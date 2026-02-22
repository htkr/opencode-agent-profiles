# Dev Admin Sudoers Setup

This setup allows non-interactive sudo for a single audited entry point.

## 1) Install the wrapper

```bash
sudo install -o root -g root -m 0755 scripts/admin/dev-admin /usr/local/sbin/dev-admin
```

## 2) Add sudoers rule

Create `/etc/sudoers.d/dev-admin-htk` via `visudo`:

```bash
sudo visudo -f /etc/sudoers.d/dev-admin-htk
```

Use this content:

```sudoers
User_Alias DEVAGENT = htk
Cmnd_Alias DEVADMIN = /usr/local/sbin/dev-admin *

Defaults!DEVADMIN !requiretty
DEVAGENT ALL=(root) NOPASSWD: DEVADMIN
```

Set strict file permissions:

```bash
sudo chown root:root /etc/sudoers.d/dev-admin-htk
sudo chmod 0440 /etc/sudoers.d/dev-admin-htk
sudo visudo -cf /etc/sudoers.d/dev-admin-htk
```

## 3) Verify non-interactive sudo

```bash
sudo -n /usr/local/sbin/dev-admin help
```

If this passes, an agent can run only through `dev-admin`.

## 4) Example operations

```bash
sudo -n /usr/local/sbin/dev-admin bootstrap-nix-dir htk
sudo -n /usr/local/sbin/dev-admin install-nix
sudo -n /usr/local/sbin/dev-admin repair-nix
sudo -n /usr/local/sbin/dev-admin uninstall-nix
sudo -n /usr/local/sbin/dev-admin reinstall-nix
sudo -n /usr/local/sbin/dev-admin install-devbox
sudo -n /usr/local/sbin/dev-admin apt-install curl git jq
```

## Security notes

- Keep `dev-admin` owned by root and not writable by normal users.
- Avoid `NOPASSWD:ALL`.
- Add new privileged operations by editing `dev-admin`, not by broadening sudoers.
