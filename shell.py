#!/usr/bin/env python3
"""Build the standalone pages' shell FROM index.html, so it cannot drift.

The eight standalone pages (pricing, demo, contact, win-back, about, careers,
privacy, terms) used to carry their own 900-line copy of the header, the footer
and the stylesheet. Two copies of a nav is two navs to change, and the one
nobody remembers is the one that goes stale — the same reason pricing_data.py
reads the tiers out of index.html rather than restating them.

So the shell is assembled here, at build time, out of index.html's own
stylesheet, header, footer and nav/search script. Change the nav once, on the
home page, and every page follows.

The page bodies predate the redesign and are written against the OLD
stylesheet's class names (.doc, .grid, .card, …). Rather than re-authoring
eight pages of markup, that stylesheet is carried too, scoped under .ported,
exactly as index.html carries the ported sections. {body} is wrapped in that
class. When a page is eventually rewritten in the new system, it moves out of
the wrapper and the old rules it was the last user of can go.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "index.html"

# index.html's script blocks, in order. Only the nav/search one belongs on a
# standalone page: the others drive the timeline, the home contact form and the
# per-vertical sections, none of which exist here.
NAV_SCRIPT_MARKER = 'var header = document.querySelector("header");'

DROP_SELECTOR = re.compile(r"^(:root|\*|html|body|@font-face)")


def _scope(css: str, prefix: str) -> str:
    """Prefix every selector, recursing into @media/@supports.

    Rules that style the document itself (:root, html, body, *) are dropped:
    under a prefix they would be meaningless, and left alone they would fight
    the shell's own.
    """
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        brace = css.find("{", i)
        if brace == -1:
            break
        head = css[i:brace].strip()
        depth, j = 0, brace
        while j < n:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        body = css[brace + 1 : j]
        if head.startswith("@"):
            at = head.split()[0]
            inner = _scope(body, prefix) if at in ("@media", "@supports", "@layer") else body
            out.append(f"{head}{{{inner}}}")
        else:
            sels = []
            drop = False
            for one in head.split(","):
                t = one.strip()
                if not t:
                    continue
                if DROP_SELECTOR.match(t):
                    drop = True
                    break
                sels.append(f"{prefix} {t}")
            if not drop and sels:
                out.append(", ".join(sels) + "{" + body + "}")
        i = j + 1
    return "\n".join(out)


def _between(src: str, start: str, end: str) -> str:
    a = src.index(start)
    b = src.index(end, a) + len(end)
    return src[a:b]


def parts() -> dict:
    """The pieces of index.html a standalone page needs."""
    if not SRC.exists():
        sys.exit("index.html not found — run this from the site repo root.")
    src = SRC.read_text(encoding="utf-8")

    style = _between(src, "<style>", "</style>")
    style = style[len("<style>") : -len("</style>")]

    header = _between(src, "<header>", "</header>")
    footer = _between(src, "<footer>", "</footer>")

    # the nav + search script, found by its own first line rather than by index
    blocks = re.findall(r"<script>(.*?)</script>", src, flags=re.S)
    nav = [b for b in blocks if NAV_SCRIPT_MARKER in b]
    if len(nav) != 1:
        sys.exit(f"expected exactly one nav script in index.html, found {len(nav)}")

    talk = re.search(r'<script type="module" src="/talk\.js[^"]*"></script>', src)
    if not talk:
        sys.exit("index.html does not load talk.js — the shell would ship without Speak.")

    return {
        "style": style,
        "header": header,
        "footer": footer,
        "nav_script": nav[0],
        "talk": talk.group(0),
    }


HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<meta name="description" content="@@DESC@@">
<meta name="theme-color" content="#FFFFFF">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://voicecaptures.com/@@SLUG@@/">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VoiceCaptures">
<meta property="og:url" content="https://voicecaptures.com/@@SLUG@@/">
<meta property="og:title" content="@@TITLE@@">
<meta property="og:description" content="@@DESC@@">
<meta property="og:image" content="https://voicecaptures.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="@@TITLE@@">
<meta name="twitter:description" content="@@DESC@@">
<meta name="twitter:image" content="https://voicecaptures.com/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
<style>
"""


def build(old_css: str) -> str:
    """The SHELL template, with {title}, {desc}, {slug}, {body} and {script}.

    `old_css` is the previous shell's stylesheet; it is scoped under .ported so
    the existing page bodies keep working unchanged.
    """
    p = parts()
    raw = (
        HEAD
        + p["style"]
        + "\n\n/* ---- the page bodies' own rules, scoped ---------------------------\n"
        "   These come from the shell these pages used before the redesign. Every\n"
        "   selector is machine-prefixed with .ported, so nothing here can reach\n"
        "   the header, the footer or anything written in the new system. */\n"
        + _scope(old_css, ".ported")
        # Last word, because the scoped sheet above sets its own primary: the
        # old one was cyan and this system's is the blue, and a page must not
        # carry two different "main" colours.
        # The old sheet carried *{min-width:0}, which _scope drops as a
        # document-level rule. Without it a grid or flex child refuses to
        # shrink below its content, and /pricing/'s comparison table pushed
        # 104px past a 390px viewport instead of scrolling inside .pr-scroll.
        + "\n.ported *{min-width:0}"
        + "\n.ported .btn-primary{background:var(--blue); border-color:var(--blue); color:#fff}"
        "\n.ported .btn-primary:hover{background:var(--blue-dk); border-color:var(--blue-dk)}"
        + "\n</style>\n</head>\n<body>\n\n"
        + p["header"]
        + "\n\n<div class=\"ported\">\n@@BODY@@\n</div>\n\n"
        + p["footer"]
        + "\n\n<script>"
        + p["nav_script"]
        + "</script>\n@@SCRIPT@@\n"
        + p["talk"]
        + "\n</body>\n</html>\n"
    )
    # str.format() is what fills this template, and the stylesheet is mostly
    # braces. Everything is escaped, then the five real placeholders are put
    # back — rather than asking whoever edits the CSS to remember to double
    # every brace, which is exactly the trap the old shell set.
    raw = raw.replace("{", "{{").replace("}", "}}")
    for token, field in (
        ("@@TITLE@@", "{title}"),
        ("@@DESC@@", "{desc}"),
        ("@@SLUG@@", "{slug}"),
        ("@@BODY@@", "{body}"),
        ("@@SCRIPT@@", "{script}"),
    ):
        raw = raw.replace(token, field)
    return raw


if __name__ == "__main__":
    p = parts()
    print(f"style      {len(p['style']):>7} bytes")
    print(f"header     {len(p['header']):>7} bytes")
    print(f"footer     {len(p['footer']):>7} bytes")
    print(f"nav script {len(p['nav_script']):>7} bytes")
    print(f"talk       {p['talk']}")
