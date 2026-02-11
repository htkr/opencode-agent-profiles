# Skills構成の現状まとめ

更新日: 2026-02-11

## 目的

- Kaggle/ゲーム開発の用途別に、使うSkillを明確に分離する
- Anthropic公式ドキュメント更新に追従しやすい管理構成にする
- 誤起動や越境利用を `permission.skill` で抑制する

## 全体設計

- 命名規約
  - 共通: `core-*`
  - Kaggle: `kaggle-*`
  - ゲーム開発: `game-*`
- 管理の正本
  - `skills/manifest/anthropic-skills.lock.json`
- Skill本体
  - `.opencode/skills/<name>/SKILL.md`
- 整合検証
  - `scripts/skills/sync-anthropic-skills.mjs`
- Kaggle調査の取得経路
  - 1st: `brave_*` でURL候補検索
  - 2nd: `webfetch` で本文抽出
  - fallback: `agent-browser` でJS描画ページを取得

## 追加したエージェント

- `.opencode/agents/kaggle-research.md`
  - `kaggle-*` と `core-*` を許可
  - `brave_*` を許可、`agent-browser` 実行を許可
  - `game-*` を拒否
  - 意思決定時は `ask_user_question` を原則利用
- `.opencode/agents/game-dev-assistant.md`
  - `game-*` と `core-*` を許可
  - `kaggle-*` を拒否
  - 意思決定時は `ask_user_question` を原則利用

## AskUserQuestion plugin

- 実体: `.opencode/plugins/ask-user-question.js`
- 提供tool: `ask_user_question`
  - 引数: `question`, `options`, `recommended`, `context`
  - `options` は2〜6件
  - `recommended` は `options` 内の文字列と完全一致が必要
- 常時有効化
  - `profiles/generate-configs.mjs` で plugin配列へ追加
  - 反映先: `profiles/vanilla/opencode.json`, `profiles/ohmy/opencode.json`

## 追加したSkill一覧

### 共通（5）

- `core-code-review`
  - 変更意図、主要リスク、テスト抜けを短く点検する。
  - レビュー観点を揃えて、見落としを減らすための共通スキル。
- `core-debug-investigation`
  - 再現手順を明確化し、原因候補を優先順位付きで切り分ける。
  - 調査ログを構造化して、修正と検証の往復を短縮する。
- `core-test-authoring`
  - 回帰防止に必要な最小テストを設計し、失敗先行で追加する。
  - 過剰なモックを避け、既存テスト流儀に合わせて実装する。
- `core-pr-summary`（手動）
  - PRの目的、主要変更、リスク/ロールバックを短く要約する。
  - レビュー前に文脈を共有し、レビュー効率を上げる。
- `core-safe-commit`（手動）
  - コミット前に秘密情報混入、差分妥当性、メッセージ品質を確認する。
  - why中心の履歴を残し、後追い調査しやすくする。

### Kaggle（10）

- `kaggle-research`
  - solution/discussionを調査し、再利用可能な知見に圧縮する。
  - リンク、手法パターン、次実験案までを一体で返す。
- `kaggle-discussion-harvest`
  - discussion本文取得失敗時のフォールバック手順を実行する。
  - 取得不能時も理由を明示し、根拠URLを必ず残す。
- `kaggle-feature-ideation`
  - データ特性から特徴量案を発散し、優先度を付ける。
  - 効果仮説と実装コストをセットで提示して実験順を決める。
- `kaggle-cv-strategy-audit`
  - CV分割方針を点検し、リークや過学習リスクを検知する。
  - LB乖離を減らす分割候補と検証チェックリストを提示する。
- `kaggle-error-analysis`
  - 誤差の偏りをバケット化し、失敗パターンを特定する。
  - 改善仮説を次実験へ直結する形で整理する。
- `kaggle-ensemble-planner`
  - 予測相関を意識して多様なモデルの組み合わせを設計する。
  - ブレンド/スタッキング方針と検証方法を明示する。
- `kaggle-metric-alignment`
  - CVとPublic LBの乖離要因を診断し、測定設計を調整する。
  - 指標・分割・データ分布のズレを分解して対策化する。
- `kaggle-submission-checklist`（手動）
  - 提出形式、ID整合、推論再現性を提出前に最終確認する。
  - 提出事故を防ぐためのゲートとして運用する。
- `kaggle-fast-iteration`
  - 1仮説1実験の短サイクルで低コストに検証を回す。
  - 変更点とスコア差分を固定フォーマットで蓄積する。
- `kaggle-data-leakage-guard`
  - 特徴量生成と分割手順のリーク経路を網羅的に点検する。
  - 重大度と修正方針を提示し、提出前に封じる。

### ゲーム開発（10）

- `game-dev-min`
  - ゲーム開発の最小運用ルールを適用し、変更を安全に進める。
  - 性能目標確認と小分け実装を習慣化するベーススキル。
- `game-perf-budget-check`
  - fps/memory/load timeの予算逸脱を診断する。
  - 主要ボトルネックと即効性のある改善候補を提示する。
- `game-frame-time-profiler-plan`
  - フレーム時間悪化の要因をCPU/GPU/IO観点で切り分ける。
  - 計測ポイントと合格基準を先に定義して調査を迷子にしない。
- `game-scene-impact-check`
  - シーン変更の影響範囲を洗い出し、回帰観点を整理する。
  - 関連システムとテスト観点を事前に可視化する。
- `game-asset-change-check`（手動）
  - アセット更新時の互換性、メモリ、容量影響を確認する。
  - ビルド肥大化やランタイム不整合を事前に防ぐ。
- `game-rendering-debug`
  - 描画不具合の再現手順を固定し、パイプライン段階で切り分ける。
  - 調査プローブを定義して原因特定までの往復を減らす。
- `game-input-latency-check`
  - 入力経路を分解して遅延要因を列挙し、改善案を示す。
  - 体感遅延に直結する箇所を優先して対処する。
- `game-build-size-guard`
  - ビルドサイズ増分を監視し、増加要因を特定する。
  - 容量削減案を優先度付きで提示し継続監視に繋げる。
- `game-mobile-compat-check`
  - モバイル端末での互換性と性能劣化を点検する。
  - 端末制約を踏まえた修正候補を提示する。
- `game-save-data-migration-check`（手動）
  - セーブデータ移行時の互換性と破損リスクを確認する。
  - フォールバック手順を含めて安全な移行を担保する。

## コマンドと運用

- 追加コマンド
  - `.opencode/commands/skills-sync.md`
- 実行内容
  - `node scripts/skills/sync-anthropic-skills.mjs --write`
  - `node profiles/generate-configs.mjs`（必要時）

## Kaggle skill統合方針（衝突回避）

- `kaggle-research`
  - 入口スキルとしてURL探索から要約までを担当。
  - 本文欠落時は `kaggle-discussion-harvest` を明示的に呼ぶ。
- `kaggle-discussion-harvest`（手動）
  - 取得フォールバック専用に限定（分析は行わない）。
  - `webfetch` 失敗時に `agent-browser` を使う設計。
- `kaggle-cv-strategy-audit` と `kaggle-metric-alignment`
  - 前者は分割設計、後者は指標乖離診断に責務を分離。

## プロファイル連携

- 更新: `profiles/subagent-registry.json`
  - `kaggle-research`, `game-dev-assistant` を登録
- 再生成済み
  - `profiles/vanilla/opencode.json`
  - `profiles/ohmy/opencode.json`

## 参照する公式URL

- `https://code.claude.com/docs/llms.txt`
- `https://code.claude.com/docs/en/skills.md`

## 今後の拡張ポイント

- 公式更新の差分取得（URL fetch）を `sync-anthropic-skills.mjs` に統合
- manifestに `deprecated` / `replacement` フィールドを追加
- 定期運用向けに `skills-sync` をCIジョブ化
