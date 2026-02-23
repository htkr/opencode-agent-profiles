---
name: colab-notebook-publisher
description: Google Colabで使うipynbをGitHub優先・Google補助のMCP経由で配置し、Colab起動URLまで返す
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
編集済み notebook を Colab で開ける状態へ、再現性のある手順で配置する。

## Use When
- `*.ipynb` を GitHub repo に反映して Colab で開きたい
- Google Drive に notebook を配置/更新したい
- Codex/OpenCode の MCP 構成を前提に notebook 配置を定型化したい

## Defaults
- 主経路は GitHub MCP
- Google 系MCPは補助経路（Drive/Workspace）
- Colab UI 直接操作は行わない

## Procedure
1. `references/mcp-survey.md` で利用可能なMCP候補と制約を確認する。
2. `references/codex-mcp-setup.md` で GitHub MCP / Google系MCP の設定前提を確認する。
3. `scripts/check_mcp_env.sh` で必要な環境変数・credential path の有無を確認する。
4. notebook を `scripts/validate_notebook_json.py` で検証する。
5. 指定がなければ GitHub MCP で repo/path を更新する。
6. Google Drive 指定時のみ Google系MCP で Drive に配置する。
7. GitHub 経路では `scripts/render_colab_url.py` で Colab URL を返す。

## Output
- 選択した配置経路（GitHub / Google Drive）
- 更新先（repo/path または Drive path/file id）
- Colab URL（GitHub 経路時）
- 前提不足（MCP未設定 / 認証不足）の診断結果

## Safety Rules
- token / secret / OAuth credential を出力・commitしない
- 書き込み前に対象 repo/path または Drive path を明示する
- 可能なら read-only 診断を先に行い、write は明示要求後に実行する
