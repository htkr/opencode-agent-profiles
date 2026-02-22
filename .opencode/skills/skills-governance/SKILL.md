---
name: skills-governance
description: Skillsの共有/非共有設定とAgentルール整合を検査し、漏れや設定ドリフトを検知する
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
Skills運用の事故を防ぐため、共有設定とルール整合を機械的に確認する。

## Use When
- 新規Skillを追加した
- Skillの共有可否を変更した
- Agentルールを変更した
- PR前の最終確認をしたい

## Checks
1. `node scripts/skills/check-shared-skills.mjs`
   - 全Skillが `shared` か `nonshared` に分類されているか
   - allowlist と `.shared/skills` のリンク状態が一致しているか
2. `node scripts/skills/check-agent-rules.mjs`
   - `AGENTS.md` と `.opencode/profiles/minimal/AGENTS.md` が一致しているか
   - `CLAUDE.md` が `AGENTS.md` を参照しているか

## Auto-fix
リンク差分は以下で再生成する。

```bash
node scripts/skills/sync-shared-skills.mjs
```

## Output
- Validation status: PASS/FAIL
- Failed checks
- Required fixes
