import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path

import aiohttp
import dotenv
from marzban import MarzbanAPI
from marzban.models import UserCreate, UserModify, ProxySettings

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


COUNTRIES = {
    "germany1": {
        "url": _env_first("MARZABAN_URL_GERMANY1", "MARZABAN_URL_GERMANY"),
        "username": _env_first("MARZABAN_USERNAME_GERMANY1", "MARZABAN_USERNAME_GERMANY"),
        "password": _env_first("MARZABAN_PASSWORD_GERMANY1", "MARZABAN_PASSWORD_GERMANY"),
    },
    "germany2": {
        "url": _env_first("MARZABAN_URL_GERMANY2", "MARZABAN_URL_GERMANY_WHITELIST"),
        "username": _env_first("MARZABAN_USERNAME_GERMANY2", "MARZABAN_USERNAME_GERMANY_WHITELIST"),
        "password": _env_first("MARZABAN_PASSWORD_GERMANY2", "MARZABAN_PASSWORD_GERMANY_WHITELIST"),
    },
    "austria": {
        "url": _env_first("MARZABAN_URL_AUSTRIA"),
        "username": _env_first("MARZABAN_USERNAME_AUSTRIA"),
        "password": _env_first("MARZABAN_PASSWORD_AUSTRIA"),
    },
    "lte_bypass": {
        "url": _env_first("MARZABAN_URL_WHITELIST"),
        "username": _env_first("MARZABAN_USERNAME_WHITELIST"),
        "password": _env_first("MARZABAN_PASSWORD_WHITELIST"),
    },
}

TOKENS = {}


def get_api(country: str):
    cfg = COUNTRIES[country]
    api = MarzbanAPI(base_url=cfg["url"])
    return api, cfg


async def get_marzban_token(country: str):
    api, cfg = get_api(country)

    token = await api.get_token(
        username=cfg["username"],
        password=cfg["password"]
    )

    TOKENS[country] = token.access_token
    return TOKENS[country]


def _extract_subscription_url(user_info) -> str | None:
    if hasattr(user_info, "subscription_url") and user_info.subscription_url:
        return user_info.subscription_url

    links = getattr(user_info, "links", None)
    if links:
        if isinstance(links, list) and len(links) > 0:
            for link in links:
                if isinstance(link, str) and link.startswith("vless://"):
                    return link
            return links[0]
        if isinstance(links, str):
            return links
    return None


async def generate_vpn_key(user_id: int, duration_days: int, country: str):

    api, cfg = get_api(country)

    token = TOKENS.get(country)
    if not token:
        token = await get_marzban_token(country)
        if not token:
            return None

    username = f"user_{user_id}_{secrets.token_hex(8)}"

    expire_ts = 0 if duration_days <= 0 else int(
        (datetime.now() + timedelta(days=duration_days)).timestamp()
    )

    try:
        new_user = UserCreate(
            username=username,
            proxies={
                "vless": ProxySettings(flow="xtls-rprx-vision"),
                "shadowsocks": ProxySettings(),
            },
            expire=expire_ts,
            data_limit=0
        )

        await api.add_user(user=new_user, token=token)
        user_info = await api.get_user(username=username, token=token)

        subscription_url = _extract_subscription_url(user_info)
        if subscription_url:
            return {"subscription_url": subscription_url, "username": username}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}
                async with session.get(
                    f"{cfg['url']}/api/v1/user/{username}/subscription",
                    headers=headers,
                    params={"client_type": "v2ray"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                        if text.startswith(("vless://", "vmess://", "ss://")):
                            return {"subscription_url": text, "username": username}
        except Exception as e:
            print(f"subscription error: {e}")

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}
                async with session.get(
                    f"{cfg['url']}/api/v1/user/{username}/links",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()

                        if isinstance(data, list) and len(data) > 0:
                            for link in data:
                                if isinstance(link, str) and link.startswith("vless://"):
                                    return {"subscription_url": link, "username": username}
                            return {"subscription_url": data[0], "username": username}

                        elif isinstance(data, str):
                            return {"subscription_url": data, "username": username}

        except Exception as e:
            print(f"links error: {e}")

        return None

    except Exception as e:
        print(f"create user error: {e}")

        if "401" in str(e) or "Unauthorized" in str(e):
            token = await get_marzban_token(country)
            try:
                await api.add_user(user=new_user, token=token)
                user_info = await api.get_user(username=username, token=token)

                subscription_url = _extract_subscription_url(user_info)
                if subscription_url:
                    return {"subscription_url": subscription_url, "username": username}

            except Exception as e2:
                print(f"retry error: {e2}")

        return None


async def renew_vpn_key(username: str, duration_days: int, country: str):
    api, _ = get_api(country)
    token = TOKENS.get(country)
    if not token:
        token = await get_marzban_token(country)
        if not token:
            return None

    try:
        user_info = await api.get_user(username=username, token=token)
        current_expire = int(user_info.expire or 0)
        now_ts = int(datetime.now().timestamp())
        base_ts = max(current_expire, now_ts) if current_expire > 0 else now_ts
        new_expire = 0 if duration_days <= 0 else base_ts + duration_days * 24 * 60 * 60

        await api.modify_user(
            username=username,
            token=token,
            user=UserModify(
                proxies=user_info.proxies,
                inbounds=user_info.inbounds,
                data_limit=user_info.data_limit,
                data_limit_reset_strategy=user_info.data_limit_reset_strategy,
                status="active",
                expire=new_expire,
            ),
        )

        updated = await api.get_user(username=username, token=token)
        return {
            "subscription_url": _extract_subscription_url(updated),
            "expire": int(updated.expire or 0),
            "username": username,
        }
    except Exception as e:
        print(f"renew user error: {e}")
        if "401" in str(e) or "Unauthorized" in str(e):
            token = await get_marzban_token(country)
            if not token:
                return None
            try:
                user_info = await api.get_user(username=username, token=token)
                current_expire = int(user_info.expire or 0)
                now_ts = int(datetime.now().timestamp())
                base_ts = max(current_expire, now_ts) if current_expire > 0 else now_ts
                new_expire = 0 if duration_days <= 0 else base_ts + duration_days * 24 * 60 * 60

                await api.modify_user(
                    username=username,
                    token=token,
                    user=UserModify(
                        proxies=user_info.proxies,
                        inbounds=user_info.inbounds,
                        data_limit=user_info.data_limit,
                        data_limit_reset_strategy=user_info.data_limit_reset_strategy,
                        status="active",
                        expire=new_expire,
                    ),
                )
                updated = await api.get_user(username=username, token=token)
                return {
                    "subscription_url": _extract_subscription_url(updated),
                    "expire": int(updated.expire or 0),
                    "username": username,
                }
            except Exception as retry_error:
                print(f"renew retry error: {retry_error}")
        return None