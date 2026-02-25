# Claude Code 利用ガイド（包括版）

更新日: 2026-02-25  
対象: Claude Code CLI / Claude Code Docs（公式）  
この環境の実機確認: `claude 2.1.56 (native install, Linux/WSL)`

## 0. このドキュメントの目的

Claude Code を日常開発・自動化・チーム運用で使うための実務的な使い方を、以下をまとめて整理したガイドです。

- 導入と認証
- 日常の対話利用（REPL）
- 非対話利用（`-p` / headless）
- 権限・サンドボックス・安全運用
- `CLAUDE.md` / Memory / 設定
- MCP / Hooks / Subagents / Plugins
- CI 連携（GitHub Actions）

補足:

- このリポジトリには `dcos/` はなく `docs/` が既存の文書置き場のため、`docs/` に保存しています（依頼の `/dcos` は typo とみなして対応）。

## 1. Claude Code とは（要点）

Claude Code はターミナル中心のエージェント型コーディングツールです。単なるチャットではなく、ファイル読取・編集・コマンド実行・外部ツール連携（MCP）まで行えます。

主な特徴:

- ターミナルで動く（CLI中心）
- 自律的に調査→計画→実装→検証まで進められる
- 権限システムでツール利用を制御できる
- `CLAUDE.md` / settings / hooks / subagents で挙動を調整できる
- `claude -p` によりスクリプトやCIに組み込みやすい

## 2. 導入・更新・認証

### 2.1 推奨インストール（native install）

2026-02-25 時点の公式 docs では、Linux / macOS / WSL は native install が推奨です。

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

ポイント:

- native install はバックグラウンド自動更新あり
- `claude doctor` で installation type / version を確認できる
- npm グローバルインストールは deprecated 扱い

### 2.2 バージョン固定 / チャネル

インストーラは `latest` / `stable` / 特定版を指定できます。

```bash
# stable を入れる
curl -fsSL https://claude.ai/install.sh | bash -s stable

# 特定版
curl -fsSL https://claude.ai/install.sh | bash -s 2.1.56
```

更新運用:

- native install: 自動更新（起動時・実行中にチェック）
- 手動更新: `claude update`
- リリースチャネルは `autoUpdatesChannel` 設定で `latest` / `stable`

### 2.3 認証方法

公式 docs 上の主な選択肢:

- 個人利用: Claude.ai（Pro / Max 推奨）
- Anthropic Console（OAuth, 課金有効な組織）
- 組織利用: Teams / Enterprise
- クラウド経由: Bedrock / Vertex / Foundry（組織展開向け）

CLI コマンド（実機ヘルプ確認）:

```bash
claude auth login
claude auth status
claude auth logout
```

## 3. 基本の使い方（対話モード）

### 3.1 セッション開始

```bash
cd /path/to/project
claude
```

開始直後に行うと良いこと:

- `/status` で状態確認（モデル・アカウント・設定レイヤ）
- `/permissions` で権限方針確認
- `/init` で `CLAUDE.md` たたき台生成

### 3.2 日常プロンプトのコツ（実務向け）

Claude Code は曖昧指示でも動きますが、精度と手戻りを減らすには以下が重要です。

- 成功条件を明示する（テスト・期待出力・再現条件）
- 対象範囲を指定する（ファイル/ディレクトリ/機能）
- 既存パターンを参照させる（「この実装に合わせて」）
- 検証方法もセットで頼む（テスト実行、差分確認）

良い例:

```text
src/auth 以下を先に読んで、現在のログイン/セッション更新フローを要約して。
その上で Google OAuth 追加の計画を作って。変更対象ファイルとテスト方針も含めて。
```

### 3.3 `@` 参照・`!` Bash モード

- `@path` でファイル/ディレクトリを参照（MCP resource も `@server:...` 形式で参照可能）
- `!` で Bash コマンドを直接実行（出力を会話コンテキストに載せる）

例:

```text
@src/components/Header.tsx を説明して
! git status
```

## 4. 対話モードの操作（Slash Commands / ショートカット）

### 4.1 よく使う Slash Commands

`Interactive mode` 参照ベースで、実務で頻出のものを抜粋:

- `/help` 使用方法
- `/status` 状態確認（モデル/アカウント/接続/設定ソース）
- `/config` 設定UI
- `/permissions` 権限確認・更新
- `/model` モデル切替（対応モデルでは effort 調整）
- `/memory` Memory / `CLAUDE.md` 編集
- `/mcp` MCP 接続・OAuth 管理
- `/doctor` インストール健全性チェック
- `/compact` 会話圧縮（長セッション対策）
- `/plan` Plan Mode へ切替
- `/resume` セッション再開
- `/init` `CLAUDE.md` 初期化
- `/tasks` 背景タスク管理
- `/usage` サブスク利用状況表示（対応プラン）

### 4.2 よく使うショートカット（抜粋）

- `Ctrl+C`: 入力/生成の中断
- `Ctrl+D`: セッション終了
- `Ctrl+O`: verbose 出力の切替
- `Ctrl+R`: 履歴逆引き
- `Ctrl+B`: バックグラウンド化（長い Bash / agent task）
- `Ctrl+T`: タスクリスト表示切替
- `?`: 環境で使えるショートカット一覧

補足:

- `Shift+Enter` は端末によって設定が必要（`/terminal-setup` 参照）
- Vim入力モードは `/vim`

## 5. 非対話利用（`-p` / headless / Agent SDK CLI）

Claude Code は `-p` (`--print`) で非対話実行できます。CI / スクリプト / バッチ処理の基本です。

```bash
claude -p "このリポジトリの概要を要約して"
```

### 5.1 代表的な使い方

```bash
# JSON出力
claude -p "Summarize this project" --output-format json

# Structured output (JSON Schema)
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'

# ストリーミングJSON
claude -p "Explain recursion" \
  --output-format stream-json \
  --verbose \
  --include-partial-messages

# 会話継続
claude -p "Review this codebase" --output-format json
claude -p "Now focus on db queries" --continue
```

### 5.2 非対話利用の注意点

- `--allowedTools` / `--permission-mode` で自動承認範囲を明示する
- `--max-budget-usd` を使ってコスト上限を抑える
- 実行回数制御系のフラグはバージョン差分が出やすいため、利用前に `claude --help` を確認する
- `--output-format json` を使うと機械処理しやすい
- `--print` では対話用スラッシュコマンドや skills の前提が一部異なる（タスク文で明示する）

## 6. CLIコマンドと主要フラグ（2026-02-25 実機 `--help` 確認）

### 6.1 主要サブコマンド（実機確認）

- `auth` 認証管理
- `doctor` 自動更新/インストール診断
- `install [target]` native build導入
- `update` / `upgrade` 更新
- `mcp` MCPサーバ管理
- `plugin` プラグイン管理
- `agents` 設定済み subagent 一覧
- `setup-token` 長期トークン設定

### 6.2 特に重要なフラグ（抜粋）

- `-c, --continue` 最新会話継続
- `-r, --resume [id]` 指定会話再開
- `-p, --print` 非対話出力
- `--model <alias|name>` モデル指定
- `--permission-mode <mode>` 権限モード指定
- `--allowedTools` / `--disallowedTools` ツール制御
- `--add-dir` 追加ディレクトリアクセス
- `--output-format {text,json,stream-json}`
- `--json-schema`
- `--max-budget-usd`
- `--mcp-config`, `--strict-mcp-config`
- `--append-system-prompt`, `--system-prompt`
- `--worktree` / `--tmux`
- `--ide`, `--chrome`

注記:

- 公式 `CLI reference` は実機ヘルプより説明が豊富で、`remote-control`, `--remote`, `--teleport` なども記載あり。バージョン差分があり得るため、使用前に `claude --help` で現物確認推奨。

## 7. 権限（Permissions）と安全運用

### 7.1 権限モデルの基本

Claude Code は tool 単位の権限制御を持ちます。

- Read系: 通常は承認不要
- Bash: 承認が必要（ルール化で許可/拒否可能）
- File edit/write: 承認が必要（モードで自動受理可能）

`/permissions` UI でルール確認・更新できます。

### 7.2 権限モード（公式 docs）

- `default`: 標準
- `acceptEdits`: 編集系を自動受理（Bash等は別）
- `plan`: 解析専用（変更/コマンド実行なし）
- `dontAsk`: 未許可ツールを自動拒否
- `bypassPermissions`: 全確認スキップ（隔離環境限定）

### 7.3 権限ルールの書き方

形式:

- `Tool`
- `Tool(specifier)`

例:

```json
{
  "permissions": {
    "allow": [
      "Bash(git diff *)",
      "Bash(npm run test *)"
    ],
    "ask": [
      "Bash(git push *)"
    ],
    "deny": [
      "WebFetch",
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./secrets/**)"
    ]
  }
}
```

重要ポイント:

- 評価順序は `deny -> ask -> allow`
- Bash ルールはワイルドカード指定できるが、URL制約などは脆い（回避パターンあり）
- 機密ファイルの除外は `permissions.deny` を使う（`ignorePatterns` は deprecated）

## 8. Sandboxing（Bash の OS レベル隔離）

Claude Code は Bash ツール向けにネイティブ sandboxing を提供します（macOS / Linux / WSL2）。

### 8.1 何を守るか

- ファイルシステム境界
- ネットワーク境界
- Bash 子プロセスにも制約継承

### 8.2 Linux / WSL2 前提

公式 docs では Linux/WSL2 で `bubblewrap` と `socat` を前提とします。

```bash
sudo apt-get install bubblewrap socat
```

### 8.3 使い方と注意

- `/sandbox` で有効化・モード選択
- Auto-allow sandbox mode では、sandbox 内で安全と判断された Bash は承認なしで流せる
- ただしサンドボックス外実行の escape hatch（再試行）挙動があり、必要時は通常権限フローに戻る
- `allowUnsandboxedCommands: false` で escape hatch を抑制可能

補足:

- WSL1 は非対応（WSL2 は bubblewrap ベースで対応）
- `docker` / `watchman` など相性の悪いコマンドは調整が必要

## 9. 設定（settings.json）と優先順位

### 9.1 設定ファイルの場所

代表的な設定レイヤ:

- ユーザ: `~/.claude/settings.json`
- 共有プロジェクト: `.claude/settings.json`
- ローカルプロジェクト: `.claude/settings.local.json`（git ignore対象）
- 管理設定（組織）: managed settings（上位レイヤ）

### 9.2 優先順位（高→低）

公式 docs 要点:

1. Managed settings
2. CLI引数
3. `.claude/settings.local.json`
4. `.claude/settings.json`
5. `~/.claude/settings.json`

### 9.3 よく使う設定キー（抜粋）

- `permissions.allow/ask/deny`
- `permissions.additionalDirectories`
- `permissions.defaultMode`
- `model`
- `effortLevel`
- `autoUpdatesChannel`
- `hooks`
- `enabledPlugins`

`/config` と `/status` を使うと、実際にどの設定ソースが有効か確認しやすいです。

## 10. Memory / `CLAUDE.md` / `.claude/rules/`

Claude Code は永続的な指示・知識を持たせる仕組みが強いです。

### 10.1 メモリの種類（公式 docs）

大きく2系統:

- Auto memory（Claude が自動で書く学習メモ）
- `CLAUDE.md` 系（人が書くルール/指示）

代表ロケーション:

- `~/.claude/CLAUDE.md`（ユーザ共通）
- `./CLAUDE.md` or `./.claude/CLAUDE.md`（プロジェクト共有）
- `./CLAUDE.local.md`（個人用・ローカル）
- `./.claude/rules/*.md`（分割ルール）
- `~/.claude/projects/<project>/memory/`（auto memory）

### 10.2 `CLAUDE.md` の実務的な書き方

入れるべきもの:

- ビルド/テスト/lint コマンド
- その repo 固有のコーディング規約
- レビュー/PR 運用ルール
- 非自明な落とし穴

入れすぎない方がいいもの:

- Claude がコードを読めば分かる情報
- 長大なAPI仕様書（リンク参照にする）
- 頻繁に変わる情報

### 10.3 `@import` と modular rules

`CLAUDE.md` では `@path` 形式で別ファイルを読み込めます。

```md
See @README.md for project overview.
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

`.claude/rules/` では Markdown を分割配置でき、YAML frontmatter の `paths` でパス限定ルールも可能です。

## 11. モデル設定（Model configuration）

### 11.1 よく使うエイリアス

公式 docs にある主要エイリアス:

- `default`
- `sonnet`
- `opus`
- `haiku`
- `sonnet[1m]`（長文脈）
- `opusplan`（Plan時Opus / 実行時Sonnet）

### 11.2 切り替え方法

- セッション中: `/model`
- 起動時: `claude --model <alias|name>`
- 環境変数: `ANTHROPIC_MODEL`
- settings: `"model": "opus"` など

### 11.3 effort / 長文脈

- `effortLevel`: `low|medium|high`（対応モデルで有効）
- 1M context は対応モデル/契約で利用可能
- 長文脈課金・制限は通常利用と別条件になりうるので docs と pricing を確認

## 12. MCP（Model Context Protocol）

Claude Code の拡張性の中心です。外部API/DB/SaaS/自作ツールを「ツール化」できます。

### 12.1 何ができるか

公式 examples ベースの用途:

- GitHub/Jira/Sentry/Slack/Figma 等の横断操作
- DB問い合わせ
- 監視データ確認
- Gmail draft 作成などの業務自動化

### 12.2 サーバ追加（CLI）

HTTP / SSE / stdio があり、現在 docs は remote は HTTP 推奨、SSE は deprecated 表記あり。

```bash
# HTTP
claude mcp add --transport http notion https://mcp.notion.com/mcp

# stdio（ローカル）
claude mcp add --transport stdio --env AIRTABLE_API_KEY=... airtable \
  -- npx -y airtable-mcp-server
```

管理コマンド:

```bash
claude mcp list
claude mcp get <name>
claude mcp remove <name>
claude mcp reset-project-choices
```

### 12.3 スコープ（重要）

公式 docs のスコープ:

- `local`（既定、個人・現プロジェクトのみ）
- `project`（`.mcp.json` に保存、チーム共有）
- `user`（ユーザ全体）

注意:

- `project` スコープの `.mcp.json` はチーム共有しやすい
- 初回利用時は承認（approval choices）が入り、`reset-project-choices` でリセット可能

### 12.4 MCP resources / prompts / Claude Code を MCP server として使う

- `@server:protocol://...` 形式で MCP resources 参照可能
- MCP server が提供する prompt は `/mcp__<server>__<prompt>` 形式で呼べる
- `claude mcp serve` で Claude Code 自体を MCP server として公開可能

## 13. Hooks（自動フック）

Hooks は Claude Code ライフサイクルの特定イベントで shell command / prompt / agent を自動実行できます。

### 13.1 主なイベント（公式 hooks reference）

例:

- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PermissionRequest`
- `PostToolUse`
- `PostToolUseFailure`
- `Stop` / `SubagentStop` 系

### 13.2 実務で使いやすい用途

- 危険コマンドのブロック（`rm -rf` 等）
- 編集後の lint / formatter 自動実行
- 停止前の未完了タスク検査
- 監査ログ出力

### 13.3 Hook 実装の要点

- stdin で JSON を受け取る
- exit code と stdout/stderr で結果を返す
- `PreToolUse` は `hookSpecificOutput.permissionDecision` を返す形式（旧 top-level 形式は deprecated）
- `exit 2` はイベントごとに「ブロック」扱い

簡易イメージ:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

## 14. Subagents（カスタムサブエージェント）

Claude Code は用途別サブエージェントを定義できます（レビュー専用、調査専用など）。

### 14.1 スコープと優先順位（公式 docs）

高優先度→低優先度:

1. `--agents`（CLI JSON, セッション限定）
2. `.claude/agents/`（プロジェクト共有）
3. `~/.claude/agents/`（ユーザ共通）
4. Plugin 内 `agents/`

### 14.2 サブエージェント定義（Markdown + YAML frontmatter）

```md
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---
You are a code reviewer...
```

代表フィールド（公式 docs）:

- `name`, `description`（必須）
- `tools`, `disallowedTools`
- `model`
- `permissionMode`
- `maxTurns`
- `skills`
- `mcpServers`
- `hooks`
- `memory`
- `background`
- `isolation`（`worktree` など）

## 15. Plugins / Skills（拡張の考え方）

Claude Code には Plugins と Skills の両方があります。

- Skills: プロンプト/手順の再利用（`/xxx` 的に呼ぶ）
- Plugins: より広い配布単位。MCP server や subagent を同梱できる

運用の目安:

- チーム運用ルールや定型レビュープロンプト → Skills
- ツール連携・配布・構成をまとめたい → Plugins

## 16. CI / 自動化（GitHub Actions）

Claude Code GitHub Actions により、PR/Issue コメントや定期実行で Claude を使えます。

### 16.1 できること（公式 docs）

- `@claude` メンションで PR/Issue 対応
- 自動レビュー / 実装 / 修正
- `CLAUDE.md` を参照したプロジェクト規約準拠

### 16.2 セットアップ要点

- CLI から `/install-github-app` による quick setup（条件あり）
- 手動セットアップ:
  - Claude GitHub App を導入
  - `ANTHROPIC_API_KEY` を GitHub Secrets に設定
  - workflow を `.github/workflows/` に配置

### 16.3 運用注意

- APIキーを workflow に直書きしない（必ず Secrets）
- Action 権限は最小化
- Claude の提案をレビューしてからマージ
- ランナーコスト（GitHub minutes）＋ APIコストを意識

## 17. ベストプラクティス（要約）

公式 `Best practices` と実務観点を統合した要点です。

### 17.1 成果物の品質を上げるコツ

- 検証方法を与える（テスト/スクショ/期待出力）
- 「探索→計画→実装」を分離（複雑タスクで特に有効）
- 具体的なファイルと制約を提示
- `@` / 画像 / ログ / URL で文脈を豊かにする

### 17.2 セッション運用

- 長セッションは `/compact` で圧縮
- `/status` と status line でコンテキスト/状態を把握
- 早めに軌道修正する（間違った方向の自律を放置しない）
- 調査専用 subagent を作ると大規模コードベースで安定

### 17.3 安全運用

- `permissions.deny` で secrets を不可視化
- `bypassPermissions` は隔離環境のみ
- sandboxing + permissions を併用（多層防御）
- 未検証の third-party MCP server は慎重に扱う

## 18. まず覚えるコマンド集（実用ショートリスト）

```bash
# 起動・継続
claude
claude -c
claude -r

# 非対話
claude -p "summarize this repo"
claude -p "review staged changes" --output-format json

# メンテナンス
claude --version
claude doctor
claude update

# 認証
claude auth login
claude auth status --text
claude auth logout

# MCP
claude mcp list
claude mcp get <name>
claude mcp add --transport http <name> <url>

# インストール方式移行/確認（環境に応じて）
claude install
```

## 19. この環境での確認結果（ローカル実機）

2026-02-25 にこの環境で確認:

- OS: Ubuntu 24.04 (WSL2)
- `claude` 導入方式: native
- `claude --version`: `2.1.56 (Claude Code)`
- `claude doctor`: native install / auto-updates enabled を確認
- 初回起動画面（テーマ選択）まで到達確認済み

## 20. 参考リンク（公式）

主要:

- Overview: https://code.claude.com/docs/en/overview
- Set up Claude Code: https://code.claude.com/docs/en/getting-started
- Quickstart: https://code.claude.com/docs/en/quickstart
- Common workflows: https://code.claude.com/docs/en/tutorials
- Best practices: https://code.claude.com/docs/en/best-practices

CLI / 設定 / 安全性:

- CLI reference: https://code.claude.com/docs/en/cli-reference
- Interactive mode: https://code.claude.com/docs/en/interactive-mode
- Settings: https://code.claude.com/docs/en/settings
- Permissions: https://code.claude.com/docs/en/permissions
- Sandboxing: https://code.claude.com/docs/en/sandboxing
- Model configuration: https://code.claude.com/docs/en/model-config
- Security: https://code.claude.com/docs/en/security

拡張:

- Memory management: https://code.claude.com/docs/en/memory
- Hooks reference: https://code.claude.com/docs/en/hooks
- Hooks guide: https://code.claude.com/docs/en/hooks-guide
- Subagents: https://code.claude.com/docs/en/sub-agents
- MCP: https://code.claude.com/docs/en/mcp

自動化 / 連携:

- Claude Code GitHub Actions: https://code.claude.com/docs/en/github-actions
- Headless / programmatic CLI (`-p`) docs: https://code.claude.com/docs/en/headless

---

### 調査メモ（作成方針）

- 仕様は変更が早いため、実運用前に `claude --help` と公式 docs を再確認すること
- 特に CLI フラグ・Slash Commands・モデル名・ベータ機能はバージョン差分が出やすい
