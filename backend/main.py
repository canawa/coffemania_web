import os
import secrets
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
import sqlite3 as sq
from database import create_tables
from models import (
    User,
    PaymentRequest,
    VpnConfiguration,
    ReferralCodeRequest,
    AdminLoginRequest,
)
import jwt
from datetime import datetime, timedelta
import time
from auth import create_jwt, verify_jwt, create_admin_jwt
from yookassa import Configuration, Payment # для работы с Юкассой
from vpn import generate_vpn_key

class LoginRequest(BaseModel):
    email: str
    password: str



create_tables()

env_path = Path(__file__).with_name(".env.production")
fallback_env_path = Path(__file__).with_name(".env")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
if fallback_env_path.exists():
    load_dotenv(dotenv_path=fallback_env_path)

Configuration.account_id = os.getenv('YOOKASSA_ACCOUNT_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')
private_key = os.getenv("NEXT_API_SECRET")
frontend_url = os.getenv("FRONTEND_URL")
cors_origins = [
    "https://coffeemaniavpn.ru",
    "https://www.coffeemaniavpn.ru",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    frontend_url,
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


def _admin_credentials_configured() -> bool:
    return bool(os.getenv("ADMIN_LOGIN")) and bool(os.getenv("ADMIN_PASSWORD"))


def get_admin_payload(request: Request):
    token = request.cookies.get("admin_token")
    if not token:
        return None
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return None
    if payload.get("role") != "admin":
        return None
    return payload


def normalize_referral_code(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    code = value.strip()
    if not code:
        return None
    return code


@app.get("/promo/validate")
def validate_promo_for_topup(request: Request, code: str = ""):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    normalized = normalize_referral_code(code)
    if not normalized:
        return {"valid": False, "own_code": False}

    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute(
            "SELECT email FROM referral_codes WHERE UPPER(code) = UPPER(?) LIMIT 1",
            (normalized,),
        )
        row = cur.fetchone()

    if not row:
        return {"valid": False, "own_code": False}
    if row[0] == payload["email"]:
        return {"valid": False, "own_code": True}
    return {"valid": True, "own_code": False, "bonus_percent": 10}


@app.post("/login")
def login(payload: LoginRequest):
    with sq.connect("database.db") as con:
        cursor = con.cursor()
        cursor.execute("SELECT password FROM users WHERE email = ? LIMIT 1", (payload.email,))
        user = cursor.fetchone()

    if not user or user[0] != payload.password:
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    token = create_jwt(payload.email, "user", {})
    response = JSONResponse(content={"status": "Вход выполнен!"})
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="Lax",
    )
    return response


@app.post('/buy_vpn')
async def buy_vpn(request: Request, configuration: VpnConfiguration):
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    with sq.connect("database.db") as con:
        cursor = con.cursor()
        cursor.execute("SELECT balance FROM users WHERE email = ? LIMIT 1", (payload['email'],))
        balance = cursor.fetchone()

    price_by_duration = {
        7: 50,
        30: 150,
        180: 500,
        365: 800,
        0: 2900,
    }

    required = price_by_duration.get(configuration.duration) # дернуть по значению справа от ключа в dictionary
    if required is None:
        return JSONResponse(
            content={"status": "error", "message": "Неверная продолжительность"},
            status_code=400,
        )

    if balance[0] < required:
        return JSONResponse(
            content={"status": "error", "message": "Недостаточно средств"},
            status_code=400,
        )

    key = await generate_vpn_key(payload["email"], configuration.duration, configuration.country)
    if not key:
        return JSONResponse(
            content={"status": "error", "message": "Не удалось создать VPN ключ"},
            status_code=500,
        )

    # Deduct balance only after a key is successfully created.
    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute(
            """
            UPDATE users
            SET balance = balance - ?
            WHERE email = ? AND balance >= ?
            """,
            (required, payload["email"], required),
        )
        if cur.rowcount == 0:
            return JSONResponse(
                content={"status": "error", "message": "Недостаточно средств"},
                status_code=400,
            )

        created_at = datetime.now()
        expires_at = None if configuration.duration <= 0 else (created_at + timedelta(days=configuration.duration)).isoformat()
        cur.execute(
            "INSERT INTO vpn_keys (email, vpn_key, duration, country, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                payload["email"],
                key,
                configuration.duration,
                configuration.country,
                created_at.isoformat(),
                expires_at,
            ),
        )
        con.commit()
    print(key)
    return key
    

@app.post('/create_payment')
def create_payment(payment: PaymentRequest, request: Request): # обязательно PyDantic модель иначе не работает
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    
    promo_code = normalize_referral_code(payment.promo_code)
    if payment.promo_code and not promo_code:
        return JSONResponse(
            content={"status": "error", "message": "Промокод не может быть пустым"},
            status_code=400,
        )

    if promo_code:
        with sq.connect("database.db") as con:
            cur = con.cursor()
            cur.execute(
                "SELECT email, code FROM referral_codes WHERE UPPER(code) = UPPER(?) LIMIT 1",
                (promo_code,),
            )
            owner = cur.fetchone()
        if not owner:
            return JSONResponse(
                content={"status": "error", "message": "Промокод не найден"},
                status_code=400,
            )
        if owner[0] == payload["email"]:
            return JSONResponse(
                content={"status": "error", "message": "Нельзя использовать собственный реферальный промокод"},
                status_code=400,
            )
        promo_code = owner[1]

    yoo_payment = Payment.create({
    "amount": {
        "value": payment.amount,
        "currency": "RUB"
    },
    "confirmation": {
        "type": "redirect",
        "return_url": f"{frontend_url}/profile"
    },
    "capture": True,
    "description": "Пополнение баланса coffeemaniavpn.ru"
        }, str(uuid4()))

    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute(
            """
            INSERT OR REPLACE INTO payment_contexts (payment_id, email, promo_code, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (yoo_payment.id, payload["email"], promo_code, datetime.now().isoformat()),
        )
        con.commit()

    return yoo_payment


@app.get('/check_payment')
def check_payment(payment_id: str, request: Request):
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    data = check_payment_yookassa_status(payment_id, payload['email'])
    return data
    

# def check_payment_from_db(payment_id):
#     with sq.connect('database.db') as con:
#         cur = con.cursor()
#         cur.execute('SELECT credited FROM transactions WHERE id = ?', (payment_id,))
#         credited = cur.fetchone()
#         if credited[0]:
#             return True
#         else:
#             return False

def check_payment_yookassa_status(payment_id, email):
    payment = Payment.find_one(payment_id)

    if payment.status != "succeeded":
        return False

    amount = float(payment.amount.value)

    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute(
            "SELECT promo_code FROM payment_contexts WHERE payment_id = ? LIMIT 1",
            (payment_id,),
        )
        ctx = cur.fetchone()
        promo_code = ctx[0] if ctx else None

        credit_multiplier = 1.0
        # Safety net: never count self-referral even if promo somehow passed client checks.
        if promo_code:
            cur.execute(
                "SELECT email, code FROM referral_codes WHERE UPPER(code) = UPPER(?) LIMIT 1",
                (promo_code,),
            )
            owner = cur.fetchone()
            if not owner or owner[0] == email:
                promo_code = None
            else:
                promo_code = owner[1]
                credit_multiplier = 1.1

        credit_amount = round(amount * credit_multiplier, 2)

        try:
            cur.execute("""
                INSERT INTO transactions
                (payment_id, email, amount, type, date, promo_code)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                payment_id,
                email,
                amount,
                "yookassa",
                datetime.now().isoformat(),
                promo_code,
            ))

            # только если INSERT прошёл — начисляем баланс
            cur.execute("""
                UPDATE users
                SET balance = COALESCE(balance, 0) + ?
                WHERE email = ?
            """, (credit_amount, email))

            cur.execute("DELETE FROM payment_contexts WHERE payment_id = ?", (payment_id,))

            con.commit()
            return True

        except sq.IntegrityError:
            # такой payment_id уже был
            return False

@app.get("/balance")
def get_balance(request: Request):
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    with sq.connect("database.db") as con:
        cursor = con.cursor()
        cursor.execute("SELECT balance FROM users WHERE email = ? LIMIT 1", (payload['email'],))
        balance = cursor.fetchone()
    print(balance)
    return balance


@app.get("/vpn_keys")
def get_vpn_keys(request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    with sq.connect("database.db") as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute(
            """
            SELECT id, country, duration, vpn_key, created_at, expires_at
            FROM vpn_keys
            WHERE email = ?
            ORDER BY id DESC
            """,
            (payload["email"],),
        )
        rows = cur.fetchall()

    return [dict(r) for r in rows]


@app.get("/referral")
def get_referral(request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute(
            "SELECT promo_code, withdrawed FROM users WHERE email = ? LIMIT 1",
            (payload["email"],),
        )
        user_row = cur.fetchone()
        code = user_row[0] if user_row and user_row[0] else None
        withdrawed = float(user_row[1] or 0) if user_row else 0.0

        if not code:
            cur.execute(
                "SELECT code FROM referral_codes WHERE email = ? LIMIT 1",
                (payload["email"],),
            )
            row = cur.fetchone()
            code = row[0] if row else None

        deposits_count = 0
        deposits_sum = 0.0
        revshare_total = 0.0
        withdraw_available = 0.0
        if code:
            cur.execute(
                """
                SELECT COUNT(*), COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE UPPER(IFNULL(promo_code, '')) = UPPER(?) AND type = 'yookassa' AND email <> ?
                """,
                (code, payload["email"]),
            )
            stats = cur.fetchone()
            deposits_count = int(stats[0] or 0)
            deposits_sum = float(stats[1] or 0)
            revshare_total = deposits_sum * 0.5
            withdraw_available = max(revshare_total - withdrawed, 0.0)

            cur.execute(
                """
                UPDATE users
                SET withdraw_available = ?
                WHERE email = ?
                """,
                (withdraw_available, payload["email"]),
            )
            con.commit()

    return {
        "referral_code": code,
        "deposits_count": deposits_count,
        "deposits_sum": deposits_sum,
        "revshare_total": revshare_total,
        "withdrawed": withdrawed,
        "withdraw_available": withdraw_available,
    }


@app.post("/referral/code")
def create_referral_code(payload_req: ReferralCodeRequest, request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    code = normalize_referral_code(payload_req.code)
    if not code:
        return JSONResponse(
            content={"status": "error", "message": "Промокод не может быть пустым"},
            status_code=400,
        )

    with sq.connect("database.db") as con:
        cur = con.cursor()
        cur.execute("SELECT code FROM referral_codes WHERE email = ? LIMIT 1", (payload["email"],))
        exists = cur.fetchone()
        if exists:
            return JSONResponse(
                content={"status": "error", "message": "Авторский промокод можно создать только один раз"},
                status_code=400,
            )

        cur.execute(
            "SELECT 1 FROM referral_codes WHERE UPPER(code) = UPPER(?) LIMIT 1",
            (code,),
        )
        occupied = cur.fetchone()
        if occupied:
            return JSONResponse(
                content={"status": "error", "message": "Этот промокод уже занят"},
                status_code=409,
            )

        cur.execute(
            "INSERT INTO referral_codes (email, code, created_at) VALUES (?, ?, ?)",
            (payload["email"], code, datetime.now().isoformat()),
        )
        cur.execute(
            "UPDATE users SET promo_code = ? WHERE email = ?",
            (code, payload["email"]),
        )
        con.commit()

    return {"status": "success", "code": code}


@app.post("/admin/login")
def admin_login(payload: AdminLoginRequest):
    if not _admin_credentials_configured():
        return JSONResponse(
            content={"status": "error", "message": "Админка не настроена"},
            status_code=503,
        )
    login_env = os.getenv("ADMIN_LOGIN", "")
    password_env = os.getenv("ADMIN_PASSWORD", "")
    if not (
        secrets.compare_digest(payload.username, login_env)
        and secrets.compare_digest(payload.password, password_env)
    ):
        return JSONResponse(
            content={"status": "error", "message": "Неверный логин или пароль"},
            status_code=401,
        )
    token = create_admin_jwt(login_env)
    response = JSONResponse(content={"status": "ok"})
    response.set_cookie(
        key="admin_token",
        value=token,
        httponly=True,
        samesite="Lax",
        path="/",
    )
    return response


@app.post("/admin/logout")
def admin_logout():
    response = JSONResponse(content={"status": "ok"})
    response.delete_cookie("admin_token", path="/")
    return response


@app.get("/admin/me")
def admin_me(request: Request):
    if get_admin_payload(request):
        return {"status": "ok"}
    return JSONResponse(content={"status": "error"}, status_code=401)


@app.get("/admin/users")
def admin_users(request: Request):
    if not get_admin_payload(request):
        return JSONResponse(
            content={"status": "error", "message": "Нет доступа"},
            status_code=401,
        )
    with sq.connect("database.db") as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute(
            """
            SELECT id, email, balance, created_at, promo_code, withdrawed, withdraw_available
            FROM users
            ORDER BY id DESC
            """
        )
        rows = cur.fetchall()
    return {"users": [dict(r) for r in rows]}


@app.post("/register")
def register(user: User):
    with sq.connect("database.db") as con:
        cursor = con.cursor()
        cursor.execute("SELECT 1 FROM users WHERE email = ? LIMIT 1", (user.email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return {"status": 'error', "message": "Этот email уже занят"}

        cursor.execute("INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)", (user.email, user.password, user.created_at))
        con.commit()
    token = create_jwt(user.email, 'user', {})
    response = JSONResponse(content={"status": "success"})
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="Lax",
    )
    return response