# Experiment Workflow

## Scope

- `src/preprocess` は共通管理（このフローでは編集対象外）。
- `exp/<exp_id>/` には実験固有コードのみ置く。

## Commands

```bash
/exp-start <slug> [background]
/exp-run <exp_id>
/exp-finalize <exp_id>
```

## Reproducibility

- 依存は `uv.lock` 前提。
- `meta.json` に `base_commit`, `preprocess_ref`, `uv_lock_hash` を記録。
- `reproduce.sh` で `uv sync --frozen` 後に実行。

## Logging

- 実行ログ: `exp/<exp_id>/logs/run.log`
- レポート: `exp/<exp_id>/report.md`
- 台帳: `exp/MASTER.csv`, `exp/MASTER.md`

## Git

- レポート確定後に1実験単位で commit/push。
