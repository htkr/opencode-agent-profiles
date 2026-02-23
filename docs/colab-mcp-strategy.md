# Colab notebook 配置のMCP最小化戦略（Codex/OpenCode）

## 目的
Google Colab で使う `SSH.ipynb` を、毎回手作業でアップロードせずに反映できる運用を作る。

## 前提
- `opencode-agent-profiles` はテンプレ用途
- 実運用はコンペ用 GitHub repo を正本にする
- Colab は GitHub または Google Drive 上の notebook を開く

## 推奨構成
- 主経路: skills + CLI（`git`）でコンペrepo内の notebook を更新
- 補助経路: Google Workspace MCP で Drive 配置（手動アップロード廃止用）
- 実行導線: `google-workspace-sync` skill 経由（Colabはユースケースの1つ）
- Google Workspace MCP の起動方式: `uvx`（標準）

## なぜこの構成か
- Colab に直接アップロードする UI 自動化は壊れやすい
- GitHub 正本にすると履歴管理・レビュー・同期が簡単
- GitHub 反映は CLI で十分なので MCP を増やさない
- Google Workspace MCP は Drive 手動アップロードをなくす目的に加え、将来のDocs/Sheets/Gmailにも流用できる

## 典型フロー
1. ローカルで `tmp/SSH.ipynb` を編集
2. skill で notebook JSON を検証
3. skills + CLI（`git`）でコンペrepoの notebook を更新
4. Colab URL を生成して開く
5. 必要時だけ Drive にもコピー（Google Workspace MCP）

## skill / 参照ファイル
- Skill: `.opencode/skills/google-workspace-sync/SKILL.md`
- 調査比較: `.opencode/skills/google-workspace-sync/references/mcp-survey.md`
- Codex設定テンプレ: `.opencode/skills/google-workspace-sync/references/codex-mcp-setup.md`
- Colab URL仕様: `.opencode/skills/google-workspace-sync/references/colab-opening-patterns.md`

## セキュリティ注意
- GitHub token / Google OAuth credential は repo に保存しない
- Google系MCPはまず read/list で接続確認し、必要な write だけ有効化する
- notebook 書込前に対象 repo/path を明示確認する
- Colab では secret は Notebook secrets から注入し、credential ファイルは `/tmp` のみに配置する（Drive保存しない）

## MCPを使う条件（この運用）
- GitHub反映: 使わない（CLIで十分）
- Colab URL生成: 使わない（ローカルscriptで十分）
- Google Drive / Workspace 操作: Google Workspace MCP を使う（手動アップロード廃止のため）

## Colab での Google Workspace MCP 運用（read/list 推奨開始）
1. Colab Secrets から credential を取得する
2. `/tmp` に credential ファイルを書き出し `GOOGLE_APPLICATION_CREDENTIALS` を設定する
3. Colab runtime 内で `uvx workspace-mcp --transport streamable-http` を起動する
4. 同一runtime内のクライアントから Drive read/list を実行して接続確認する
5. write は read/list 確認後に別ステップで有効化する
