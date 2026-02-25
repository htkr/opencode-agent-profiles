#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

JSON_OUTPUT=0
TIMEOUT_SEC="${TIMEOUT_SEC:-5}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/colab_env_preflight.sh [--json]

Checks local prerequisites before running Colab Playwright automation:
- DNS resolution / outbound HTTPS host resolution (npm/github/google)
- Tailscale-managed /etc/resolv.conf hint
- node / pnpm / npx
- package.json / node_modules
- Playwright browser install (best effort local check)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON_OUTPUT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

exists_cmd() { command -v "$1" >/dev/null 2>&1; }

py_escape() {
  python3 - <<'PY' "$1"
import json,sys
print(json.dumps(sys.argv[1], ensure_ascii=False))
PY
}

check_dns_host() {
  local host="$1"
  python3 - <<'PY' "$host"
import socket,sys
host=sys.argv[1]
try:
    infos=socket.getaddrinfo(host,443)
    ip=infos[0][4][0]
    print(f"OK:{ip}")
except Exception as e:
    print(f"ERR:{type(e).__name__}:{e}")
PY
}

PLAYWRIGHT_BROWSER_INSTALLED="unknown"
if [[ -d "${REPO_ROOT}/node_modules/playwright" || -d "${REPO_ROOT}/node_modules/.pnpm" ]]; then
  if [[ -d "${HOME}/.cache/ms-playwright" ]]; then
    if find "${HOME}/.cache/ms-playwright" -mindepth 1 -maxdepth 1 -type d | head -1 | grep -q .; then
      PLAYWRIGHT_BROWSER_INSTALLED="yes"
    else
      PLAYWRIGHT_BROWSER_INSTALLED="no"
    fi
  else
    PLAYWRIGHT_BROWSER_INSTALLED="no"
  fi
fi

RESOLV_CONTENT="$(cat /etc/resolv.conf 2>/dev/null || true)"
TAILSCALE_RESOlV="no"
if printf '%s' "$RESOLV_CONTENT" | rg -q 'tailscale|100\.100\.100\.100'; then
  TAILSCALE_RESOlV="yes"
fi

DNS_NPM="$(check_dns_host registry.npmjs.org)"
DNS_GITHUB="$(check_dns_host github.com)"
DNS_GOOGLE="$(check_dns_host google.com)"

NODE_OK="no"; PNPM_OK="no"; NPX_OK="no"
NODE_VER=""; PNPM_VER=""
if exists_cmd node; then NODE_OK="yes"; NODE_VER="$(node --version 2>/dev/null || true)"; fi
if exists_cmd pnpm; then PNPM_OK="yes"; PNPM_VER="$(pnpm --version 2>/dev/null || true)"; fi
if exists_cmd npx; then NPX_OK="yes"; fi

PKG_JSON="no"; NODE_MODULES="no"; DEVBOX_JSON="no"
[[ -f "${REPO_ROOT}/package.json" ]] && PKG_JSON="yes"
[[ -d "${REPO_ROOT}/node_modules" ]] && NODE_MODULES="yes"
[[ -f "${REPO_ROOT}/devbox.json" ]] && DEVBOX_JSON="yes"

OVERALL="ok"
NEEDS_USER_ACTION=0
FAIL_REASONS=()

for item in "$DNS_NPM" "$DNS_GITHUB" "$DNS_GOOGLE"; do
  if [[ "$item" != OK:* ]]; then
    OVERALL="blocked"
    NEEDS_USER_ACTION=1
    FAIL_REASONS+=("dns_resolution_failed")
    break
  fi
done

if [[ "$NODE_OK" != "yes" || "$PNPM_OK" != "yes" || "$NPX_OK" != "yes" ]]; then
  OVERALL="blocked"
  FAIL_REASONS+=("node_or_pnpm_missing")
fi

if [[ "$PKG_JSON" != "yes" ]]; then
  OVERALL="blocked"
  FAIL_REASONS+=("package_json_missing")
fi

if [[ "$NODE_MODULES" != "yes" ]]; then
  OVERALL="blocked"
  FAIL_REASONS+=("node_modules_missing")
fi

if [[ "$PLAYWRIGHT_BROWSER_INSTALLED" == "no" ]]; then
  OVERALL="blocked"
  FAIL_REASONS+=("playwright_browser_missing")
fi

python3 - <<'PY' \
  "$JSON_OUTPUT" "$OVERALL" "$NEEDS_USER_ACTION" "$TAILSCALE_RESOlV" \
  "$NODE_OK" "$NODE_VER" "$PNPM_OK" "$PNPM_VER" "$NPX_OK" \
  "$PKG_JSON" "$NODE_MODULES" "$DEVBOX_JSON" \
  "$DNS_NPM" "$DNS_GITHUB" "$DNS_GOOGLE" "$PLAYWRIGHT_BROWSER_INSTALLED" \
  "$(printf '%s\n' "${FAIL_REASONS[@]-}")"
import json,sys
json_output = sys.argv[1] == "1"
data = {
  "overall": sys.argv[2],
  "needs_user_action": sys.argv[3] == "1",
  "resolv_conf_tailscale_hint": sys.argv[4] == "yes",
  "commands": {
    "node": {"ok": sys.argv[5] == "yes", "version": sys.argv[6] or None},
    "pnpm": {"ok": sys.argv[7] == "yes", "version": sys.argv[8] or None},
    "npx": {"ok": sys.argv[9] == "yes"},
  },
  "repo": {
    "package_json": sys.argv[10] == "yes",
    "node_modules": sys.argv[11] == "yes",
    "devbox_json": sys.argv[12] == "yes",
  },
  "dns": {
    "registry.npmjs.org": sys.argv[13],
    "github.com": sys.argv[14],
    "google.com": sys.argv[15],
  },
  "playwright_browser_installed": sys.argv[16],
  "fail_reasons": [x for x in sys.argv[17].splitlines() if x],
  "next_steps": [
    "devbox shell",
    "pnpm install",
    "pnpm exec playwright install chromium",
  ],
}

if json_output:
    print(json.dumps(data, ensure_ascii=False, indent=2))
else:
    print(f"[colab-preflight] overall={data['overall']} needs_user_action={str(data['needs_user_action']).lower()}")
    print(f"[colab-preflight] tailscale_resolv_hint={str(data['resolv_conf_tailscale_hint']).lower()}")
    print(f"[colab-preflight] node={data['commands']['node']}")
    print(f"[colab-preflight] pnpm={data['commands']['pnpm']}")
    print(f"[colab-preflight] npx={data['commands']['npx']}")
    print(f"[colab-preflight] repo={data['repo']}")
    print(f"[colab-preflight] dns={data['dns']}")
    print(f"[colab-preflight] playwright_browser_installed={data['playwright_browser_installed']}")
    if data["fail_reasons"]:
        print(f"[colab-preflight] fail_reasons={','.join(data['fail_reasons'])}")
    print("[colab-preflight] next_steps:")
    for s in data["next_steps"]:
        print(f"  - {s}")
PY

