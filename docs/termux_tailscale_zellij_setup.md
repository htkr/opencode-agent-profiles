# Termux + Tailscale + zellij セットアップ手順

## 1) アプリとパッケージを準備する

まず Android に公式 `Tailscale` アプリをインストールします。次に Termux で以下を実行します。

```bash
pkg update
pkg install -y openssh
```

## 2) Android 側で Tailscale を接続する

1. Tailscale アプリを開く
2. WSL と同じアカウントでログインする
3. 状態が `Connected` になることを確認する

ログインに失敗する場合は、AdGuard などの広告/DNS フィルタリングを一時停止して再試行します。

## 3) Termux で SSH 鍵を作成する

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "termux"
cat ~/.ssh/id_ed25519.pub
```

表示された公開鍵をコピーします。

## 4) Android の公開鍵を WSL に登録する

WSL で以下を実行し、`authorized_keys` を準備します。

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

手順 3 でコピーした公開鍵を `~/.ssh/authorized_keys` に 1 行で追記します。

## 5) Termux から zellij セッションへ接続する

```bash
ssh <WSL_USER>@<TAILSCALE_IP_OR_NAME> -t ~/.local/bin/zmain
```

`main` セッションがあれば接続し、なければ新規作成します。

## 6) Termux の `~/.ssh/config` を設定する（推奨）

`~/.ssh/config` を作成して、以下を記述します。

```sshconfig
Host wslmain
  HostName <TAILSCALE_IP_OR_NAME>
  User <WSL_USER>
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
  RequestTTY yes
  RemoteCommand ~/.local/bin/zmain
```

権限を設定します。

```bash
chmod 600 ~/.ssh/config
```

以後は次のコマンドだけで接続できます。

```bash
ssh wslmain
```

この環境の現在値で書く場合の例:

```sshconfig
Host wslmain
  HostName 100.119.94.2
  User htk
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
  RequestTTY yes
  RemoteCommand ~/.local/bin/zmain
```

## 7) 任意: Termux にエイリアスを追加する

`~/.bashrc` に次を追加します。

```bash
alias wslmain='ssh <WSL_USER>@<TAILSCALE_IP_OR_NAME> -t ~/.local/bin/zmain'
```

反映:

```bash
source ~/.bashrc
```

## トラブルシュート: WSL の `apt update` 失敗

`deadsnakes noble Release` エラーが出る場合は、該当ソースを無効化して再実行します。

```bash
sudo mv /etc/apt/sources.list.d/deadsnakes-ubuntu-ppa-noble.sources /etc/apt/sources.list.d/deadsnakes-ubuntu-ppa-noble.sources.disabled
sudo apt update
```

## トラブルシュート: Android で Tailscale ログイン失敗

- `fetch control key` や `context canceled` が出る場合は、AdGuard などのフィルタリングを一時停止する
- Android ブラウザで以下に到達できることを確認する
  - `https://controlplane.tailscale.com/key?v=131`
  - `https://login.tailscale.com`
