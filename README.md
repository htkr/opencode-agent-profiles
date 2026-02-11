# opencode-agent-profiles

Reusable profile set for OpenCode and oh-my-opencode.

## Setup

```bash
git clone https://github.com/htkr/opencode-agent-profiles.git ~/project/opencode-agent-profiles
cd ~/project/opencode-agent-profiles

# Apply profile config files to ~/.config/opencode
node profiles/generate-configs.mjs
profiles/switch-profile.sh ohmy
```

## Symlink docs (shared docs workflow)

Use this when you want `/home/htk/project/test/docs` to always reflect this repository.

```bash
rm -rf /home/htk/project/test/docs
ln -s /home/htk/project/opencode-agent-profiles/docs /home/htk/project/test/docs
```

Verify:

```bash
ls -l /home/htk/project/test
```

Expected output includes:

```text
docs -> /home/htk/project/opencode-agent-profiles/docs
```

## Included

- `profiles/model-tiers.json`: single source of truth for Tier-to-model mapping
- `profiles/subagent-registry.json`: agent role/tier/profile registry
- `profiles/generate-configs.mjs`: regenerates profile configs from Tier and registry
- `profiles/switch-profile.sh`: applies `ohmy` or `vanilla` profile to `~/.config/opencode`
- `profiles/ohmy/*`: generated profile for oh-my-opencode
- `profiles/vanilla/*`: generated profile for OpenCode only
- `docs/*`: shared docs moved from `/home/htk/project/test/docs`

Subagent docs:

- `docs/subagent-management-guide.md`
- `docs/subagent-usage-guide.md`

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
