# Keybind Collision Table (zellij vs opencode)

## Policy
- Change zellij only.
- Use a global prefix: `Ctrl+A`.
- Keep opencode high-frequency keys unchanged.
- Return to `locked` mode after prefix actions.

## Confirmed Conflicts Before Migration

| Key | zellij | opencode | Impact | Resolution |
|---|---|---|---|---|
| `Ctrl+T` | tab mode (`~/.config/zellij/config.kdl:172`) | `variant_cycle` | High | Remove zellij single-key bind, use prefix flow |
| `Ctrl+P` | pane mode (`~/.config/zellij/config.kdl:175`) | `command_list` | High | Remove zellij single-key bind, use prefix flow |
| `Ctrl+B` | tmux mode (`~/.config/zellij/config.kdl:166`) | `input_move_left` | Medium | Move zellij entry key to `Ctrl+A` |
| `Ctrl+G` | lock toggle (`~/.config/zellij/config.kdl:147`) | `messages_first` | Medium | Remove global bind, map under prefix |
| `Alt+Left` | focus/tab left (`~/.config/zellij/config.kdl:137`) | `input_word_backward` | Medium | Remove zellij global Alt bind |
| `Alt+Right` | focus/tab right (`~/.config/zellij/config.kdl:140`) | `input_word_forward` | Medium | Remove zellij global Alt bind |
| `Alt+F` | floating toggle (`~/.config/zellij/config.kdl:146`) | `input_word_forward` | Low-Med | Remove global bind, map under prefix |

## Target Prefix Map (zellij)

- Entry: `Ctrl+A` -> switch to `tmux` mode.
- In `tmux` mode:
  - `p`: pane mode
  - `t`: tab mode
  - `r`: resize mode
  - `m`: move mode
  - `s`: scroll mode
  - `o`: session mode
  - `f`: toggle floating panes and return `locked`
  - `g`: return `locked`
  - `Enter` / `Esc`: return `locked`

## Mode Strategy

- Enable `Ctrl+A` in shared bindings that exclude `locked` and current temporary modes.
- Remove global single-key `Ctrl`/`Alt` mode switches where possible.
- Use `locked` as the default return mode to prioritize app input.

## Verification Checklist

- opencode shortcuts work:
  - `Ctrl+P`, `Ctrl+T`, `Ctrl+B`, `Ctrl+G`
  - `Alt+Left`, `Alt+Right`, `Alt+F`
- zellij prefix flow works:
  - `Ctrl+A` entry
  - tmux-mode dispatch keys (`p/t/r/m/s/o/f/g`)
- zellij status bar shows updated key guide after reload/restart.

## Final Applied Settings (2026-02-21)

### Goal
- Keep opencode high-frequency keybinds unchanged.
- Route zellij operations through a single prefix flow.
- Use `locked` as the return mode after zellij operations.

### Prefix Entry
- `Ctrl+A` is the zellij entry key.
- Effective behavior:
  - From `locked`: `Ctrl+A` -> `normal`
  - From shared contexts (excluding temporary input/search/tmux contexts): `Ctrl+A` -> `normal`

### Normal-Mode Dispatch (Prefix After-Key Map)
- In `normal` mode:
  - `p` -> `pane`
  - `t` -> `tab`
  - `r` -> `resize`
  - `m` -> `move`
  - `s` -> `scroll`
  - `o` -> `session`
  - `f` -> toggle floating panes, then return `locked`
  - `g` -> return `locked`
  - `Enter` -> return `locked`
  - `Esc` -> return `locked`

### Global Bind Cleanup (zellij)
- Removed/neutralized global single-key mode switches that conflicted with opencode, including:
  - `Ctrl+b`, `Ctrl+p`, `Ctrl+t`, `Ctrl+g` (global conflict set)
  - `Alt+Left`, `Alt+Right`, `Alt+f` (Alt conflict set)
- Kept `Ctrl+q` as global quit in zellij.

### Notes
- Status-bar guide behavior now follows the updated mode transitions as expected in user verification.
- If guide desync appears again, restart the zellij session and re-check mode transitions first.
