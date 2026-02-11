---
name: kaggle-metric-alignment
description: CVとPublic LBの乖離要因を診断する
compatibility: opencode
metadata:
  domain: kaggle
  invoke: auto
---

## Goal
オフライン評価と本番評価のズレを縮小する。

## Scope
このskillは評価指標と分布差の診断に集中する。分割設計の監査は `kaggle-cv-strategy-audit` を使う。

## Output
- Gap diagnosis
- Potential causes
- Controlled experiments
