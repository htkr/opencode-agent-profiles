# Skills構成の現状まとめ

更新日: 2026-02-11

## 目的

- Kaggle/ゲーム開発の用途別に、使うSkillを明確に分離する
- Anthropic公式ドキュメント更新に追従しやすい管理構成にする
- 誤起動や越境利用を `permission.skill` で抑制する

## 全体設計

- 命名規約
  - 共通: `core-*`
  - Kaggle: `kaggle-*`
  - ゲーム開発: `game-*`
- 管理の正本
  - `skills/manifest/anthropic-skills.lock.json`
- Skill本体
  - `.opencode/skills/<name>/SKILL.md`
- 整合検証
  - `scripts/skills/sync-anthropic-skills.mjs`

## 追加したエージェント

- `.opencode/agents/kaggle-research.md`
  - `kaggle-*` と `core-*` を許可
  - `game-*` を拒否
- `.opencode/agents/game-dev-assistant.md`
  - `game-*` と `core-*` を許可
  - `kaggle-*` を拒否

## 追加したSkill一覧

### 共通（5）

- `core-code-review`
- `core-debug-investigation`
- `core-test-authoring`
- `core-pr-summary`（手動）
- `core-safe-commit`（手動）

### Kaggle（10）

- `kaggle-research`
- `kaggle-discussion-harvest`
- `kaggle-feature-ideation`
- `kaggle-cv-strategy-audit`
- `kaggle-error-analysis`
- `kaggle-ensemble-planner`
- `kaggle-metric-alignment`
- `kaggle-submission-checklist`（手動）
- `kaggle-fast-iteration`
- `kaggle-data-leakage-guard`

### ゲーム開発（10）

- `game-dev-min`
- `game-perf-budget-check`
- `game-frame-time-profiler-plan`
- `game-scene-impact-check`
- `game-asset-change-check`（手動）
- `game-rendering-debug`
- `game-input-latency-check`
- `game-build-size-guard`
- `game-mobile-compat-check`
- `game-save-data-migration-check`（手動）

## コマンドと運用

- 追加コマンド
  - `.opencode/commands/skills-sync.md`
- 実行内容
  - `node scripts/skills/sync-anthropic-skills.mjs --write`
  - `node profiles/generate-configs.mjs`（必要時）

## プロファイル連携

- 更新: `profiles/subagent-registry.json`
  - `kaggle-research`, `game-dev-assistant` を登録
- 再生成済み
  - `profiles/vanilla/opencode.json`
  - `profiles/ohmy/opencode.json`

## 参照する公式URL

- `https://code.claude.com/docs/llms.txt`
- `https://code.claude.com/docs/en/skills.md`

## 今後の拡張ポイント

- 公式更新の差分取得（URL fetch）を `sync-anthropic-skills.mjs` に統合
- manifestに `deprecated` / `replacement` フィールドを追加
- 定期運用向けに `skills-sync` をCIジョブ化
