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


def _decl(style: str, sel: str) -> str:
    """The body of index.html's own `h1{...}` / `h2{...}` rule.

    The ported sheet used to RESTATE the clamp, with a comment claiming it was
    "the same clamp the home page uses". It wasn't: the home page's scale was
    retuned for phones and this copy stayed at the old 38px floor, so every
    subpage kept a heading a size larger than the page it was supposed to
    match. Reading the real rule is the only way that promise holds.
    """
    m = re.search(r"(?:^|\n)" + re.escape(sel) + r"\{([^}]*)\}", style)
    if not m:
        sys.exit(f"index.html has no bare `{sel}{{...}}` rule — the shell cannot match it.")
    return " ".join(m.group(1).split())


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
        "h1_decl": _decl(style, "h1"),
        "h2_decl": _decl(style, "h2"),
    }





BRIDGE_CSS = """
/* ---- token bridge, and the colour that was missing ----------------------
   The carried-over sheet was written against the OLD palette, where the names
   mean different things: --bg was near-black, --text near-white, --bg2 and
   --bg3 were raised dark surfaces. Those names were never redefined for the
   light system, so every ported rule painting with them resolved to NOTHING.
   That is why these pages came out flat white: a card asking for var(--bg2)
   got no colour at all and simply disappeared into the page.

   Mapping them onto the new palette brings the surfaces back AND is what
   makes the tints below possible. */
.ported{
  --bg:#FFFFFF;
  --bg2:var(--bg-soft);
  --bg3:#FFFFFF;
  --text:var(--ink);
  --muted:var(--muted);
  --faint:var(--faint);
  --line2:rgba(13,23,41,.16);
  --blue-glow:color-mix(in srgb, var(--blue) 12%, transparent);
  --cyan-lt:#7FD4E8;
  --red:#DC2626;
  --wb-dk:#6D28D9;
  --wb-glow:color-mix(in srgb, var(--wb) 12%, transparent);
  --display:'Manrope',sans-serif;
  --body:'Manrope',sans-serif;
  color:var(--ink);
}

/* The home page alternates white with pale tints of the blue, the cyan and the
   violet rather than running white all the way down. These pages now do the
   same: .alt is the carried-over sheet's "this one is shaded" class, so the
   rotation hangs off it and no markup had to change. */
.ported .alt{background:var(--bg-soft)}
.ported section.alt:nth-of-type(6n+2){background:var(--f-blue)}
.ported section.alt:nth-of-type(6n+4){background:var(--f-cyan)}
.ported section.alt:nth-of-type(6n+6){background:var(--f-wb)}

/* Cards sit on white so they stay legible whichever tint is behind them. */
.ported .alt .card, .ported .alt .pr-card, .ported .alt .pay,
.ported .alt .role, .ported .alt .demo-try > div{background:#fff}

/* The closing band and the contact block, as on the home page. */
.ported .faq-end{background:var(--f-cyan)}
"""

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

/* Not a copy of the home page's clamp — the clamp itself, lifted out of
   index.html at build time by _decl(). A restated one drifted silently and
   left every subpage a size larger than the page it claimed to match. */
.ported h1{@@H1@@; letter-spacing:normal; margin-bottom:var(--s4)}
.ported h2{@@H2@@; letter-spacing:normal}
.ported h3{font-size:19px; line-height:26px; letter-spacing:normal}

.ported p, .ported li{font-size:17px; line-height:27px; color:var(--ink-2)}
.ported .lede{font-size:18px; line-height:28px; color:var(--muted)}
.ported .sub{font-size:17px; line-height:27px; color:var(--muted)}
.ported .fine, .ported .note, .ported small{font-size:13.5px; line-height:20px;
  color:var(--muted)}
/* The home page's eyebrow exactly: 13px, sentence case, no tracking. The
   carried-over pages had it uppercase with wide tracking, and inside .doc it
   inherited the body size and came out at 15.5px. */
.ported .eyebrow{display:inline-flex; align-items:center; gap:var(--s2);
  font-size:13px; font-weight:700; letter-spacing:normal; text-transform:none;
  color:var(--wb); margin:0 0 var(--s4)}
.ported .doc .eyebrow{font-size:13px}
.ported .eyebrow .spark{width:14px; height:14px; flex:0 0 auto}

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

PLAYGROUND_CSS = """
/* Playground: the demo number, and the calendar it books into. */
.ported .pg-hero{text-align:center; max-width:760px; margin:0 auto var(--s12)}
.ported .pg-dial{display:inline-flex; align-items:center; gap:var(--s4);
  margin:var(--s8) 0 var(--s4); padding:var(--s4) var(--s8);
  border-radius:var(--r-pill); background:var(--blue); color:#fff;
  text-decoration:none; font-weight:800; min-height:68px;
  box-shadow:0 10px 30px rgba(37,99,235,.28)}
.ported .pg-dial:hover{background:var(--blue-dk)}
.ported .pg-dial .pg-num{font-size:clamp(24px,3.4vw,32px); letter-spacing:-.01em;
  white-space:nowrap}
.ported .pg-dial svg{width:26px; height:26px; flex:0 0 auto}
.ported .pg-steps{display:grid; gap:var(--s4); grid-template-columns:1fr;
  max-width:980px; margin:0 auto var(--s12); padding:0; list-style:none}
@media(min-width:760px){ .ported .pg-steps{grid-template-columns:repeat(3,1fr)} }
.ported .pg-steps li{display:flex; gap:var(--s4); align-items:flex-start;
  background:#fff; border:1px solid var(--line); border-radius:16px;
  padding:var(--s6)}
.ported .pg-steps b{display:grid; place-items:center; flex:0 0 auto;
  width:34px; height:34px; border-radius:50%; background:var(--f-blue);
  color:var(--blue); font-size:15px; font-weight:800}
.ported .pg-steps span{font-size:15px; line-height:23px; color:var(--ink-2)}
.ported .calframe{border-radius:20px; overflow:hidden; border:1px solid var(--line);
  background:#fff; box-shadow:0 18px 50px rgba(13,23,41,.08)}
.ported .calframe iframe{border:0; width:100%; height:620px; display:block}
@media(max-width:700px){ .ported .calframe iframe{height:480px} }
.ported .pg-note{max-width:760px; margin:var(--s6) auto 0; text-align:center}

/* The sample call, on a phone screen. Fixed height, pinned to the newest
   line: a chat that grows pushes the page around, and a chat you have to
   scroll yourself is not what a call looks like. Colours are the site's own
   -- the first pass invented a cyan and an amber that appear nowhere else. */
.ported .pc{max-width:560px; margin:0 auto; background:#fff;
  border:1px solid var(--line); border-radius:24px; overflow:hidden;
  box-shadow:0 18px 50px rgba(13,23,41,.08)}
.ported .pc-top{display:flex; flex-wrap:wrap; align-items:center; gap:var(--s3);
  padding:var(--s6); border-bottom:1px solid var(--line); background:var(--bg-soft)}
.ported .pc-who{flex:1 1 170px; min-width:0}
.ported .pc-who b{display:block; font-size:16px; font-weight:800; color:var(--ink)}
.ported .pc-who span{font-size:13px; color:var(--muted)}
.ported .pc-top audio{flex:1 1 240px; min-width:0; height:36px; max-width:100%}

/* The screen: phone-width, and light, because a navy slab in the middle of
   a pale page reads as a different site. Every text colour here is stated
   outright -- `.ported p` and `.ported li` set --ink-2 and will otherwise
   leak in, which is how the text card ended up dark-on-dark. */
.ported .pc-screen{width:min(380px,100%); margin:var(--s6) auto;
  border-radius:26px; background:#F3F6FC; padding:var(--s4) var(--s3) var(--s3);
  border:1px solid var(--line)}
.ported .pc-bar{display:flex; align-items:center; justify-content:space-between;
  padding:0 var(--s2) var(--s3); margin-bottom:var(--s3);
  border-bottom:1px solid var(--line)}
.ported .pc-live{display:inline-flex; align-items:center; gap:6px; font-size:10px;
  font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--muted)}
.ported .pc-live i{width:6px; height:6px; border-radius:50%; background:#B6C0D2}
.ported .pc-screen.is-playing .pc-live{color:#15803D}
.ported .pc-screen.is-playing .pc-live i{background:#16A34A;
  animation:pcDot 1.9s ease-in-out infinite}
@keyframes pcDot{0%,100%{opacity:1}50%{opacity:.25}}
.ported .pc-screen.is-live .pc-live b{display:none}
.ported .pc-screen.is-live.is-playing .pc-live b{display:inline}
.ported .pc-screen.is-live.is-playing .pc-live em{display:none}
.ported .pc-live em{font-style:normal}
.ported .pc-clock{font-size:11.5px; font-weight:700; color:var(--muted);
  font-variant-numeric:tabular-nums}

/* Fixed window, pinned to the newest line. */
.ported .pc-lines{list-style:none; margin:0; padding:0 var(--s1);
  display:flex; flex-direction:column; gap:7px;
  height:400px; overflow-y:auto; scrollbar-width:thin;
  scrollbar-color:rgba(13,23,41,.18) transparent}
.ported .pc-lines::-webkit-scrollbar{width:4px}
.ported .pc-lines::-webkit-scrollbar-track{background:transparent}
.ported .pc-lines::-webkit-scrollbar-thumb{background:rgba(13,23,41,.16);
  border-radius:100px}
.ported .pc-l{max-width:80%; padding:7px 11px; font-size:12.5px; line-height:18px}
.ported .pc-r{display:block; font-size:8.5px; font-weight:800; letter-spacing:.12em;
  text-transform:uppercase; margin-bottom:2px}
.ported .pc-agent{align-self:flex-start; background:#fff; color:var(--ink);
  border:1px solid var(--line); border-radius:14px 14px 14px 4px}
.ported .pc-agent .pc-r{color:var(--blue)}
.ported .pc-caller{align-self:flex-end; background:var(--blue); color:#fff;
  border-radius:14px 14px 4px 14px}
.ported .pc-caller .pc-r{color:rgba(255,255,255,.76)}

@keyframes pcIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.ported .pc-lines.is-live .pc-l{display:none}
.ported .pc-lines.is-live .pc-l.is-past{display:block; animation:pcIn .3s ease both}
.ported .pc-lines.is-live .pc-hint{display:block; align-self:center; max-width:100%;
  margin:auto 0; padding:0; background:none; border:0; font-size:12px;
  color:var(--muted); text-align:center}
.ported .pc-lines.is-live:has(.pc-l.is-past) .pc-hint{display:none}

/* The text it sent: warm, so it is plainly not another spoken line. */
.ported .pc-sms{display:block; align-self:stretch; max-width:100%; margin-top:7px;
  padding:9px 12px; border-radius:14px; background:var(--f-sand);
  border:1px solid rgba(180,83,9,.22); color:var(--ink-2)}
.ported .pc-lines.is-live .pc-sms{display:none}
.ported .pc-lines.is-live .pc-sms.is-past{display:block; animation:pcIn .3s ease both}
.ported .pc-k{display:block; font-size:8.5px; font-weight:800; letter-spacing:.12em;
  text-transform:uppercase; color:#B45309; margin-bottom:3px}
.ported .pc-sms p{margin:0; font-size:11.5px; line-height:17px; color:var(--ink-2)}
.ported .pc-sms b{color:var(--ink)}
.ported .pc-note{margin:0; padding:0 var(--s6) var(--s6)}
@media(max-width:620px){
  .ported .pc-screen{margin:var(--s4) auto}
  .ported .pc-lines{height:340px}
}
"""


PRICING_CSS = """
/* ---- pricing: one grid, in the main page's system --------------------- */
/* Selectors are compounded with `.ported` on purpose. The ported stylesheet
   carries descendant rules (`.ported p`, `.ported ul li`) that outrank a bare
   single class, so a plain `.pr-card p` here would silently lose. */
.ported .pr-hero{text-align:center; padding-top:var(--s12)}
.ported .pr-hero .lede{max-width:46rem; margin-inline:auto}

.ported .pr-switch{display:flex; width:max-content; gap:var(--s1);
  margin:var(--s8) auto 0; padding:var(--s1); background:var(--bg-soft);
  border-radius:var(--r-pill)}
.ported .pr-sw{display:block; border:0; cursor:pointer; font:inherit;
  padding:var(--s3) var(--s6); border-radius:var(--r-pill);
  background:transparent; color:var(--ink-2); text-align:center}
.ported .pr-sw b{display:block; font-size:16px; font-weight:700; color:var(--ink)}
.ported .pr-sw span{display:block; font-size:13px; color:var(--muted)}
.ported .pr-sw.is-on{background:var(--blue)}
.ported .pr-sw.is-on b, .ported .pr-sw.is-on span{color:#fff}
.ported .pr-sw:focus-visible{outline:3px solid var(--blue); outline-offset:2px}

.ported .pr-banner{display:block; width:max-content; max-width:100%;
  margin-inline:auto; margin-top:var(--s8);
  padding:var(--s3) var(--s6); border-radius:var(--r-pill);
  background:var(--bg-soft); color:var(--ink-2); font-size:15px}

.ported .pr-grid{display:grid; grid-template-columns:1fr; gap:var(--s6);
  margin-top:var(--s8); align-items:start}
@media(min-width:760px){ .ported .pr-grid-4{grid-template-columns:repeat(2,1fr)} }
@media(min-width:1080px){ .ported .pr-grid-4{grid-template-columns:repeat(4,1fr)} }

.ported .pr-card{position:relative; display:flex; flex-direction:column;
  height:100%; padding:var(--s8) var(--s6); border:1px solid var(--line);
  border-radius:var(--r-card); background:var(--bg)}
.ported .pr-card.pr-pop{border-color:var(--blue); background:#F5F8FF}
.ported .pr-card.pr-dark{background:var(--ink); border-color:var(--ink)}
.ported .pr-card.pr-dark h3,
.ported .pr-card.pr-dark .pr-price,
.ported .pr-card.pr-dark .pr-feat-head{color:#fff}
.ported .pr-card.pr-dark .pr-tag,
.ported .pr-card.pr-dark .pr-min,
.ported .pr-card.pr-dark .pr-feat li{color:#C7D2E4}
.ported .pr-card.pr-dark .pr-annual{color:#8FB4FF}
.ported .pr-card.pr-dark .pr-feat li::before{color:#8FB4FF}

.ported .pr-badge{position:absolute; top:calc(var(--s6) * -1); left:50%;
  transform:translateX(-50%); white-space:nowrap;
  padding:var(--s2) var(--s4); border-radius:var(--r-pill);
  background:var(--blue); color:#fff; font-size:12px; font-weight:800;
  letter-spacing:.06em; text-transform:uppercase}

.ported .pr-top{display:block; margin-bottom:0}
.ported .pr-top h3{margin:0; font-size:23px}
.ported .pr-tag{margin:var(--s1) 0 0; font-size:15px; color:var(--muted)}
.ported .pr-price{margin:var(--s6) 0 0; font-size:46px; font-weight:800;
  line-height:1.05; letter-spacing:-.02em; color:var(--ink)}
.ported .pr-price .pr-per{font-size:18px; font-weight:700; color:var(--muted)}
.ported .pr-price.pr-quoted{font-size:34px}
.ported .pr-min{margin:var(--s3) 0 0; font-size:15px; color:var(--ink-2)}
.ported .pr-annual{margin:var(--s1) 0 0; font-size:14px; font-weight:700;
  color:var(--blue)}

.ported .pr-feats{margin-top:var(--s6); padding-top:var(--s6);
  border-top:1px solid var(--line); flex:1}
.ported .pr-card.pr-dark .pr-feats{border-top-color:rgba(255,255,255,.18)}
.ported .pr-feat-head{margin:0 0 var(--s4); font-size:15px; font-weight:800;
  color:var(--ink)}
.ported .pr-feat{list-style:none; margin:0; padding:0}
.ported .pr-feat li{position:relative; margin:0 0 var(--s3); padding-left:26px;
  font-size:15px; line-height:1.45; color:var(--ink-2)}
/* The ported layer already draws a tick here out of two rotated borders.
   Setting only `content` on top of it left the glyph sitting inside half a
   drawn box, so this resets that geometry before drawing the character. */
.ported .pr-feat li::before{content:"\\2713"; position:absolute; left:0; top:0;
  width:auto; height:auto; border:0; transform:none; background:none;
  font-weight:800; color:var(--blue)}


.ported .pr-extra{margin:var(--s6) 0 var(--s4); padding:var(--s3) var(--s4);
  border-radius:var(--r-sm); background:var(--bg-soft); font-size:14px;
  color:var(--ink-2)}
.ported .pr-card .pr-cta-btn{width:100%; margin-top:auto; text-align:center}
.ported .pr-card.pr-dark .pr-cta-btn{background:#fff; color:var(--ink);
  border-color:#fff}

.ported .pr-strip{list-style:none; display:flex; flex-wrap:wrap;
  justify-content:center; gap:var(--s3) var(--s8); margin:var(--s12) 0 0;
  padding:var(--s6) 0 0; border-top:1px solid var(--line)}
.ported .pr-strip li{margin:0; font-size:14px; color:var(--ink-2)}

/* ---- minutes, add-ons and setup --------------------------------------- */
.ported .pr-three{display:grid; grid-template-columns:1fr; gap:var(--s8);
  margin-top:var(--s8)}
@media(min-width:900px){ .ported .pr-three{grid-template-columns:repeat(3,1fr)} }
.ported .pr-col h3{margin:0 0 var(--s4); font-size:20px}
.ported .pr-col p{font-size:15px}
.ported .pr-table{width:100%; border-collapse:collapse; margin:var(--s4) 0;
  background:var(--bg); border-radius:var(--r-sm); overflow:hidden;
  font-size:14px}
.ported .pr-table th, .ported .pr-table td{padding:var(--s3) var(--s4);
  text-align:left; border-bottom:1px solid var(--line)}
.ported .pr-table thead th{font-size:13px; color:var(--muted);
  text-transform:none}
.ported .pr-table tbody th{font-weight:700; color:var(--ink)}
.ported .pr-table tr:last-child th,
.ported .pr-table tr:last-child td{border-bottom:0}
.ported .pr-addons{list-style:none; margin:0; padding:0}
.ported .pr-addons li{margin:0 0 var(--s4); font-size:15px; color:var(--ink)}
.ported .pr-addons li span{display:block; font-size:13px; color:var(--muted)}
.ported .pr-note{font-size:14px; color:var(--muted)}

/* ---- the move-up path -------------------------------------------------- */
.ported .pth-wrap{margin-top:var(--s8); padding:var(--s8) var(--s6);
  border-radius:var(--r-card); background:var(--bg-soft)}
.ported .pth-intro{margin:0 0 var(--s8); font-size:15px}
.ported .pth-intro b{display:block; font-size:17px; color:var(--ink)}
.ported .pth-intro span{color:var(--muted)}
.ported .pth{display:flex; flex-direction:column; gap:var(--s3);
  align-items:stretch}
@media(min-width:900px){
  .ported .pth{flex-direction:row; align-items:center; gap:var(--s2)}
  .ported .pth-card{flex:1}
}
.ported .pth-card{padding:var(--s4) var(--s6); background:var(--bg);
  border:1px solid var(--line); border-radius:var(--r-card)}
.ported .pth-card.pth-dark{background:var(--ink); border-color:var(--ink)}
.ported .pth-card h4{margin:0; font-size:17px}
.ported .pth-card.pth-dark h4{color:#fff}
.ported .pth-price{margin:var(--s1) 0 0; font-size:14px; font-weight:700;
  color:var(--ink-2)}
.ported .pth-blurb{margin:0; font-size:14px; color:var(--muted)}
.ported .pth-card.pth-dark .pth-price{color:#C7D2E4}
.ported .pth-card.pth-dark .pth-blurb{color:#9FB0C9}
.ported .pth-link{align-self:center; padding:var(--s1) var(--s3);
  border-radius:var(--r-pill); background:var(--bg); border:1px solid var(--blue);
  color:var(--blue); font-size:13px; font-weight:800; white-space:nowrap}

.ported .trg-grid{display:grid; grid-template-columns:1fr; gap:var(--s6);
  margin-top:var(--s8)}
@media(min-width:900px){ .ported .trg-grid{grid-template-columns:repeat(3,1fr)} }
.ported .trg{padding:var(--s6); background:var(--bg); border-radius:var(--r-card);
  border:1px solid #E2A33C}
.ported .trg h4{margin:0 0 var(--s4); font-size:17px; color:#8A5A12}
.ported .trg ul{list-style:none; margin:0; padding:0}
.ported .trg li{position:relative; margin:0 0 var(--s3); padding-left:16px;
  font-size:14px; line-height:1.5; color:var(--ink-2)}
.ported .trg li::before{content:"\\2022"; position:absolute; left:0;
  color:var(--muted)}
.ported .pth-end{margin:var(--s8) 0 0; padding:var(--s4) var(--s6);
  background:var(--bg); border-radius:var(--r-card); font-size:15px;
  color:var(--ink-2)}
.ported .pth-end b{color:var(--ink)}

.ported .pr-end{text-align:center}
.ported .pr-cta{display:flex; flex-wrap:wrap; justify-content:center;
  gap:var(--s3); margin-top:var(--s6)}
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
<meta property="og:image" content="https://voicecaptures.com/@@OGIMG@@">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="@@OGALT@@">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="@@TITLE@@">
<meta name="twitter:description" content="@@DESC@@">
<meta name="twitter:image" content="https://voicecaptures.com/@@OGIMG@@">
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
        + BRIDGE_CSS
        + TYPE_CSS.replace("@@H1@@", p["h1_decl"]).replace("@@H2@@", p["h2_decl"])
        + PRICING_CSS
        + PLAYGROUND_CSS
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
        ("@@OGIMG@@", "{og_img}"),
        ("@@OGALT@@", "{og_alt}"),
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
