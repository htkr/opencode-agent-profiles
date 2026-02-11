---
name: kaggle-discussion-harvest
description: discussion本文の取得失敗を減らすフォールバック手順
compatibility: opencode
metadata:
  domain: kaggle
  invoke: auto
---

## Fallback
1. webfetch
2. browser系取得
3. 取得不能理由を明記

## Quality
- URLを残す
- 事実と推測を分離
