#!/usr/bin/env bash
set -euo pipefail

DOMAIN="coffeemaniavpn.ru"
CERT_LIVE="nginx/letsencrypt/live/${DOMAIN}/fullchain.pem"

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

EMAIL="${CERTBOT_EMAIL:-}"

if [[ -z "$EMAIL" ]]; then
  echo "Добавь CERTBOT_EMAIL=твой@email.com в .env"
  exit 1
fi

mkdir -p nginx/letsencrypt nginx/certbot-www

is_letsencrypt_cert() {
  [[ -f "$CERT_LIVE" ]] \
    && openssl x509 -in "$CERT_LIVE" -noout -issuer 2>/dev/null \
      | grep -qi "Let's Encrypt"
}

if is_letsencrypt_cert; then
  echo "Let's Encrypt сертификат уже есть."
  docker compose exec nginx nginx -s reload 2>/dev/null || true
  echo "Готово: https://${DOMAIN}"
  exit 0
fi

echo "Запускаем стек..."
docker compose up -d --build

echo "Запрашиваем Let's Encrypt..."
if ! docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --force-renewal; then

  echo ""
  echo "Webroot не сработал, пробуем standalone (nginx на 30 сек остановится)..."
  docker compose stop nginx
  docker compose run --rm -p 80:80 certbot certonly --standalone \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --force-renewal
  docker compose up -d nginx
fi

echo "Перезагружаем nginx..."
docker compose exec nginx nginx -s reload

if is_letsencrypt_cert; then
  echo "Готово: https://${DOMAIN}"
  openssl x509 -in "$CERT_LIVE" -noout -issuer -dates
else
  echo "Ошибка: Let's Encrypt сертификат не получен."
  echo "Проверь DNS: coffeemaniavpn.ru и www → IP сервера, порты 80/443 открыты."
  exit 1
fi
