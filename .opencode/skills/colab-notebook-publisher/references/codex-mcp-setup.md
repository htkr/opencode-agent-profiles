# Codex 優先 MCP 設定テンプレ（GitHub主・Google補助）

## 方針
- notebook 配置の主経路は GitHub MCP
- Google系MCPは Drive/Workspace が必要なときだけ追加
- 最初は read-only で接続確認してから write を有効化する

## 1. GitHub MCP（主経路）

### 例: `codex mcp add` で追加（概念例）
実際のオプション名は Codex のバージョンに合わせて確認すること。

```bash
codex mcp add github \
  --transport stdio \
  --command "npx" \
  --args "-y" "@modelcontextprotocol/server-github"
```

または GitHub 公式 server の配布方法（docker / remote）を利用する。

### 推奨運用
- 初期: read-only / 最小toolset
- 安定後: repo/path 限定で write toolset を有効化
- token は `GITHUB_TOKEN` など環境変数で管理（repo に保存しない）

## 2. Google Workspace MCP（補助・汎用）
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

## 3. Google Drive MCP（補助・軽量代替）
- notebook を Drive に置きたいだけなら Drive特化MCPを先に試す選択肢もある
- Docs/Sheets/Slides の更新を含めるなら機能差分を確認して選定する

## 4. secrets 管理ルール
- `GITHUB_TOKEN`, OAuth credential path, refresh token は repo に書かない
- `.bashrc` / shell profile に平文固定しない（可能なら一時 export）
- credential 実体は `~/.config` など repo外に置く

## 5. skill との連携
- Colab notebook 配置タスクでは `colab-notebook-publisher` skill を使う
- skill は以下の順で処理する
  1. MCP 設定確認（`check_mcp_env.sh`）
  2. notebook JSON 検証（`validate_notebook_json.py`）
  3. GitHub MCP 更新（既定）
  4. Google系MCP更新（指定時のみ）
  5. Colab URL 生成（GitHub経路時）
