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
from models import User, PaymentRequest, VpnConfiguration
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
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

Configuration.account_id = os.getenv('YOOKASSA_ACCOUNT_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')
private_key = os.getenv("NEXT_API_SECRET")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

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
    
    yoo_payment = Payment.create({
    "amount": {
        "value": payment.amount,
        "currency": "RUB"
    },
    "confirmation": {
        "type": "redirect",
        "return_url": "http://localhost:3000/profile"
    },
    "capture": True,
    "description": "Пополнение баланса"
        }, str(uuid4()))

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

        try:
            cur.execute("""
                INSERT INTO transactions
                (payment_id, email, amount, type, date)
                VALUES (?, ?, ?, ?, ?)
            """, (
                payment_id,
                email,
                amount,
                "yookassa",
                datetime.now().isoformat()
            ))

            # только если INSERT прошёл — начисляем баланс
            cur.execute("""
                UPDATE users
                SET balance = COALESCE(balance, 0) + ?
                WHERE email = ?
            """, (amount, email))

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