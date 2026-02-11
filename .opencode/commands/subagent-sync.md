---
description: Tier/registryからプロファイル設定を再生成する
agent: build
---

Load `subagent-profile-manager` skill and run `node profiles/generate-configs.mjs`.

Then report:
- changed generated files
- next `switch-profile.sh` command
