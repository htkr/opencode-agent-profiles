# Skills運用手順

この文書は、`.opencode/skills/` 配下のSkillsを安全に追加・更新・削除するための運用手順をまとめる。

## 対象

- 共通: `core-*`
- Kaggle: `kaggle-*`
- ゲーム開発: `game-*`

## 管理の前提

- Source of truthは `skills/manifest/anthropic-skills.lock.json`
- Skill実体は `.opencode/skills/<skill-name>/SKILL.md`
- 検証/ハッシュ更新は `scripts/skills/sync-anthropic-skills.mjs`
- 用途別有効化は `.opencode/agents/*.md` の `permission.skill` で制御

## 追加手順

1. Skillファイルを作成する。
   - 例: `.opencode/skills/kaggle-new-skill/SKILL.md`
2. Frontmatterを設定する。
   - `name` はディレクトリ名と一致させる
   - `description` は短く具体的にする
   - 必要に応じて `disable-model-invocation: true` を付与する
3. `skills/manifest/anthropic-skills.lock.json` の `skills` に1件追加する。
   - `name`, `domain`, `path`, `source_ref` を設定
   - `sha256` は空文字でよい（後で自動更新）
4. 用途別に許可が必要なら、対象エージェントの `permission.skill` を更新する。
   - Kaggle: `.opencode/agents/kaggle-research.md`
   - Game: `.opencode/agents/game-dev-assistant.md`
5. 検証とハッシュ更新を実行する。

```bash
node scripts/skills/sync-anthropic-skills.mjs --write
```

6. プロファイル設定に影響がある変更なら再生成する。

```bash
node profiles/generate-configs.mjs
```

## 更新手順

1. 対象 `SKILL.md` を編集する。
2. `source_ref` が変わる場合はmanifestも更新する。
3. 以下を実行する。

```bash
node scripts/skills/sync-anthropic-skills.mjs --write
```

4. 必要なら以下を実行する。

```bash
node profiles/generate-configs.mjs
```

## 削除手順

1. 対象Skillディレクトリを削除する。
2. `skills/manifest/anthropic-skills.lock.json` から該当エントリを削除する。
3. 関連エージェントの `permission.skill` から不要な許可ルールを削除する。
4. 以下を実行して整合を確認する。

```bash
node scripts/skills/sync-anthropic-skills.mjs --write
```

5. 影響がある場合は以下を実行する。

```bash
node profiles/generate-configs.mjs
```

## 公式更新追従手順（Anthropic docs基準）

1. 参照URLを確認する。
   - `https://code.claude.com/docs/llms.txt`
   - `https://code.claude.com/docs/en/skills.md`
2. 追加/変更が必要なskillを選定する。
3. `SKILL.md` とmanifestを更新する。
4. `node scripts/skills/sync-anthropic-skills.mjs --write` を実行する。
5. 差分レビュー時は次を必ず確認する。
   - Frontmatterの `name` 整合
   - `disable-model-invocation` の妥当性
   - ドメイン境界（`kaggle-*` / `game-*` / `core-*`）
   - エージェントの `permission.skill` ルール

## トラブルシュート

- `name mismatch` が出る
  - `SKILL.md` の `name` とmanifestの `name` を一致させる
- `missing` が出る
  - manifestの `path` が正しいか確認する
- 意図しない自動起動が起きる
  - `description` を具体化する
  - `disable-model-invocation: true` を検討する
