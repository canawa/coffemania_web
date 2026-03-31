import os
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
from models import User, PaymentRequest, VpnConfiguration, ReferralCodeRequest
import jwt
from datetime import datetime, timedelta
import time
from auth import create_jwt, verify_jwt
from yookassa import Configuration, Payment # для работы с Юкассой
from vpn import generate_vpn_key

class LoginRequest(BaseModel):
    email: str
    password: str



create_tables()

app_env = os.getenv("APP_ENV", "local").lower()
env_filename = ".env.production" if app_env == "production" else ".env.local"
env_path = Path(__file__).with_name(env_filename)
fallback_env_path = Path(__file__).with_name(".env")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
if fallback_env_path.exists():
    load_dotenv(dotenv_path=fallback_env_path)

Configuration.account_id = os.getenv('YOOKASSA_ACCOUNT_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')
private_key = os.getenv("NEXT_API_SECRET")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3002")
cors_origins = [
    "https://coffeemaniavpn.ru",
    "https://www.coffeemaniavpn.ru",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
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


def normalize_referral_code(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    code = value.strip()
    if not code:
        return None
    return code

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
        30: 100,
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
            cur.execute("SELECT email FROM referral_codes WHERE code = ? LIMIT 1", (promo_code,))
            owner = cur.fetchone()
        if not owner:
            return JSONResponse(
                content={"status": "error", "message": "Промокод не найден"},
                status_code=400,
            )

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
    "description": "Пополнение баланса"
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
            """, (amount, email))

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
            "SELECT code FROM referral_codes WHERE email = ? LIMIT 1",
            (payload["email"],),
        )
        row = cur.fetchone()
        code = row[0] if row else None

        deposits_count = 0
        deposits_sum = 0.0
        if code:
            cur.execute(
                """
                SELECT COUNT(*), COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE promo_code = ? AND type = 'yookassa'
                """,
                (code,),
            )
            stats = cur.fetchone()
            deposits_count = int(stats[0] or 0)
            deposits_sum = float(stats[1] or 0)

    return {
        "referral_code": code,
        "deposits_count": deposits_count,
        "deposits_sum": deposits_sum,
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

        cur.execute("SELECT 1 FROM referral_codes WHERE code = ? LIMIT 1", (code,))
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
        con.commit()

    return {"status": "success", "code": code}


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