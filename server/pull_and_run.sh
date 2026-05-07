#!/usr/bin/env bash
# server/pull_and_run.sh
# Pull an image from the private registry and run the obfuscation service container
# Usage: ./pull_and_run.sh <registry> <image:tag>

set -euo pipefail
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <registry> <image:tag>"
  exit 1
fi
REGISTRY=$1
IMAGE=$2
CONTAINER_NAME=luau-obfuscator

FULL="$REGISTRY/$IMAGE"

read -p "Registry username: " USER
read -s -p "Registry password: " PASS
echo

echo "$PASS" | docker login $REGISTRY -u "$USER" --password-stdin

docker pull "$FULL"

# stop+remove existing
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f $CONTAINER_NAME || true
fi

# run container (example port mapping and env variables)
# Make sure to set OBFUSCATE_TOKEN as env or inject via Docker secrets

docker run -d \
  --name $CONTAINER_NAME \
  -p 3000:3000 \
  -e OBFUSCATE_TOKEN="REPLACE_WITH_TOKEN" \
  $FULL

echo "Container $CONTAINER_NAME running from $FULL"
