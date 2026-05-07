#!/usr/bin/env bash
# infra/registry/deploy_registry.sh
# Bootstrap the registry stack (create certs directory if needed, prompt for domain)

set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if [ -z "${DOMAIN:-}" ]; then
  read -p "Registry domain (e.g. registry.example.com): " DOMAIN
fi

echo "Using domain: $DOMAIN"

mkdir -p data certs

echo "
Please obtain TLS certs for $DOMAIN and place them as:
  ./certs/fullchain.pem
  ./certs/privkey.pem

You can use certbot (letsencrypt) on the host:
  sudo certbot certonly --standalone -d $DOMAIN
  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./certs/
  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./certs/

Create htpasswd file for auth (example):
  docker run --rm httpd:2.4-alpine htpasswd -Bbn myuser 'MyS3cretP@ss' > ./htpasswd

After that, start the stack:
  docker compose up -d

"

read -p "Continue and open compose now? (y/N): " ok
if [ "$ok" = "y" ] || [ "$ok" = "Y" ]; then
  docker compose up -d
  echo "Stack started. Check 'docker compose ps'"
else
  echo "Aborted. Please follow the README steps and run the compose when ready."
fi
