# Codex 優先 MCP 設定テンプレ（Google Workspace MCP / uvx採用）

## 方針
- notebook 配置の主経路は skills + CLI（git）
- Google系MCPは Drive 配置が必要なときだけ追加
- Google Workspace MCP の起動は `uvx` を標準とする（`pnpm` は補助ツール用途）
- 最初は read/list で接続確認してから write を有効化する

## 1. GitHub反映（MCP不要・CLI標準）
- `git` で repo へ反映する（既定）
- skill では `publish_notebook_git.sh` / `validate_notebook_json.py` / `render_colab_url.py` を使う
- GitHub MCP は将来、repo操作をMCPで統一したくなった場合のみ再評価する

## 2. Google Workspace MCP（採用・汎用）
- Drive 以外（Gmail / Docs / Sheets）にも拡張したい場合に導入
- OAuth credential は repo外パスに配置し、パスのみ設定
- 最初は read/list 系だけで接続確認する
- `codex mcp add` で登録し、`~/.codex/config.toml` の手編集は避ける（入力ミス防止）

### 起動方式のベストプラクティス（`uvx` vs `pnpm`）
- 採用: `uvx`
  - `workspace-mcp` は Python系配布で、READMEの標準起動手順が `uvx workspace-mcp`
  - `uv`/`uvx` はこのrepoの Python ツール運用方針（uv標準）とも整合する
- 非採用（本体起動）: `pnpm`
  - Node製MCPサーバなら有力だが、Google Workspace MCP本体の標準起動経路ではない
  - `pnpm` は Node 補助CLI（別用途）に限定して使う

### ローカル Codex への登録（`codex mcp add`）
以下は stdio サーバ登録の例。credential path は repo外ファイルを指定する。

```bash
codex mcp add google-workspace \
  --env GOOGLE_APPLICATION_CREDENTIALS=/home/htk/.config/google-workspace-mcp/oauth-client.json \
  -- uvx workspace-mcp
```

登録確認:

```bash
codex mcp list
codex mcp get google-workspace
```

### `config.toml` 例（概念テンプレ、参照用）
```toml
# ~/.codex/config.toml (concept)
[mcp_servers.google_workspace]
command = "uvx"
args = ["workspace-mcp"]
env = { GOOGLE_APPLICATION_CREDENTIALS = "/path/outside/repo/google-oauth.json" }
```

### 認証/secret 管理のベストプラクティス（ローカル）
- OAuth client credential は repo外に保存（例: `~/.config/google-workspace-mcp/`）
- 標準 env は `GOOGLE_APPLICATION_CREDENTIALS` を使う
- 可能ならシェル常設 export ではなく、一時 export または秘密管理ツールで注入する
- 権限はユーザー限定（例: `chmod 600`）

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

## 6. Colab から Google Workspace MCP を使うベストプラクティス（read/list）
### 前提
- Colab runtime 内で MCP サーバを起動する（外部公開しない）
- 秘密情報は Colab Secrets を使って runtime に注入する
- credential ファイルが必要な場合は `/tmp` に生成し、Driveには置かない

### 推奨フロー（read/list）
1. Colab Secrets から OAuth client credential JSON（または必要な secret）を取得
2. `/tmp/google-workspace-mcp/` に credential ファイルを作成
3. `export GOOGLE_APPLICATION_CREDENTIALS=/tmp/.../oauth-client.json`
4. `uvx workspace-mcp --transport streamable-http --port 8765` を起動
5. 同一 runtime 内のクライアント/テストコードから read/list を実行

### Colab での secret 管理ルール
- Notebook/Drive に credential JSON を保存しない
- runtime終了で消える `/tmp` を使う
- ログ/print に secret 内容を出さない
- write テストは read/list 確認後の別ステップに分離する

## 7. （任意）GitHub MCPを使いたくなった場合
- repo操作をMCPで統一したい場合のみ導入候補とする
- 導入時は read-only / 最小toolset から開始する
- notebook配置用途だけなら `git` で十分なので、原則は追加しない
