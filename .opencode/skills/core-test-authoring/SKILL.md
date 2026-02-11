---
name: core-test-authoring
description: 回帰防止のための最小テストを設計して追加する
compatibility: opencode
metadata:
  domain: common
  invoke: auto
---

## Goal
バグ再発を防ぐため、失敗先行の最小テストを用意する。

## Rules
- 既存テストスタイルに合わせる
- 過剰なモックは避ける
- 期待値を明示する
