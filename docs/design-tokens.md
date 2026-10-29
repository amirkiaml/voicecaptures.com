# VoiceCaptures design tokens

Rewritten on 2026-10-29, at commit `3900ea7`, after the site moved to the
redesign (Route B). Every value below was read from the source; nothing is
inferred. What could not be determined is listed at the end.

## Where the CSS lives

**There are still no `.css` files in this repo.** All styling is inline — but
there is now **one copy of it**, not two:

| File | What it styles |
|---|---|
| `index.html` → single `<style>` block | The home page, and via `build.py` the five sector pages (`/personal/`, `/home-services/`, `/restaurants-cafes/`, `/clinics-dental/`, `/other-businesses/`) |
| `shell.py` | Reads that same block out of `index.html` and wraps the eight standalone pages (`/pricing/`, `/demo/`, `/contact/`, `/win-back/`, `/about/`, `/careers/`, `/privacy/`, `/terms/`) in it |
| `talk.js` | Injects its own `<style>` for the voice widget: the orb, the neural field, the panel and the Speak sphere |

Before the cutover, `build-pages.py` carried a **second, separate** stylesheet.
A token changed in one did not change the other. That copy is gone: it now
survives only as `OLD_BODY_CSS` in `build-pages.py`, scoped under `.ported`
for page bodies not yet rewritten in the new system. Nothing new should be
added to it.

## Theme

**Light only.** Dark mode was removed at the cutover: there is no
`data-theme` attribute, no toggle, and no `html[data-theme="dark"]` rule
anywhere in `index.html`, `talk.js` or any generated page. Dark will be
designed deliberately rather than inherited.

(`admin/`, `dashboard/` and `login/` still carry `data-theme`. Those are the
dashboard app, not built by `build.py` or `build-pages.py`, and were out of
scope for this change.)

## Colour

### Accents

| Token | Value | Used for |
|---|---|---|
| `--blue` | `#2563EB` | The primary. Buttons, links, active nav, the search dialog's focus ring |
| `--blue-dk` | `#1D4ED8` | Hover on anything blue |
| `--cyan` | `#0E93B8` | The live dot, accents. Darkened from the old `#22D3EE`, which could not carry text on white |
| `--wb` | `#7C3AED` | Win-back, and the section eyebrows |

### Fields

Each is its accent at roughly 8–14% over white, mixed by hand so it stays
neutral enough to carry near-black text at AA.

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--f-blue` | `#E8EEFB` | | `--f-blue-2` | `#DCE6F9` |
| `--f-cyan` | `#E2F1F5` | | `--f-cyan-2` | `#D3EAF1` |
| `--f-wb` | `#EFE9FB` | | `--f-wb-2` | `#E5DBF8` |
| `--f-warm` | `#F5F2EC` | | `--f-sand` | `#FBF6EC` |

### Ground and ink

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#FFFFFF` | Page |
| `--bg-soft` | `#F4F6FA` | Alternating sections, the footer, hover on quiet controls |
| `--ink` | `#0D1729` | Headings and body |
| `--ink-2` | `#36465C` | Secondary body |
| `--muted` | `#55637A` | Supporting copy |
| `--faint` | `#7C8CA3` | Placeholders, the key legend, list chevrons |
| `--line` | `rgba(13,23,41,.09)` | Hairlines and card borders |

The hero sits on `#EFF4FE`, which is not a token: it was sampled from the
hero artwork's own edges so the full-bleed image has no seam.

## Type

| | |
|---|---|
| Body and headings | `Manrope`, 400/500/600/700/800, from Google Fonts |
| The accent phrase | `Instrument Serif`, italic 400 — the `.pay` and `.hl` classes |
| Body size | 16px / 24px |
| H1 | `clamp(38px, 5.4vw, 60px)`, line-height 1.04, letter-spacing normal |
| H2 | `clamp(28px, 3.4vw, 40px)`, line-height 1.1 |

Google Fonts is blocked in the build container, so screenshots taken there
fall back to a system sans. That is a container limitation, not a page bug.

## Shape and space

| Token | Value |
|---|---|
| `--r-card` | `24px` |
| `--r-sm` | `8px` |
| `--r-pill` | `999px` |

A 4px scale: `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s6` 24, `--s8` 32,
`--s12` 48, `--s16` 64, `--s24` 96.

`--rail` is `1120px` — the content column. The top bar has a **wider rail of
1280px** of its own, which is what lets brand, nav, search, sales, Log in and
the CTA sit on one line from 1200px up.

## Breakpoints

| Width | What changes |
|---|---|
| 1200px | Full desktop bar appears: nav, search, sales, Log in. Burger hides. `/` focuses search above this width only |
| 1279px and below | The word "Sales:" hides; the number stays. Without it the bar is 37px short |
| 1000px | The sector collage goes to its explicit 12×10 grid |
| 700px | Hero capability columns split; the hero orb takes its fixed 284px size |
| 560px | Search quick-links go to three columns |

There is also a **height** breakpoint: at `min-width:700px` and
`max-height:860px` the hero trims its top padding and the orb shrinks to
208px, so the orb and the line under it still clear the fold on a short
laptop screen.

## The `.ported` layer

Two stylesheets predate the redesign and are carried rather than rewritten,
both under a `.ported` wrapper with every selector machine-prefixed:

1. The **live page's own sheet**, in `index.html`, for the eleven sections
   ported at the cutover (pricing, the calculator, the demo, the calendar,
   the win-back band, the personal line and the rest).
2. The **old standalone shell's sheet**, as `OLD_BODY_CSS` in
   `build-pages.py`, for those eight page bodies.

Both redefine the OLD token names in the new palette — `--bg` was near-black
and `--text` near-white in the dark design — so the ported rules keep working
without being re-authored. Two document-level rules are restored by hand
inside the wrapper, because the scoping pass drops them by design:

- `.ported *{min-width:0}` — without it a flex or grid child will not shrink
  below its content, and `/pricing/`'s comparison table ran 104px past a
  390px viewport.
- `.ported .btn-primary` — the old primary was cyan; the new one is the blue,
  and a page must not show two different "main" colours.

When a ported section or page is rewritten in the new system, it moves out of
the wrapper and whatever rules it was the last user of can go with it.

## Cache busting

`talk.js` is referenced as `/talk.js?v=<hash>`, where the hash is the first
eight characters of its SHA-256. `stamp.py` writes it into every page, and
`build.py` calls `stamp.py` last, after the pages are generated. This is not
hygiene for its own sake: the file is served with a long max-age, and an old
copy beside new HTML once put the voice panel back on a live screen after it
had been removed.

## What could not be determined

- **Contrast ratios for the `.ported` layer.** The automated check covers the
  new system's text colours (stat 5.70, fine print 5.52, both AA). The ported
  rules were verified for overflow and console errors at six widths across all
  14 pages, but their text contrast has not been audited pair by pair.
- **Dark values.** There are none yet, by choice.
- **`admin/`, `dashboard/`, `login/`.** Part of the dashboard app, not built
  from these scripts, and not examined here.
