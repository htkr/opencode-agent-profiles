# OpenCode Subagent Management Guide

このドキュメントは、OpenCodeでサブエージェントをプロファイル連動で管理するための運用ガイドです。

## 目的

- モデル名を直接ばらまかず、`Tier` 変数で一元管理する
- サブエージェント設定を `registry` で一元管理する
- `generate-configs.mjs` で `profiles/*/opencode.json` を自動生成する

## 管理ファイル

- `profiles/model-tiers.json`
  - `tier1`, `tier2`, `tier3` に具体モデルを割り当てる
- `profiles/subagent-registry.json`
  - サブエージェント名、説明、`tier`、適用プロファイルを管理する
- `profiles/generate-configs.mjs`
  - Tierを具体モデルへ解決し、`profiles/ohmy/opencode.json` と `profiles/vanilla/opencode.json` を生成する

## 変更フロー

1. Tierを更新する（例: `tier3` のモデル差し替え）
2. レジストリでサブエージェントの `tier` または `profiles` を更新する
3. 設定を再生成する
4. プロファイルを適用する

```bash
node profiles/generate-configs.mjs
profiles/switch-profile.sh vanilla
```

## 新規サブエージェントの追加手順

1. `profiles/subagent-registry.json` の `opencode_agents` に追加
2. `.opencode/agents/<name>.md` を作成
3. 必要なら `.opencode/skills` と `.opencode/commands` も追加
4. `node profiles/generate-configs.mjs` を実行
5. 生成結果を確認して commit/push

## 設計ルール

- モデル名は `model-tiers.json` 以外に直書きしない
- サブエージェントの有効範囲は `profiles` で制御する
- 重いサブエージェントは用途限定で追加し、説明文を明確にする
- 変更後は必ず生成物を再生成して差分確認する
