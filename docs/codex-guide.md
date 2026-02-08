# Codex CLI クオータ確認ガイド

このガイドは、Codex のクオータを素早く確認する方法、追加したエイリアスの使い方、クオータ消費の仕組み、Codex の概要と便利機能をまとめたものです。

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

## 参考リンク

- Codex Overview: `https://developers.openai.com/codex`
- CLI Slash Commands: `https://developers.openai.com/codex/cli/slash-commands`
- CLI Command Reference: `https://developers.openai.com/codex/cli/reference`
- Pricing / Limits: `https://developers.openai.com/codex/pricing`
- Plan と利用説明: `https://help.openai.com/en/articles/11369540-codex-in-chatgpt`
