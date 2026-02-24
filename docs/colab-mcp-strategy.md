# Colab notebook 配置のMCP最小化戦略（Codex/OpenCode）

## 目的
Google Colab で使う `SSH.ipynb` を、毎回手作業でアップロードせずに反映できる運用を作る。

## 前提
- `opencode-agent-profiles` はテンプレ用途
- 実運用はコンペ用 GitHub repo を正本にする
- Colab は GitHub または Google Drive 上の notebook を開く

## 推奨構成
- 主経路: skills + CLI（`git`）でコンペrepo内の notebook を更新
- 補助経路: Google Drive系特化MCP で Drive 配置（手動アップロード廃止用）
- 実行導線: `google-workspace-sync` skill 経由（Colabはユースケースの1つ）
- 既定MCP: `piotr-agier/google-drive-mcp`

## なぜこの構成か
- Colab に直接アップロードする UI 自動化は壊れやすい
- GitHub 正本にすると履歴管理・レビュー・同期が簡単
- GitHub 反映は CLI で十分なので MCP を増やさない
- Google Drive系特化MCP は Drive/Docs/Sheets に絞り、Google Workspace MCP よりスコープと運用負荷を抑えやすい

## 典型フロー
1. ローカルで `tmp/SSH.ipynb` を編集
2. skill で notebook JSON を検証
3. skills + CLI（`git`）でコンペrepoの notebook を更新
4. Colab URL を生成して開く
5. 必要時だけ Drive にもコピー（Google Drive系MCP）

## skill / 参照ファイル
- Skill: `.opencode/skills/google-workspace-sync/SKILL.md`
- 調査比較: `.opencode/skills/google-workspace-sync/references/mcp-survey.md`
- Codex設定テンプレ: `.opencode/skills/google-workspace-sync/references/codex-mcp-setup.md`
- Colab URL仕様: `.opencode/skills/google-workspace-sync/references/colab-opening-patterns.md`
- Colab SSH接続運用: `.opencode/skills/colab-ssh-attach/SKILL.md`

## Colab SSH 接続の自動化（skill + ローカルCLI）
- Colab 側では短期主経路として `trycloudflare` の hostname を出力し、ローカルへ渡す
- ローカルでは `scripts/colab_open_ssh_wezterm.sh --host <hostname>` を使い、wezterm優先で接続する（未導入時はコマンド表示/直接実行）
- `WORK_DIR/.colab_local/runtime/ssh_connection.json` は補助（診断/将来拡張）として保存を継続する
- この導線は MCP ではなく skill + ローカルCLI を主とする

### 運用フェーズ（確定方針）
- 短期（現行）: ユーザーが Colab の SSH セルを実行し、以後のローカル接続は `colab-ssh-attach` skill + CLI で自動化する
- 長期（将来）: Colab 側のセル実行もエージェント化し、「Colab SSH まで完全自動」を目指す
- 重要: 完全自動化の本質は Colab 制御層（UI自動化または実行API調査）であり、`colab-ssh-attach` はローカル接続導線に責務を限定する

### 完全自動化へ向けた設計境界
- `colab-ssh-attach`: ローカル端末接続（ssh_connection.json の確認、wezterm起動、接続失敗切り分け）
- `google-workspace-sync`: Drive/Docs/Sheets 連携（接続情報ファイルの受け渡し補助に使う場合はここ）
- 将来追加候補: Colab UI自動操作または notebook 実行制御の専用 skill（例: `colab-notebook-runner`）

## セキュリティ注意
- GitHub token / Google OAuth credential は repo に保存しない
- Google系MCPはまず read/list で接続確認し、必要な write だけ有効化する
- notebook 書込前に対象 repo/path を明示確認する
- Colab では secret は Notebook secrets から注入し、credential ファイルは `/tmp` のみに配置する（Drive保存しない）

## MCPを使う条件（この運用）
- GitHub反映: 使わない（CLIで十分）
- Colab URL生成: 使わない（ローカルscriptで十分）
- Google Drive / Docs / Sheets 操作: Google Drive系MCP を使う（手動アップロード廃止のため）

## Colab での Google Drive系MCP 運用（read/list 推奨開始）
1. Colab Secrets から credential を取得する
2. `/tmp` に credential ファイルを書き出し `GOOGLE_APPLICATION_CREDENTIALS` を設定する
3. Colab runtime 内で採用MCPを起動する（HTTP transport がある実装なら HTTP、なければ stdio/CLI）
4. 同一runtime内のクライアント/テストコードから Drive read/list を実行して接続確認する
5. write は read/list 確認後に別ステップで有効化する

## 既知の制約（Google OAuth）
- Google OAuth 同意画面が `Testing` の場合、実行アカウントを test user に追加しないとアクセスがブロックされる
- これは特定MCP実装の不具合ではなく、Google OAuth の運用制約
- Drive系特化MCPに切り替えても、自前OAuthアプリを使う場合は同様の管理が必要
