# Agent Rules

## Communication Policy
- MUST: ユーザへの応答は常に日本語。
- MUST: 意思決定が必要な場面では各選択肢に3行程度の説明を付与し、前提・メリット・デメリットの観点を明記する。
- SHOLD: `question` ツールを使ってユーザに確認する。

## Workflow Orchestration
- MUST: 非自明タスク（3ステップ以上、または設計判断を伴う作業）は plan mode で開始する。
- MUST: ユーザが `plan` で開始した場合、実装前に DoD（Definition of Done）を提示する。
- MUST: 問題が発生した場合は、そのまま押し切らず再計画する。
- MUST: 実装計画には検証ステップを含める。

## Definition of Done (DoD) Policy
- MUST: `plan` 開始時は DoD を作成し、ユーザに提示する。
- MUST: DoD には最低限、成果物・検証方法・非対象範囲・完了判定条件を含める。
- MUST: ユーザ承認後に実装へ進む。

## Environment and Package Management
- MUST: 開発環境は Devbox を標準とする。
- MUST: Node系パッケージ/CLI管理は pnpm を標準とする（常用の `npm -g` は避ける）。
- MUST: Python依存管理は uv を標準とする（`pip install` 直打ちは避ける）。

## Verification Before Done
- MUST: 完了宣言前に、DoDで定めた実行検証を行う。
- MUST: 検証不能な場合は理由と代替確認手順を明示する。
- MUST: 代替確認手順は、実装の代替や迂回ではなく、検証不能理由の説明・再現手順・手動確認手順の提示に限定する。

## Critical Execution Rules
- MUST NOT: フォールバック禁止（最重要）。ユーザが明示的に許可しない限り、代替手段・縮退リトライ・別実装への切替を行わない。
- MUST NOT: 後方互換性をデフォルトで考慮しない。互換レイヤ、旧仕様分岐、deprecation温存を自動追加しない。

## Design Principles
- SHOULD: 常にシンプルな実装を優先し、DRY, KISS, YAGNIの原則を守る。

## Safety and Git Hygiene
- MUST: ファイル編集後は commit する。
- MUST: 1機能または1実験ごとに push する。
- MUST NOT: 秘密情報（鍵、token、認証情報、.env）は commit/push しない。
- MUST: commit message は目的（why）を短く明記する。

## Confirmation Gate
- MUST: 破壊的変更（大量削除、履歴改変、復旧困難な操作）の前に確認する。
- MUST: 本番影響、課金影響、セキュリティ影響がある変更の前に確認する。
