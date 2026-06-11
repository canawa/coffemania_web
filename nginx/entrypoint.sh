#!/bin/sh
set -e

DOMAIN="${SSL_DOMAIN:-coffeemaniavpn.ru}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  echo "[nginx] SSL-сертификат не найден, создаём временный..."
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}"
fi

exec nginx -g "daemon off;"
