#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  publish_notebook_git.sh --src <local.ipynb> --repo-dir <git-repo-dir> --dest-path <path/in/repo.ipynb> [--repo owner/repo] [--ref main] [--dry-run]

What it does (default):
  1) Validate notebook JSON
  2) Copy notebook into repo path
  3) Show git status (no commit/push)
  4) Render Colab URL when --repo is given

Options:
  --src       Source notebook path (required)
  --repo-dir  Local git repository directory (required)
  --dest-path Destination path inside repo (required)
  --repo      GitHub repo in owner/repo format (optional, for Colab URL)
  --ref       Branch/tag/sha for Colab URL (default: main)
  --dry-run   Validate and preview only; do not copy file
USAGE
}

SRC=""
REPO_DIR=""
DEST_PATH=""
REPO_SLUG=""
REF_NAME="main"
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --src) SRC="$2"; shift 2 ;;
    --repo-dir) REPO_DIR="$2"; shift 2 ;;
    --dest-path) DEST_PATH="$2"; shift 2 ;;
    --repo) REPO_SLUG="$2"; shift 2 ;;
    --ref) REF_NAME="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [ -z "$SRC" ] || [ -z "$REPO_DIR" ] || [ -z "$DEST_PATH" ]; then
  usage
  exit 2
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="$SCRIPT_DIR/validate_notebook_json.py"
COLAB_URL="$SCRIPT_DIR/render_colab_url.py"

if [ ! -f "$SRC" ]; then
  echo "ERROR: source notebook not found: $SRC" >&2
  exit 3
fi
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "ERROR: not a git repo: $REPO_DIR" >&2
  exit 4
fi
if [[ "$DEST_PATH" != *.ipynb ]]; then
  echo "ERROR: --dest-path must end with .ipynb" >&2
  exit 5
fi

python3 "$VALIDATOR" "$SRC"

DEST_ABS="$REPO_DIR/${DEST_PATH#/}"
mkdir -p "$(dirname "$DEST_ABS")"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[DRY RUN] Would copy: $SRC -> $DEST_ABS"
else
  cp "$SRC" "$DEST_ABS"
  echo "Copied: $SRC -> $DEST_ABS"
fi

echo
echo "[Git Status]"
git -C "$REPO_DIR" status --short -- "$DEST_PATH" || true

if [ -n "$REPO_SLUG" ]; then
  echo
  echo "[Colab URL]"
  python3 "$COLAB_URL" --repo "$REPO_SLUG" --path "$DEST_PATH" --ref "$REF_NAME"
fi

echo
echo "Done. commit/push is intentionally not performed by this script."
