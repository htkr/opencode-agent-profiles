---
name: kaggle-research
description: Kaggle solutionとdiscussionを調査し実験に使える形で要約する
compatibility: opencode
metadata:
  domain: kaggle
  invoke: auto
---

## Goal
有効だった手法を短時間で抽出し、次実験へ接続する。

## Use When
- コンペの解法傾向を短時間で把握したい
- discussion/solutionの根拠リンク付き要約が必要

## Procedure
1. `brave_*` で候補URLを収集する。
2. `webfetch` で本文抽出する。
3. 本文不足なら `kaggle-discussion-harvest` を呼び出す。
4. 取得根拠を添えて実験案へ圧縮する。

## Output
- Links
- Key Patterns
- Leakage Notes
- Action Items
