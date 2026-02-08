#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(cd "${BASE_DIR}/.." && pwd)"
BACKUP_DIR="${CONFIG_DIR}/backups"
MODE="${1:-}"

if [[ -z "${MODE}" ]]; then
  echo "Usage: $(basename "$0") <ohmy|vanilla>"
  exit 1
fi

if [[ "${MODE}" != "ohmy" && "${MODE}" != "vanilla" ]]; then
  echo "Invalid profile: ${MODE}"
  echo "Expected: ohmy or vanilla"
  exit 1
fi

ts="$(date +%Y%m%dT%H%M%S)"
mkdir -p "${BACKUP_DIR}"

if [[ -f "${CONFIG_DIR}/opencode.json" ]]; then
  cp "${CONFIG_DIR}/opencode.json" "${BACKUP_DIR}/opencode.json.${ts}.bak"
fi

if [[ -f "${CONFIG_DIR}/oh-my-opencode.json" ]]; then
  cp "${CONFIG_DIR}/oh-my-opencode.json" "${BACKUP_DIR}/oh-my-opencode.json.${ts}.bak"
fi

cp "${BASE_DIR}/${MODE}/opencode.json" "${CONFIG_DIR}/opencode.json"

if [[ "${MODE}" == "ohmy" ]]; then
  cp "${BASE_DIR}/ohmy/oh-my-opencode.json" "${CONFIG_DIR}/oh-my-opencode.json"
fi

echo "Applied profile: ${MODE}"
echo "- Active: ${CONFIG_DIR}/opencode.json"
if [[ "${MODE}" == "ohmy" ]]; then
  echo "- Active: ${CONFIG_DIR}/oh-my-opencode.json"
fi
echo "- Backups: ${BACKUP_DIR}"
