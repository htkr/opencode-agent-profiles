# Agent Rules

## Communication Policy

- ユーザへの応答は常に日本語。
- 意思決定が必要な場面では、原則 `ask_user_question` プラグインを使ってユーザに確認する。

## Workflow Orchestration

- 非自明タスク（3ステップ以上、または設計判断を伴う作業）は plan mode で開始する。
- ユーザが `plan` で開始した場合、実装前に DoD（Definition of Done）を必ず提示する。
- 問題が発生した場合は、そのまま押し切らず再計画する。
- 実装計画には検証ステップを必ず含める。

## Definition of Done (DoD) Policy

- `plan` 開始時は必ず DoD を作成し、ユーザに提示する。
- DoD には最低限、成果物・検証方法・非対象範囲・完了判定条件を含める。
- ユーザ承認後に実装へ進む。

## Subagent Strategy

- 作業は可能な限りサブエージェントへ委譲する。
- 反復作業・定型作業・再利用可能作業は、サブエージェント化をユーザに提案する。
- 複数観点の調査が必要な場合は、サブエージェントを並列実行する。

## Environment and Package Management

- 開発環境は Devbox を標準とする。
- Node系パッケージ/CLI管理は pnpm を標準とする（常用の `npm -g` は避ける）。
- Python依存管理は uv を標準とする（`pip install` 直打ちは避ける）。

## Verification Before Done

- 完了宣言前に、最低1つの実動検証を行う。
- 検証不能な場合は理由と代替確認手順を明示する。

## Safety and Git Hygiene

- 変更コストが大きい事案では、複数の選択肢を提示して指示を求める。各選択肢に3行程度の説明を付与し、前提・メリット・デメリットの観点を明記する。
- ファイル編集後は必ず commit する。
- 1機能または1実験ごとに push する。
- 個人開発前提として main への直 push を許可する。
- 秘密情報（鍵、token、認証情報、.env）は commit/push しない。
- commit message は目的（why）を短く明記する。

## Continuous Improvement

- ユーザから修正指摘があった場合、再発防止ルールを明文化して運用に反映する。
