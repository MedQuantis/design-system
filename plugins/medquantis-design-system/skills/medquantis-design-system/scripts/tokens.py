#!/usr/bin/env python3
"""Look up MedQuantis design tokens by name or value.

Usage: python3 tokens.py [--medium document|app] [--all] [QUERY]

QUERY matches part of a token name (accent, chart, radius) or a value (#0a2463, 6px).
Without a query, every token usable in the medium is listed. Core and deprecated tokens are
hidden unless --all is given; --medium document hides the status colours (apps only, ADR-0004).
"""

import argparse
import json
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "assets" / "tokens.json"


def is_status(token):
    path = token.get("path", [])
    return len(path) > 2 and path[0] == "semantic" and (path[2] == "status" or path[2] in ("warning-fill", "warning-tint"))


def main(argv):
    parser = argparse.ArgumentParser(description="Look up MedQuantis design tokens.")
    parser.add_argument("query", nargs="?", default="")
    parser.add_argument("--medium", choices=("document", "app"), default="app", help="document hides the status colours")
    parser.add_argument("--all", action="store_true", help="include core and deprecated tokens")
    args = parser.parse_args(argv)
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    query = args.query.lower().replace(" ", "")
    rows = []
    for name, token in tokens.items():
        value = str(token.get("value", ""))
        if not args.all and (name.startswith("--mq-core-") or token.get("deprecated")):
            continue
        if args.medium == "document" and is_status(token):
            continue
        if query and query not in name.lower() and query not in value.lower().replace(" ", ""):
            continue
        rows.append((name, value, token.get("deprecated") and f"Deprecated: {token['deprecated']}" or token.get("description", "")))
    if not rows:
        print(f"no token matches {args.query!r}", file=sys.stderr)
        return 1
    width = max(len(name) for name, _, _ in rows)
    for name, value, description in rows:
        print(f"{name.ljust(width)}  {value}  {description}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
