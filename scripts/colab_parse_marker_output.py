#!/usr/bin/env python3
import argparse
import json
import re
import sys
from typing import Any


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Extract Colab marker JSON from controller output or raw cell logs."
    )
    p.add_argument("--marker", required=True, help="Marker name, e.g. COLAB_SSH_JSON")
    p.add_argument("--text", help="Input text to parse")
    p.add_argument(
        "--file",
        dest="file_path",
        help="Read input text from file (alternative to --text)",
    )
    return p.parse_args()


def extract_from_controller_json(data: Any, marker: str):
    if isinstance(data, dict):
        markers = data.get("markers")
        if isinstance(markers, dict) and marker in markers:
          return markers[marker]
    return None


def extract_from_prefixed_lines(text: str, marker: str):
    pattern = re.compile(rf"^{re.escape(marker)}:\s*(\{{.*\}})\s*$", re.MULTILINE)
    matches = pattern.findall(text)
    if not matches:
        return None
    return json.loads(matches[-1])


def main() -> int:
    args = parse_args()
    if bool(args.text) == bool(args.file_path):
        print("ERROR: specify exactly one of --text or --file", file=sys.stderr)
        return 2

    if args.file_path:
        with open(args.file_path, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        text = args.text or ""

    # Path 1: controller stdout is a JSON envelope.
    obj = None
    stripped = text.strip()
    if stripped:
        try:
            obj = json.loads(stripped)
        except json.JSONDecodeError:
            obj = None

    if obj is not None:
        marker_obj = extract_from_controller_json(obj, args.marker)
        if marker_obj is None:
            print(f"ERROR: marker not found in controller JSON: {args.marker}", file=sys.stderr)
            return 3
        print(json.dumps(marker_obj, ensure_ascii=False))
        return 0

    # Path 2: raw mixed log lines with PREFIX: {json}
    marker_obj = extract_from_prefixed_lines(text, args.marker)
    if marker_obj is None:
        print(f"ERROR: marker not found in text: {args.marker}", file=sys.stderr)
        return 4

    print(json.dumps(marker_obj, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
