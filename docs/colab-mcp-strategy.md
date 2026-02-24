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

## Colab UI自動化のMCP選定（agent-browser / Playwright / Chrome DevTools）

### 結論（現時点）
- 主軸（再検討後の補助位置づけ）: `Playwright MCP` ではなく `Playwright CLI`
- 補助（診断/デバッグ）: `Chrome DevTools MCP`
- 非主軸: `agent-browser`

理由（要点）:
- Colab の起動/再開/終了は「再現性ある UI 操作」が主課題で、最終的には `Playwright CLI` が最も適合する
- Chrome DevTools MCP はブラウザ診断・既存セッション調査に強いが、主目的のUI操作フローの主軸には寄せすぎない
- `agent-browser` は実装によって性質が異なり、今回欲しい「ブラウザ操作MCPそのもの」とはズレやすい

### 名前の混同に注意（重要）

`agent-browser` という名前は複数の系統で使われており、用途が異なる。

- `microsoft/playwright-mcp`
  - ブラウザ操作の **MCPサーバ**
  - 今回の主軸候補
- `ChromeDevTools/chrome-devtools-mcp`
  - Chrome DevTools連携の **MCPサーバ**
  - 診断・補助用途候補
- `vercel-labs/agent-browser`
  - ブラウザ操作のCLI/エージェント補助寄り（MCP主軸ではない）
- `co-browser/agent-browser`
  - MCPサーバを束ねる管理/集約寄り（ブラウザ操作エンジンそのものではない）

### 選定理由（この運用に対して）

#### 1) Playwright CLI を主軸にする理由（推奨・再検討後）
- Colab notebook を開く、`Connect` する、指定セルを実行する、セル出力から SSH 情報を取る、という一連のUI操作をローカルCLIの状態機械で閉じられる
- アクセシビリティツリーに基づく操作を使いつつ、会話には要約JSONだけ返せるためトークン効率が高い
- 将来 `colab-notebook-runner` skill を作る場合も、責務を「UI制御CLIの起動/監督」に分離しやすい

#### 2) Chrome DevTools MCP を補助に留める理由
- コンソール/ネットワーク/DevTools診断は強い（UIドリフト時の切り分けに有効）
- 既存ブラウザセッションの調査に有利な場面がある
- 一方で、Colabの定型UI操作の主軸をこれに寄せると、設計が診断中心になりやすい

#### 3) agent-browser を主軸にしない理由
- 候補名が曖昧で、MCPサーバ本体ではない実装を混同しやすい
- 今回の要件は「Colab UIをエージェントが再現可能に操作すること」であり、MCP集約器やCLI補助が先ではない
- まずは `Playwright CLI` で最短価値を出し、MCP増加時に集約器導入を検討する方が安全

### 採用方針（段階的）

#### Phase 1: Playwright CLI（主軸）
- Colab UI の起動/再開/終了を Playwright CLI で自動化する
- 失敗時はスクリーンショット・URL・DOM情報を保存して停止する（自動フォールバックしない）

#### Phase 2: MCP を診断用に追加
- Playwright CLI で失敗したケースの調査に使う
- コンソール/ネットワークを確認し、Colab UI変更や認証問題の切り分けを行う

#### Phase 3: agent-browser（集約器）の再評価
- MCPが増えて運用が煩雑になった場合のみ検討する
- ただし、これは「MCP管理の整理」であり、Colab UI自動化エンジンの代替ではない

### このドキュメント内の設計境界への反映
- `colab-notebook-runner`（将来追加候補）の標準UI制御は `Playwright CLI`
- `Playwright MCP` / `Chrome DevTools MCP` は診断モード時の補助として位置づける
- `agent-browser` は当面採用しない（主軸/補助ともに必須ではない）

### 再検討結果（安定性・トークン効率）
- 主経路は `Playwright CLI`（ローカルスクリプト）に統一する
- `Playwright MCP` / `Chrome DevTools MCP` は UIドリフトや認証不具合の調査時のみ使う
- 自動フォールバックは禁止し、CLI失敗時は診断出力を残して停止する

### 実装計画ドキュメント
- `docs/colab-notebook-runner-implementation-plan.md`
  - `colab-notebook-runner` の CLI / state JSON / セル契約 / `start|resume|stop` フロー / テスト計画を定義

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

## 参考（Colab UI自動化MCP選定）
- Playwright MCP: `https://github.com/microsoft/playwright-mcp`
- Chrome DevTools MCP: `https://github.com/ChromeDevTools/chrome-devtools-mcp`
- Chrome DevTools MCP 紹介: `https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session`
- Vercel agent-browser: `https://github.com/vercel-labs/agent-browser`
- co-browser agent-browser: `https://github.com/co-browser/agent-browser`
