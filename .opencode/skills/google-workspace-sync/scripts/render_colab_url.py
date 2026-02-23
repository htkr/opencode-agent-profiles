#!/usr/bin/env python3
import argparse
import urllib.parse


def main() -> int:
    p = argparse.ArgumentParser(description="Render Google Colab URL for a GitHub-hosted notebook")
    p.add_argument("--repo", required=True, help="owner/repo")
    p.add_argument("--path", required=True, help="path/to/notebook.ipynb")
    p.add_argument("--ref", default="main", help="branch/tag/sha (default: main)")
    args = p.parse_args()

    repo = args.repo.strip().strip("/")
    path = args.path.lstrip("/")
    ref = args.ref.strip()

    if repo.count("/") != 1:
        raise SystemExit("--repo must be in owner/repo format")
    if not path.endswith(".ipynb"):
        raise SystemExit("--path must end with .ipynb")

    owner, name = repo.split("/", 1)
    encoded_path = "/".join(urllib.parse.quote(part) for part in path.split("/"))
    encoded_ref = urllib.parse.quote(ref, safe="")
    print(f"https://colab.research.google.com/github/{owner}/{name}/blob/{encoded_ref}/{encoded_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
