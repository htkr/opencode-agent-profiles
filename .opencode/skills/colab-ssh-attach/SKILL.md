---
name: colab-ssh-attach
description: Colab SSH接続情報ファイルを使ってローカル端末接続（wezterm優先）を標準化する
compatibility: opencode
metadata:
  domain: common
  invoke: manual
disable-model-invocation: true
---

## Goal
Colab の SSH 接続情報をセル出力に依存せず取得し、ローカル端末接続を再現可能にする。
短期は「Colab セル実行のみユーザー、以後はエージェント」を既定とし、長期は Colab 側も含めた完全自動化を目指す。

## Use When
- Colab の SSH コマンド出力を見失いやすい
- wezterm 新規タブで SSH 接続を起動したい
- cloudflared + ssh 前提の接続手順を標準化したい

## Defaults
- 接続情報の正本は `WORK_DIR/.colab_local/runtime/ssh_connection.json`
- 接続方式は `cloudflared` 既定
- 端末は `wezterm` 優先、未導入時はコマンド表示にフォールバック
- 実行前に `--dry-run` で確認可能
- 短期運用では Colab の SSH セル実行はユーザー操作（完全自動化は別フェーズ）

## Procedure
1. （短期既定）Colab 側で SSH セルを実行し、`ssh_connection.json` が更新されていることを確認する。
2. ローカルで `scripts/colab_open_ssh_wezterm.sh --dry-run --json <path>` を実行して接続コマンドを確認する。
3. 問題なければ `scripts/colab_open_ssh_wezterm.sh --json <path>` を実行する。
4. `wezterm` 未導入時は `--print-only` または `--exec-shell` を使う。
5. 接続失敗時は URL の有効期限切れを疑い、Colab 側セルを再実行して接続情報を更新する。

## Scope Boundary
- この skill はローカル端末接続導線（JSON確認・CLI実行・切り分け）を担当する
- Colab UI の自動操作やセル実行自動化は担当しない（別 skill / 別制御層で扱う）
- `google-workspace-sync` は Drive/Docs/Sheets 連携を担当し、この skill とは責務を分離する

## Output
- 使用した接続情報ファイルパス
- 生成/実行した SSH コマンド
- wezterm 使用有無
- 失敗時の不足要件（`cloudflared`, `wezterm`, `ssh`, JSON不足キー）

## Safety Rules
- 秘密鍵ファイル自体は読み取らない（パス文字列のみ扱う）
- 接続情報ファイルに token/secret を入れない
- URL が古い場合の接続失敗は正常系として扱い、再実行手順を案内する
- `wezterm` / `cloudflared` / `ssh` の不足は明示エラーとして返し、勝手に代替方式へ切り替えない
