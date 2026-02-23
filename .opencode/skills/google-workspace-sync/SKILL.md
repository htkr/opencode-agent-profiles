---
name: google-workspace-sync
description: Google Workspace（特にDrive）連携をGoogle Workspace MCPで安全に実行し、必要時にColab notebook運用へ接続する
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
Google Workspace（主にDrive）へのファイル連携を、MCP前提・安全重視で再現性ある手順にする。

## Use When
- Google Drive にファイルを配置/更新したい
- Google Workspace MCP の前提確認・認証・実行順を標準化したい
- Colab notebook の Drive 配置を手動アップロードなしで行いたい
- 必要に応じて GitHub CLI運用と組み合わせたい

## Defaults
- Google Workspace 側の操作は Google Workspace MCP を使う
- GitHub 反映は別経路（CLI）で扱う
- Colab UI 直接操作は行わない

## Procedure
1. `references/mcp-survey.md` で「CLIで代替可能か」を確認し、MCP使用が本当に必要か判断する。
2. `references/codex-mcp-setup.md` を参照し、Google Workspace MCP を設定する。
3. Google Workspace 操作前に `scripts/check_mcp_env.sh` で credential path の有無を確認する。
4. Drive へ notebook を置く場合は `scripts/validate_notebook_json.py` で notebook を検証する。
5. Colab + GitHub 併用時のみ `scripts/publish_notebook_git.sh`（または通常の `git`）を使う。
6. Colab URL が必要な場合のみ `scripts/render_colab_url.py` を使う。
7. Google Workspace MCP で Drive/Workspace を更新する（未設定なら前提不足を返す）。

## Output
- 実行した Google Workspace 操作の種類（Drive upload/update など）
- 更新先（Drive path/file id など）
- Colab URL（Colab用途で GitHub 経路を併用した場合のみ）
- 前提不足（MCP未設定 / 認証不足 / 対象パス不明）の診断結果

## Safety Rules
- token / secret / OAuth credential を出力・commitしない
- 書き込み前に対象 Drive path / folder / file id を明示する
- Google Workspace MCP は read/list 診断を先に行い、write は明示要求後に実行する
- GitHub 反映は初期運用では commit/push 自動化を行わず、差分確認までを既定とする
