#!/usr/bin/env bash
# bin/obfuscate.sh - small wrapper for lua/obfuscator.lua
set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
LUA=${LUA:-lua}

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 --input in.lua --output out.lua [--mode=luau|lua] [--mangle-local] [--encrypt-strings]"
  exit 1
fi

# forward args to the lua script
$LUA "$REPO_ROOT/lua/obfuscator.lua" "$@"
