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

DC="docker compose"
if ! docker compose version &>/dev/null; then
  DC="docker-compose"
fi

is_letsencrypt_cert() {
  [[ -f "$CERT_LIVE" ]] \
    && openssl x509 -in "$CERT_LIVE" -noout -issuer 2>/dev/null \
      | grep -qi "Let's Encrypt"
}

if is_letsencrypt_cert; then
  echo "Let's Encrypt сертификат уже есть."
  $DC exec nginx nginx -s reload 2>/dev/null || true
  openssl x509 -in "$CERT_LIVE" -noout -issuer -dates
  exit 0
fi

mkdir -p nginx/certbot-www

echo "Удаляем самоподписанный сертификат..."
$DC stop nginx 2>/dev/null || true
rm -rf "nginx/letsencrypt/live/${DOMAIN}"
rm -rf "nginx/letsencrypt/archive/${DOMAIN}"
rm -f "nginx/letsencrypt/renewal/${DOMAIN}.conf"

echo "Запрашиваем Let's Encrypt (standalone)..."
$DC run --rm --entrypoint certbot -p 80:80 certbot certonly --standalone \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "Поднимаем стек..."
$DC up -d --build

if is_letsencrypt_cert; then
  echo "Готово: https://${DOMAIN}"
  openssl x509 -in "$CERT_LIVE" -noout -issuer -dates
else
  echo "Ошибка: сертификат Let's Encrypt не получен."
  exit 1
fi
