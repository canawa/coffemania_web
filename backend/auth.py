import os
from datetime import datetime, timedelta
from pathlib import Path

import jwt
from dotenv import load_dotenv

app_env = os.getenv("APP_ENV", "local").lower()
env_filename = ".env.production" if app_env == "production" else ".env.local"
dotenv_path = Path(__file__).with_name(env_filename)
fallback_dotenv_path = Path(__file__).with_name(".env")

if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
if fallback_dotenv_path.exists():
    load_dotenv(dotenv_path=fallback_dotenv_path)

private_key = os.getenv("NEXT_API_SECRET")

if not private_key:
    raise RuntimeError(
        "Missing NEXT_API_SECRET. Set it in backend/.env.local/.env.production or environment variables."
    )
def create_jwt(email: str, role: str, keys: dict):
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    payload = {
        'email': email,
        'role': role,
        'keys': keys,
        'exp': datetime.now() + timedelta(minutes=30),
    }
    token = jwt.encode(payload, private_key, algorithm="HS256", headers=header)
    return token

def verify_jwt(token):
    try:
        payload = jwt.decode(token, private_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError: # если exp истек
        return {'status': 'error', 'message': 'Token expired'}
    except jwt.InvalidTokenError: # если токен не валидный
        return {'status': 'error', 'message': 'Invalid token'}
    except Exception as e: # если произошла ошибка
        return {'status': 'error', 'message': str(e)}