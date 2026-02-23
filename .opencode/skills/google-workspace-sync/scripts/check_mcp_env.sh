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

echo "[Purpose]"
echo "This script is a Google Drive/Workspace MCP preflight (Drive/Docs/Sheets operations)."
echo "GitHub publish is CLI-first and does not require MCP."

echo

echo "[GitHub CLI note]"
check_var GITHUB_TOKEN

echo "(optional for this script; may still be needed for git push/gh auth depending on your setup)"

echo

echo "[Google MCP prerequisites - common variants]"
check_path_var GOOGLE_APPLICATION_CREDENTIALS
check_path_var GOOGLE_WORKSPACE_CREDENTIALS
check_path_var GOOGLE_OAUTH_CREDENTIALS
check_path_var GOOGLE_CLIENT_SECRET_PATH

echo

echo "[Drive-focused MCP extras (implementation-specific)]"
check_path_var GOOGLE_DRIVE_MCP_CREDENTIALS_DIR
check_path_var GOOGLE_DRIVE_TOKEN_PATH
check_var GOOGLE_OAUTH_CLIENT_ID
check_var GOOGLE_OAUTH_CLIENT_SECRET

if [ -n "${COLAB_RELEASE_TAG:-}" ] || [ -n "${COLAB_GPU:-}" ]; then
  echo
  echo "[Colab detected]"
  echo "Use Colab Secrets and write credentials to /tmp only (do not save to Drive/repo)."
else
  echo
  echo "[Colab not detected]"
  echo "If you plan to run MCP in Colab, re-run this script inside the Colab runtime too."
fi

cat <<'MSG'

Notes:
- Variable names differ by MCP implementation. Keep this script as a quick preflight only.
- This repo standardizes on GOOGLE_APPLICATION_CREDENTIALS when possible.
- Some MCP builds may instead require GOOGLE_CLIENT_SECRET_PATH or client-id/client-secret env vars.
- Do not store secrets in this repository.
- If OAuth consent screen is in Testing mode, add your Google account as a test user first.
- Run this before Google MCP operations (Drive/Docs/Sheets/etc.).
MSG
