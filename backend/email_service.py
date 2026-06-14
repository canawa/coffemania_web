import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

dotenv_path = Path(__file__).with_name(".env.production")
fallback_dotenv_path = Path(__file__).with_name(".env")

if fallback_dotenv_path.exists():
    load_dotenv(dotenv_path=fallback_dotenv_path)
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER).strip()
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"}
SITE_NAME = os.getenv("SITE_NAME", "КОФЕМАНИЯ ВПН")


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD and SMTP_FROM)


def _build_message(to_email: str, subject: str, text_body: str, html_body: str) -> MIMEMultipart:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))
    return message


def send_verification_code(to_email: str, code: str, purpose: str) -> tuple[bool, str]:
    if purpose == "register":
        subject = f"{SITE_NAME} — код подтверждения регистрации"
        action = "регистрации"
    else:
        subject = f"{SITE_NAME} — код для сброса пароля"
        action = "сброса пароля"

    text_body = (
        f"Ваш код для {action}: {code}\n\n"
        f"Код действует 15 минут. Если вы не запрашивали письмо, просто проигнорируйте его.\n\n"
        f"— {SITE_NAME}"
    )
    html_body = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3D1C1C;max-width:520px">
      <h2 style="margin:0 0 16px">{SITE_NAME}</h2>
      <p>Код для {action}:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">{code}</p>
      <p style="color:#666">Код действует 15 минут. Если вы не запрашивали письмо, просто проигнорируйте его.</p>
    </div>
    """

    if not smtp_configured():
        print(f"[email] SMTP не настроен. Код для {to_email} ({purpose}): {code}")
        return True, "Код отправлен (режим разработки: смотрите логи сервера)."

    message = _build_message(to_email, subject, text_body, html_body)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_email], message.as_string())
        return True, "Код отправлен на email."
    except Exception as exc:
        print(f"[email] send failed for {to_email}: {exc}")
        return False, "Не удалось отправить письмо. Попробуйте позже."
