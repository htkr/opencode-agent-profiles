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
REPORT_PATH="${EXP_DIR}/report.md"
MASTER_CSV="exp/MASTER.csv"
MASTER_MD="exp/MASTER.md"

if [[ ! -d "$EXP_DIR" ]]; then
  echo "Experiment not found: $EXP_DIR" >&2
  exit 1
fi

if [[ ! -f "$META_PATH" ]]; then
  echo "meta.json not found: $META_PATH" >&2
  exit 1
fi

if [[ ! -f "$MASTER_CSV" ]]; then
  mkdir -p exp
  cat > "$MASTER_CSV" <<'EOF'
exp_id,created_at,task,background,score_public,score_cv,status,base_commit,preprocess_ref,uv_lock_hash,report_path
EOF
fi

if [[ ! -f "$MASTER_MD" ]]; then
  mkdir -p exp
  cat > "$MASTER_MD" <<'EOF'
# Experiment Master

EOF
fi

python3 - "$META_PATH" "$RESULT_PATH" "$REPORT_PATH" "$MASTER_CSV" "$MASTER_MD" <<'PY'
import csv
import json
import os
import re
import sys
from datetime import datetime, timezone

meta_path, result_path, report_path, master_csv, master_md = sys.argv[1:]

with open(meta_path, "r", encoding="utf-8") as f:
    meta = json.load(f)

result = {}
if os.path.exists(result_path):
    with open(result_path, "r", encoding="utf-8") as f:
        result = json.load(f)

score_public = result.get("score_public", meta.get("score_public", ""))
score_cv = result.get("score_cv", meta.get("score_cv", ""))

meta["score_public"] = score_public
meta["score_cv"] = score_cv
meta["status"] = meta.get("status", result.get("status", "completed"))
meta["finalized_at"] = datetime.now(timezone.utc).isoformat()

with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=True, indent=2)

if not os.path.exists(report_path):
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# {meta['exp_id']}\n\n")
        f.write("## Background\n- TBD\n\n")
        f.write("## Change\n- TBD\n\n")
        f.write(f"## Result\n- score_public: {score_public}\n- score_cv: {score_cv}\n\n")
        f.write("## Analysis\n- TBD\n\n")
        f.write("## Next Actions\n1. TBD\n")

row = {
    "exp_id": meta.get("exp_id", ""),
    "created_at": meta.get("created_at", ""),
    "task": meta.get("task", ""),
    "background": meta.get("background", ""),
    "score_public": score_public,
    "score_cv": score_cv,
    "status": meta.get("status", ""),
    "base_commit": meta.get("base_commit", ""),
    "preprocess_ref": meta.get("preprocess_ref", ""),
    "uv_lock_hash": meta.get("uv_lock_hash", ""),
    "report_path": report_path
}

rows = []
if os.path.exists(master_csv):
    with open(master_csv, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if r.get("exp_id") != row["exp_id"]]

rows.append(row)

fieldnames = [
    "exp_id",
    "created_at",
    "task",
    "background",
    "score_public",
    "score_cv",
    "status",
    "base_commit",
    "preprocess_ref",
    "uv_lock_hash",
    "report_path"
]

with open(master_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

block = "\n".join([
    f"<!-- EXP:{row['exp_id']}:BEGIN -->",
    f"## {row['exp_id']}",
    f"- task: {row['task']}",
    f"- background: {row['background']}",
    f"- score_public: {row['score_public']}",
    f"- score_cv: {row['score_cv']}",
    f"- status: {row['status']}",
    f"- report: `{row['report_path']}`",
    f"<!-- EXP:{row['exp_id']}:END -->",
    ""
])

existing = ""
if os.path.exists(master_md):
    with open(master_md, "r", encoding="utf-8") as f:
        existing = f.read()

pattern = re.compile(
    rf"\n?<!-- EXP:{re.escape(row['exp_id'])}:BEGIN -->.*?<!-- EXP:{re.escape(row['exp_id'])}:END -->\n?",
    flags=re.DOTALL,
)
updated = re.sub(pattern, "\n", existing)
if not updated.endswith("\n"):
    updated += "\n"
updated += block

with open(master_md, "w", encoding="utf-8") as f:
    f.write(updated)
PY

echo "Finalized experiment: $EXP_ID"
echo "Updated: $MASTER_CSV"
echo "Updated: $MASTER_MD"
