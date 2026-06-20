import os
from functools import lru_cache
from pathlib import Path

import jwt
import requests
from dotenv import load_dotenv
from jwt import PyJWKSet

from network import prefer_ipv4

prefer_ipv4()

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
def _load_jwks() -> PyJWKSet:
    response = requests.get(TELEGRAM_JWKS_URL, timeout=15)
    response.raise_for_status()
    return PyJWKSet.from_dict(response.json())


def _telegram_audiences() -> list[str | int]:
    audiences: list[str | int] = [TELEGRAM_CLIENT_ID]
    if TELEGRAM_CLIENT_ID.isdigit():
        audiences.append(int(TELEGRAM_CLIENT_ID))
    return audiences


def verify_telegram_id_token(id_token: str) -> dict:
    if not TELEGRAM_CLIENT_ID:
        raise ValueError("TELEGRAM_CLIENT_ID не настроен")

    header = jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("JWT без kid")

    try:
        signing_key = _load_jwks()[kid]
    except (KeyError, requests.RequestException) as exc:
        _load_jwks.cache_clear()
        raise ConnectionError(
            "Не удалось загрузить ключи Telegram (oauth.telegram.org). "
            "Проверьте интернет/DNS в контейнере backend."
        ) from exc

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
