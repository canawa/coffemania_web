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
from database import create_tables, connect
from models import (
    User,
    PaymentRequest,
    VpnConfiguration,
    RenewSubscriptionRequest,
    ReferralCodeRequest,
    AdminLoginRequest,
    SendCodeRequest,
    ResetPasswordRequest,
    TelegramLinkRequest,
)
import jwt
from datetime import datetime, timedelta
import time
from auth import create_jwt, verify_jwt, create_admin_jwt
from yookassa import Configuration, Payment # для работы с Юкассой
from vpn import (
    attach_telegram_id_to_remnawave_user,
    fetch_remnawave_user_for_telegram,
    fetch_user_by_username,
    generate_vpn_key,
    remnawave_telegram_username,
    remnawave_user_to_subscription,
    renew_vpn_key,
    remnawave_username,
)
from email_service import send_verification_code
from verification import (
    create_and_store_code,
    normalize_email,
    verify_code,
)
from telegram_auth import extract_telegram_profile, verify_telegram_id_token

class LoginRequest(BaseModel):
    email: str
    password: str



create_tables()

env_path = Path(__file__).with_name(".env.production")
fallback_env_path = Path(__file__).with_name(".env")
local_env_path = Path(__file__).with_name(".env.local")

if fallback_env_path.exists():
    load_dotenv(dotenv_path=fallback_env_path)
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
if local_env_path.exists():
    load_dotenv(dotenv_path=local_env_path, override=True)

Configuration.account_id = os.getenv('YOOKASSA_ACCOUNT_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')
private_key = os.getenv("NEXT_API_SECRET")
frontend_url = os.getenv("FRONTEND_URL")
cors_origins = [
    origin.strip()
    for origin in [
        "https://coffeemaniavpn.ru",
        "https://www.coffeemaniavpn.ru",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        frontend_url,
        *(os.getenv("CORS_ORIGINS", "").split(",")),
    ]
    if origin and origin.strip()
]


def _auth_cookie_kwargs() -> dict:
    if os.getenv("APP_ENV", "").lower() == "production":
        return {
            "httponly": True,
            "samesite": "none",
            "secure": True,
            "domain": ".coffeemaniavpn.ru",
            "path": "/",
        }
    return {
        "httponly": True,
        "samesite": "lax",
        "path": "/",
    }


def _clear_auth_cookie(response: JSONResponse) -> None:
    cookie_kwargs = _auth_cookie_kwargs()
    response.delete_cookie(
        "token",
        path=cookie_kwargs.get("path", "/"),
        domain=cookie_kwargs.get("domain"),
        secure=cookie_kwargs.get("secure", False),
        httponly=cookie_kwargs.get("httponly", True),
        samesite=cookie_kwargs.get("samesite", "lax"),
    )

app = FastAPI()

SUBSCRIPTION_PRICE = 149
SUBSCRIPTION_DURATION_DAYS = 30
SUBSCRIPTION_PLANS = {
    30: 149,
    90: 399,
    365: 899,
}


def _plan_price(duration_days: int) -> int | None:
    return SUBSCRIPTION_PLANS.get(duration_days)


def _get_user_id_by_email(email: str) -> int | None:
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT id FROM users WHERE email = ? LIMIT 1", (email,))
        row = cur.fetchone()
    return int(row[0]) if row else None


def _get_telegram_id_by_email(email: str) -> int | None:
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT telegram_id FROM users WHERE email = ? LIMIT 1", (email,))
        row = cur.fetchone()
    if not row or row[0] is None:
        return None
    return int(row[0])


def _parse_expire_at(expires_at: str | None) -> datetime | None:
    if not expires_at:
        return None
    try:
        parsed = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed
    except ValueError:
        return None


def _is_subscription_active(expires_at: str | None) -> bool:
    if not expires_at:
        return True
    parsed = _parse_expire_at(expires_at)
    if parsed is None:
        return False
    return parsed > datetime.now()


def _upsert_vpn_key_from_remnawave(
    email: str,
    username: str,
    sub_url: str,
    expires_at: str | None,
) -> None:
    now_iso = datetime.now().isoformat()
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT id FROM vpn_keys WHERE email = ? ORDER BY id DESC LIMIT 1",
            (email,),
        )
        row = cur.fetchone()
        if row:
            cur.execute(
                """
                UPDATE vpn_keys
                SET vpn_username = ?, vpn_key = ?, expires_at = ?
                WHERE id = ?
                """,
                (username, sub_url, expires_at, row[0]),
            )
        else:
            cur.execute(
                """
                INSERT INTO vpn_keys
                (email, vpn_username, vpn_key, duration, country, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    email,
                    username,
                    sub_url,
                    SUBSCRIPTION_DURATION_DAYS,
                    "germany1",
                    now_iso,
                    expires_at,
                ),
            )
        con.commit()


async def _sync_subscription_from_remnawave(email: str) -> None:
    user_id = _get_user_id_by_email(email)
    telegram_id = _get_telegram_id_by_email(email)

    rw_user = None
    subscription = None

    if telegram_id:
        rw_user = await fetch_remnawave_user_for_telegram(telegram_id)
        subscription = remnawave_user_to_subscription(rw_user)
        if subscription:
            print(f"[sync] bot subscription for email={email} tg_id={telegram_id}")

    if not subscription and user_id:
        rw_user = await fetch_user_by_username(
            remnawave_username(user_id),
            quiet_not_found=True,
        )
        subscription = remnawave_user_to_subscription(rw_user)
        if subscription:
            print(f"[sync] web subscription for email={email} user_id={user_id}")

    if not subscription:
        if telegram_id:
            print(f"[sync] no remnawave subscription for email={email} tg_id={telegram_id}")
        return

    username = subscription.get("username")
    if not username and rw_user:
        username = rw_user.get("username")
    if not username and telegram_id:
        username = remnawave_telegram_username(telegram_id)
    if not username and user_id:
        username = remnawave_username(user_id)
    if not username:
        return

    _upsert_vpn_key_from_remnawave(
        email,
        username,
        subscription["subscription_url"],
        subscription.get("expires_at"),
    )


async def _reconcile_telegram_subscription(email: str, telegram_id: int) -> dict:
    tg_user = await fetch_remnawave_user_for_telegram(telegram_id)
    tg_subscription = remnawave_user_to_subscription(tg_user)
    if tg_user and tg_subscription:
        username = (
            tg_subscription.get("username")
            or tg_user.get("username")
            or remnawave_telegram_username(telegram_id)
        )
        _upsert_vpn_key_from_remnawave(
            email,
            username,
            tg_subscription["subscription_url"],
            tg_subscription.get("expires_at"),
        )
        print(f"[telegram] imported bot subscription for email={email} tg_id={telegram_id}")
        return {
            "link_action": "imported_from_bot",
            "subscription_synced": True,
            "message": "Telegram подключён, подписка из бота синхронизирована",
        }

    if tg_user:
        print(
            f"[telegram] remnawave user found for tg_id={telegram_id} "
            f"but subscription url missing for email={email}",
        )
    else:
        print(f"[telegram] no remnawave user for tg_id={telegram_id} email={email}")

    user_id = _get_user_id_by_email(email)
    web_user = None
    if user_id:
        web_user = await fetch_user_by_username(remnawave_username(user_id), quiet_not_found=True)

    web_subscription = remnawave_user_to_subscription(web_user)
    has_active_web_subscription = bool(
        web_subscription and _is_subscription_active(web_subscription.get("expires_at"))
    )

    if web_user and has_active_web_subscription:
        attached = await attach_telegram_id_to_remnawave_user(
            web_user,
            telegram_id,
            email=email,
        )
        if attached:
            _upsert_vpn_key_from_remnawave(
                email,
                web_subscription.get("username") or remnawave_username(user_id),
                web_subscription["subscription_url"],
                web_subscription.get("expires_at"),
            )
            return {
                "link_action": "attached_to_web",
                "subscription_synced": False,
                "message": "Telegram привязан к вашей активной подписке на сайте",
            }
        return {
            "link_action": "attached_to_web",
            "subscription_synced": False,
            "message": (
                "Telegram подключён, но не удалось обновить привязку в панели. "
                "Напишите в поддержку, если бот не видит подписку."
            ),
        }

    return {
        "link_action": "pending_purchase",
        "subscription_synced": False,
        "message": (
            "Telegram подключён. При следующей покупке на сайте подписка будет "
            "привязана к вашему Telegram."
        ),
    }

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


def _get_user_payload(request: Request) -> dict | None:
    token = request.cookies.get("token")
    if not token:
        return None
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return None
    return payload


def _require_user_payload(request: Request) -> dict | JSONResponse:
    payload = _get_user_payload(request)
    if not payload:
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    return payload


def _telegram_status_for_email(email: str) -> dict:
    with connect() as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute(
            """
            SELECT telegram_id, telegram_username, telegram_name, telegram_photo_url, telegram_linked_at
            FROM users
            WHERE email = ?
            LIMIT 1
            """,
            (email,),
        )
        row = cur.fetchone()

    if not row:
        return {"linked": False}

    return {
        "linked": row["telegram_id"] is not None,
        "telegram_id": row["telegram_id"],
        "telegram_username": row["telegram_username"],
        "telegram_name": row["telegram_name"],
        "telegram_photo_url": row["telegram_photo_url"],
        "telegram_linked_at": row["telegram_linked_at"],
    }


@app.get("/telegram/status")
def telegram_status(request: Request):
    payload = _require_user_payload(request)
    if isinstance(payload, JSONResponse):
        return payload
    email = normalize_email(payload["email"])
    return {"status": "success", **_telegram_status_for_email(email)}


@app.post("/telegram/link")
async def telegram_link(request: Request, body: TelegramLinkRequest):
    payload = _require_user_payload(request)
    if isinstance(payload, JSONResponse):
        return payload

    email = normalize_email(payload["email"])

    try:
        token_payload = verify_telegram_id_token(body.id_token.strip())
        profile = extract_telegram_profile(token_payload)
    except ConnectionError as exc:
        print(f"[telegram] link verify failed: {exc}")
        return JSONResponse(
            content={
                "status": "error",
                "message": "Сервер не может связаться с Telegram. Попробуйте позже или напишите в поддержку.",
            },
            status_code=503,
        )
    except Exception as exc:
        print(f"[telegram] link verify failed: {exc}")
        return JSONResponse(
            content={"status": "error", "message": "Не удалось подтвердить вход через Telegram"},
            status_code=400,
        )

    telegram_id = profile["telegram_id"]
    if body.telegram_id is not None and int(body.telegram_id) != telegram_id:
        return JSONResponse(
            content={"status": "error", "message": "Telegram ID не совпадает с токеном авторизации"},
            status_code=400,
        )

    now_iso = datetime.now().isoformat()

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT email FROM users WHERE telegram_id = ? AND email <> ? LIMIT 1",
            (telegram_id, email),
        )
        other = cur.fetchone()
        if other:
            return JSONResponse(
                content={
                    "status": "error",
                    "message": "Этот Telegram уже привязан к другому аккаунту",
                },
                status_code=409,
            )

        cur.execute(
            """
            UPDATE users
            SET telegram_id = ?, telegram_username = ?, telegram_name = ?,
                telegram_photo_url = ?, telegram_linked_at = ?
            WHERE email = ?
            """,
            (
                telegram_id,
                profile.get("telegram_username"),
                profile.get("telegram_name"),
                profile.get("telegram_photo_url"),
                now_iso,
                email,
            ),
        )
        if cur.rowcount == 0:
            return JSONResponse(
                content={"status": "error", "message": "Пользователь не найден"},
                status_code=404,
            )
        con.commit()

    print(f"[telegram] linked email={email} telegram_id={telegram_id}")

    reconcile = await _reconcile_telegram_subscription(email, telegram_id)

    return {
        "status": "success",
        **_telegram_status_for_email(email),
        **reconcile,
    }


@app.post("/telegram/unlink")
def telegram_unlink(request: Request):
    payload = _require_user_payload(request)
    if isinstance(payload, JSONResponse):
        return payload

    email = normalize_email(payload["email"])

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            UPDATE users
            SET telegram_id = NULL, telegram_username = NULL, telegram_name = NULL,
                telegram_photo_url = NULL, telegram_linked_at = NULL
            WHERE email = ?
            """,
            (email,),
        )
        con.commit()

    return {
        "status": "success",
        "message": "Telegram отключён",
        **_telegram_status_for_email(email),
    }


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

    with connect() as con:
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
    email = normalize_email(payload.email)
    with connect() as con:
        cursor = con.cursor()
        cursor.execute("SELECT password FROM users WHERE email = ? LIMIT 1", (email,))
        user = cursor.fetchone()

    if not user or user[0] != payload.password:
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    token = create_jwt(email, "user", {})
    response = JSONResponse(content={"status": "Вход выполнен!"})
    response.set_cookie(key="token", value=token, **_auth_cookie_kwargs())
    return response


@app.post("/logout")
def logout():
    response = JSONResponse(content={"status": "ok"})
    _clear_auth_cookie(response)
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
    with connect() as con:
        cursor = con.cursor()
        cursor.execute("SELECT id, balance FROM users WHERE email = ? LIMIT 1", (payload['email'],))
        user_row = cursor.fetchone()

    if not user_row:
        return JSONResponse(
            content={"status": "error", "message": "Пользователь не найден"},
            status_code=404,
        )

    user_id, balance = user_row[0], user_row[1]
    required = SUBSCRIPTION_PRICE

    if balance < required:
        return JSONResponse(
            content={"status": "error", "message": "Недостаточно средств"},
            status_code=400,
        )

    generated = await generate_vpn_key(
        user_id,
        payload["email"],
        SUBSCRIPTION_DURATION_DAYS,
        "germany1",
        telegram_id=_get_telegram_id_by_email(payload["email"]),
    )
    if not generated:
        return JSONResponse(
            content={"status": "error", "message": "Не удалось оформить подписку"},
            status_code=500,
        )
    if generated.get("error"):
        return JSONResponse(
            content={"status": "error", "message": generated.get("error")},
            status_code=500,
        )
    key = generated.get("subscription_url")
    vpn_username = generated.get("username")
    if not key:
        return JSONResponse(
            content={"status": "error", "message": "Не удалось получить ссылку подписки"},
            status_code=500,
        )

    # Deduct balance only after a key is successfully created.
    with connect() as con:
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
        expires_at = created_at + timedelta(days=SUBSCRIPTION_DURATION_DAYS)
        cur.execute(
            "INSERT INTO vpn_keys (email, vpn_username, vpn_key, duration, country, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                payload["email"],
                vpn_username,
                key,
                SUBSCRIPTION_DURATION_DAYS,
                "germany1",
                created_at.isoformat(),
                expires_at.isoformat(),
            ),
        )
        con.commit()
    print(key)
    return {
        "status": "success",
        "subscription_url": key,
        "vpn_username": vpn_username,
        "country": "germany1",
        "duration": SUBSCRIPTION_DURATION_DAYS,
        "expires_at": expires_at.isoformat(),
    }
    

@app.post("/renew_vpn")
async def renew_vpn(request: Request, payload_req: RenewSubscriptionRequest):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    required = SUBSCRIPTION_PRICE

    with connect() as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute("SELECT balance FROM users WHERE email = ? LIMIT 1", (payload["email"],))
        balance_row = cur.fetchone()
        balance = float(balance_row["balance"] if balance_row else 0)
        if balance < required:
            return JSONResponse(
                content={"status": "error", "message": "Недостаточно средств"},
                status_code=400,
            )

        if payload_req.subscription_id:
            cur.execute(
                """
                SELECT id, vpn_username, vpn_key, country, expires_at
                FROM vpn_keys
                WHERE id = ? AND email = ?
                LIMIT 1
                """,
                (payload_req.subscription_id, payload["email"]),
            )
            target = cur.fetchone()
        else:
            cur.execute(
                """
                SELECT id, vpn_username, vpn_key, country, expires_at
                FROM vpn_keys
                WHERE email = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (payload["email"],),
            )
            target = cur.fetchone()

        if not target:
            return JSONResponse(
                content={"status": "error", "message": "Активная подписка не найдена"},
                status_code=404,
            )

        expires_at = target["expires_at"]
        if expires_at and not _is_subscription_active(expires_at):
            return JSONResponse(
                content={"status": "error", "message": "Подписка истекла, оформите новую"},
                status_code=400,
            )

        if not target["vpn_username"]:
            return JSONResponse(
                content={
                    "status": "error",
                    "message": "Эту подписку нельзя продлить автоматически, оформите новую",
                },
                status_code=400,
            )

        renewed = await renew_vpn_key(
            username=target["vpn_username"],
            duration_days=SUBSCRIPTION_DURATION_DAYS,
            country=target["country"],
            telegram_id=_get_telegram_id_by_email(payload["email"]),
        )
        if not renewed:
            return JSONResponse(
                content={"status": "error", "message": "Не удалось продлить подписку"},
                status_code=500,
            )
        if renewed.get("error"):
            return JSONResponse(
                content={"status": "error", "message": renewed.get("error")},
                status_code=500,
            )

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

        expire_ts = renewed.get("expire", 0) or 0
        new_expires_at = None if expire_ts <= 0 else datetime.fromtimestamp(expire_ts).isoformat()
        new_link = renewed.get("subscription_url") or target["vpn_key"]
        cur.execute(
            """
            UPDATE vpn_keys
            SET vpn_key = ?, duration = ?, expires_at = ?
            WHERE id = ?
            """,
            (new_link, SUBSCRIPTION_DURATION_DAYS, new_expires_at, target["id"]),
        )
        con.commit()

    return {
        "status": "success",
        "subscription_url": renewed.get("subscription_url") or target["vpn_key"],
        "expires_at": new_expires_at,
        "subscription_id": target["id"],
    }


async def _provision_new_subscription(email: str, duration_days: int) -> dict | None:
    user_id = _get_user_id_by_email(email)
    if user_id is None:
        return None

    telegram_id = _get_telegram_id_by_email(email)
    generated = await generate_vpn_key(
        user_id,
        email,
        duration_days,
        "germany1",
        telegram_id=telegram_id,
    )
    if not generated or generated.get("error"):
        return None

    key = generated.get("subscription_url")
    vpn_username = generated.get("username")
    if not key:
        return None

    created_at = datetime.now()
    expires_at = created_at + timedelta(days=duration_days)
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO vpn_keys (email, vpn_username, vpn_key, duration, country, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                email,
                vpn_username,
                key,
                duration_days,
                "germany1",
                created_at.isoformat(),
                expires_at.isoformat(),
            ),
        )
        con.commit()

    return {
        "subscription_url": key,
        "vpn_username": vpn_username,
        "expires_at": expires_at.isoformat(),
    }


async def _provision_renew_subscription(
    email: str,
    subscription_id: Optional[int],
    duration_days: int,
) -> dict | None:
    with connect() as con:
        con.row_factory = sq.Row
        cur = con.cursor()

        if subscription_id:
            cur.execute(
                """
                SELECT id, vpn_username, vpn_key, country, expires_at
                FROM vpn_keys
                WHERE id = ? AND email = ?
                LIMIT 1
                """,
                (subscription_id, email),
            )
            target = cur.fetchone()
        else:
            cur.execute(
                """
                SELECT id, vpn_username, vpn_key, country, expires_at
                FROM vpn_keys
                WHERE email = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (email,),
            )
            target = cur.fetchone()

        user_id = _get_user_id_by_email(email)
        if not target or not user_id:
            return None

        vpn_username = target["vpn_username"] or remnawave_username(user_id)

        now = datetime.now()
        expires_at = target["expires_at"]
        if expires_at and not _is_subscription_active(expires_at):
            return None

        renewed = await renew_vpn_key(
            username=vpn_username,
            duration_days=duration_days,
            country=target["country"],
            email=email,
            telegram_id=_get_telegram_id_by_email(email),
        )
        if not renewed or renewed.get("error"):
            return None

        expire_ts = renewed.get("expire", 0) or 0
        new_expires_at = None if expire_ts <= 0 else datetime.fromtimestamp(expire_ts).isoformat()
        new_link = renewed.get("subscription_url") or target["vpn_key"]
        cur.execute(
            """
            UPDATE vpn_keys
            SET vpn_key = ?, duration = ?, expires_at = ?
            WHERE id = ?
            """,
            (new_link, duration_days, new_expires_at, target["id"]),
        )
        con.commit()

    return {
        "subscription_url": renewed.get("subscription_url") or target["vpn_key"],
        "expires_at": new_expires_at,
        "subscription_id": target["id"],
    }


@app.post('/create_payment')
def create_payment(payment: PaymentRequest, request: Request): # обязательно PyDantic модель иначе не работает
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    purpose = (payment.purpose or "subscription").strip().lower()
    if purpose not in {"subscription", "renew"}:
        return JSONResponse(
            content={"status": "error", "message": "Некорректный тип оплаты"},
            status_code=400,
        )
    duration_days = payment.duration_days or SUBSCRIPTION_DURATION_DAYS
    expected_price = _plan_price(duration_days)
    if expected_price is None or payment.amount != expected_price:
        return JSONResponse(
            content={"status": "error", "message": "Некорректная сумма или срок подписки"},
            status_code=400,
        )
    
    promo_code = normalize_referral_code(payment.promo_code)
    if payment.promo_code and not promo_code:
        return JSONResponse(
            content={"status": "error", "message": "Промокод не может быть пустым"},
            status_code=400,
        )

    if promo_code:
        with connect() as con:
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

    payment_description = (
        "Продление подписки Coffee Mania VPN"
        if purpose == "renew"
        else "Подписка Coffee Mania VPN"
    )
    return_url = f"{(frontend_url or 'http://localhost:3002').rstrip('/')}/profile"

    try:
        yoo_payment = Payment.create(
            {
                "amount": {
                    "value": f"{payment.amount:.2f}",
                    "currency": "RUB",
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": return_url,
                },
                "capture": True,
                "description": payment_description,
            },
            str(uuid4()),
        )
    except Exception:
        return JSONResponse(
            content={"status": "error", "message": "Не удалось создать платёж. Попробуйте позже."},
            status_code=502,
        )

    confirmation_url = getattr(
        getattr(yoo_payment, "confirmation", None),
        "confirmation_url",
        None,
    )
    if not confirmation_url:
        return JSONResponse(
            content={"status": "error", "message": "Платёж создан, но ссылка на оплату недоступна."},
            status_code=502,
        )

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            INSERT OR REPLACE INTO payment_contexts
            (payment_id, email, promo_code, created_at, purpose, subscription_id, duration_days)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                yoo_payment.id,
                payload["email"],
                promo_code,
                datetime.now().isoformat(),
                purpose,
                payment.subscription_id,
                duration_days,
            ),
        )
        con.commit()

    return JSONResponse(
        content={
            "id": yoo_payment.id,
            "confirmation": {"confirmation_url": confirmation_url},
        }
    )


def _normalize_payment_promo_code(promo_code: Optional[str], email: str) -> Optional[str]:
    if not promo_code:
        return None
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT email, code FROM referral_codes WHERE UPPER(code) = UPPER(?) LIMIT 1",
            (promo_code,),
        )
        owner = cur.fetchone()
    if not owner or owner[0] == email:
        return None
    return owner[1]


async def fulfill_payment(payment_id: str, email: Optional[str] = None) -> dict:
    try:
        payment = Payment.find_one(payment_id)
    except Exception:
        return {"status": "error", "message": "Платёж не найден"}

    if payment.status in ("pending", "waiting_for_capture"):
        return {"status": "pending"}
    if payment.status != "succeeded":
        return {"status": "error", "message": "Платёж не был успешно завершён"}

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT fulfilled FROM transactions WHERE payment_id = ? LIMIT 1",
            (payment_id,),
        )
        tx = cur.fetchone()
        if tx and tx[0]:
            return {"status": "success"}

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT email, promo_code, purpose, subscription_id, duration_days
            FROM payment_contexts
            WHERE payment_id = ? LIMIT 1
            """,
            (payment_id,),
        )
        ctx = cur.fetchone()

    if not ctx:
        return {
            "status": "error",
            "message": "Данные платежа не найдены. Напишите в поддержку с номером платежа.",
        }

    ctx_email, promo_code, purpose, subscription_id, duration_days_raw = ctx
    if email and email != ctx_email:
        return {"status": "error", "message": "Недостаточно прав для этого платежа"}

    email = ctx_email
    purpose = (purpose or "subscription").strip().lower()
    subscription_id = subscription_id
    duration_days = int(duration_days_raw) if duration_days_raw else SUBSCRIPTION_DURATION_DAYS
    if _plan_price(duration_days) is None:
        duration_days = SUBSCRIPTION_DURATION_DAYS

    promo_code = _normalize_payment_promo_code(promo_code, email)

    if purpose == "renew":
        provisioned = await _provision_renew_subscription(email, subscription_id, duration_days)
    else:
        provisioned = await _provision_new_subscription(email, duration_days)

    if not provisioned:
        return {
            "status": "error",
            "message": (
                "Оплата получена, но подписку пока не удалось выдать. "
                "Нажмите «Проверить оплату» ещё раз или напишите в поддержку."
            ),
        }

    amount = float(payment.amount.value)
    with connect() as con:
        cur = con.cursor()
        try:
            cur.execute(
                """
                INSERT INTO transactions
                (payment_id, email, amount, credited, type, date, promo_code, fulfilled)
                VALUES (?, ?, ?, 1, 'yookassa', ?, ?, 1)
                """,
                (payment_id, email, amount, datetime.now().isoformat(), promo_code),
            )
        except sq.IntegrityError:
            cur.execute(
                "UPDATE transactions SET fulfilled = 1, credited = 1 WHERE payment_id = ?",
                (payment_id,),
            )
        cur.execute("DELETE FROM payment_contexts WHERE payment_id = ?", (payment_id,))
        con.commit()

    return {"status": "success"}


@app.get("/check_payment")
async def check_payment(payment_id: str, request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    return await fulfill_payment(payment_id, payload["email"])


@app.post("/yookassa/webhook")
async def yookassa_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        return {"status": "ignored"}

    event = body.get("event")
    payment_object = body.get("object") or {}
    payment_id = payment_object.get("id")

    if event == "payment.succeeded" and payment_id:
        await fulfill_payment(payment_id)

    return {"status": "ok"}

@app.get("/balance")
def get_balance(request: Request):
    token = request.cookies.get('token')
    payload = verify_jwt(token)
    if payload.get('status') == 'error':
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )
    with connect() as con:
        cursor = con.cursor()
        cursor.execute("SELECT balance FROM users WHERE email = ? LIMIT 1", (payload['email'],))
        balance = cursor.fetchone()
    print(balance)
    return balance


@app.get("/vpn_keys")
async def get_vpn_keys(request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    await _sync_subscription_from_remnawave(payload["email"])

    with connect() as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute(
            """
            SELECT id, country, duration, vpn_key, vpn_username, created_at, expires_at
            FROM vpn_keys
            WHERE email = ?
            ORDER BY id DESC
            """,
            (payload["email"],),
        )
        rows = cur.fetchall()

    return [dict(r) for r in rows]


@app.get("/subscription")
async def get_subscription(request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    await _sync_subscription_from_remnawave(payload["email"])

    with connect() as con:
        con.row_factory = sq.Row
        cur = con.cursor()
        cur.execute(
            """
            SELECT vpn_key, country, created_at, expires_at
            , id
            FROM vpn_keys
            WHERE email = ?
            ORDER BY id DESC
            """,
            (payload["email"],),
        )
        rows = cur.fetchall()

    for row in rows:
        expires_at = row["expires_at"]
        if _is_subscription_active(expires_at):
            return {
                "active": True,
                "id": row["id"],
                "subscription_url": row["vpn_key"],
                "country": row["country"],
                "expires_at": expires_at,
                "created_at": row["created_at"],
            }

    return {"active": False, "subscription_url": None}


@app.get("/referral")
def get_referral(request: Request):
    token = request.cookies.get("token")
    payload = verify_jwt(token)
    if payload.get("status") == "error":
        return JSONResponse(
            content={"status": "error", "message": "Неверный email или пароль"},
            status_code=401,
        )

    with connect() as con:
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

    with connect() as con:
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
    with connect() as con:
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


@app.post("/auth/send-code")
def send_code(payload: SendCodeRequest):
    email = normalize_email(payload.email)
    if not email or "@" not in email:
        return JSONResponse(
            content={"status": "error", "message": "Некорректный email"},
            status_code=400,
        )

    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT 1 FROM users WHERE email = ? LIMIT 1", (email,))
        user_exists = cur.fetchone() is not None

    if payload.purpose == "register" and user_exists:
        return JSONResponse(
            content={"status": "error", "message": "Этот email уже зарегистрирован"},
            status_code=400,
        )

    if payload.purpose == "reset_password" and not user_exists:
        return JSONResponse(
            content={"status": "error", "message": "Пользователь с таким email не найден"},
            status_code=404,
        )

    code, create_message = create_and_store_code(email, payload.purpose)
    if not code:
        return JSONResponse(
            content={"status": "error", "message": create_message},
            status_code=429,
        )

    sent, send_message = send_verification_code(email, code, payload.purpose)
    if not sent:
        return JSONResponse(
            content={"status": "error", "message": send_message},
            status_code=503,
        )

    return {"status": "success", "message": send_message}


@app.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    email = normalize_email(payload.email)
    ok, message = verify_code(email, "reset_password", payload.code)
    if not ok:
        return JSONResponse(
            content={"status": "error", "message": message},
            status_code=400,
        )

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "UPDATE users SET password = ? WHERE email = ?",
            (payload.new_password, email),
        )
        if cur.rowcount == 0:
            return JSONResponse(
                content={"status": "error", "message": "Пользователь не найден"},
                status_code=404,
            )
        con.commit()

    return {"status": "success", "message": "Пароль успешно изменён. Теперь можно войти."}


@app.post("/register")
def register(user: User):
    email = normalize_email(user.email)
    ok, message = verify_code(email, "register", user.code)
    if not ok:
        return JSONResponse(
            content={"status": "error", "message": message},
            status_code=400,
        )

    with connect() as con:
        cursor = con.cursor()
        cursor.execute("SELECT 1 FROM users WHERE email = ? LIMIT 1", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return JSONResponse(
                content={"status": "error", "message": "Этот email уже занят"},
                status_code=400,
            )

        cursor.execute(
            "INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)",
            (email, user.password, user.created_at),
        )
        con.commit()
    token = create_jwt(email, "user", {})
    response = JSONResponse(content={"status": "success", "message": "Регистрация успешна"})
    response.set_cookie(key="token", value=token, **_auth_cookie_kwargs())
    return response