#!/bin/sh
set -e

# Docker иногда создаёт database.db как каталог вместо файла
if [ -d /app/data/database.db ]; then
  echo "[backend] Удаляем ошибочный каталог database.db..."
  rm -rf /app/data/database.db
fi

mkdir -p /app/data
touch /app/data/database.db

exec uvicorn main:app --host 0.0.0.0 --port 8001
