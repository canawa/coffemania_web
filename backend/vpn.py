import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import aiohttp
import dotenv

dotenv_path = Path(__file__).with_name(".env.production")
fallback_dotenv_path = Path(__file__).with_name(".env")

if dotenv_path.exists():
    dotenv.load_dotenv(dotenv_path=dotenv_path)
if fallback_dotenv_path.exists():
    dotenv.load_dotenv(dotenv_path=fallback_dotenv_path)


def _env_first(*keys: str):
    for key in keys:
        value = os.getenv(key)
        if value:
            return value.strip()
    return None


REMNAWAVE_BASE_URL = _env_first("REMNAWAVE_BASE_URL")
REMNAWAVE_TOKEN = _env_first("REMNAWAVE_TOKEN")
REMNAWAVE_INTERNAL_SQUAD_ID = _env_first("REMNAWAVE_INTERNAL_SQUAD_ID")
TRAFFIC_LIMIT_BYTES_25_GB = 25 * 1024 * 1024 * 1024
TRAFFIC_LIMIT_STRATEGY_MONTH_ROLLING = "MONTH_ROLLING"


def _unwrap_remnawave_response(data: Any) -> dict | None:
    if not isinstance(data, dict):
        return None
    nested = data.get("response")
    if isinstance(nested, dict):
        return nested
    nested = data.get("data")
    if isinstance(nested, dict):
        return nested
    return data


def _extract_subscription_url(user_info: Any) -> str | None:
    if not isinstance(user_info, dict):
        return None
    for key in ("subscriptionUrl", "subscription_url", "subscription", "subscriptionLink"):
        value = user_info.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    links = user_info.get("links")
    if isinstance(links, list):
        for link in links:
            if isinstance(link, str) and link.strip():
                return link.strip()
    if isinstance(links, str) and links.strip():
        return links.strip()
    return None


def _build_headers() -> dict[str, str] | None:
    if not REMNAWAVE_BASE_URL or not REMNAWAVE_TOKEN:
        return None
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {REMNAWAVE_TOKEN}",
    }


def remnawave_username(user_id: int) -> str:
    return f"web_{user_id}"


def _build_user_payload(
    username: str,
    expire_at_iso: str,
    email: str | None = None,
    telegram_id: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "username": username,
        "trafficLimitBytes": TRAFFIC_LIMIT_BYTES_25_GB,
        "trafficLimitStrategy": TRAFFIC_LIMIT_STRATEGY_MONTH_ROLLING,
        "expireAt": expire_at_iso,
        "hwidDeviceLimit": 3,
    }
    if email:
        payload["email"] = email
    if telegram_id is not None:
        payload["telegramId"] = telegram_id
    if REMNAWAVE_INTERNAL_SQUAD_ID:
        payload["activeInternalSquads"] = [REMNAWAVE_INTERNAL_SQUAD_ID]
    return payload


async def fetch_user_by_telegram_id(telegram_id: int) -> dict | None:
    data, status, error_text = await _request_json(
        "GET",
        f"/api/users/by-telegram-id/{telegram_id}",
    )
    if status >= 400 or not isinstance(data, dict):
        if status >= 400 and status != 404:
            print(f"remnawave fetch by telegram id failed: {status} | {error_text}")
        return None
    return _unwrap_remnawave_response(data)


async def attach_telegram_id_to_remnawave_user(
    rw_user: dict,
    telegram_id: int,
    email: str | None = None,
) -> bool:
    username = rw_user.get("username")
    if not isinstance(username, str) or not username.strip():
        return False

    expire_at = rw_user.get("expireAt") or rw_user.get("expire_at")
    if not isinstance(expire_at, str) or not expire_at.strip():
        expire_at = datetime.now().isoformat()

    update_payload = _build_user_payload(
        username=username.strip(),
        expire_at_iso=expire_at,
        email=email or rw_user.get("email"),
        telegram_id=telegram_id,
    )
    update_payload["status"] = rw_user.get("status") or "ACTIVE"
    user_uuid = rw_user.get("uuid")
    if isinstance(user_uuid, str) and user_uuid.strip():
        update_payload["uuid"] = user_uuid.strip()

    _, update_status, update_error_text = await _request_json(
        "PATCH",
        "/api/users",
        update_payload,
    )
    if update_status >= 400:
        print(
            f"remnawave attach telegramId failed: {update_status} | {update_error_text}",
        )
        return False
    return True


async def fetch_user_by_username(username: str) -> dict | None:
    data, status, error_text = await _request_json(
        "GET",
        f"/api/users/by-username/{username}",
    )
    if status >= 400 or not isinstance(data, dict):
        if status >= 400:
            print(f"remnawave fetch user failed: {status} | {error_text}")
        return None
    return _unwrap_remnawave_response(data)


def remnawave_user_to_subscription(user: dict | None) -> dict | None:
    if not user:
        return None
    subscription_url = _extract_subscription_url(user)
    if not subscription_url:
        return None
    return {
        "username": user.get("username"),
        "subscription_url": subscription_url,
        "expires_at": user.get("expireAt") or user.get("expire_at"),
        "status": user.get("status"),
    }


async def _request_json(method: str, endpoint: str, payload: dict[str, Any] | None = None):
    headers = _build_headers()
    if headers is None:
        return None, 500, "Remnawave не настроен: проверьте REMNAWAVE_BASE_URL и REMNAWAVE_TOKEN"
    url = f"{REMNAWAVE_BASE_URL.rstrip('/')}{endpoint}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method,
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                try:
                    data = await resp.json()
                except Exception:
                    data = None
                text = await resp.text()
                return data, resp.status, text
    except Exception as e:
        print(f"remnawave request error: {e}")
        return None, 500, str(e)


def _user_already_exists_error(error_text: str) -> bool:
    lowered = error_text.lower()
    return "already exists" in lowered or '"errorcode":"a019"' in lowered.replace(" ", "")


def _extend_expire_from_user(user: dict, duration_days: int) -> datetime:
    current_expire_iso = user.get("expireAt") or user.get("expire_at")
    base_dt = datetime.now()
    if isinstance(current_expire_iso, str):
        try:
            parsed = datetime.fromisoformat(current_expire_iso.replace("Z", "+00:00"))
            base_dt = max(base_dt, parsed.replace(tzinfo=None))
        except Exception:
            pass
    return base_dt + timedelta(days=duration_days)


async def update_remnawave_user(
    username: str,
    expire_at_iso: str,
    email: str | None = None,
    user_uuid: str | None = None,
    telegram_id: int | None = None,
) -> tuple[dict | None, int, str]:
    update_payload = _build_user_payload(
        username=username,
        expire_at_iso=expire_at_iso,
        email=email,
        telegram_id=telegram_id,
    )
    update_payload["status"] = "ACTIVE"
    if isinstance(user_uuid, str) and user_uuid.strip():
        update_payload["uuid"] = user_uuid.strip()
    updated_raw, update_status, update_error_text = await _request_json(
        "PATCH",
        "/api/users",
        update_payload,
    )
    if update_status >= 400:
        return None, update_status, update_error_text
    updated = _unwrap_remnawave_response(updated_raw) if isinstance(updated_raw, dict) else None
    return updated, update_status, update_error_text


async def generate_vpn_key(
    user_id: int,
    email: str,
    duration_days: int,
    country: str,
    telegram_id: int | None = None,
):
    if not REMNAWAVE_INTERNAL_SQUAD_ID:
        return {
            "error": "Не задан REMNAWAVE_INTERNAL_SQUAD_ID. Без internal squad Remnawave может возвращать access error."
        }
    username = remnawave_username(user_id)

    existing = await fetch_user_by_username(username)
    if existing:
        return await renew_vpn_key(
            username,
            duration_days,
            country,
            email=email,
            telegram_id=telegram_id,
        )

    expire_at = datetime.now() + timedelta(days=duration_days)
    payload = _build_user_payload(
        username=username,
        expire_at_iso=expire_at.isoformat(),
        email=email,
        telegram_id=telegram_id,
    )
    payload["createdAt"] = datetime.now().isoformat()
    created_raw, status, error_text = await _request_json("POST", "/api/users", payload)
    if status >= 400:
        if status in (400, 409) and _user_already_exists_error(error_text):
            return await renew_vpn_key(
                username,
                duration_days,
                country,
                email=email,
                telegram_id=telegram_id,
            )
        print(f"remnawave create user failed: {status} | {error_text}")
        return {"error": f"Remnawave create user failed ({status}): {error_text}"}

    created = _unwrap_remnawave_response(created_raw) if isinstance(created_raw, dict) else None
    sub = _extract_subscription_url(created)
    if not sub:
        existing = await fetch_user_by_username(username)
        if existing:
            sub = _extract_subscription_url(existing)
        if not sub and isinstance(created_raw, dict):
            token = created_raw.get("subscriptionToken") or created_raw.get("subscription_token")
            if isinstance(token, str) and token.strip() and REMNAWAVE_BASE_URL:
                sub = f"{REMNAWAVE_BASE_URL.rstrip('/')}/sub/{token.strip()}"
    if not sub:
        return {"error": "Remnawave не вернул subscription URL после создания пользователя"}
    return {"subscription_url": sub, "username": username}


async def renew_vpn_key(
    username: str,
    duration_days: int,
    country: str,
    email: str | None = None,
    telegram_id: int | None = None,
):
    fetched = await fetch_user_by_username(username)
    if not fetched:
        return {"error": f"Не удалось получить пользователя в Remnawave: {username}"}

    new_expire_dt = _extend_expire_from_user(fetched, duration_days)
    updated, update_status, update_error_text = await update_remnawave_user(
        username=username,
        expire_at_iso=new_expire_dt.isoformat(),
        email=email,
        user_uuid=fetched.get("uuid") if isinstance(fetched.get("uuid"), str) else None,
        telegram_id=telegram_id,
    )
    if update_status >= 400 or not updated:
        print(f"remnawave renew failed: {update_status} | {update_error_text}")
        return {"error": f"Remnawave renew failed ({update_status}): {update_error_text}"}

    sub = _extract_subscription_url(updated) or _extract_subscription_url(fetched)
    return {
        "subscription_url": sub,
        "expire": int(new_expire_dt.timestamp()),
        "username": username,
    }