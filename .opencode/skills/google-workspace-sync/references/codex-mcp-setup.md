# Codex 優先 MCP 設定テンプレ（Google Drive特化MCP採用）

## 方針
- notebook 配置の主経路は skills + CLI（git）
- Google系MCPは Drive 配置が必要なときだけ追加
- 既定MCPは `piotr-agier/google-drive-mcp`（Drive/Docs/Sheets/Slides）
- Node系MCPサーバの起動は `pnpm dlx` を標準とする（READMEが `npx` の場合も `pnpm dlx` を優先）
- 最初は read/list で接続確認してから write を有効化する

## 1. GitHub反映（MCP不要・CLI標準）
- `git` で repo へ反映する（既定）
- skill では `publish_notebook_git.sh` / `validate_notebook_json.py` / `render_colab_url.py` を使う
- GitHub MCP は将来、repo操作をMCPで統一したくなった場合のみ再評価する

## 2. Google Drive MCP（採用・特化）
- `piotr-agier/google-drive-mcp` を既定にする（Drive/Docs/Sheets/Slides 向け）
- OAuth credential と token cache は repo外パスに配置し、パスのみ設定
- 最初は read/list 系だけで接続確認する
- `codex mcp add` で登録し、`~/.codex/config.toml` の手編集は避ける（入力ミス防止）

### 起動方式のベストプラクティス（`pnpm dlx` vs `npx`）
- 採用: `pnpm dlx`
  - `google-drive-mcp` は Node系配布で、READMEの `npx` 例を `pnpm dlx` に置き換えて運用できる
  - このrepoの Node ツール運用方針（pnpm標準）と整合する
- 参考（README記載）: `npx`
  - READMEのサンプルをそのまま使える
  - ただしこのrepoでは Node系CLI管理の既定を `pnpm` に寄せる

### ローカル Codex への登録（`codex mcp add`）
以下は stdio サーバ登録の例。実際の env 名は採用MCPのREADMEに合わせて調整する（例は repo外path を参照）。

```bash
codex mcp add google-drive \
  --env GOOGLE_APPLICATION_CREDENTIALS=/home/htk/.config/google-drive-mcp/client_secret.json \
  --env GOOGLE_DRIVE_MCP_CREDENTIALS_DIR=/home/htk/.config/google-drive-mcp/tokens \
  -- pnpm dlx @piotr-agier/google-drive-mcp
```

登録確認:

```bash
codex mcp list
codex mcp get google-drive
```

### `config.toml` 例（概念テンプレ、参照用）
```toml
# ~/.codex/config.toml (concept)
[mcp_servers.google_drive]
command = "pnpm"
args = ["dlx", "@piotr-agier/google-drive-mcp"]
env = {
  GOOGLE_APPLICATION_CREDENTIALS = "/path/outside/repo/google-drive/client_secret.json",
  GOOGLE_DRIVE_MCP_CREDENTIALS_DIR = "/path/outside/repo/google-drive/tokens"
}
```

### 認証/secret 管理のベストプラクティス（ローカル）
- OAuth client credential は repo外に保存（例: `~/.config/google-drive-mcp/`）
- token cache / refresh token 保存先も repo外に分離する（例: `~/.config/google-drive-mcp/tokens/`）
- 標準 env は `GOOGLE_APPLICATION_CREDENTIALS` を使う
- 可能ならシェル常設 export ではなく、一時 export または秘密管理ツールで注入する
- 権限はユーザー限定（例: `chmod 600`）
- OAuth consent screen が `Testing` の場合、実行アカウントを test user に追加する

## 3. Google Workspace MCP（参考・保留）
- `taylorwilsdon/google_workspace_mcp` は Drive read/list の初回認可URL発行までは確認済み
- ただし広範スコープとテスター制約により、今回の既定からは外す
- Gmail/Calendar等も必要になった場合の再選定候補として残す

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
  5. Google Drive系MCP 更新（指定時のみ）

## 6. Colab から Google Drive系MCP を使うベストプラクティス（read/list）
### 前提
- Colab runtime 内で MCP サーバを起動する（外部公開しない）
- 秘密情報は Colab Secrets を使って runtime に注入する
- credential ファイルが必要な場合は `/tmp` に生成し、Driveには置かない

### 推奨フロー（read/list）
1. Colab Secrets から OAuth client credential JSON（または必要な secret）を取得
2. `/tmp/google-drive-mcp/` に credential ファイルを作成（必要なら token cache dir も `/tmp` 配下）
3. `export GOOGLE_APPLICATION_CREDENTIALS=/tmp/.../oauth-client.json`
4. 実装が HTTP transport を持つ場合は HTTP 起動、なければ stdio/CLI で同一 runtime 内検証を行う
5. 同一 runtime 内のクライアント/テストコードから read/list を実行

### Colab での secret 管理ルール
- Notebook/Drive に credential JSON を保存しない
- runtime終了で消える `/tmp` を使う
- ログ/print に secret 内容を出さない
- write テストは read/list 確認後の別ステップに分離する

## 7. 参考: `isaacphi/mcp-gdrive` を使う場合
- Python系のため `uvx mcp-gdrive` ベースで運用できる
- service account / OAuth client など認証方式の選択肢がある
- Docs/Sheets の必要機能が `piotr-agier` 実装で不足した場合の再選定先とする

## 8. （任意）GitHub MCPを使いたくなった場合
- repo操作をMCPで統一したい場合のみ導入候補とする
- 導入時は read-only / 最小toolset から開始する
- notebook配置用途だけなら `git` で十分なので、原則は追加しない
