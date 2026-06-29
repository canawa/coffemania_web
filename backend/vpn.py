import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import dotenv
import requests

from network import prefer_ipv4

prefer_ipv4()

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
REMNAWAVE_API_BASE_URL = _env_first("REMNAWAVE_INTERNAL_BASE_URL", "REMNAWAVE_BASE_URL")
REMNAWAVE_SUBSCRIPTION_BASE_URL = _env_first("REMNAWAVE_SUBSCRIPTION_BASE_URL")
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


def _unwrap_remnawave_user(data: Any) -> dict | None:
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                return item
        return None

    if not isinstance(data, dict):
        return None

    for key in ("response", "data"):
        nested = data.get(key)
        if isinstance(nested, list) and nested:
            first = nested[0]
            if isinstance(first, dict):
                return first
        if isinstance(nested, dict):
            if any(
                nested.get(field)
                for field in ("username", "uuid", "subscription_url", "subscriptionUrl", "shortUuid", "short_uuid")
            ):
                return nested

    if any(
        data.get(field)
        for field in ("username", "uuid", "subscription_url", "subscriptionUrl", "shortUuid", "short_uuid")
    ):
        return data

    return _unwrap_remnawave_response(data)


def _subscription_public_base() -> str | None:
    if REMNAWAVE_SUBSCRIPTION_BASE_URL:
        return REMNAWAVE_SUBSCRIPTION_BASE_URL.rstrip("/")
    panel = REMNAWAVE_BASE_URL or ""
    if "panel." in panel:
        return panel.replace("panel.", "sub.", 1).rstrip("/")
    return _public_remnawave_base()


def _public_remnawave_base() -> str | None:
    return (REMNAWAVE_BASE_URL or "").rstrip("/") or None


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
    token = user_info.get("subscriptionToken") or user_info.get("subscription_token")
    panel_base = _public_remnawave_base()
    if isinstance(token, str) and token.strip() and panel_base:
        return f"{panel_base}/sub/{token.strip()}"
    short_uuid = user_info.get("shortUuid") or user_info.get("short_uuid")
    sub_base = _subscription_public_base()
    if isinstance(short_uuid, str) and short_uuid.strip() and sub_base:
        return f"{sub_base}/{short_uuid.strip()}"
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


def remnawave_telegram_username(telegram_id: int) -> str:
    return f"user_{telegram_id}"


def _parse_hwid_limit(user: dict | None, default: int = 3) -> int:
    if not user:
        return default
    for key in ("hwidDeviceLimit", "hwid_device_limit"):
        value = user.get(key)
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                pass
    return default


def _build_user_payload(
    username: str,
    expire_at_iso: str,
    email: str | None = None,
    telegram_id: int | None = None,
    hwid_device_limit: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "username": username,
        "trafficLimitBytes": TRAFFIC_LIMIT_BYTES_25_GB,
        "trafficLimitStrategy": TRAFFIC_LIMIT_STRATEGY_MONTH_ROLLING,
        "expireAt": expire_at_iso,
        "hwidDeviceLimit": hwid_device_limit if hwid_device_limit is not None else 3,
    }
    if email:
        payload["email"] = email
    if telegram_id is not None:
        payload["telegramId"] = telegram_id
    if REMNAWAVE_INTERNAL_SQUAD_ID:
        payload["activeInternalSquads"] = [REMNAWAVE_INTERNAL_SQUAD_ID]
    return payload


async def fetch_user_by_telegram_id(telegram_id: int, *, quiet_not_found: bool = False) -> dict | None:
    data, status, error_text = await _request_json(
        "GET",
        f"/api/users/by-telegram-id/{telegram_id}",
    )
    if status >= 400:
        if not (quiet_not_found and status == 404):
            print(f"remnawave fetch by telegram id failed: {status} | {error_text[:300]}")
        return None
    user = _unwrap_remnawave_user(data)
    if not user:
        print(f"remnawave fetch by telegram id parse failed for tg_id={telegram_id}")
    return user


async def fetch_remnawave_user_for_telegram(telegram_id: int) -> dict | None:
    """Bot users in Remnawave: username user_{telegram_id}."""
    username = remnawave_telegram_username(telegram_id)
    user = await fetch_user_by_username(username, quiet_not_found=True)
    if user:
        return user
    return await fetch_user_by_telegram_id(telegram_id, quiet_not_found=True)


async def fetch_telegram_bot_subscription(telegram_id: int) -> dict | None:
    username = remnawave_telegram_username(telegram_id)
    api_base = (REMNAWAVE_API_BASE_URL or REMNAWAVE_BASE_URL or "").rstrip("/")

    data, status, error_text = await _request_json(
        "GET",
        f"/api/users/by-username/{username}",
    )
    if status == 200:
        user = _unwrap_remnawave_user(data)
        if user:
            subscription = remnawave_user_to_subscription(user)
            if subscription:
                subscription["username"] = subscription.get("username") or username
                return subscription
            print(
                f"[remnawave] user {username} found but subscription url missing, "
                f"keys={sorted(user.keys())}",
            )
    elif status == 404:
        print(f"[remnawave] user {username} not found (404), api={api_base}")
    else:
        print(
            f"[remnawave] user lookup failed for {username}: {status} | {error_text[:300]} "
            f"(api={api_base})",
        )

    tg_data, tg_status, tg_error = await _request_json(
        "GET",
        f"/api/users/by-telegram-id/{telegram_id}",
    )
    if tg_status == 200:
        tg_user = _unwrap_remnawave_user(tg_data)
        if tg_user:
            subscription = remnawave_user_to_subscription(tg_user)
            if subscription:
                subscription["username"] = subscription.get("username") or tg_user.get("username") or username
                return subscription

    data, status, error_text = await _request_json(
        "GET",
        f"/api/subscriptions/by-username/{username}",
    )
    if status >= 400:
        if status == 404:
            print(f"[remnawave] no subscription for tg_id={telegram_id} ({username})")
        else:
            print(
                f"[remnawave] subscriptions lookup failed for {username}: "
                f"{status} | {error_text[:300]}",
            )
        return None

    unwrapped = _unwrap_remnawave_user(data)
    if not unwrapped:
        print(f"[remnawave] subscription parse failed for {username}")
        return None

    sub_url = _extract_subscription_url(unwrapped)
    if not sub_url:
        print(
            f"[remnawave] subscription payload for {username} has no url, "
            f"keys={sorted(unwrapped.keys())}",
        )
        return None

    return {
        "username": username,
        "subscription_url": sub_url,
        "expires_at": unwrapped.get("expireAt") or unwrapped.get("expire_at"),
        "status": unwrapped.get("status"),
    }


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
        hwid_device_limit=_parse_hwid_limit(rw_user),
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


async def fetch_user_by_username(username: str, *, quiet_not_found: bool = False) -> dict | None:
    data, status, error_text = await _request_json(
        "GET",
        f"/api/users/by-username/{username}",
    )
    if status >= 400:
        if not (quiet_not_found and status == 404):
            print(f"remnawave fetch user failed: {status} | {error_text[:300]}")
        return None
    return _unwrap_remnawave_user(data)


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


def _request_json_sync(
    method: str,
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any] | None,
) -> tuple[Any, int, str]:
    try:
        response = requests.request(
            method,
            url,
            headers=headers,
            json=payload,
            timeout=30,
        )
        try:
            data = response.json()
        except Exception:
            data = None
        return data, response.status_code, response.text
    except requests.RequestException as exc:
        print(f"remnawave request error: {type(exc).__name__}: {exc!r}")
        return None, 500, str(exc) or type(exc).__name__


async def _request_json(method: str, endpoint: str, payload: dict[str, Any] | None = None):
    headers = _build_headers()
    if headers is None:
        return None, 500, "Remnawave не настроен: проверьте REMNAWAVE_BASE_URL и REMNAWAVE_TOKEN"
    api_base = (REMNAWAVE_API_BASE_URL or REMNAWAVE_BASE_URL or "").rstrip("/")
    if not api_base:
        return None, 500, "Remnawave не настроен: проверьте REMNAWAVE_BASE_URL и REMNAWAVE_TOKEN"
    url = f"{api_base}{endpoint}"
    return await asyncio.to_thread(_request_json_sync, method, url, headers, payload)


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
    hwid_device_limit: int | None = None,
) -> tuple[dict | None, int, str]:
    update_payload = _build_user_payload(
        username=username,
        expire_at_iso=expire_at_iso,
        email=email,
        telegram_id=telegram_id,
        hwid_device_limit=hwid_device_limit,
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
        hwid_device_limit=_parse_hwid_limit(fetched),
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


def _coerce_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.isdigit():
            return int(stripped)
        try:
            return int(float(stripped))
        except ValueError:
            return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_user_uuid(user: dict | None) -> str | None:
    if not user:
        return None
    for key in ("uuid", "userUuid", "user_uuid"):
        value = user.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _unwrap_hwid_devices_response(data: Any) -> tuple[int, list[dict]]:
    if not isinstance(data, dict):
        if isinstance(data, list):
            devices = [item for item in data if isinstance(item, dict)]
            return len(devices), devices
        return 0, []

    blocks: list[Any] = [data]
    for key in ("response", "data"):
        nested = data.get(key)
        if isinstance(nested, dict):
            blocks.append(nested)
        elif isinstance(nested, list):
            devices = [item for item in nested if isinstance(item, dict)]
            return len(devices), devices

    for block in blocks:
        if not isinstance(block, dict):
            continue
        devices_raw = block.get("devices")
        if isinstance(devices_raw, list):
            devices = [item for item in devices_raw if isinstance(item, dict)]
            total = _coerce_int(block.get("total"))
            return total if total is not None else len(devices), devices

    return 0, []


async def resolve_remnawave_account_user(
    user_id: int | None,
    telegram_id: int | None,
    preferred_username: str | None = None,
) -> dict | None:
    if isinstance(preferred_username, str) and preferred_username.strip():
        user = await fetch_user_by_username(preferred_username.strip(), quiet_not_found=True)
        if user:
            return user

    if telegram_id:
        user = await fetch_remnawave_user_for_telegram(telegram_id)
        if user:
            return user
    if user_id:
        return await fetch_user_by_username(remnawave_username(user_id), quiet_not_found=True)
    return None


async def fetch_user_hwid_devices(user_uuid: str) -> tuple[int, list[dict]]:
    data, status, error_text = await _request_json(
        "GET",
        f"/api/hwid/devices/get/{user_uuid}",
    )
    if status >= 400:
        print(
            f"remnawave fetch hwid devices failed for {user_uuid}: "
            f"{status} | {error_text[:300]}",
        )
        return 0, []

    used, devices = _unwrap_hwid_devices_response(data)
    if used == 0 and isinstance(data, dict):
        print(
            f"[remnawave] hwid devices parsed as 0 for {user_uuid}, "
            f"keys={sorted(data.keys())}",
        )
    return used, devices


async def get_account_device_stats(
    user_id: int | None,
    telegram_id: int | None,
    preferred_username: str | None = None,
) -> dict | None:
    rw_user = await resolve_remnawave_account_user(
        user_id,
        telegram_id,
        preferred_username=preferred_username,
    )
    if not rw_user:
        return None

    user_uuid = _extract_user_uuid(rw_user)
    devices_used = 0
    if user_uuid:
        devices_used, _ = await fetch_user_hwid_devices(user_uuid)
    else:
        print(
            f"[remnawave] no uuid for user {rw_user.get('username')}, "
            f"keys={sorted(rw_user.keys())}",
        )

    devices_limit = _parse_hwid_limit(rw_user)
    return {
        "devices_used": devices_used,
        "devices_limit": devices_limit,
        "devices_available": max(0, devices_limit - devices_used),
        "remnawave_username": rw_user.get("username"),
    }


async def add_hwid_device_slots(rw_user: dict, amount: int) -> tuple[bool, int]:
    username = rw_user.get("username")
    if not isinstance(username, str) or not username.strip():
        return False, 0

    current_limit = _parse_hwid_limit(rw_user)
    new_limit = current_limit + amount
    payload: dict[str, Any] = {
        "username": username.strip(),
        "hwidDeviceLimit": new_limit,
    }
    user_uuid = rw_user.get("uuid")
    if isinstance(user_uuid, str) and user_uuid.strip():
        payload["uuid"] = user_uuid.strip()

    _, status, error_text = await _request_json("PATCH", "/api/users", payload)
    if status >= 400:
        print(f"remnawave add hwid devices failed: {status} | {error_text[:300]}")
        return False, current_limit
    return True, new_limit