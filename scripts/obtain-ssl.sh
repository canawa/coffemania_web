#!/usr/bin/env bash
# Алиас — см. init-letsencrypt.sh
exec "$(dirname "$0")/init-letsencrypt.sh" "$@"
