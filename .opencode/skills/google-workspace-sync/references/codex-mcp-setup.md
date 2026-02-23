# Codex 優先 MCP 設定テンプレ（Google Drive用途のみ必須）

## 方針
- notebook 配置の主経路は skills + CLI（git）
- Google系MCPは Drive 配置が必要なときだけ追加
- 最初は read-only で接続確認してから write を有効化する

## 1. GitHub反映（MCP不要・CLI標準）
- `git` で repo へ反映する（既定）
- skill では `publish_notebook_git.sh` / `validate_notebook_json.py` / `render_colab_url.py` を使う
- GitHub MCP は将来、repo操作をMCPで統一したくなった場合のみ再評価する

## 2. Google Workspace MCP（採用・汎用）
- Drive 以外（Gmail / Docs / Sheets）にも拡張したい場合に導入
- OAuth credential は repo外パスに配置し、パスのみ設定
- 最初は read/list 系だけで接続確認する

### 例（概念テンプレ）
```toml
# ~/.codex/config.toml (concept)
[mcp_servers.google_workspace]
command = "uvx"
args = ["google-workspace-mcp"]
env = { GOOGLE_APPLICATION_CREDENTIALS = "/path/outside/repo/google-oauth.json" }
```

## 3. Google Drive MCP（参考・非採用）
- 今回は Google Workspace MCP を採用するため、Drive特化MCPは導入しない
- 将来、Drive用途のみで軽量化したくなった場合の比較対象として残す

## 4. secrets 管理ルール
- `GITHUB_TOKEN`（git push用途）, OAuth credential path, refresh token は repo に書かない
- `.bashrc` / shell profile に平文固定しない（可能なら一時 export）
- credential 実体は `~/.config` など repo外に置く

## 5. skill との連携（CLI優先）
- Colab notebook 配置タスクでは `google-workspace-sync` skill を使う
- skill は以下の順で処理する
  1. notebook JSON 検証（`validate_notebook_json.py`）
  2. GitHub CLI反映（`publish_notebook_git.sh` または通常の `git`）
  3. Colab URL 生成（`render_colab_url.py`）
  4. Drive/Workspace 操作前に MCP 設定確認（`check_mcp_env.sh`）
  5. Google Workspace MCP 更新（指定時のみ）

## 6. （任意）GitHub MCPを使いたくなった場合
- repo操作をMCPで統一したい場合のみ導入候補とする
- 導入時は read-only / 最小toolset から開始する
- notebook配置用途だけなら `git` で十分なので、原則は追加しない
