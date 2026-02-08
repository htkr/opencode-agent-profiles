# oh-my-opencode ガイド

OpenCodeに「エージェント運用の既定値」を付与するプラグインです。複数エージェントの分担、フック、MCP、LSPを前提に“使い始めから強い”構成で動きます。

---

## 第1部: クイックスタート

### 1. OpenCodeの確認
```bash
opencode --version
```

### 2. oh-my-opencode の導入
```bash
npx oh-my-opencode install
```

### 3. 起動
```bash
opencode
```

### 4. プロバイダ認証
OpenAI/Geminiを使う場合は認証が必要です。
```bash
opencode auth login
```

Geminiは `Google → OAuth with Antigravity` を選択します。

### 5. まず覚える使い方
**Ultrawork（即実行モード）**
```
ulw 既存のAPIにrate limitを入れて
```

**Prometheus（計画モード）**
1. `Tab` でPrometheusへ
2. インタビューに答える
3. `/start-work` で計画実行

### 6. エージェントを明示的に呼ぶ
```
@oracle この設計のリスクを洗い出して
@librarian 公式ドキュメントの該当箇所を調べて
@explore このリポジトリで認証実装がある場所を探して
```

---

## 第2部: 詳細説明（思想と概念）

### 1. 何が変わるのか
oh-my-opencodeはOpenCodeを「複数エージェント前提の作業環境」に変えます。単一モデルに頑張らせるのではなく、探索・調査・設計・実装・検証を並列で進めるための“編成”が最初から整っています。

### 2. 基本概念（役割分担）
**Sisyphus**が統括、**Prometheus**が計画、**Oracle/Librarian/Explore**が調査・検証を担当します。

| エージェント | 役割 | 特徴 |
|-------------|------|------|
| Sisyphus | 主担当 | 進行管理と実装の総指揮 |
| Prometheus | 計画担当 | インタビューで要件を詰める |
| Oracle | 設計/レビュー | 読み取り専用で論理検証 |
| Librarian | 文献/実装調査 | 公的ドキュメント参照 |
| Explore | 高速探索 | リポジトリ探索とgrep |

### 3. 2つの作業モード
**Ultrawork**: 速さ優先で自動的に探索→実装→確認まで進めます。`ultrawork`/`ulw` を含めるだけで起動。

**Prometheus**: 重要タスク向け。計画を立てた上で `/start-work` で実行します。

**重要**: Prometheusで計画を作ったら必ず `/start-work` で実行します。`atlas`単独の起動は推奨されません。

### 4. 設定ファイルの階層
設定はユーザー単位とプロジェクト単位があり、プロジェクト側が優先です。

| 種別 | パス |
|------|------|
| プロジェクト | `.opencode/oh-my-opencode.json` / `.opencode/oh-my-opencode.jsonc` |
| ユーザー | `~/.config/opencode/oh-my-opencode.json` / `~/.config/opencode/oh-my-opencode.jsonc` |

JSONC（コメント/末尾カンマ）に対応しています。

### 5. モデル設定の考え方
基本は“自動決定”です。導入時のインストーラが利用可能なプロバイダを聞き、最適な割当を生成します。必要なら特定のエージェントだけ上書きします。

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "agents": {
    "oracle": { "model": "openai/gpt-5.2" },
    "librarian": { "model": "zai-coding-plan/glm-4.7" },
    "explore": { "model": "opencode/gpt-5-nano" }
  }
}
```

利用可能なモデル一覧は `opencode models` で確認します。

### 6. フックと自動化
フックはOpenCodeのイベントに割り込んで、作業継続・コンテキスト管理・コメント抑制などを自動化します。必要なものだけ無効化できます。

```json
{
  "disabled_hooks": ["comment-checker"]
}
```

### 7. MCPと外部知識
Exa / Context7 / grep.app のMCPがデフォルトで有効です。公的ドキュメントや公開コードの探索が簡単になります。

```json
{
  "disabled_mcps": ["websearch", "context7", "grep_app"]
}
```

### 8. LSPとリファクタリング
OpenCodeのLSPを拡張し、リファクタ向けのツールが使えます。`lsp`設定でサーバー追加・優先度指定が可能です。

```json
{
  "lsp": {
    "typescript-language-server": {
      "command": ["typescript-language-server", "--stdio"],
      "extensions": [".ts", ".tsx"],
      "priority": 10
    }
  }
}
```

### 9. よく使うコマンド
| 操作 | コマンド |
|------|----------|
| 相談/設計 | `@oracle ...` |
| 調査 | `@librarian ...` |
| 探索 | `@explore ...` |
| 計画 | `Tab` → Prometheus |
| 実行 | `/start-work` |
| 診断 | `npx oh-my-opencode doctor --verbose` |

---

## 導入後の確認
```bash
opencode --version
cat ~/.config/opencode/opencode.json
```

`opencode.json` の `plugin` に `oh-my-opencode` が入っていれば導入成功です。

---

## 参考リンク
- https://github.com/code-yeongyu/oh-my-opencode
- https://ohmyopencode.com/installation/
- https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/guide/overview.md
- https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/configurations.md
- https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/features.md
