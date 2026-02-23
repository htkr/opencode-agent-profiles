# Colab notebook 配置のMCP最小化戦略（Codex/OpenCode）

## 目的
Google Colab で使う `SSH.ipynb` を、毎回手作業でアップロードせずに反映できる運用を作る。

## 前提
- `opencode-agent-profiles` はテンプレ用途
- 実運用はコンペ用 GitHub repo を正本にする
- Colab は GitHub または Google Drive 上の notebook を開く

## 推奨構成
- 主経路: skills + CLI（`git`）でコンペrepo内の notebook を更新
- 補助経路: Google Workspace MCP / Google Drive MCP で Drive 配置（手動アップロード廃止用）
- 実行導線: `colab-notebook-publisher` skill 経由

## なぜこの構成か
- Colab に直接アップロードする UI 自動化は壊れやすい
- GitHub 正本にすると履歴管理・レビュー・同期が簡単
- GitHub 反映は CLI で十分なので MCP を増やさない
- Google系MCPは Drive 手動アップロードをなくす目的に限定しつつ、将来のDocs/Sheets/Gmailにも流用できる

## 典型フロー
1. ローカルで `tmp/SSH.ipynb` を編集
2. skill で notebook JSON を検証
3. skills + CLI（`git`）でコンペrepoの notebook を更新
4. Colab URL を生成して開く
5. 必要時だけ Drive にもコピー（Google系MCP）

## skill / 参照ファイル
- Skill: `.opencode/skills/colab-notebook-publisher/SKILL.md`
- 調査比較: `.opencode/skills/colab-notebook-publisher/references/mcp-survey.md`
- Codex設定テンプレ: `.opencode/skills/colab-notebook-publisher/references/codex-mcp-setup.md`
- Colab URL仕様: `.opencode/skills/colab-notebook-publisher/references/colab-opening-patterns.md`

## セキュリティ注意
- GitHub token / Google OAuth credential は repo に保存しない
- Google系MCPはまず read/list で接続確認し、必要な write だけ有効化する
- notebook 書込前に対象 repo/path を明示確認する

## MCPを使う条件（この運用）
- GitHub反映: 使わない（CLIで十分）
- Colab URL生成: 使わない（ローカルscriptで十分）
- Google Drive 配置: 使う（手動アップロード廃止のため）
