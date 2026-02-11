#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $(basename "$0") <exp_id>" >&2
  exit 1
fi

EXP_ID="$1"
EXP_DIR="exp/${EXP_ID}"
META_PATH="${EXP_DIR}/meta.json"
RESULT_PATH="${EXP_DIR}/result.json"
LOG_PATH="${EXP_DIR}/logs/run.log"

if [[ ! -d "$EXP_DIR" ]]; then
  echo "Experiment not found: $EXP_DIR" >&2
  exit 1
fi

if [[ ! -f "$META_PATH" ]]; then
  echo "meta.json not found: $META_PATH" >&2
  exit 1
fi

mkdir -p "${EXP_DIR}/logs"

python3 - "$META_PATH" <<'PY'
import json
import platform
import sys
from datetime import datetime, timezone

meta_path = sys.argv[1]
with open(meta_path, "r", encoding="utf-8") as f:
    meta = json.load(f)
meta["status"] = "running"
meta["started_at"] = datetime.now(timezone.utc).isoformat()
meta["python_version"] = platform.python_version()
with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=True, indent=2)
PY

set +e
(
  cd "$EXP_DIR"
  ./run.sh
) 2>&1 | tee "$LOG_PATH"
EXIT_CODE=${PIPESTATUS[0]}
set -e

python3 - "$META_PATH" "$RESULT_PATH" "$EXIT_CODE" <<'PY'
import json
import sys
from datetime import datetime, timezone

meta_path, result_path, exit_code = sys.argv[1], sys.argv[2], int(sys.argv[3])
with open(meta_path, "r", encoding="utf-8") as f:
    meta = json.load(f)

meta["finished_at"] = datetime.now(timezone.utc).isoformat()
meta["exit_code"] = exit_code
meta["status"] = "completed" if exit_code == 0 else "failed"

if exit_code == 0:
    try:
        with open(result_path, "r", encoding="utf-8") as f:
            result = json.load(f)
        meta["score_public"] = result.get("score_public", "")
        meta["score_cv"] = result.get("score_cv", "")
    except FileNotFoundError:
        pass

with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=True, indent=2)
PY

if [[ "$EXIT_CODE" -ne 0 ]]; then
  echo "Experiment failed: $EXP_ID (exit=$EXIT_CODE)" >&2
  exit "$EXIT_CODE"
fi

echo "Experiment completed: $EXP_ID"
echo "Log: $LOG_PATH"
