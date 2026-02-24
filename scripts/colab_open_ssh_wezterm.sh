#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/colab_open_ssh_wezterm.sh (--host HOST | --json PATH | --cmd-file PATH) [--user USER] [--key PATH] [--proxy-command CMD] [--dry-run] [--print-only] [--exec-shell] [--tab-title TITLE]
USAGE
}

HOST=""
JSON_PATH=""
CMD_FILE=""
SSH_USER="root"
SSH_KEY="~/.ssh/solafune_colab"
PROXY_COMMAND='cloudflared access ssh --hostname %h'
DRY_RUN=0
PRINT_ONLY=0
EXEC_SHELL=0
TAB_TITLE="colab-ssh"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"; shift 2 ;;
    --json)
      JSON_PATH="${2:-}"; shift 2 ;;
    --cmd-file)
      CMD_FILE="${2:-}"; shift 2 ;;
    --user)
      SSH_USER="${2:-}"; shift 2 ;;
    --key)
      SSH_KEY="${2:-}"; shift 2 ;;
    --proxy-command)
      PROXY_COMMAND="${2:-}"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    --print-only)
      PRINT_ONLY=1; shift ;;
    --exec-shell)
      EXEC_SHELL=1; shift ;;
    --tab-title)
      TAB_TITLE="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      usage
      exit 1 ;;
  esac
done

SOURCE_COUNT=0
[[ -n "$HOST" ]] && SOURCE_COUNT=$((SOURCE_COUNT + 1))
[[ -n "$JSON_PATH" ]] && SOURCE_COUNT=$((SOURCE_COUNT + 1))
[[ -n "$CMD_FILE" ]] && SOURCE_COUNT=$((SOURCE_COUNT + 1))

if [[ "$SOURCE_COUNT" -eq 0 ]]; then
  echo "ERROR: one of --host, --json, or --cmd-file is required" >&2
  usage
  exit 1
fi
if [[ "$SOURCE_COUNT" -gt 1 ]]; then
  echo "ERROR: specify only one of --host, --json, or --cmd-file" >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "ERROR: ssh command not found" >&2
  exit 1
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "ERROR: cloudflared command not found (required for ProxyCommand)" >&2
  exit 1
fi

SSH_CMD=""
if [[ -n "$HOST" ]]; then
  if [[ -z "${HOST// }" ]]; then
    echo "ERROR: --host is empty" >&2
    exit 1
  fi
  SSH_CMD="ssh -i ${SSH_KEY} -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ProxyCommand=\"${PROXY_COMMAND}\" ${SSH_USER}@${HOST}"
elif [[ -n "$CMD_FILE" ]]; then
  [[ -f "$CMD_FILE" ]] || { echo "ERROR: cmd file not found: $CMD_FILE" >&2; exit 1; }
  SSH_CMD="$(head -n 1 "$CMD_FILE")"
else
  [[ -f "$JSON_PATH" ]] || { echo "ERROR: json file not found: $JSON_PATH" >&2; exit 1; }
  SSH_CMD="$(python3 - <<'PY' "$JSON_PATH"
import json,sys
p=sys.argv[1]
with open(p, encoding='utf-8') as f:
    d=json.load(f)
cmd=d.get('ssh_command')
if not cmd:
    missing=[]
    for k in ['hostname','ssh_user','proxy_command']:
        if not d.get(k):
            missing.append(k)
    if missing:
        raise SystemExit(f"ERROR: missing keys in json: {', '.join(missing)}")
    key=d.get('ssh_key_path_hint','~/.ssh/solafune_colab')
    cmd=(f"ssh -i {key} -o ServerAliveInterval=30 -o ServerAliveCountMax=3 "
         f"-o ProxyCommand=\\\"{d['proxy_command']}\\\" {d['ssh_user']}@{d['hostname']}")
print(cmd)
PY
)"
fi

if [[ -z "$SSH_CMD" ]]; then
  echo "ERROR: empty ssh command" >&2
  exit 1
fi

printf 'SSH command: %s\n' "$SSH_CMD"

if [[ "$DRY_RUN" -eq 1 || "$PRINT_ONLY" -eq 1 ]]; then
  exit 0
fi

if command -v wezterm >/dev/null 2>&1; then
  if wezterm cli spawn --help >/dev/null 2>&1; then
    wezterm cli spawn -- bash -lc "$SSH_CMD"
    printf 'Opened wezterm tab (%s)\n' "$TAB_TITLE"
    exit 0
  fi
fi

if [[ "$EXEC_SHELL" -eq 1 ]]; then
  exec bash -lc "$SSH_CMD"
fi

echo "wezterm not found or wezterm cli unavailable. Use --exec-shell to run directly, or copy the command above." >&2
exit 2
