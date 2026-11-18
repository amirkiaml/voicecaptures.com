#!/usr/bin/env python3
"""Stamp each long-cached first-party script's content hash into every page.

These files are served with a long max-age, so a browser will happily keep an
old copy beside freshly deployed HTML. That is not theoretical: it shipped
once, and the panel the hero was supposed to replace came back on a visitor's
screen while the markup around it was new.

attr.js is stamped for the same reason and a sharper one: a stale copy would
go on writing the old parameter names into links while the pages around it,
and the self-serve side reading them, had moved on.

Run it after any change to one of them. build.py calls it, so a normal build
is already covered.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
ASSETS = ("talk.js", "attr.js")


def _pattern(asset: str) -> re.Pattern:
    return re.compile(r'(src="[^"]*' + re.escape(asset) + r')(\?v=[0-9a-f]+)?(")')


def stamp(asset: pathlib.Path, pages) -> int:
    if not asset.exists():
        sys.exit(f"{asset} is missing; nothing to stamp.")
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:8]
    pattern = _pattern(asset.name)
    touched = 0
    for page in pages:
        src = page.read_text(encoding="utf-8")
        out, n = pattern.subn(lambda m: f"{m.group(1)}?v={digest}{m.group(3)}", src)
        if n and out != src:
            page.write_text(out, encoding="utf-8")
            touched += 1
    return touched


if __name__ == "__main__":
    pages = sorted(ROOT.glob("**/*.html"))
    pages = [p for p in pages if "node_modules" not in p.parts]
    for asset in ASSETS:
        n = stamp(ROOT / asset, pages)
        print(f"stamp: {asset} hash written into {n} page(s)")
