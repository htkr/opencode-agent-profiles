---
name: kaggle-discussion-harvest
description: discussion本文の取得失敗を減らすフォールバック手順
compatibility: opencode
metadata:
  domain: kaggle
  invoke: manual
disable-model-invocation: true
---

## Scope
このskillは「本文取得の失敗時」にのみ使う。分析や実験設計は行わない。

## Fallback
1. `webfetch` で再取得する。
2. 不足時は `agent-browser` でJS描画後の本文を抽出する。
3. 取得不能なら、URLと失敗理由を明記する。

## Quality
- URLを残す
- 事実と推測を分離
