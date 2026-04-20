import os
import secrets
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


def _build_user_payload(username: str, expire_at_iso: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "username": username,
        "trafficLimitBytes": 0,
        "expireAt": expire_at_iso,
        "hwidDeviceLimit": 3,
    }
    if REMNAWAVE_INTERNAL_SQUAD_ID:
        payload["activeInternalSquads"] = [REMNAWAVE_INTERNAL_SQUAD_ID]
    return payload


async def _request_json(method: str, endpoint: str, payload: dict[str, Any] | None = None):
    headers = _build_headers()
    if headers is None:
        return None, 500
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
                return data, resp.status
    except Exception as e:
        print(f"remnawave request error: {e}")
        return None, 500


async def generate_vpn_key(user_id: int, duration_days: int, country: str):
    username = f"user_{user_id}_{secrets.token_hex(8)}"
    expire_at = datetime.now() + timedelta(days=duration_days)
    payload = _build_user_payload(username=username, expire_at_iso=expire_at.isoformat())
    payload["createdAt"] = datetime.now().isoformat()
    created, status = await _request_json("POST", "/api/users", payload)
    if status >= 400:
        print(f"remnawave create user failed: {status}")
        return None
    sub = _extract_subscription_url(created if isinstance(created, dict) else {})
    if not sub:
        fetched, fetched_status = await _request_json("GET", f"/api/users/{username}")
        if fetched_status < 400 and isinstance(fetched, dict):
            sub = _extract_subscription_url(fetched)
        if not sub and isinstance(created, dict):
            token = created.get("subscriptionToken") or created.get("subscription_token")
            if isinstance(token, str) and token.strip() and REMNAWAVE_BASE_URL:
                sub = f"{REMNAWAVE_BASE_URL.rstrip('/')}/sub/{token.strip()}"
    if not sub:
        return None
    return {"subscription_url": sub, "username": username}


async def renew_vpn_key(username: str, duration_days: int, country: str):
    fetched, status = await _request_json("GET", f"/api/users/{username}")
    if status >= 400 or not isinstance(fetched, dict):
        return None
    current_expire_iso = fetched.get("expireAt") or fetched.get("expire_at")
    base_dt = datetime.now()
    if isinstance(current_expire_iso, str):
        try:
            parsed = datetime.fromisoformat(current_expire_iso.replace("Z", "+00:00"))
            base_dt = max(base_dt, parsed.replace(tzinfo=None))
        except Exception:
            pass
    new_expire_dt = base_dt + timedelta(days=duration_days)
    update_payload = _build_user_payload(username=username, expire_at_iso=new_expire_dt.isoformat())
    updated, update_status = await _request_json("PATCH", "/api/users", update_payload)
    if update_status >= 400:
        print(f"remnawave renew failed: {update_status}")
        return None
    sub = _extract_subscription_url(updated if isinstance(updated, dict) else {})
    if not sub:
        sub = _extract_subscription_url(fetched)
    return {
        "subscription_url": sub,
        "expire": int(new_expire_dt.timestamp()),
        "username": username,
    }