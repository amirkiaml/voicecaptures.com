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




TYPE_CSS = """
/* ---- one typographic system ---------------------------------------------
   The ported bodies were written against a sheet with its own scale: 15.5px
   copy on a 24px line, h1 at 30px, and a .wrap with NO side padding, which
   put body text hard against the edge of a phone. These bring the whole
   ported layer onto the home page's scale, so a reader cannot tell which
   pages were carried over.

   Anything a later block sets — the pricing cards, the FAQ list — still wins,
   because this comes first. */
.ported .wrap{max-width:var(--rail); padding-left:var(--s6);
  padding-right:var(--s6)}
.ported .wrap.doc, .ported .doc{max-width:760px}

/* The same clamp the home page's h1 uses, so a heading is the same size
   whichever page a phone lands on. */
.ported h1{font-size:clamp(38px,5.4vw,60px); line-height:1.04;
  letter-spacing:normal; margin-bottom:var(--s4)}
.ported h2{font-size:clamp(26px,3.4vw,38px); line-height:1.12;
  letter-spacing:normal}
.ported h3{font-size:19px; line-height:26px; letter-spacing:normal}

.ported p, .ported li{font-size:17px; line-height:27px; color:var(--ink-2)}
.ported .lede{font-size:18px; line-height:28px; color:var(--muted)}
.ported .sub{font-size:17px; line-height:27px; color:var(--muted)}
.ported .fine, .ported .note, .ported small{font-size:13.5px; line-height:20px;
  color:var(--muted)}
.ported .eyebrow{font-size:12.5px; font-weight:800; letter-spacing:.1em;
  text-transform:uppercase; color:var(--wb)}

.ported .doc h2{margin-top:var(--s12); margin-bottom:var(--s4)}
.ported .doc h3{margin-top:var(--s8); margin-bottom:var(--s3)}
.ported .doc p, .ported .doc li{margin-bottom:var(--s4)}
.ported .doc ul, .ported .doc ol{padding-left:22px}
.ported .doc a{color:var(--blue); font-weight:600}

/* Buttons were 15px on a 40px box; the home page's are 16px on a 48px pill. */
.ported .btn{font-size:16px; font-weight:700; min-height:48px;
  border-radius:var(--r-pill); padding:0 22px; display:inline-flex;
  align-items:center; justify-content:center; gap:8px}
.ported .btn-ghost{background:#fff; color:var(--blue);
  border:1px solid color-mix(in srgb, var(--blue) 34%, transparent)}
.ported .btn-ghost:hover{background:var(--f-blue)}
.ported .btn-dark{background:var(--ink); color:#fff; border:1px solid var(--ink)}
@media(max-width:560px){
  .ported .btn{width:100%}
  .ported .btns .btn + .btn{margin-top:var(--s3)}
}
"""

PRICING_CSS = """
/* ---- pricing cards, in the main page's system ------------------------- */
.ported .pr-grid{display:grid; grid-template-columns:1fr; gap:var(--s6);
  margin-top:var(--s8)}
@media(min-width:860px){ .ported .pr-grid{grid-template-columns:repeat(3,1fr)} }
.ported .pr-card{display:flex; flex-direction:column; background:#fff;
  border:1px solid var(--line); border-radius:var(--r-card); padding:var(--s8);
  box-shadow:none}
.ported .pr-card.is-rec{background:var(--f-blue);
  border-color:color-mix(in srgb, var(--blue) 26%, transparent)}
.ported .pr-top{display:flex; align-items:center; gap:var(--s3);
  flex-wrap:wrap; margin-bottom:var(--s3)}
.ported .pr-top h3{font-size:12.5px; font-weight:800; letter-spacing:.1em;
  text-transform:uppercase; color:var(--muted); margin:0}
.ported .pr-top .pop{font-size:11px; font-weight:800; letter-spacing:.06em;
  text-transform:uppercase; color:var(--blue); background:#fff;
  border:1px solid color-mix(in srgb, var(--blue) 30%, transparent);
  border-radius:var(--r-pill); padding:4px 10px}
.ported .pr-price{font-size:46px; line-height:1.05; font-weight:800;
  color:var(--ink); letter-spacing:-.02em; margin:0 0 var(--s2)}
/* "/mo per location" wraps as one piece, rather than leaving "location"
   stranded on its own line under a 46px number. */
.ported .pr-price em{font-size:17px; font-style:normal; font-weight:700;
  color:var(--muted); white-space:nowrap}
.ported .pr-min{font-size:15px; color:var(--ink-2); margin:0 0 var(--s6)}
.ported .pr-feat{list-style:none; margin:0 0 var(--s6); padding:0;
  display:grid; gap:10px}
.ported .pr-feat li{position:relative; margin:0; padding-left:26px;
  font-size:15px; line-height:22px; color:var(--ink-2)}
.ported .pr-feat li::before{content:""; position:absolute; left:2px; top:7px;
  width:12px; height:7px; border-left:2px solid var(--blue);
  border-bottom:2px solid var(--blue); transform:rotate(-45deg)}
.ported .pr-note{font-size:13.5px; line-height:20px; color:var(--muted);
  margin:0 0 var(--s6)}
.ported .pr-card .btn{margin-top:auto; width:100%; justify-content:center}
.ported .pr-sub{text-align:center; font-size:16px; color:var(--muted);
  margin:var(--s2) 0 0}
@media(min-width:860px){ .ported .pr-grid-2{grid-template-columns:repeat(2,1fr);
  max-width:880px; margin-left:auto; margin-right:auto} }
.ported .pr-vnote{margin-top:var(--s6); text-align:center}
.ported .pr-grid + .pr-vnote{text-align:center}
.ported [id^="p-"] > .wrap > h2{text-align:center}

/* ---- the FAQ page ----------------------------------------------------- */
/* The old sheet puts a "+" marker on every summary and a dark translucent
   background on the bare <header> tag. Both are its own site chrome, and both
   land on anything written in that markup, so they are turned off here. */
.ported .faq-list summary::before{content:none}
.ported .faq-top{background:none; position:static; backdrop-filter:none;
  border:0; padding:0}
/* The old sheet gives a bare .pay span a bordered, padded card box. In this
   system .pay is just the serif accent phrase inside a heading. */
.ported .pay{display:inline; border:0; padding:0; border-radius:0;
  background:none; box-shadow:none;
  font-family:'Instrument Serif',Georgia,serif; font-style:italic;
  font-weight:400; letter-spacing:.005em}
.ported .faq-page{padding:var(--s16) var(--s6) var(--s24)}
.ported .faq-top{max-width:720px; margin:0 auto var(--s16); text-align:center}
.ported .faq-top h1{margin:var(--s3) 0 var(--s4)}
.ported .faq-top .lede{margin-left:auto; margin-right:auto}
.ported .faq-g{max-width:760px; margin:0 auto var(--s12)}
.ported .faq-g h2{font-size:14px; font-weight:800; letter-spacing:.1em;
  text-transform:uppercase; color:var(--wb); margin-bottom:var(--s4);
  text-align:left}
.ported .faq-list{border-top:1px solid var(--line)}
.ported .faq-list details{border-bottom:1px solid var(--line)}
.ported .faq-list summary{list-style:none; cursor:pointer; position:relative;
  padding:var(--s4) 40px var(--s4) 0; font-size:17.5px; font-weight:700;
  color:var(--ink); min-height:44px; display:flex; align-items:center}
.ported .faq-list summary::-webkit-details-marker{display:none}
.ported .faq-list summary::after{content:""; position:absolute; right:10px;
  top:50%; width:10px; height:10px; margin-top:-7px;
  border-right:2px solid var(--faint); border-bottom:2px solid var(--faint);
  transform:rotate(45deg); transition:transform .18s ease}
.ported .faq-list details[open] summary::after{transform:rotate(-135deg);
  margin-top:-2px}
.ported .faq-list summary:hover{color:var(--blue)}
.ported .faq-list details p{margin:0 0 var(--s6); padding-right:40px;
  font-size:16px; line-height:26px; color:var(--ink-2)}
.ported .faq-end{max-width:760px; margin:0 auto; background:var(--f-cyan);
  border-radius:var(--r-card); padding:var(--s12) var(--s8); text-align:center}
.ported .faq-end h2{font-size:clamp(24px,3vw,32px); margin-bottom:var(--s3)}
.ported .faq-end p{color:var(--ink-2); max-width:52ch; margin:0 auto}
.ported .faq-cta{display:flex; gap:var(--s3); justify-content:center;
  flex-wrap:wrap; margin-top:var(--s6)}
@media(prefers-reduced-motion:reduce){
  .ported .faq-list summary::after{transition:none}
}
"""

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
        # The pricing cards are written against the NEW tokens, not carried:
        # they are the page people compare prices on, so they match the rest of
        # the site rather than the stylesheet they came from.
        # Typography first, cards after, so the cards' own sizes win.
        + TYPE_CSS
        + PRICING_CSS
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
