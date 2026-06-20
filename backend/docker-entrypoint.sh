#!/bin/sh
set -e

# Docker иногда создаёт database.db как каталог вместо файла
if [ -d /app/data/database.db ]; then
  echo "[backend] Удаляем ошибочный каталог database.db..."
  rm -rf /app/data/database.db
fi

mkdir -p /app/data
touch /app/data/database.db

if [ ! -f /app/data/telegram_jwks.json ] && [ -f /app/telegram_jwks.json ]; then
  cp /app/telegram_jwks.json /app/data/telegram_jwks.json
  echo "[backend] Copied bundled Telegram JWKS to /app/data/"
fi

exec uvicorn main:app --host 0.0.0.0 --port 8001
