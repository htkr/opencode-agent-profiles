# OpenCode Subagent Usage Guide

## 基本

- サブエージェントは定義しておくと常に「呼び出し可能」になる
- 実行コストが増えるのは、実際に `@name` や Task で起動したとき
- 通常会話のコンテキスト圧迫は限定的だが、不要な自動委譲が増えると非効率になる

## 使い分け

- `Skill`: 手順やフォーマットの標準化
- `Subagent`: 実作業の分業（専用ツール/専用モデル）
- `Command`: 起動の定型化（`/exp-start` など）

## コンテキスト節約のコツ

- ログ全文を会話に貼らず、ファイルに保存してパスだけ返す
- 重い処理は `subtask: true` で子セッションに隔離する
- 説明文が曖昧なサブエージェントを増やさない

## 実験管理サブエージェント

- `exp-orchestrator`: 全体進行
- `exp-runner`: 実装と同期実行
- `exp-reporter`: レポート作成
- `exp-indexer`: MASTER更新

## 更新時チェック

1. `profiles/model-tiers.json` を確認
2. `profiles/subagent-registry.json` を確認
3. `node profiles/generate-configs.mjs`
4. `profiles/switch-profile.sh <ohmy|vanilla>`
