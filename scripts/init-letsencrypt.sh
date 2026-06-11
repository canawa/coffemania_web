#!/usr/bin/env bash
set -euo pipefail

DOMAIN="coffeemaniavpn.ru"

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

EMAIL="${CERTBOT_EMAIL:-}"

if [[ -z "$EMAIL" ]]; then
  echo "Укажи CERTBOT_EMAIL в .env (корень репозитория)"
  exit 1
fi

mkdir -p nginx/letsencrypt nginx/certbot-www

if [[ ! -f "nginx/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "Создаём временный сертификат, чтобы nginx мог стартовать..."
  mkdir -p "nginx/letsencrypt/live/${DOMAIN}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "nginx/letsencrypt/live/${DOMAIN}/privkey.pem" \
    -out "nginx/letsencrypt/live/${DOMAIN}/fullchain.pem" \
    -subj "/CN=${DOMAIN}"
fi

echo "Запускаем стек..."
docker compose up -d --build

echo "Запрашиваем Let's Encrypt..."
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

echo "Перезагружаем nginx с боевым сертификатом..."
docker compose exec nginx nginx -s reload

echo "Готово: https://${DOMAIN}"
