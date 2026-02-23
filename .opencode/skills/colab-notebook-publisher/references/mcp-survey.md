# Colab Notebook 配置向け MCP 調査メモ（2026-02-23, MCP最小化版）

## 結論（推奨構成）
- 主経路: skills + CLI（`git`）で notebook をコンペrepoへ更新（MCP不要）
- 補助経路: Google Workspace MCP（汎用）または Google Drive MCP（軽量）で Drive 配置
- 非推奨（主経路）: Colab UI を browser automation で直接操作

## 比較表

| 候補 | 主用途 | Colab notebook配置適性 | CLI代替可否 | 汎用性 | 認証難易度 | 推奨度 |
|---|---|---:|---:|---:|---:|---|
| GitHub CLI（`git`） | repo 反映、履歴管理 | 高 | - | 中 | 中 | 採用（主） |
| GitHub MCP（公式） | repo 読み書き、PR、issue等 | 高（GitHub repo配置に最適） | 高（`git`で十分） | 中 | 中（PAT/GitHub App） | 保留（通常不要） |
| Google Workspace MCP | Drive/Docs/Sheets/Gmail等 | 中〜高（Drive配置可能なら可） | 低〜中 | 高 | 高（OAuth） | 採用候補（補助/汎用） |
| Google Drive MCP（特化） | Drive/Docs/Sheets/Slides | 高（Drive配置に直結） | 低〜中 | 中 | 中〜高（OAuth/SA実装次第） | 採用候補（補助/軽量） |
| OpenAPI→MCP 変換系 | OpenAPI API 全般 | 低〜中（Google OAuth2制約に依存） | 中 | 高 | 高 | 保留 |
| Browser Automation MCP | ブラウザ操作全般 | 低（UI変化に弱い） | 中 | 中 | 高 | 非推奨（主経路） |

## 採用理由

### 1) GitHub反映はCLIで十分（MCP不要）
- Colab は GitHub 上の `.ipynb` をそのまま開ける導線が安定している。
- notebook 配置の最短経路は `git` であり、既存運用にも自然に乗る。
- MCPを増やすと設定/認証/権限制御の管理コストが先に増える。
- まずは skills + CLI を標準とし、GitHub MCP は将来オプションに留める。

### 2) Google Workspace / Drive MCP（補助）
- Drive 配置が必要な場面（共同作業、MyDrive運用、ColabのDrive起点運用）をカバーできる。
- Workspace MCP は将来の Gmail / Sheets / Docs 自動化にも横展開しやすい。
- ただし OAuth 設定コストは高いので、日常運用の主経路にはしない。

## 候補メモ

### GitHub CLI（標準）
- 利用ツール: `git`（必要なら `gh` は補助）
- 強み: 既存運用に自然、差分/履歴/レビューの導線がそのまま使える
- notebook配置用途: `tmp/SSH.ipynb` をコンペrepoの任意パスへ反映し、Colab URL を生成

### GitHub MCP（公式）
- リポジトリ: `github/github-mcp-server`
- 強み: 公式、toolset制御、read-only運用、remote/local 両パターン
- notebook配置用途: 実現は可能だが、`git` CLIで代替できるため今回は標準採用しない

### Google Workspace MCP（汎用）
- 候補: `taylorwilsdon/google_workspace_mcp`
- 強み: Drive 以外も含めたGoogleサービスの汎用運用に向く
- 注意: OAuth 準備と権限スコープ管理が重い

### Google Drive MCP（特化）
- 候補: `piotr-agier/google-drive-mcp`, `isaacphi/mcp-gdrive`
- 強み: Drive 配置やファイル更新の導線が比較的短い
- 注意: 実装差が大きい。Docs/Sheets/Slides の扱い、認証方式、書込可否を導入前に確認する

### OpenAPI→MCP 変換系（保留）
- Google APIs Discovery / OpenAPI を土台にした汎用化は魅力がある
- ただし OAuth 2.0 対応や認可画面・refresh token 運用でハマりやすい
- 今回の notebook 配置用途では過剰になりやすい

### Browser Automation MCP（非推奨・主経路）
- Colab のUI操作自動化は可能性はあるが、認証状態・DOM変更・待機制御で壊れやすい
- 「配置」ではなく「開く」問題まで含めてしまい保守負荷が高い

## 導入の優先順位（MCP最小化）
1. GitHub経路を skills + CLI で運用化（MCPなし）
2. Drive 手動アップロードをなくす必要があるため、Google Workspace MCP か Google Drive MCP を1つだけ追加
3. Google系MCP を read/list で接続確認
4. Drive 書込を有効化して notebook 配置を実運用化
5. Google 汎用API 自動化が必要になった段階で OpenAPI/Discovery ベースを再評価

## 再確認チェックリスト（導入時）
- 本当にCLIで代替できないか
- 最終更新日・release頻度
- 認証方式（PAT / OAuth / GitHub App / Service Account）
- read-only / write 制御の有無
- tools 一覧と notebook 配置に必要な書込操作の有無
- ライセンス
- Codex/OpenCode からの接続例があるか

## 参考URL
- OpenAI Docs MCP: https://developers.openai.com/resources/docs-mcp
- GitHub MCP Server: https://github.com/github/github-mcp-server
- Open in Colab (GitHub notebooks): https://github.com/googlecolab/open_in_colab
- Google Workspace MCP: https://github.com/taylorwilsdon/google_workspace_mcp
- Google Drive MCP (piotr-agier): https://github.com/piotr-agier/google-drive-mcp
- Google Drive MCP (isaacphi): https://github.com/isaacphi/mcp-gdrive
- Google APIs Discovery: https://developers.google.com/discovery/v1/getting_started
- OpenAPI MCP 変換候補: https://github.com/sotayamashita/openapi-mcp-server
