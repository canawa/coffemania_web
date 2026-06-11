#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Статус контейнеров ==="
docker compose ps -a

echo ""
echo "=== Nginx (последние 30 строк) ==="
docker compose logs nginx --tail 30

echo ""
echo "=== Frontend ==="
docker compose logs frontend --tail 30

echo ""
echo "=== Backend ==="
docker compose logs backend --tail 30

echo ""
echo "=== Порты 80/443 ==="
ss -tlnp | grep -E ':80|:443' || true

echo ""
echo "=== Проверка HTTPS локально ==="
curl -kI --max-time 5 https://127.0.0.1/ -H "Host: coffeemaniavpn.ru" 2>&1 || true

echo ""
echo "=== SSL-сертификат ==="
CERT="nginx/letsencrypt/live/coffeemaniavpn.ru/fullchain.pem"
if [[ -f "$CERT" ]]; then
  ls -la nginx/letsencrypt/live/coffeemaniavpn.ru/
  echo "Issuer:"
  openssl x509 -in "$CERT" -noout -issuer -dates 2>&1
else
  echo "Сертификат не найден — запусти: ./scripts/init-letsencrypt.sh"
fi
