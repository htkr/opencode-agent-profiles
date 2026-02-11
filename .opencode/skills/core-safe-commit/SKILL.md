---
name: core-safe-commit
description: コミット前チェックとwhy中心メッセージ作成を行う
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
誤コミットを防ぎ、再読で意図が伝わる履歴を残す。

## Checklist
- no secrets
- staged diff reviewed
- why-focused message
