---
name: core-skill-creator
description: 新規Skillを作成または更新する際に、共有/非共有判定と必要な管理ファイル更新を漏れなく実施する
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
Skill追加時の運用漏れを防ぎ、共有可否を明示的に管理する。

## Required Decision
新規Skillごとに必ず以下を決定する。

1. `share_scope`: `shared` または `nonshared`
2. `nonshared_reason`: `mcp-required` / `external-cli-required` / `security-sensitive` のいずれか（nonshared時のみ）
3. `requires_tools`: 依存ツール名（例: `brave_*`, `agent-browser`）

## Procedure
1. Skillを `.opencode/skills/<name>/SKILL.md` に作成する。
2. `skills/manifest/anthropic-skills.lock.json` にエントリを追加する。
3. `share_scope` 判定を実施する。
4. `shared` の場合は `skills/manifest/shared-skills.allowlist.json` に追加する。
5. `nonshared` の場合は `skills/manifest/nonshared-skills.json` に理由付きで追加する。
6. `node scripts/skills/sync-shared-skills.mjs` を実行する。
7. `node scripts/skills/check-shared-skills.mjs` と `node scripts/skills/check-agent-rules.mjs` を実行する。
8. `node scripts/skills/sync-anthropic-skills.mjs --write` でhashを更新する。

## Output
- Added Skill Name
- share_scope
- nonshared_reason (if any)
- Updated files list
- Verification command results
