#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser(description="Validate .ipynb JSON and optionally check cell headings")
    p.add_argument("path", help="Path to .ipynb")
    p.add_argument("--require-heading", action="append", default=[], help="Heading substring that must appear in some cell source")
    args = p.parse_args()

    path = Path(args.path)
    if not path.exists():
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        return 2

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERROR: invalid JSON: {e}", file=sys.stderr)
        return 3

    if not isinstance(data, dict) or "cells" not in data or not isinstance(data["cells"], list):
        print("ERROR: not a valid notebook structure (missing cells list)", file=sys.stderr)
        return 4

    text_blobs = []
    for cell in data["cells"]:
        src = cell.get("source", [])
        if isinstance(src, list):
            text_blobs.append("".join(str(x) for x in src))
        elif isinstance(src, str):
            text_blobs.append(src)

    missing = []
    merged = "\n".join(text_blobs)
    for heading in args.require_heading:
        if heading not in merged:
            missing.append(heading)

    print(f"OK: {path}")
    print(f"cells: {len(data['cells'])}")
    if missing:
        print("missing headings:")
        for h in missing:
            print(f"- {h}")
        return 5
    if args.require_heading:
        print("required headings: all found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
