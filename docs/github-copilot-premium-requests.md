# GitHub Copilot Premium Requests (個人Pro向け)

個人でGitHub Copilot Proを契約しているユーザー向けに、当月のプレミアムリクエスト利用状況をCLIで確認する方法と、bashのエイリアス設定、Copilotの概要、モデルごとのプレミアムリクエスト消費倍率をまとめます。

---

## 1. Copilotの概要とプレミアムリクエスト

- Copilotのやり取りは「リクエスト」としてカウントされます。
- そのうち高度な処理を伴うものは「プレミアムリクエスト」として消費されます。
- プレミアムリクエストのカウンタは **毎月1日 00:00:00 UTC** にリセットされます。
- 有料プランでは、モデルごとの倍率に応じてプレミアムリクエストが消費されます。

参考:
- https://docs.github.com/en/copilot/concepts/billing/copilot-requests

---

## 2. 当月のクオータをCLIで確認する（個人Pro）

個人で契約している場合は、ユーザー向けのBilling APIを使います。

### 前提

- `gh` がインストール済みでログイン済みであること
- Fine-grained PATの場合は **Plan: Read** 権限が必要です

参考:
- https://docs.github.com/en/rest/billing/usage

### 実行コマンド（生の出力）

```bash
gh api \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /users/$(gh api user --jq .login)/settings/billing/premium_request/usage
```

### 当月に絞って確認（year/month指定）

```bash
gh api \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/users/$(gh api user --jq .login)/settings/billing/premium_request/usage?year=$(date +%Y)&month=$(date +%m)"
```

---

## 3. bashのエイリアス設定（copilot-quota）

`~/.bashrc` に以下を追加します。

```bash
alias copilot-quota='gh api -H "X-GitHub-Api-Version: 2022-11-28" "/users/$(gh api user --jq .login)/settings/billing/premium_request/usage?year=$(date +%Y)&month=$(date +%m)"'
```

反映:

```bash
source ~/.bashrc
```

使い方:

```bash
copilot-quota
```

### 使いやすい表示に整形する場合（jq利用）

`jq` が入っている場合は、簡易表示のエイリアスも追加できます。

```bash
alias copilot-quota='gh api -H "X-GitHub-Api-Version: 2022-11-28" "/users/$(gh api user --jq .login)/settings/billing/premium_request/usage?year=$(date +%Y)&month=$(date +%m)" --jq "{timePeriod, usageItems: (.usageItems | map({product, model, grossQuantity, discountQuantity, netQuantity}))}"'
```

---

## 4. モデルごとのプレミアムリクエスト倍率（有料プラン）

以下は **有料プラン向けの倍率** です。Copilot Free向けの倍率は異なります。

| Model | Multiplier (Paid Plans) |
| --- | --- |
| Claude Haiku 4.5 | 0.33 |
| Claude Opus 4.1 | 10 |
| Claude Opus 4.5 | 3 |
| Claude Sonnet 4 | 1 |
| Claude Sonnet 4.5 | 1 |
| Gemini 2.5 Pro | 1 |
| Gemini 3 Flash | 0.33 |
| Gemini 3 Pro | 1 |
| GPT-4.1 | 0 |
| GPT-4o | 0 |
| GPT-5 | 1 |
| GPT-5 mini | 0 |
| GPT-5-Codex | 1 |
| GPT-5.1 | 1 |
| GPT-5.1-Codex | 1 |
| GPT-5.1-Codex-Mini | 0.33 |
| GPT-5.1-Codex-Max | 1 |
| GPT-5.2 | 1 |
| GPT-5.2-Codex | 1 |
| Grok Code Fast 1 | 0.25 |
| Raptor mini | 0 |

参考:
- https://docs.github.com/en/copilot/concepts/billing/copilot-requests#model-multipliers

---

## 5. 追加メモ

- 有料プランの **GPT-5 mini / GPT-4.1 / GPT-4o** は倍率0のため、プレミアムリクエストを消費しません。
- 使っているモデルによって消費が大きく変わります。特に Claude Opus 4.1 は倍率10なので注意が必要です。
- 月次の上限に到達した場合でも、含まれるモデルは利用可能です（ただしレート制限の可能性あり）。

参考:
- https://docs.github.com/en/copilot/concepts/billing/copilot-requests
