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
  echo "Добавь в .env: CERTBOT_EMAIL=твой@email.com"
  exit 1
fi

DC="docker compose"
if ! docker compose version &>/dev/null; then
  DC="docker-compose"
fi

is_letsencrypt() {
  [[ -f "$CERT_LIVE" ]] \
    && openssl x509 -in "$CERT_LIVE" -noout -issuer 2>/dev/null \
      | grep -qi "Let's Encrypt"
}

if is_letsencrypt; then
  echo "Уже Let's Encrypt:"
  openssl x509 -in "$CERT_LIVE" -noout -issuer -dates
  exit 0
fi

echo "Сейчас самоподписанный сертификат — удаляем и запрашиваем Let's Encrypt..."

mkdir -p nginx/certbot-www

$DC stop nginx 2>/dev/null || true

rm -rf "nginx/letsencrypt/live/${DOMAIN}"
rm -rf "nginx/letsencrypt/archive/${DOMAIN}"
rm -f "nginx/letsencrypt/renewal/${DOMAIN}.conf"

echo "Certbot standalone (порт 80)..."
$DC run --rm -p 80:80 certbot certonly --standalone \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "Запускаем nginx..."
$DC up -d nginx

if is_letsencrypt; then
  echo ""
  echo "OK — https://${DOMAIN}"
  openssl x509 -in "$CERT_LIVE" -noout -issuer -dates
else
  echo ""
  echo "Не удалось. Проверь:"
  echo "  dig +short ${DOMAIN}"
  echo "  dig +short www.${DOMAIN}"
  echo "  ss -tlnp | grep ':80'"
  exit 1
fi
