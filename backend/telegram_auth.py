import os
from functools import lru_cache
from pathlib import Path

import jwt
from dotenv import load_dotenv
from jwt import PyJWKClient

dotenv_path = Path(__file__).with_name(".env.production")
fallback_dotenv_path = Path(__file__).with_name(".env")

if fallback_dotenv_path.exists():
    load_dotenv(dotenv_path=fallback_dotenv_path)
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

TELEGRAM_CLIENT_ID = os.getenv("TELEGRAM_CLIENT_ID", "7964141443").strip()
TELEGRAM_ISSUER = "https://oauth.telegram.org"
TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(TELEGRAM_JWKS_URL, cache_keys=True)


def _telegram_audiences() -> list[str | int]:
    audiences: list[str | int] = [TELEGRAM_CLIENT_ID]
    if TELEGRAM_CLIENT_ID.isdigit():
        audiences.append(int(TELEGRAM_CLIENT_ID))
    return audiences


def verify_telegram_id_token(id_token: str) -> dict:
    if not TELEGRAM_CLIENT_ID:
        raise ValueError("TELEGRAM_CLIENT_ID не настроен")

    signing_key = _jwks_client().get_signing_key_from_jwt(id_token)
    payload = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "PS256"],
        audience=_telegram_audiences(),
        issuer=TELEGRAM_ISSUER,
        options={"require": ["exp", "iat", "sub"]},
    )
    return payload


def extract_telegram_profile(payload: dict) -> dict:
    raw_id = payload.get("id")
    if raw_id is None:
        raw_id = payload.get("sub")
    if raw_id is None:
        raise ValueError("В токене Telegram нет идентификатора пользователя")

    return {
        "telegram_id": int(raw_id),
        "telegram_username": payload.get("preferred_username"),
        "telegram_name": payload.get("name"),
        "telegram_photo_url": payload.get("picture"),
    }
