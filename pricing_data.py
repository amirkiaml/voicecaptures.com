#!/usr/bin/env python3
"""
pricing_data.py — read the plan data out of index.html.

index.html's `V` object is the only place tiers, prices and minutes are
written. The pricing page needs the same numbers, and a second copy would
drift the first time one price changed, so this parses the real thing rather
than restating it. If the parse breaks, the build stops instead of shipping a
pricing page that disagrees with the homepage.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent

# Order they appear on the pricing page.
VERTICALS = [
    ("home",     "Home services & trades"),
    ("food",     "Restaurants & cafés"),
    ("clinic",   "Clinics & dental"),
    ("other",    "Any other business"),
    ("personal", "Personal line"),
]


def _skip_ws(s, i):
    while i < len(s) and s[i] in " \t\r\n":
        i += 1
    return i


def _parse_string(s, i):
    quote = s[i]
    i += 1
    out = []
    while i < len(s):
        c = s[i]
        if c == "\\":
            nxt = s[i + 1]
            if nxt == "u":
                out.append(chr(int(s[i + 2:i + 6], 16)))
                i += 6
                continue
            out.append({"n": "\n", "t": "\t", "r": "\r"}.get(nxt, nxt))
            i += 2
            continue
        if c == quote:
            return "".join(out), i + 1
        out.append(c)
        i += 1
    raise ValueError("unterminated string")


def _parse_value(s, i):
    """Parse one JS literal at s[i]. Returns (value, next index)."""
    i = _skip_ws(s, i)
    c = s[i]
    if c in "\"'":
        return _parse_string(s, i)
    if c == "[":
        out = []
        i += 1
        while True:
            i = _skip_ws(s, i)
            if s[i] == "]":
                return out, i + 1
            v, i = _parse_value(s, i)
            out.append(v)
            i = _skip_ws(s, i)
            if s[i] == ",":
                i += 1
    if c == "{":
        out = {}
        i += 1
        while True:
            i = _skip_ws(s, i)
            if s[i] == "}":
                return out, i + 1
            if s[i] in "\"'":
                k, i = _parse_string(s, i)
            else:
                j = i
                while s[j] not in ": \t\r\n":
                    j += 1
                k, i = s[i:j], j
            i = _skip_ws(s, i)
            assert s[i] == ":", f"expected ':' at {i}"
            v, i = _parse_value(s, i + 1)
            out[k] = v
            i = _skip_ws(s, i)
            if s[i] == ",":
                i += 1
    # number, true/false/null
    j = i
    while j < len(s) and s[j] not in ",]}\n":
        j += 1
    tok = s[i:j].strip()
    if tok in ("true", "false"):
        return tok == "true", j
    if tok == "null":
        return None, j
    return (float(tok) if "." in tok else int(tok)), j


def _field(src, key, name):
    """Read one field of V[key], e.g. V.home.tiers."""
    start = src.index(f"\n  {key}: {{")
    end = src.index("\n  },", start) if "\n  }," in src[start:] else len(src)
    end = start + src[start:].index("\n  }")
    block = src[start:end]
    # Fields share lines ("short: ..., setup: ..."), so anchor on , { or newline.
    m = re.search(r"[\n,{]\s*" + re.escape(name) + r":\s*", block)
    if not m:
        return None
    return _parse_value(block, m.end())[0]


def load():
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for key, label in VERTICALS:
        tiers = _field(src, key, "tiers")
        if isinstance(tiers, str):           # e.g. other -> "home"
            tiers = _field(src, tiers, "tiers")
        rec = _field(src, key, "rec")
        out[key] = {
            "label": label,
            "short": _field(src, key, "short"),
            "setup": _field(src, key, "setup"),
            "trades": _field(src, key, "trades"),
            "priceNote": _field(src, key, "priceNote"),
            "rec": 1 if rec is None else rec,
            "tiers": tiers or [],
        }
    _check(out)
    return out


def _check(data):
    """Fail the build rather than ship a pricing page that is quietly wrong."""
    expect = {"home": 3, "food": 3, "clinic": 3, "other": 3, "personal": 0}
    for key, n in expect.items():
        got = len(data[key]["tiers"])
        if got != n:
            sys.exit(f"pricing_data: {key} has {got} tiers, expected {n}. "
                     "index.html changed — update pricing_data.py.")
    for key, d in data.items():
        for t in d["tiers"]:
            if not (len(t) >= 5 and isinstance(t[0], str)
                    and re.fullmatch(r"\$[\d,]+", t[1])
                    and isinstance(t[4], list) and t[4]):
                sys.exit(f"pricing_data: {key} tier {t[:2]!r} is not in the "
                         "expected [name, $price, minutes, calls, [features]] shape.")


if __name__ == "__main__":
    import json
    d = load()
    for k, v in d.items():
        print(f"\n{k} ({v['label']})  setup={v['setup']}  rec={v['rec']}")
        for t in v["tiers"]:
            print(f"   {t[0]:<18} {t[1]:>6}  {t[2]:<32} {t[3]!r:<18} "
                  f"{len(t[4])} features" + (f"  extra={t[5:]!r}" if len(t) > 5 else ""))
