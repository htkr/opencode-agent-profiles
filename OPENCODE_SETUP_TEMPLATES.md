# OpenCode Setup Templates (Minimal + Kaggle + Game)

このドキュメントは、これまでの方針をそのまま使える形でまとめたテンプレート集です。

- `minimal` を共通ベースにする
- `kaggle` は調査・実験向けに拡張する
- `game` は最小設定だけ先に入れる
- MCPは重いものを常時ONにしない（必要時ON）
- Skillで検索/抽出手順を明示して、エージェントの迷いを減らす

## 1) 推奨ディレクトリ構成

```text
.
├── AGENTS.md
├── opencode.json
└── .opencode
    ├── skills
    │   ├── kaggle-research
    │   │   └── SKILL.md
    │   ├── kaggle-discussion-harvest
    │   │   └── SKILL.md
    │   └── game-dev-min
    │       └── SKILL.md
    └── agents
        └── kaggle-research.md
```

## 2) `opencode.json` テンプレート

ポイント:

- `serena` と `context7` をベース採用
- 動的ページ取得は `agent-browser`（CLI）を使う
- `tools` で重いMCPをグローバルOFF
- `kaggle-research` サブエージェントでのみ `agent-browser` 実行を許可

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-5.3-codex",
  "default_agent": "build",
  "compaction": {
    "auto": true,
    "prune": true
  },
  "mcp": {
    "serena": {
      "type": "local",
      "command": [
        "uvx",
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server"
      ],
      "enabled": true
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      },
      "enabled": true
    },
    "brave": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@brave/brave-search-mcp-server"
      ],
      "environment": {
        "BRAVE_API_KEY": "{env:BRAVE_API_KEY}"
      },
      "enabled": true
    }
  },
  "tools": {
    "brave_*": false
  },
  "permission": {
    "skill": {
      "*": "allow"
    },
    "task": {
      "*": "allow"
    },
    "bash": {
      "*": "deny",
      "agent-browser *": "allow"
    }
  },
  "agent": {
    "kaggle-research": {
      "description": "Kaggle discussion/solution収集に特化した調査サブエージェント",
      "mode": "subagent",
      "tools": {
        "skill": true,
        "webfetch": true,
        "websearch": true,
        "brave_*": true,
        "context7_*": true,
        "serena_*": false,
        "edit": false,
        "bash": true
      },
      "permission": {
        "edit": "deny",
        "bash": {
          "*": "deny",
          "agent-browser *": "allow"
        }
      }
    }
  }
}
```

`agent-browser` はCLIなので、事前に次を実行します。

```bash
npm install -g agent-browser
agent-browser install
```

## 3) `AGENTS.md` テンプレート（Minimal + Kaggle + Game最小）

```md
# Team Rules (Minimal Base)

## Default Behavior
- Keep responses concise and actionable.
- Prefer reading minimal files needed for the task.
- Avoid destructive commands unless explicitly requested.

## Tool Policy
- Use Serena for symbol-aware code navigation/editing when applicable.
- Use Context7 for up-to-date library docs and version-specific APIs.
- Do not use heavy web MCPs by default unless task requires web discovery.

## Kaggle Mode
- For Kaggle research tasks, prefer `@kaggle-research` subagent.
- Workflow order:
  1. Find candidates via `brave` (`site:kaggle.com ...`).
  2. Extract details via `webfetch` first.
  3. If content is JS-rendered or incomplete, use `agent-browser`.
- Always produce a compact output:
  - top links
  - key ideas
  - leakage/risk notes
  - reproducibility checklist

## Game Mode (Minimal)
- Keep architecture simple and modular.
- Prioritize performance budgets early (fps, memory, load time).
- Avoid large-scale refactors without explicit request.
```

## 4) Skillテンプレート

### 4-1) `.opencode/skills/kaggle-research/SKILL.md`

```md
---
name: kaggle-research
description: Kaggle向けにsolution/discussionを探索し、短く構造化して要約する
compatibility: opencode
metadata:
  domain: kaggle
  style: concise
---

## Goal
Kaggleの過去solution/discussionを効率よく集め、すぐ実験に使える形で返す。

## Use When
- 「過去solutionを調べたい」
- 「discussionの有益なスレを集めたい」
- 「特定コンペで有効だった特徴量/CV戦略を比較したい」

## Procedure
1. `brave` で `site:kaggle.com` 検索し、候補URLを集める。
2. 候補を `webfetch` で本文取得し、重要ポイントを抽出。
3. 取得不足なら `agent-browser`（`bash`）で再取得する。
4. 最後に以下の形式で圧縮して返す。

## Output Format
- Links: 上位5-10件
- Key Patterns: 有効だった手法の共通点
- CV/Leakage Notes: 注意点
- Action Items: 次の実験案3つ
```

### 4-2) `.opencode/skills/kaggle-discussion-harvest/SKILL.md`

```md
---
name: kaggle-discussion-harvest
description: Kaggle discussion本文の取得失敗を減らすためのフォールバック手順
compatibility: opencode
metadata:
  domain: kaggle
  focus: discussion
---

## Goal
Kaggle discussion/codeページで本文が取り切れない場合に、取得品質を上げる。

## Fallback Policy
1. まず `webfetch`。
2. タイトルのみ/本文欠落なら `agent-browser`。
3. それでも難しい場合はURLと取得不能理由を明示して返す。

## Quality Gate
- URLを必ず残す
- 主張の根拠を1行で添える
- 推測と事実を分ける
```

### 4-3) `.opencode/skills/game-dev-min/SKILL.md`

```md
---
name: game-dev-min
description: ゲーム開発タスク向けの最小ルール（暫定版）
compatibility: opencode
metadata:
  domain: game
  maturity: minimal
---

## Goal
ゲーム開発タスクを安全に前進させるための最小運用。

## Rules
- 先に性能目標を確認する（fps, memory, load time）。
- 変更は小さく分割して実施する。
- アセット/シーン変更は影響範囲を明示する。
```

## 5) Kaggle向けサブエージェント（Markdown定義）

`.opencode/agents/kaggle-research.md`

```md
---
description: Kaggleのsolution/discussion収集専用サブエージェント
mode: subagent
tools:
  skill: true
  read: true
  glob: true
  grep: true
  webfetch: true
  websearch: true
  brave_*: true
  edit: false
  bash: true
permission:
  edit: deny
  bash:
    "*": deny
    "agent-browser *": allow
  skill:
    "kaggle-*": allow
    "*": ask
---

You are a Kaggle research specialist.

Always load `kaggle-research` skill first, then follow it.
If discussion body is missing, load `kaggle-discussion-harvest` and execute fallback.
Keep final output compact and evidence-linked.
```

## 6) Profile運用（Minimal / Kaggle / Game）

手軽に切り替えるなら、`opencode.json` を1つに固定し、次の運用にするのが安全です。

- `minimal`:
  - 通常は `build` で作業
  - `brave_*` はグローバルOFFのまま
- `kaggle`:
  - `@kaggle-research` を明示的に使う
  - 本文不足時のみ `agent-browser` を実行
- `game`:
  - まず `game-dev-min` skillのみ適用
  - 詳細ルールは後で増やす

## 7) Skillが読まれない時のチェックリスト

1. `SKILL.md` が大文字になっているか
2. frontmatterに `name` と `description` があるか
3. `name` とフォルダ名が一致しているか
4. `tools.skill` が有効か
5. `permission.skill` が `deny` になっていないか
6. 実行時に `@kaggle-research` を明示しているか

## 8) 実運用の短いプロンプト例

```text
@kaggle-research
house-prices系の過去solution/discussionを調査。
CV戦略、特徴量、リーク注意点を比較して。
本文欠落時はフォールバックして、最後は実験案3つに圧縮して。
```

```text
このタスクではkaggle-research skillを使って。
まずsite:kaggle.comで候補収集して、重要リンクだけ残して。
```

## 9) 補足

- `brave-search-mcp` はBraveブラウザ専用ではなく、検索APIサーバーです。
- `agent-browser` はWeb全体検索ではなく、ページ操作/抽出向きです。
- Kaggle discussion参照は「検索MCP + webfetch + agent-browser」の併用が安定します。
