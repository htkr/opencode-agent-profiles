# Colab Notebook Runner 実装計画（通常Colab + Playwright CLI）

## 目的
通常版 Google Colab を対象に、Colab SSH 環境の `起動 / 再開 / 終了` をエージェント作業で完結させる。

前提:
- Colab 本体は通常版（Colab Enterprise ではない）
- Colab UI 自動化の主軸は `Playwright CLI`（ローカルスクリプト）
- 診断用に `Playwright MCP` / `Chrome DevTools MCP` を後から併用可能にする
- GitHub はローカル Git 正本、Colab は GitHub notebook を開く実行フロント

## スコープ

### 対象
- Colab notebook の起動（GitHub URL から open / runtime connect / セル実行）
- Colab notebook の再開（runtime 再接続 / セル再実行 / checkpoint resume）
- Colab notebook の終了（同期セル実行 / runtime 停止）
- SSH 接続情報の抽出とローカル SSH 接続導線への橋渡し
- ローカル state 管理（session 状態、SSH 情報）

### 非対象
- 学習コード本体のロジック改善
- Colab Enterprise API ベース実装
- UI ドリフト時の自動フォールバック（禁止）
- 秘密情報の永続化（repo / Drive 保存）

## DoD（Definition of Done）
- 成果物:
  - `scripts/colab_orchestrate.sh`（start/resume/stop の入口 CLI）
  - `scripts/colab_control_playwright.ts`（UI 制御の実体）
  - `scripts/colab_parse_marker_output.py`（セル出力パーサ、任意）
  - state JSON 仕様と保存処理
  - 実装/運用ドキュメント更新（本書 + `docs/colab-mcp-strategy.md`）
- 検証方法:
  - `--dry-run` でコマンド生成/state 更新前までを確認できる
  - `start/resume/stop` がそれぞれ入力検証と state 読み書きを行える
  - UI 失敗時に診断情報（スクショ/URL/状態）を出力して停止できる
- 非対象範囲:
  - Colab UI 実環境での E2E 成功保証（UI 変動があるため）
  - 学習完走の保証（学習コード側依存）
- 完了判定条件:
  - 実装担当が追加判断なしで Phase 1-3 を実装できる
  - インターフェース（CLI/state/セル契約）が確定している

## 既存資産との統合
- 既存再利用:
  - `scripts/colab_open_ssh_wezterm.sh`（SSH 接続起動）
  - `.opencode/skills/colab-ssh-attach/SKILL.md`（ローカル接続導線）
  - `.opencode/skills/google-workspace-sync/scripts/publish_notebook_git.sh`（notebook 検証 + GitHub URL生成）
- 新規追加の責務:
  - Colab UI 操作（open / connect / cell run / stop）
  - state JSON 管理
  - 既存スクリプト間のオーケストレーション

## 開発環境（実装前提）
- `devbox` を標準とし、`nodejs` / `pnpm` を提供する
- Node依存は `pnpm` で管理し、Playwright CLI 実行は `pnpm exec` を使う
- 初回セットアップ（CLI主軸）:
  1. `devbox shell`
  2. `pnpm install`
  3. `pnpm exec playwright install chromium`

## アーキテクチャ

### 1. ローカル制御層（Orchestrator）
- ファイル: `scripts/colab_orchestrate.sh`
- 役割:
  - 引数解析
  - notebook の GitHub 正本反映（必要時）
  - Colab UI 制御スクリプト呼び出し
  - `ssh_connection.json` 保存/更新
  - `scripts/colab_open_ssh_wezterm.sh` 呼び出し
  - `session_state.json` 管理

### 2. UI 制御層（Playwright CLI）
- 実装体: `scripts/colab_control_playwright.ts`
- 役割:
  - Colab notebook URL を開く
  - runtime 接続状態を確認
  - 指定セル（タグ/見出し）を実行
  - セル出力から機械可読マーカーを抽出
  - UI ドリフト時の診断情報出力

### 3. 状態層（ローカルJSON）
- 保存先: `WORK_DIR/.colab_local/runtime/`
- ファイル:
  - `session_state.json`
  - `ssh_connection.json`
  - `diagnostics/<timestamp>/...`

## CLI 仕様（確定）

### `scripts/colab_orchestrate.sh`

#### 共通オプション
- `--work-dir PATH`（既定: カレントディレクトリ）
- `--state-dir PATH`（既定: `WORK_DIR/.colab_local/runtime`）
- `--dry-run`
- `--no-ssh-attach`
- `--headed` / `--headless`（既定: `--headed`）
- `--diag-dir PATH`（既定: `STATE_DIR/diagnostics`）

#### `start`
```bash
scripts/colab_orchestrate.sh start \
  --work-dir <repo_root> \
  --repo-dir <git_repo_dir> \
  --repo <owner/repo> \
  --ref <git_ref> \
  --notebook-path <path/in/repo.ipynb> \
  --exp-id <exp_id> \
  [--run-id <run_id>] \
  [--publish-notebook]
```

役割:
- 必要なら `publish_notebook_git.sh` 呼び出し
- Colab URL 生成
- `colab_control_playwright.ts start` 呼び出し
- `ssh_connection.json` 更新
- （既定）SSH attach 実行

#### `resume`
```bash
scripts/colab_orchestrate.sh resume \
  --state <STATE_DIR/session_state.json> \
  [--run-id <run_id_override>]
```

役割:
- state 読み込み
- notebook URL / repo ref / exp_id 検証
- `colab_control_playwright.ts resume` 呼び出し
- `ssh_connection.json` 更新
- （既定）SSH attach 実行

#### `stop`
```bash
scripts/colab_orchestrate.sh stop \
  --state <STATE_DIR/session_state.json>
```

役割:
- state 読み込み
- `colab_control_playwright.ts stop` 呼び出し
- sync 完了確認
- runtime 停止
- state を `stopped` に更新

## UI 制御スクリプト仕様（`scripts/colab_control_playwright.ts`）

### 実行モード
- `start`
- `resume`
- `stop`

### 入力（JSONまたはCLI引数）
- `notebook_url`
- `phase`
- `cell_tags`（実行対象セル）
- `state_dir`
- `diag_dir`
- `headed/headless`
- `timeout_ms`

### 出力（stdout JSON, 1回）
- `ok: boolean`
- `phase: "ssh_ready" | "training" | "sync_done" | "stopped" | "error"`
- `markers`:
  - `COLAB_SSH_JSON`
  - `TRAIN_STATUS_JSON`
  - `SYNC_STATUS_JSON`
- `diagnostics_dir`
- `current_url`
- `error`（失敗時）

### 失敗時の診断出力（必須）
- `screenshot.png`
- `page.html`（可能なら）
- `accessibility.json`（可能なら）
- `meta.json`（mode, url, timestamp, step）

## state JSON 仕様（確定）

### `session_state.json`
```json
{
  "version": 1,
  "phase": "started",
  "work_dir": "/path/to/work",
  "repo_dir": "/path/to/repo",
  "repo_slug": "owner/repo",
  "repo_ref": "main",
  "notebook_path": "notebooks/SSH.ipynb",
  "notebook_url": "https://colab.research.google.com/github/...",
  "exp_id": "exp_20260224_a",
  "run_id": "run_001",
  "last_success_cell_tag": "AGENT_SSH_START",
  "last_train_phase": "training",
  "updated_at": "2026-02-24T12:34:56Z"
}
```

### `ssh_connection.json`
```json
{
  "version": 1,
  "hostname": "xxxx.trycloudflare.com",
  "ssh_user": "root",
  "proxy_command": "cloudflared access ssh --hostname %h",
  "ssh_key_path_hint": "~/.ssh/solafune_colab",
  "source_notebook_url": "https://colab.research.google.com/github/...",
  "generated_at": "2026-02-24T12:35:00Z",
  "ssh_command": "ssh -i ~/.ssh/solafune_colab ..."
}
```

## Notebook セル契約（機械可読出力）

### 必須セルタグ/見出し
- `AGENT_BOOTSTRAP`
- `AGENT_DRIVE_MOUNT`
- `AGENT_DATA_PREP`
- `AGENT_SSH_START`
- `AGENT_TRAIN_RESUME`
- `AGENT_SYNC_AND_STOP`

### 出力マーカー仕様（固定）
- `COLAB_SSH_JSON: {...}`
- `TRAIN_STATUS_JSON: {...}`
- `SYNC_STATUS_JSON: {...}`

ルール:
- JSON は1行で出す
- プレフィックスは厳密一致
- 機密値を含めない

## フロー詳細（decision complete）

### `start` フロー
1. 入力検証（repo/notebook/state-dir）
2. `state_dir` 作成
3. （指定時）`publish_notebook_git.sh` 実行
4. Colab URL 生成（GitHub URLベース）
5. `colab_control_playwright.ts start` 実行
6. `COLAB_SSH_JSON` を `ssh_connection.json` に保存
7. `session_state.json` を `phase=training` で保存
8. `--no-ssh-attach` でなければ `scripts/colab_open_ssh_wezterm.sh --json ...`

### `resume` フロー
1. `session_state.json` 読み込み
2. 必須キー検証（`notebook_url`, `repo_ref`, `exp_id`, `run_id`）
3. `colab_control_playwright.ts resume` 実行
4. `COLAB_SSH_JSON`（新しいhost）で `ssh_connection.json` を更新
5. `TRAIN_STATUS_JSON` を反映して `session_state.json` 更新
6. SSH attach（既定）

### `stop` フロー
1. `session_state.json` 読み込み
2. `colab_control_playwright.ts stop` 実行
3. `SYNC_STATUS_JSON.phase == "sync_done"` を確認
4. runtime 停止完了を確認
5. `session_state.json.phase = "stopped"` 更新

## Playwright CLI / MCP 補助の使い分け（実装反映）
- 標準:
  - `Playwright CLI` で UI 操作を完結（JSON結果のみ返す）
- 診断モード（将来オプション）:
  - `Playwright MCP` または `Chrome DevTools MCP` を有効化してコンソール/ネットワーク/手動調査を補助
- フォールバック禁止:
  - Playwright 失敗時に自動で Chrome DevTools 操作へ切替しない
  - 診断情報を保存して停止する

## セキュリティ設計
- ローカル:
  - 秘密鍵はパスのみ扱う（内容を読み出さない）
  - ブラウザプロファイル/トークンを repo に保存しない
- Colab:
  - GitHub token / cloudflared token は Colab Secrets
  - `/tmp` に一時ファイルを置く場合も Drive へ保存しない
- JSON state:
  - secret/token/password を書かない

## 実装フェーズ（段階導入）

### Phase 1（最短価値）
- `start` 実装
- `session_state.json` / `ssh_connection.json` 作成
- `colab_open_ssh_wezterm.sh` 連携
- `--dry-run` 実装

### Phase 2（再開性）
- `resume` 実装
- `TRAIN_STATUS_JSON` 反映
- 既存 state から notebook URL / run_id 復元

### Phase 3（終了まで完結）
- `stop` 実装
- `AGENT_SYNC_AND_STOP` 実行と sync 成否検証
- runtime 停止操作

### Phase 4（診断強化）
- `Chrome DevTools MCP` 診断モード追加
- 失敗時の診断収集を強化

## テストケース / シナリオ

### 単体（ローカル）
1. 引数検証
- 必須引数不足で usage + 非0終了

2. state 生成/更新
- `start` dry-run で `session_state.json` の雛形が生成される（または出力される）
- `resume` で state 必須キー不足を検知して停止

3. マーカー解析
- `COLAB_SSH_JSON` / `TRAIN_STATUS_JSON` / `SYNC_STATUS_JSON` を正しく抽出
- 不正JSONで明示エラー

### 結合（擬似）
4. UI制御スクリプト出力モック
- `colab_control_playwright.ts` をモック出力に差し替え、`start/resume/stop` の state 遷移を確認

5. SSH attach 連携
- `--no-ssh-attach` 時は未実行
- 通常時は `scripts/colab_open_ssh_wezterm.sh --json` が呼ばれる

### 実機（手動確認）
6. Colab 起動
- GitHub notebook を開き `AGENT_SSH_START` まで成功
- `ssh_connection.json` 生成

7. Colab 再開
- runtime 断後に `resume` で `AGENT_TRAIN_RESUME` に到達

8. Colab 終了
- `AGENT_SYNC_AND_STOP` 実行後に runtime 停止

## 失敗時の再計画トリガ（明示）
- Colab UI の主要セレクタ（Connect/セル実行）が見つからない
- セル出力の機械可読マーカーが取得できない
- Colab 側 notebook 契約（セルタグ/プレフィックス）が守られていない
- Playwright MCP の制約で必要操作が実現できない

上記は押し切らず、UI変更または notebook 契約の変更として再計画する。

## 参照
- `docs/colab-mcp-strategy.md`
- `.opencode/skills/colab-ssh-attach/SKILL.md`
- `.opencode/skills/google-workspace-sync/SKILL.md`
- `scripts/colab_open_ssh_wezterm.sh`
- `.opencode/skills/google-workspace-sync/scripts/publish_notebook_git.sh`
