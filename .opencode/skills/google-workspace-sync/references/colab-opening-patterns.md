# Colab で notebook を開く運用パターン

## GitHub 経路（推奨）
- notebook を GitHub repo に配置して Colab で開く
- 配置後に Open in Colab URL を生成して共有できる
- GitHub を正本にしやすく、変更履歴の追跡が容易

## Colab URL 形式（GitHub）
一般形（ブランチ指定あり）:

```text
https://colab.research.google.com/github/<owner>/<repo>/blob/<ref>/<path/to/notebook.ipynb>
```

例:

```text
https://colab.research.google.com/github/example/my-competition-repo/blob/main/notebooks/SSH.ipynb
```

## Drive 経路（補助）
- Google Drive に notebook を配置し、Colab の Drive タブから開く
- 共同編集や Drive中心運用には向くが、変更履歴・レビューは GitHub に比べて弱い
- GitHub 正本 + Drive は配布コピー、という運用が安全

## 運用注意
- `*.ipynb` は出力セルや実行履歴が差分ノイズになりやすい
- 配置前に JSON 構文検証と必要なら出力クリアを行う
- Colab 上で編集した notebook を戻す場合、GitHub/Drive のどちらを正本にするか先に決める
