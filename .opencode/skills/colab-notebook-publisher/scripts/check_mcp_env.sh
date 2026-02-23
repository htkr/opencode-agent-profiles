#!/usr/bin/env bash
set -euo pipefail

check_var() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    echo "OK env: $name is set"
  else
    echo "MISSING env: $name"
  fi
}

check_path_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "MISSING env: $name"
    return
  fi
  if [ -e "${!name}" ]; then
    echo "OK path: $name -> ${!name}"
  else
    echo "MISSING path: $name -> ${!name}"
  fi
}

echo "[GitHub MCP prerequisites]"
check_var GITHUB_TOKEN

echo

echo "[Google MCP prerequisites - common variants]"
check_path_var GOOGLE_APPLICATION_CREDENTIALS
check_path_var GOOGLE_WORKSPACE_CREDENTIALS
check_path_var GOOGLE_OAUTH_CREDENTIALS

cat <<'MSG'

Notes:
- Variable names differ by MCP implementation. Keep this script as a quick preflight only.
- Do not store secrets in this repository.
MSG
