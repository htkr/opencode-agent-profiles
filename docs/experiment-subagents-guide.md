# Experiment Management Subagents Guide

このドキュメントは、Kaggle実験管理のためのサブエージェント群
（`exp-orchestrator`, `exp-runner`, `exp-reporter`, `exp-indexer`）の
設計意図・責務分担・運用手順を定義する。

## 1. 目的

- 実験ごとの再現性を担保する
- 実装/実行/報告/台帳更新を分業し、コンテキスト消費を抑える
- 1実験単位で `commit` / `push` を徹底する
- 実験ログを `exp/` 配下に集約し、追跡可能にする

## 2. スコープ

- 前処理コードは `src/preprocess` に共通管理（本フローでは編集対象外）
- 実験固有コードは `exp/<exp_id>/` 配下で管理
- 依存固定は `uv.lock` を前提とする

## 3. 全体アーキテクチャ

実験フローは以下の4サブエージェントで分業する。

1. `exp-orchestrator`
   全体進行。必要な作業を他サブエージェントへ委譲する司令塔。

2. `exp-runner`
   実験固有コードの実装・同期実行・ログ生成を担当。

3. `exp-reporter`
   実験結果を `report.md` に整理。

4. `exp-indexer`
   `exp/MASTER.csv` と `exp/MASTER.md` を更新。

## 4. サブエージェント定義と責務

### 4.1 exp-orchestrator

- 目的:
  - 実験の開始→実行→報告→台帳更新を順序立てて進める
- 主な責務:
  - `exp-kaggle-runbook` のロード
  - `exp-runner` / `exp-reporter` / `exp-indexer` への委譲
  - ユーザへの進捗報告（`exp_id` を必ず含める、OS通知は使わない）
- 非責務:
  - 詳細実装そのもの（runnerへ委譲）

### 4.2 exp-runner

- 目的:
  - 実験固有コードを `exp/<exp_id>/` に実装し、同期実行する
- 主な責務:
  - `scripts/exp/create-exp.sh`
  - `scripts/exp/run-exp.sh <exp_id>`
  - `logs/run.log` 出力確認
  - `meta.json` / `result.json` 更新確認
- 制約:
  - 明示指示がない限り `exp/<exp_id>/` 以外を編集しない
  - `.env` や秘密情報を扱わない

### 4.3 exp-reporter

- 目的:
  - 実験結果を再利用しやすい文章に整形する
- 主な責務:
  - `exp-reporting` のロード
  - `meta.json`, `result.json`, `logs/run.log` を根拠に `report.md` 生成
- レポート構成:
  - Background
  - Change
  - Result (`score_public`, `score_cv`)
  - Analysis
  - Next Actions

### 4.4 exp-indexer

- 目的:
  - 台帳を更新して比較・検索・再現を容易にする
- 主な責務:
  - `exp/MASTER.csv` 1行追加/更新
  - `exp/MASTER.md` 1ブロック追加/更新
- 必須記録:
  - `exp_id`, `score_public`, `score_cv`, `status`
  - `base_commit`, `preprocess_ref`, `uv_lock_hash`
  - `report_path`

## 5. 実験ライフサイクル

### Step 1: 実験作成

実行:

```bash
/exp-start <slug> [background]
```

生成物:

- `exp/<exp_id>/meta.json`
- `exp/<exp_id>/train.py`
- `exp/<exp_id>/config.yaml`
- `exp/<exp_id>/run.sh`
- `exp/<exp_id>/reproduce.sh`
- `exp/<exp_id>/result.json`
- `exp/<exp_id>/report.md`
- `exp/<exp_id>/logs/`

### Step 2: 実験実行（同期）

実行:

```bash
/exp-run <exp_id>
```

期待結果:

- `exp/<exp_id>/logs/run.log` が更新される
- `meta.json.status` が `running` -> `completed|failed` に更新される
- `result.json` のスコアが反映される

### Step 3: レポートと台帳更新

実行:

```bash
/exp-finalize <exp_id>
```

期待結果:

- `exp/<exp_id>/report.md` が更新される
- `exp/MASTER.csv` と `exp/MASTER.md` が更新される
- 実験単位で `commit` / `push` される

## 6. 再現性要件

`meta.json` には以下を必須記録する。

- `exp_id`
- `base_commit`
- `preprocess_ref`
- `uv_lock_hash`
- `train_entrypoint`
- `run_command`
- `python_version`
- `score_public`
- `score_cv`
- `status`

再現手順:

```bash
cd exp/<exp_id>
./reproduce.sh
```

## 7. コマンド連携

- `/exp-start`: 実験雛形作成
- `/exp-run`: 同期実行
- `/exp-finalize`: 報告・台帳・Git反映

補助:

- `@exp-orchestrator`: 全体進行を明示委譲
- `@exp-runner`: 実装/実行だけ個別委譲
- `@exp-reporter`: レポート改善のみ
- `@exp-indexer`: 台帳更新のみ

## 8. エラー時運用

### 実行失敗時 (`status=failed`)

- `run.log` の末尾を確認
- `meta.json.exit_code` を確認
- `result.json` 欠落時はその旨を `report.md` に明記
- 再実行時は同じ `exp_id` を使い、修正履歴を `report.md` に追記

### 台帳更新不整合時

- `MASTER.csv` は `exp_id` 重複行を1つに保つ
- `MASTER.md` は同一 `exp_id` ブロックを更新して重複を避ける

## 9. コンテキスト最適化ルール

- 長いログは会話へ貼らず、ファイルパスを返す
- 返答は「結果要約 + 根拠ファイル」形式にする
- 実験処理は `subtask` 分離を優先する
- 報告/台帳更新は軽量モデル側（Tier3）に寄せる

## 10. モデル割り当てポリシー（Tier方式）

Tier定義:

- `profiles/model-tiers.json`

割り当て定義:

- `profiles/subagent-registry.json`

生成:

```bash
node profiles/generate-configs.mjs
```

適用:

```bash
profiles/switch-profile.sh vanilla
# or
profiles/switch-profile.sh ohmy
```

現在の実験系割り当て:

- `exp-orchestrator`: Tier1
- `exp-runner`: Tier1
- `exp-reporter`: Tier3
- `exp-indexer`: Tier3

## 11. セキュリティとガード

- `.env`, token, credential など秘密情報を読み書きしない
- 実験成果物で機密が含まれる場合は commit/push 対象外にする
- 例外運用をした場合は `report.md` に理由を記録する

## 12. 運用チェックリスト

実験開始前:

- [ ] 目的と背景が定義されている
- [ ] `slug` が命名規約に沿っている

実行後:

- [ ] `logs/run.log` がある
- [ ] `meta.json` に status/score が反映された

完了時:

- [ ] `report.md` 更新済み
- [ ] `MASTER.csv`, `MASTER.md` 更新済み
- [ ] 1実験単位で `commit` / `push` 済み
