import hashlib
import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

from database import connect

dotenv_path = Path(__file__).with_name(".env.production")
fallback_dotenv_path = Path(__file__).with_name(".env")

if fallback_dotenv_path.exists():
    load_dotenv(dotenv_path=fallback_dotenv_path)
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

CODE_TTL_MINUTES = 15
MAX_CODES_PER_WINDOW = 3
SEND_WINDOW_MINUTES = 15
MAX_VERIFY_ATTEMPTS = 5
ALLOWED_PURPOSES = {"register", "reset_password"}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _pepper() -> str:
    return os.getenv("NEXT_API_SECRET", "dev-pepper")


def _hash_code(email: str, purpose: str, code: str) -> str:
    payload = f"{normalize_email(email)}:{purpose}:{code}:{_pepper()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _cleanup_expired(email: str, purpose: str) -> None:
    now_iso = datetime.now().isoformat()
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            DELETE FROM email_verification_codes
            WHERE email = ? AND purpose = ? AND (expires_at < ? OR used = 1)
            """,
            (normalize_email(email), purpose, now_iso),
        )
        con.commit()


def can_send_code(email: str, purpose: str) -> tuple[bool, str]:
    if purpose not in ALLOWED_PURPOSES:
        return False, "Некорректный тип кода."

    normalized = normalize_email(email)
    window_start = (datetime.now() - timedelta(minutes=SEND_WINDOW_MINUTES)).isoformat()

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT COUNT(*) FROM email_verification_codes
            WHERE email = ? AND purpose = ? AND created_at >= ?
            """,
            (normalized, purpose, window_start),
        )
        count = int(cur.fetchone()[0])

    if count >= MAX_CODES_PER_WINDOW:
        return False, f"Слишком много запросов. Попробуйте через {SEND_WINDOW_MINUTES} минут."

    return True, ""


def create_and_store_code(email: str, purpose: str) -> tuple[str | None, str]:
    allowed, message = can_send_code(email, purpose)
    if not allowed:
        return None, message

    normalized = normalize_email(email)
    _cleanup_expired(normalized, purpose)

    code = generate_code()
    now = datetime.now()
    expires_at = (now + timedelta(minutes=CODE_TTL_MINUTES)).isoformat()

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            INSERT INTO email_verification_codes
            (email, purpose, code_hash, expires_at, created_at, attempts, used)
            VALUES (?, ?, ?, ?, ?, 0, 0)
            """,
            (
                normalized,
                purpose,
                _hash_code(normalized, purpose, code),
                expires_at,
                now.isoformat(),
            ),
        )
        con.commit()

    return code, "Код создан."


def verify_code(email: str, purpose: str, code: str) -> tuple[bool, str]:
    if purpose not in ALLOWED_PURPOSES:
        return False, "Некорректный тип кода."

    normalized = normalize_email(email)
    normalized_code = code.strip()
    if not normalized_code.isdigit() or len(normalized_code) != 6:
        return False, "Код должен состоять из 6 цифр."

    now_iso = datetime.now().isoformat()

    with connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT id, code_hash, expires_at, attempts, used
            FROM email_verification_codes
            WHERE email = ? AND purpose = ? AND used = 0
            ORDER BY id DESC
            LIMIT 1
            """,
            (normalized, purpose),
        )
        row = cur.fetchone()

        if not row:
            return False, "Код не найден. Запросите новый."

        row_id, code_hash, expires_at, attempts, used = row
        if used:
            return False, "Код уже использован. Запросите новый."
        if expires_at < now_iso:
            return False, "Срок действия кода истёк. Запросите новый."
        if attempts >= MAX_VERIFY_ATTEMPTS:
            return False, "Превышено число попыток. Запросите новый код."

        expected_hash = _hash_code(normalized, purpose, normalized_code)
        if not secrets.compare_digest(code_hash, expected_hash):
            cur.execute(
                "UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = ?",
                (row_id,),
            )
            con.commit()
            return False, "Неверный код."

        cur.execute(
            "UPDATE email_verification_codes SET used = 1 WHERE id = ?",
            (row_id,),
        )
        con.commit()

    return True, "Код подтверждён."
