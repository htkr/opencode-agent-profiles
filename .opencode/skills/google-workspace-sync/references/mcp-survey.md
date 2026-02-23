# Colab Notebook 配置向け MCP 調査メモ（2026-02-23, MCP最小化版）

## 結論（推奨構成）
- 主経路: skills + CLI（`git`）で notebook をコンペrepoへ更新（MCP不要）
- 補助経路: Google Drive系特化MCP（採用）で Drive/Docs/Sheets 配置
- 非推奨（主経路）: Colab UI を browser automation で直接操作
- `Google Workspace MCP` は参考/比較対象に降格（未審査アプリのテスター制限に該当）

## 比較表

| 候補 | 主用途 | Colab notebook配置適性 | CLI代替可否 | 汎用性 | 認証難易度 | 推奨度 |
|---|---|---:|---:|---:|---:|---|
| GitHub CLI（`git`） | repo 反映、履歴管理 | 高 | - | 中 | 中 | 採用（主） |
| GitHub MCP（公式） | repo 読み書き、PR、issue等 | 高（GitHub repo配置に最適） | 高（`git`で十分） | 中 | 中（PAT/GitHub App） | 保留（通常不要） |
| Google Workspace MCP | Drive/Docs/Sheets/Gmail等 | 中〜高（Drive配置可能なら可） | 低〜中 | 高 | 高（OAuth） | 保留（参考） |
| Google Drive MCP（特化） | Drive/Docs/Sheets/Slides | 高（Drive配置に直結） | 低〜中 | 中 | 中〜高（OAuth/SA実装次第） | 採用（補助） |
| OpenAPI→MCP 変換系 | OpenAPI API 全般 | 低〜中（Google OAuth2制約に依存） | 中 | 高 | 高 | 保留 |
| Browser Automation MCP | ブラウザ操作全般 | 低（UI変化に弱い） | 中 | 中 | 高 | 非推奨（主経路） |

## 採用理由

### 1) GitHub反映はCLIで十分（MCP不要）
- Colab は GitHub 上の `.ipynb` をそのまま開ける導線が安定している。
- notebook 配置の最短経路は `git` であり、既存運用にも自然に乗る。
- MCPを増やすと設定/認証/権限制御の管理コストが先に増える。
- まずは skills + CLI を標準とし、GitHub MCP は将来オプションに留める。

### 2) Google Drive特化MCP（補助）
- Drive 配置が必要な場面（共同作業、MyDrive運用、ColabのDrive起点運用）をカバーできる。
- Drive/Docs/Sheets に機能範囲を絞ることで、必要スコープと運用複雑性を抑えやすい。
- ただし Google OAuth の test user 制約自体は残るため、自前OAuthアプリ管理は必要。
- 今回は `piotr-agier/google-drive-mcp` を第一候補として採用する。

### 3) Google Workspace MCP を既定から外す理由
- `taylorwilsdon/google_workspace_mcp` は `list_drive_items` 実行時に初回認可URL発行まで確認できた。
- しかし OAuth 同意画面が `Testing` 状態で、利用アカウントが test user 未登録だと Google にブロックされる。
- これは Google OAuth の運用制約であり、実装不具合ではないが、今回の用途にはスコープが広すぎる。

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
- 注意: OAuth 準備と権限スコープ管理が重い。`Testing` 状態では test user 登録が必須

### Google Drive MCP（特化）
- 候補: `piotr-agier/google-drive-mcp`, `isaacphi/mcp-gdrive`
- 強み: Drive 配置やファイル更新の導線が比較的短い。`piotr-agier` 実装は Docs/Sheets/Slides も対象
- 注意: 実装差が大きい。認証方式、トークン保管、transport、書込可否を導入前に確認する

#### 第一候補: `piotr-agier/google-drive-mcp`
- 実装: Node系MCPサーバ（READMEは `npx @piotr-agier/google-drive-mcp` 例）
- 対応: Drive / Docs / Sheets / Slides の管理操作
- 認証: OAuth 2.0（READMEの手順に従い client credentials と token cache を管理）
- 運用方針: このrepoでは `pnpm dlx` を既定にし、READMEの `npx` は参考扱いにする

#### 第二候補: `isaacphi/mcp-gdrive`
- 実装: Python系（READMEでは `uvx mcp-gdrive`）
- 対応: Drive（Sheets連携を含むが機能深度は要確認）
- 認証: service account / OAuth client など複数パターン
- 運用方針: 第一候補の read/list / write が不足した場合の再選定先

### OpenAPI→MCP 変換系（保留）
- Google APIs Discovery / OpenAPI を土台にした汎用化は魅力がある
- ただし OAuth 2.0 対応や認可画面・refresh token 運用でハマりやすい
- 今回の notebook 配置用途では過剰になりやすい

### Browser Automation MCP（非推奨・主経路）
- Colab のUI操作自動化は可能性はあるが、認証状態・DOM変更・待機制御で壊れやすい
- 「配置」ではなく「開く」問題まで含めてしまい保守負荷が高い

## 導入の優先順位（MCP最小化）
1. GitHub経路を skills + CLI で運用化（MCPなし）
2. Drive 手動アップロードをなくすため、Google Drive特化MCP を追加
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
- Google OAuth テストユーザー制約（公式）: https://support.google.com/cloud/answer/13463073
- Google APIs Discovery: https://developers.google.com/discovery/v1/getting_started
- OpenAPI MCP 変換候補: https://github.com/sotayamashita/openapi-mcp-server
