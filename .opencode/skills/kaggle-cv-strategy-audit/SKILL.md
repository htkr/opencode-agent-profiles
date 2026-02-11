---
name: kaggle-cv-strategy-audit
description: CV分割方針を点検しリークや過学習を検知する
compatibility: opencode
metadata:
  domain: kaggle
  invoke: auto
---

## Goal
LBに近い検証設計へ寄せる。

## Scope
このskillは分割設計に集中する。指標乖離の診断は `kaggle-metric-alignment` を使う。

## Output
- Current CV risks
- Better split candidates
- Validation checklist
