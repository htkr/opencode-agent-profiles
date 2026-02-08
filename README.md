# opencode-agent-profiles

Reusable profile set for OpenCode and oh-my-opencode.

## Included

- `profiles/subagent-models.json`: single source of truth for model assignments
- `profiles/generate-configs.mjs`: regenerates profile configs from `subagent-models.json`
- `profiles/switch-profile.sh`: applies `ohmy` or `vanilla` profile to `~/.config/opencode`
- `profiles/ohmy/*`: generated profile for oh-my-opencode
- `profiles/vanilla/*`: generated profile for OpenCode only
- `docs/*`: shared docs moved from `/home/htk/project/test/docs`

## Usage

```bash
node profiles/generate-configs.mjs
profiles/switch-profile.sh ohmy
profiles/switch-profile.sh vanilla
```

If you use the shell helper in `~/.bashrc`, you can run:

```bash
ocm status
ocm
ocm ohmy
ocm vanilla
ocm regen
```
