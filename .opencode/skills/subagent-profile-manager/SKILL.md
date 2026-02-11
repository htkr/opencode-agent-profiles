---
name: subagent-profile-manager
description: サブエージェントをTierベースで安全に追加・変更する
compatibility: opencode
metadata:
  domain: config
  focus: subagent
---

## Goal
サブエージェント定義を `profiles/model-tiers.json` と `profiles/subagent-registry.json` で一元管理し、生成設定を壊さずに更新する。

## Use When
- サブエージェントを新規追加したい
- モデル割り当てを変更したい
- `ohmy` / `vanilla` の適用範囲を変えたい

## Procedure
1. まず `profiles/model-tiers.json` のTier定義を確認する。
2. `profiles/subagent-registry.json` に agent 定義を追加または更新する。
3. 必要なら `.opencode/agents/<name>.md` を作成/更新する。
4. `node profiles/generate-configs.mjs` を実行する。
5. 生成された `profiles/ohmy/opencode.json` と `profiles/vanilla/opencode.json` の差分を確認する。
6. `profiles/switch-profile.sh <ohmy|vanilla>` の適用手順を案内する。

## Rules
- モデル名は `profiles/model-tiers.json` でのみ変更する。
- `opencode.json` 生成物にモデルを直書きしない。
- 追加したサブエージェントには説明文と適用プロファイルを必ず設定する。
