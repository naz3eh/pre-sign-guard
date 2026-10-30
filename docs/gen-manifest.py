#!/usr/bin/env python3
"""Regenerate the MANIFEST block embedded in index.html.

Lists every Markdown file GitHub Pages serves raw, so the site can fetch and
render them without a build step. Run after adding/moving .md files.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

SKIP = {"node_modules", ".git", ".github"}


def collect() -> list[str]:
    files = []
    for p in sorted(ROOT.rglob("*.md")):
        rel = p.relative_to(ROOT).as_posix()
        if any(part in SKIP for part in rel.split("/")):
            continue
        files.append(rel)
    return files


def main() -> int:
    files = collect()
    manifest = json.dumps(files, indent=2)
    html = INDEX.read_text()
    new, n = re.subn(
        r"(const MANIFEST = )\[[\s\S]*?\];",
        lambda m: m.group(1) + manifest + ";",
        html,
        count=1,
    )
    if n != 1:
        print("MANIFEST block not found in index.html", file=sys.stderr)
        return 1
    if new != html:
        INDEX.write_text(new)
        print(f"updated manifest: {len(files)} files")
    else:
        print(f"manifest already current: {len(files)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
