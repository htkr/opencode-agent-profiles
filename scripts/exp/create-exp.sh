#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <slug> [background]" >&2
  exit 1
fi

SLUG_RAW="$1"
shift || true
BACKGROUND="${*:-}"

SLUG="$(printf '%s' "$SLUG_RAW" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9_' '_' | sed 's/^_\+//; s/_\+$//')"
if [[ -z "$SLUG" ]]; then
  echo "Invalid slug: $SLUG_RAW" >&2
  exit 1
fi

TS="$(date +%Y%m%d_%H%M)"
EXP_ID="${TS}_${SLUG}"
EXP_DIR="exp/${EXP_ID}"

if [[ -e "$EXP_DIR" ]]; then
  echo "Experiment already exists: $EXP_DIR" >&2
  exit 1
fi

mkdir -p "$EXP_DIR/logs" "$EXP_DIR/artifacts"

BASE_COMMIT="$(git rev-parse HEAD 2>/dev/null || true)"
PREPROCESS_REF="$(git rev-parse HEAD:src/preprocess 2>/dev/null || true)"
UV_LOCK_HASH=""
if [[ -f "uv.lock" ]]; then
  UV_LOCK_HASH="$(sha256sum uv.lock | awk '{print $1}')"
fi

cat > "$EXP_DIR/config.yaml" <<'EOF'
seed: 42
notes: fill me
EOF

cat > "$EXP_DIR/train.py" <<'EOF'
import json
from pathlib import Path


def main() -> None:
    out = {
        "score_public": None,
        "score_cv": None,
        "status": "completed"
    }
    Path("result.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("Wrote result.json")


if __name__ == "__main__":
    main()
EOF

cat > "$EXP_DIR/run.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
uv run python train.py
EOF
chmod +x "$EXP_DIR/run.sh"

cat > "$EXP_DIR/reproduce.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
uv sync --frozen
./run.sh
EOF
chmod +x "$EXP_DIR/reproduce.sh"

python3 - "$EXP_DIR/meta.json" "$EXP_ID" "$SLUG_RAW" "$BACKGROUND" "$BASE_COMMIT" "$PREPROCESS_REF" "$UV_LOCK_HASH" <<'PY'
import json
import sys
from datetime import datetime, timezone

path, exp_id, task, background, base_commit, preprocess_ref, uv_lock_hash = sys.argv[1:]
doc = {
    "exp_id": exp_id,
    "task": task,
    "background": background,
    "created_at": datetime.now(timezone.utc).isoformat(),
    "status": "created",
    "base_commit": base_commit,
    "preprocess_ref": preprocess_ref,
    "uv_lock_file": "uv.lock",
    "uv_lock_hash": uv_lock_hash,
    "python_version": "",
    "train_entrypoint": "train.py",
    "run_command": "./run.sh",
    "score_public": "",
    "score_cv": ""
}
with open(path, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=True, indent=2)
PY

cat > "$EXP_DIR/result.json" <<'EOF'
{
  "score_public": null,
  "score_cv": null,
  "status": "created"
}
EOF

cat > "$EXP_DIR/report.md" <<EOF
# ${EXP_ID}

## Background
- ${BACKGROUND:-TBD}

## Change
- TBD

## Result
- score_public: TBD
- score_cv: TBD

## Analysis
- TBD

## Next Actions
1. TBD
EOF

if [[ ! -f "exp/MASTER.csv" ]]; then
  mkdir -p exp
  cat > "exp/MASTER.csv" <<'EOF'
exp_id,created_at,task,background,score_public,score_cv,status,base_commit,preprocess_ref,uv_lock_hash,report_path
EOF
fi

if [[ ! -f "exp/MASTER.md" ]]; then
  mkdir -p exp
  cat > "exp/MASTER.md" <<'EOF'
# Experiment Master

EOF
fi

echo "Created experiment: $EXP_ID"
echo "Path: $EXP_DIR"
