---
name: exp-kaggle-runbook
description: Kaggle実験の開始から実行までを標準化する
compatibility: opencode
metadata:
  domain: kaggle
  stage: run
---

## Goal
毎回の実験を `exp/<exp_id>/` に切り出し、同期実行して再現性情報を残す。

## Rules
- 前処理コードは `src/preprocess` 管理とし、実験側にはコピーしない。
- 実験ディレクトリには実験固有コードのみ配置する。
- 実行は同期で行い、ログは `logs/run.log` に保存する。
- `meta.json` に `base_commit`, `preprocess_ref`, `uv_lock_hash` を記録する。

## Procedure
1. `scripts/exp/create-exp.sh` で実験ディレクトリを作る。
2. 実験固有の `train.py` / `config.yaml` を更新する。
3. `scripts/exp/run-exp.sh <exp_id>` で実行する。
4. 実行後に `result.json` と `meta.json` を確認する。
