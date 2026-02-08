# Neovim ガイド - VSCodeからの移行マニュアル

## 第1部: クイックスタート

### 初回セットアップ
1. **Neovimのインストール確認**
   ```bash
   nvim --version  # v0.9.0以上推奨
   ```

2. **依存関係のインストール（必要に応じて）**
   ```bash
   # Mason（LSP管理）用: Node.js
   npm install -g neovim

   # ripgrep（Telescopeの全文検索）
   sudo apt-get install ripgrep  # Ubuntu/Debian
   # または
   brew install ripgrep          # macOS
   ```

3. **初回起動**
   初回起動時に`lazy.nvim`と各プラグインが自動インストールされます。
   ```bash
   nvim
   ```

### まず覚えるキー
| 操作 | キー | 説明 |
|------|------|------|
| 保存 | `<leader>w` | Space→w |
| 閉じる | `<leader>q` | Space→q |
| 強制終了 | `<leader>Q` | Space→Q |
| ファイル検索 | `<leader>ff` | Telescope find_files |
| 文字列検索 | `<leader>fg` | Telescope live_grep |
| バッファ一覧 | `<leader>fb` | 開いているファイル一覧 |
| コマンドパレット | `<leader>:` | Telescope commands |
| ファイルツリー | `<leader>e` | NvimTree toggle |
| 定義へジャンプ | `gd` | LSP |
| 参照検索 | `gr` | LSP |
| 名前変更 | `<leader>rn` | LSP |
| コードアクション | `<leader>ca` | LSP |
| フォーマット | `<leader>f` | LSP |
| コメント | `gcc` | 行コメント |
| 統合ターミナル | `Ctrl+\` | toggleterm |

### VSCodeとの対応表（最頻出）
| VSCode | Neovim | 説明 |
|--------|--------|------|
| `Ctrl+S` | `<leader>w` | 保存 |
| `Ctrl+W` | `<leader>q` | 閉じる |
| `Ctrl+P` | `<leader>ff` | ファイル検索 |
| `Ctrl+Shift+F` | `<leader>fg` | プロジェクト内検索 |
| `Ctrl+Shift+E` | `<leader>e` | ファイルツリー |
| `Ctrl+Shift+P` | `<leader>:` | コマンドパレット |
| `F12` | `gd` | 定義へジャンプ |
| `Shift+F12` | `gr` | 参照を検索 |
| `F2` | `<leader>rn` | 名前変更 |
| `Ctrl+.` | `<leader>ca` | コードアクション |
| `Shift+Alt+F` | `<leader>f` | フォーマット |
| `Ctrl+/` | `gcc` | 行コメント切替 |
| `Ctrl+\` | `<C-\>` | 統合ターミナル |
| `Ctrl+Space` | `<C-Space>` | 補完トリガー |

### ファイルを新しいタブで開く
Neovimでは「タブ」と「バッファ」が別物です。

**Telescopeでタブ開き**
1. `<leader>ff` でファイル検索
2. `Ctrl+t` で新規タブに開く

**nvim-treeでタブ開き**
1. `<leader>e` でツリーを開く
2. 対象ファイルで `Ctrl+t`

**コマンドで開く**
```vim
:tabnew filename
:tabnew /path/to/file
```

---

## 第2部: 詳細説明（思想と概念）

### 1. Neovimの設計思想
Neovimは「モード」と「テキストオブジェクト」を軸に設計されています。操作は「入力」と「編集」を分離し、少ないキーで高速に編集できます。VSCodeのようなGUI中心の操作と異なり、思考の単位を「動詞 + 対象（テキストオブジェクト）」に置くのが特徴です。

### 2. モードと編集の流れ
| モード | 役割 | 主なキー |
|--------|------|----------|
| ノーマル | 操作の起点 | `Esc` | 
| インサート | 入力 | `i`, `a`, `o` |
| ビジュアル | 範囲選択 | `v`, `V`, `Ctrl+v` |

**ポイント**
- 迷ったら`Esc`でノーマルモードへ戻る
- `j/k`は表示行単位に調整（折り返しでも直感的に移動）

### 3. バッファ・ウィンドウ・タブ
| 概念 | 役割 | VSCode換算 |
|------|------|-----------|
| バッファ | 開いたファイルの実体 | エディタタブに近い概念 |
| ウィンドウ | 画面分割の枠 | エディタ分割 |
| タブ | ウィンドウ集合 | タブグループ |

**この設定のキーバインド**
- バッファ: `<leader>bn/bp/bd/bb`
- ウィンドウ移動: `Ctrl+h/j/k/l`

### 4. Leaderキーと操作の発見性
Leaderは`<Space>`です。どの操作があるかはwhich-keyが可視化します。
`<leader>`を押して待つだけで、機能一覧が表示されます。

### 5. LSPの思想と実装
LSPは「エディタと解析エンジンを分離」する設計です。NeovimはUI/操作を担い、言語サーバーが解析を担います。

**この設定で有効なLSP**
- Python: `pyright`
- Lua: `lua_ls`
- JSON/YAML/Markdown: `jsonls`, `yamlls`, `marksman`

**よく使う操作**
| 操作 | キー |
|------|------|
| 定義へジャンプ | `gd` |
| 参照検索 | `gr` |
| 型定義へジャンプ | `gt` |
| ホバー表示 | `K` |
| シグネチャヘルプ | `Ctrl+k` |
| 名前変更 | `<leader>rn` |
| コードアクション | `<leader>ca` |
| フォーマット | `<leader>f` |
| 診断へ移動 | `[d` / `]d` |

**保存時フォーマット**
LSPがフォーマット対応している場合、保存時に自動整形が走ります。

### 6. 補完とスニペットの流れ
補完は`nvim-cmp`が担当し、LSP/バッファ/パス/スニペットを統合します。

| 操作 | キー |
|------|------|
| 手動補完 | `Ctrl+Space` |
| 確定 | `Enter` |
| 次候補 | `Tab` |
| 前候補 | `Shift+Tab` |
| ドキュメントスクロール | `Ctrl+f` / `Ctrl+b` |

### 7. Telescopeの思想
Telescopeは「曖昧検索と絞り込みの高速化」に特化しています。候補が多いほど威力を発揮し、フィルタリングを前提にした操作体系です。

**主要ピッカー**
| 操作 | キー |
|------|------|
| ファイル検索 | `<leader>ff` |
| 文字列検索 | `<leader>fg` |
| バッファ一覧 | `<leader>fb` |
| 最近ファイル | `<leader>fr` |
| バッファ内検索 | `<leader>f/` |
| Gitブランチ | `<leader>gb` |
| Gitステータス | `<leader>gs` |
| Gitコミット | `<leader>gc` |

### 8. nvim-treeの役割
ファイルツリーは「構造の把握」と「ファイル操作」を担います。Telescopeが探索に強いのに対し、nvim-treeは構造ナビゲーションに向きます。

**主要操作**
| 操作 | キー |
|------|------|
| 開閉 | `<leader>e` |
| フォーカス | `<leader>E` |
| 現在ファイルを表示 | `<leader>o` |
| 垂直分割で開く | `Ctrl+v` |
| 水平分割で開く | `Ctrl+x` |
| タブで開く | `Ctrl+t` |

### 9. Treesitterの思想
構文を正確にパースして、ハイライト/インデント/テキストオブジェクトを提供します。
インクリメンタル選択は`Ctrl+Space`で構文単位に選択範囲を広げられます。

### 10. Git統合（gitsigns）
行単位の差分を把握し、必要な範囲だけを操作できます。

| 操作 | キー |
|------|------|
| 次/前のhunk | `]c` / `[c` |
| Hunk stage/reset | `<leader>hs` / `<leader>hr` |
| Hunk preview | `<leader>hp` |
| Blame表示 | `<leader>hb` |

### 11. 統合ターミナル
`toggleterm`はフロートで表示され、`Ctrl+\`で開閉します。
ターミナル内からは`Esc Esc`でノーマルモードへ戻れます。

### 12. オプションと自動化
- クリップボードはOSと共有（`unnamedplus`）
- Markdownは自動折り返し
- 大きなファイルは自動で負荷軽減

---

## トラブルシューティング
### プラグインがインストールされない
```vim
:Lazy sync
```

### LSPサーバーが動作しない
```vim
:Mason
```

### 設定をリロード
```vim
:source ~/.config/nvim/init.lua
```

---

## 参考リンク
- [Neovim公式ドキュメント](https://neovim.io/doc/)
- [vim-jp（日本語コミュニティ）](https://vim-jp.org/)
- [Lazy.nvimドキュメント](https://github.com/folke/lazy.nvim)
- [Telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)

---

**作成日**: 2026年2月  
**対象環境**: Windows + WSL2 + WezTerm  
**設定場所**: `~/.config/nvim/`
