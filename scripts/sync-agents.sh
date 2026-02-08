#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT_DIR/.opencode/profiles/minimal/AGENTS.md"
DST="$ROOT_DIR/AGENTS.md"

if [ ! -f "$SRC" ]; then
  echo "source not found: $SRC" >&2
  exit 1
fi

cp "$SRC" "$DST"
echo "synced: $SRC -> $DST"
