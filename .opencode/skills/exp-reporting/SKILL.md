---
name: exp-reporting
description: 実験結果のレポート化とマスター記録を標準化する
compatibility: opencode
metadata:
  domain: kaggle
  stage: report
---

## Goal
実験結果を `report.md` に整理し、`MASTER.csv` と `MASTER.md` に追記して再現可能な記録を残す。

## Report Format
- Background
- Change
- Result (`score_public`, `score_cv`)
- Analysis
- Next Actions

## Index Rules
- CSVは1実験1行。
- Markdownは1実験1ブロック。
- `report_path`, `base_commit`, `preprocess_ref`, `uv_lock_hash` を必ず残す。
