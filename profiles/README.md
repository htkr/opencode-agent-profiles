# OpenCode Profile Switcher

`oh-my-opencode` 使用時/未使用時を切り替えながら、サブエージェント設定を共通管理するための構成です。

## 何を固定しているか

- サブエージェント（軽量）: `github-copilot/gpt-5-mini`
- サブエージェント（中負荷）: `openai/gpt-5.1-codex-mini`
- メイン既定: `openai/gpt-5.3-codex`

メインは実行中に `/models` やモデル切替キーで変更できます。サブエージェントは固定モデルを維持します。

## ファイル構成

- `subagent-models.json`: 変更対象は基本この1ファイル
- `generate-configs.mjs`: プロファイル設定を自動生成
- `switch-profile.sh`: 有効化プロファイル切替
- `ohmy/opencode.json`
- `ohmy/oh-my-opencode.json`
- `vanilla/opencode.json`

## 使い方

1. モデル割り当てを変更

```bash
vim ~/.config/opencode/profiles/subagent-models.json
```

2. 設定を再生成

```bash
node ~/.config/opencode/profiles/generate-configs.mjs
```

3. プロファイルを適用

```bash
# oh-my-opencode を使う
~/.config/opencode/profiles/switch-profile.sh ohmy

# OpenCode 単体で使う
~/.config/opencode/profiles/switch-profile.sh vanilla
```

4. `ocm` で切り替え（推奨）

```bash
# 現在状態を確認
ocm status

# トグル切り替え（ohmy <-> vanilla）
ocm

# 明示切り替え
ocm ohmy
ocm vanilla

# モデル定義変更後に再生成
ocm regen
```

## メモ

- 既存設定は `~/.config/opencode/backups/` に自動バックアップされます。
- `vanilla` 適用時は `oh-my-opencode.json` を削除しません（保持のみ）。
