# Skills Catalog

このディレクトリは、Anthropic公式のSkillsドキュメントを参照して選定した
ローカル運用カタログを管理する。

## Source of truth

- `skills/manifest/anthropic-skills.lock.json`
- 参照元:
  - https://code.claude.com/docs/llms.txt
  - https://code.claude.com/docs/en/skills.md

## Update flow

1. 公式ドキュメント更新を確認する。
2. 対象skillを追加・更新する。
3. `node scripts/skills/sync-anthropic-skills.mjs --write` を実行する。
4. lockファイルのhash差分をレビューしてコミットする。

## Invocation policy

- `core-*`: 共通ルール
- `kaggle-*`: Kaggle用途
- `game-*`: ゲーム開発用途
- 破壊的・提出系の手順は `disable-model-invocation: true` を推奨
