# Codex CLI ガイド（クオータ確認・起動方法・運用）

このガイドは、Codex のクオータ確認、CLI の起動方法、主要オプション、`plan => 自律実行` の運用方法をまとめた実務向けガイドです。

## 1. クオータ確認の基本

### CLI セッション中の確認

Codex を起動した状態で `/status` を実行すると、現在セッションの状態（モデル、権限、コンテキスト使用量など）を確認できます。

```bash
codex
# Codex 内で
/status
```

### プラン全体の利用状況確認

5時間枠や週次枠などの全体利用量は、Codex usage dashboard で確認します。

- `https://chatgpt.com/codex/settings/usage`

## 2. 追加したエイリアス

`~/.bashrc` に以下を追加済みです。

- `cqs`: Codex を `/status` 付きで起動（簡易チェック）
- `cq`: 利用状況の確認先を表示し、可能なら usage dashboard をブラウザで開く

### 使い方

```bash
source ~/.bashrc

# セッション使用量をすぐ確認したいとき
cqs

# 全体クオータ確認（ブラウザでダッシュボードを開く）
cq
```

補足:

- もし `cqs` が環境差分で期待どおり動かない場合は、`codex` 起動後に手動で `/status` を実行してください。

## 3. クオータ消費の仕組み（要点）

Codex の消費量は「1メッセージ=固定」ではなく、タスクの重さで変動します。

- プロンプトが長い
- 大きいコードベースを読む
- 複数ツールを呼び出す
- 長いセッションで保持コンテキストが増える

このような条件で 1 回あたりの消費が大きくなります。

主な考え方:

- Local messages と Cloud tasks は同じ 5 時間枠を共有
- プランごとに目安上限が異なる
- 上限に近づいたら Mini モデルへ切り替えて節約可能
- 追加クレジットで継続利用できるプランもある
- API key 利用時は ChatGPT プラン枠ではなく API 従量課金

## 4. Codex の概要

Codex は、ローカル（CLI / IDE）でもクラウドでも使えるコーディングエージェントです。

できること:

- 実装: 仕様からコード生成・編集
- 調査: 既存コードの読解・説明
- 検証: 差分レビュー、テスト支援
- 修正: 不具合の切り分けと修正提案
- 自動化: 定型作業の繰り返し実行

## 5. 便利機能（CLI）

日常的に使いやすいものを絞ると以下です。

- `/status`: セッション状態と使用状況確認
- `/model`: モデル切り替え
- `/permissions`: 承認ポリシーの変更
- `/diff`: 変更差分の確認
- `/review`: ワーキングツリーのレビュー
- `/compact`: 長い会話の要約でコンテキスト節約

非対話で使う場合:

- `codex exec`: CI やスクリプトでの実行に便利

## 6. クオータ節約のコツ

- 指示を具体的にして無駄な往復を減らす
- 必要なファイルだけを対象にする
- 長時間セッションは適宜 `/compact` する
- 単純作業は Mini モデルに寄せる

## 7. Codex CLI の起動パターン（実務）

用途に応じて、起動方法を使い分けると運用が安定します。

### 通常の対話セッションを開始

```bash
codex
```

- 計画策定、調査、設計相談に向いています。
- `config.toml` の既定設定（モデル、承認方針など）が適用されます。

### 非対話で実行（`exec`）

```bash
codex exec "READMEの誤字を直してテストを実行し、差分を要約して"
```

- スクリプト的に使いたいとき、CIに寄せた運用に向いています。
- その場限りの自律実行にしたい場合は `-a never` を付けます。

### 既存セッションを継続（`resume`）

```bash
# 直近セッションを継続
codex resume --last

# 一覧から選んで継続（直近以外も含む）
codex resume --all

# セッションIDを指定して継続
codex resume <SESSION_ID>
```

- 会話履歴を一本化したいときに使います。
- 承認方針やprofileは再開時に `-a` / `-p` で上書きできます。

### 既存セッションを分岐（`fork`）

```bash
# 直近セッションから分岐
codex fork --last

# 一覧から選んで分岐（直近以外も含む）
codex fork --all

# セッションIDを指定して分岐
codex fork <SESSION_ID>
```

- 計画セッションを「正本」として残したまま、実装フェーズに移るときに有効です。
- `plan => 実行` のフェーズ分離には、通常 `resume` より `fork` を推奨します。

## 8. 主要オプション早見表（よく使うもの）

### `-a`, `--ask-for-approval`

- Codex がコマンド実行時にどの程度ユーザ承認を求めるかを指定します。
- 代表値:
  - `on-request`: 必要時のみ承認を求める（対話向け）
  - `never`: 承認を求めない（自律実行向け）
  - `untrusted`: 信頼済みコマンドのみ無承認（保守的）

例:

```bash
codex fork --all -a never
```

### `-p`, `--profile`

- `~/.codex/config.toml` の profile を選択して、複数設定をまとめて切り替えます。
- `approval_policy` だけでなく、`model`、`features`、`web_search` なども一括切替できます。

例:

```bash
codex fork --all -p auto-exec
```

### `-s`, `--sandbox`

- Codex が実行するコマンドの隔離・制限ポリシーを指定します。
- 仮想環境（`venv` / `uv` / `conda`）の切替ではありません。
- 既存の開発環境を使う前提なら、基本は未指定運用でも構いません。

例:

```bash
codex -s workspace-write
```

### `-c`, `--config`

- `config.toml` の設定値をその起動時だけ上書きします。
- 試験運用で便利です（設定を定着させる前の検証に向く）。

例:

```bash
codex -c 'features.undo=true'
```

### `-C`, `--cd`

- Codex の作業ルートを指定します。
- 複数リポジトリを跨ぐ端末運用で便利です。

例:

```bash
codex -C /path/to/repo
```

### `--search`

- ライブWeb検索を有効化します（必要な調査に限定して使うと良い）。

例:

```bash
codex --search
```

### `--full-auto`（省略記法）

- `-a on-request` と `--sandbox workspace-write` の組み合わせをまとめた省略指定です。
- 「低摩擦な自動実行」をすぐ試したいときに便利ですが、詳細制御は `-a` / `-s` を個別指定した方が明確です。

### `--dangerously-bypass-approvals-and-sandbox`（非推奨・強い注意）

- 承認とsandboxをまとめて無効化する危険なオプションです。
- 外部で十分に隔離された環境以外では使わない方がよいです。

## 9. `-a` と `-p` の違い（重要）

### 役割の違い

- `-a`: 承認方針だけをその起動時に切り替える（単発・即効）
- `-p`: profileで複数設定をまとめて切り替える（再現性・運用標準化）

### 使い分けの目安

- まず試す: `-a never`
  - 実行フェーズだけ一時的に自律化したいとき
- 定型運用にする: `-p auto-exec`
  - 実行フェーズを毎回同じ設定で再現したいとき

### 実務上の整理

- `-a` は「今回だけ変えたい」
- `-p` は「運用モードを切り替えたい」

## 10. `plan => 自律実行` の推奨運用（今回の方針）

### 運用思想

- 計画フェーズはユーザと厳密に詰める
- 実行フェーズはできるだけ自律的に進める
- 同一セッション内での承認方針切替は前提にしない
- `fork` / `resume` を再起動時に使い、`-a` / `-p` を付けて移行する

### 推奨パターン（柔軟性重視）

1. 計画フェーズ（既定設定）

```bash
codex
```

2. 実行フェーズへ移行（計画セッションを残す）

```bash
codex fork --all -a never
```

- `--all` で直近以外のセッションも一覧から選べます。
- `SESSION_ID` が分かる場合は `codex fork <SESSION_ID> -a never` で直接指定できます。

### 推奨パターン（定型運用）

```bash
codex fork --all -p auto-exec
```

- `auto-exec` profile に自律実行用設定をまとめておく方式です。
- 設定の再現性が高く、運用チームで共有しやすくなります。

### `fork` と `resume` の使い分け

- `fork`（推奨）
  - 計画ログを温存し、実装を分岐させたい
  - 計画と実行を分けて振り返りたい
- `resume`
  - 履歴を一本化したい
  - セッション数を増やしたくない

## 11. `approval_policy` 設計の考え方（`never` を既定にするか）

### 結論（実務バランス）

- 既定は `on-request`
- 実行フェーズで `-a never` または `-p auto-exec`

理由:

- `never` を既定にすると、計画フェーズでも確認なしに進みやすくなり、厳密なplan運用と相性が下がるためです。
- 一方で実行フェーズでは `never` が有効なので、フェーズ切替で両立できます。

### 選択肢の整理

- 既定 `never`
  - 実行は速いが、計画中の事故耐性が下がる
- 既定 `on-request` + `-a never`
  - 柔軟で始めやすい（推奨）
- 既定 `on-request` + `-p auto-exec`
  - 再現性が高く、運用が安定する（定型化後に推奨）

## 12. `config.toml` の推奨例（今回の運用向け）

以下は、`sandbox_mode` を基本未設定にしつつ、`undo` と実行用profileを使う最小構成例です。

```toml
personality = "pragmatic"
model = "gpt-5.3-codex"
model_reasoning_effort = "medium"

approval_policy = "on-request"

[features]
undo = true

[profiles.auto-exec]
approval_policy = "never"
```

補足:

- `sandbox_mode` は、Codex 側のコマンド隔離ポリシーです。
- 既存の仮想環境（`uv`, `venv`, `conda` など）で実行する前提なら、常時明示しなくても運用できます。

## 13. よくある運用コマンド例（コピペ用）

### 計画フェーズ開始

```bash
codex
```

### 計画セッションから実行フェーズへ分岐（単発 `never`）

```bash
codex fork --all -a never
```

### 計画セッションから実行フェーズへ分岐（profile）

```bash
codex fork --all -p auto-exec
```

### セッションIDを指定して直接分岐（非直近）

```bash
codex fork <SESSION_ID> -p auto-exec
```

### セッションを一本化したい場合の再開

```bash
codex resume <SESSION_ID> -a never
```

## 参考リンク

- Codex Overview: `https://developers.openai.com/codex`
- CLI Slash Commands: `https://developers.openai.com/codex/cli/slash-commands`
- CLI Command Reference: `https://developers.openai.com/codex/cli/reference`
- Pricing / Limits: `https://developers.openai.com/codex/pricing`
- Plan と利用説明: `https://help.openai.com/en/articles/11369540-codex-in-chatgpt`
