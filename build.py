#!/usr/bin/env python3
"""
build.py — generate per-vertical pages from index.html.

One source of truth stays index.html. This emits a folder per vertical with
its own <title>, meta description, canonical and OG tags, so each URL is a
real page to a crawler rather than a JavaScript state.

    python build.py

Writes:
    /personal/index.html
    /home-services/index.html
    /restaurants-cafes/index.html
    /clinics-dental/index.html
    /other-businesses/index.html

Run it before every push. The root index.html is left untouched.
"""

import re, pathlib, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "index.html"
SITE = "https://voicecaptures.com"

PAGES = {
    "personal": {
        "slug": "personal",
        "title": "Personal line that screens your calls — VoiceCaptures",
        "desc": "A second number that picks up unknown callers, turns away the "
                "spam and texts you who called and what they wanted. $9/mo beta.",
    },
    "home": {
        "slug": "home-services",
        "title": "AI receptionist for plumbers, HVAC and trades — VoiceCaptures",
        "desc": "An AI voice agent answers every call, triages the job, books it "
                "on your real calendar and texts you the details. Toronto and the GTA.",
    },
    "food": {
        "slug": "restaurants-cafes",
        "title": "AI phone answering for restaurants and cafés — VoiceCaptures",
        "desc": "Never miss a reservation, takeout order or catering enquiry. An AI "
                "voice agent answers in your venue's name and texts you every lead.",
    },
    "clinic": {
        "slug": "clinics-dental",
        "title": "AI receptionist for clinics and dental practices — VoiceCaptures",
        "desc": "After-hours and reception overflow answered. New patients routed, "
                "appointments booked, callback details texted to your front desk.",
    },
    "other": {
        "slug": "other-businesses",
        "title": "AI phone answering for any business — VoiceCaptures",
        "desc": "Salons, studios, tutors, venues and trades. If your work arrives "
                "by phone, an AI voice agent can answer, qualify and book it.",
    },
}

# Files that live at the site root. From a subfolder, a bare filename would
# resolve to /slug/file — so these are rewritten to absolute paths.
ASSETS = ["logo-mark.png", "sample-call.mp3", "personal-bmo.mp3", "personal-spam.mp3"]


def build_page(src: str, key: str, meta: dict) -> str:
    out = src

    # assets resolve from the root, not the subfolder
    for a in ASSETS:
        out = out.replace(f'src="{a}"', f'src="/{a}"')
        out = out.replace(f'href="{a}"', f'href="/{a}"')

    # anchors that point within the page must survive the path change
    out = out.replace('href="#', 'href="#')

    url = f"{SITE}/{meta['slug']}/"
    out = re.sub(r"<title>.*?</title>", f"<title>{meta['title']}</title>", out, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content=".*?">',
                 f'<meta name="description" content="{meta["desc"]}">', out, count=1, flags=re.S)
    out = re.sub(r'<link rel="canonical" href=".*?">',
                 f'<link rel="canonical" href="{url}">', out, count=1)
    out = re.sub(r'<meta property="og:url" content=".*?">',
                 f'<meta property="og:url" content="{url}">', out, count=1)
    out = re.sub(r'<meta property="og:title" content=".*?">',
                 f'<meta property="og:title" content="{meta["title"]}">', out, count=1, flags=re.S)
    out = re.sub(r'<meta property="og:description" content=".*?">',
                 f'<meta property="og:description" content="{meta["desc"]}">', out, count=1, flags=re.S)
    out = re.sub(r'<meta name="twitter:title" content=".*?">',
                 f'<meta name="twitter:title" content="{meta["title"]}">', out, count=1, flags=re.S)
    out = re.sub(r'<meta name="twitter:description" content=".*?">',
                 f'<meta name="twitter:description" content="{meta["desc"]}">', out, count=1, flags=re.S)

    # The page tells its own script which vertical to open with, so the right
    # one is selected on first paint rather than after a redirect.
    # The <html> tag also carries data-theme, so a literal match on
    # '<html lang="en">' silently did nothing and every subpage opened on the
    # default vertical. Insert the attribute instead of rewriting the tag.
    out = re.sub(r"<html lang=\"en\"", f'<html lang="en" data-page="{key}"', out, count=1)
    return out


def sitemap(slugs) -> str:
    today = "2026-09-23"
    urls = "".join(
        f"\n  <url><loc>{SITE}/{s}</loc><lastmod>{today}</lastmod>"
        f"<changefreq>monthly</changefreq><priority>{p}</priority></url>"
        for s, p in [("", "1.0")] + [(f"{x}/", "0.9") for x in slugs]
                     + [("demo/", "0.9"),
                        ("win-back/", "0.8"), ("contact/", "0.8"), ("about/", "0.7"), ("careers/", "0.7"),
                        ("privacy/", "0.3"), ("terms/", "0.3"), ("login", "0.3")]
    )
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}\n</urlset>\n'


# Mojibake guard. index.html once reached production with every em dash stored
# as "\u00e2\u20ac\u201d" — a UTF-8 em dash that some editor read as cp1252 and
# saved back as UTF-8. It is invisible in most editors and shows up in the
# browser tab, so the build refuses to run rather than copy it into five
# sector pages. If this fires, reopen the file as UTF-8 and save it again.
MOJIBAKE = re.compile(
    "[\u00c2\u00c3\u00e2][\u0080-\u00ff\u20ac\u2122\u2013\u2014"
    "\u2018\u2019\u201c\u201d\u0153\u017e]")


def check_encoding(raw: bytes, src: str) -> None:
    if raw[:3] == b"\xef\xbb\xbf":
        sys.exit("index.html starts with a UTF-8 BOM — save it as UTF-8 "
                 "without BOM and run again.")
    hits = MOJIBAKE.findall(src)
    if hits:
        sys.exit(f"index.html contains {len(hits)} mis-encoded character(s), "
                 f"e.g. {hits[0]!r} — it was saved as cp1252. Reopen it as "
                 "UTF-8, fix those, and run again.")


def main():
    if not SRC.exists():
        sys.exit("index.html not found — run this from the site repo root.")
    raw = SRC.read_bytes()
    src = SRC.read_text(encoding="utf-8")
    check_encoding(raw, src)

    for key, meta in PAGES.items():
        folder = ROOT / meta["slug"]
        folder.mkdir(exist_ok=True)
        (folder / "index.html").write_text(build_page(src, key, meta), encoding="utf-8")
        print(f"  {meta['slug']}/index.html")

    (ROOT / "sitemap.xml").write_text(
        sitemap([m["slug"] for m in PAGES.values()]), encoding="utf-8")
    print("  sitemap.xml")
    print(f"\n{len(PAGES)} pages built from index.html.")


if __name__ == "__main__":
    main()
