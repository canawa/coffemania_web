#!/bin/sh
set -e

# Docker иногда создаёт database.db как каталог вместо файла
if [ -d /app/data/database.db ]; then
  echo "[backend] Удаляем ошибочный каталог database.db..."
  rm -rf /app/data/database.db
fi

mkdir -p /app/data
touch /app/data/database.db

python - <<'PY' || true
import json
import urllib.request
from pathlib import Path

cache_path = Path("/app/data/telegram_jwks.json")
try:
    with urllib.request.urlopen(
        "https://oauth.telegram.org/.well-known/jwks.json",
        timeout=20,
    ) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    print("[backend] Telegram JWKS cached to /app/data/telegram_jwks.json")
except Exception as exc:
    if cache_path.is_file():
        print(f"[backend] JWKS prefetch failed, using existing cache: {exc}")
    else:
        print(f"[backend] JWKS prefetch failed (no cache yet): {exc}")
PY

exec uvicorn main:app --host 0.0.0.0 --port 8001
