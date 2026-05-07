#!/usr/bin/env bash
# client/push_to_registry.sh
# Usage: ./push_to_registry.sh <registry> <local-image> <remote-repo:tag>
# Example: ./push_to_registry.sh registry.example.com myimage:dev my-repo:dev

set -euo pipefail
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <registry> <local-image> <remote-repo:tag>"
  exit 1
fi
REGISTRY=$1
LOCAL_IMAGE=$2
REMOTE=$3

# Ensure docker is logged in
read -p "Registry username: " USER
read -s -p "Registry password: " PASS
echo

echo "$PASS" | docker login $REGISTRY -u "$USER" --password-stdin

# Tag and push
FULL="$REGISTRY/$REMOTE"
docker tag "$LOCAL_IMAGE" "$FULL"
docker push "$FULL"

echo "Pushed $LOCAL_IMAGE -> $FULL"
