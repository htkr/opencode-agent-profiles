---
name: colab-notebook-publisher
description: Google Colabで使うipynbをCLI優先で配置し、Google Drive連携が必要な時だけMCPを使ってColab起動URLまで返す
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
- Codex/OpenCode で notebook 配置を skills + CLI 中心に定型化したい

## Defaults
- 主経路は skills + CLI（git）
- Google 系MCPは Drive 配置時のみ使う
- Colab UI 直接操作は行わない

## Procedure
1. `references/mcp-survey.md` で「CLIで代替可能か」を確認し、MCP使用が本当に必要か判断する。
2. notebook を `scripts/validate_notebook_json.py` で検証する。
3. GitHub 反映は `scripts/publish_notebook_git.sh`（または通常の `git` 操作）で行う。
4. GitHub 経路では `scripts/render_colab_url.py` で Colab URL を返す。
5. Google Drive 指定時のみ `references/codex-mcp-setup.md` を参照し、Google系MCPを設定する。
6. Drive 経路の実行前に `scripts/check_mcp_env.sh` で credential path の有無を確認する。
7. Google系MCP で Drive に配置する（MCP未設定なら前提不足を返す）。

## Output
- 選択した配置経路（GitHub CLI / Google Drive MCP）
- 更新先（repo/path または Drive path/file id）
- Colab URL（GitHub 経路時）
- 前提不足（MCP未設定 / 認証不足 / CLI前提不足）の診断結果

## Safety Rules
- token / secret / OAuth credential を出力・commitしない
- 書き込み前に対象 repo/path または Drive path を明示する
- Google系MCPは read/list 診断を先に行い、write は明示要求後に実行する
- GitHub 反映は初期運用では commit/push 自動化を行わず、差分確認までを既定とする
