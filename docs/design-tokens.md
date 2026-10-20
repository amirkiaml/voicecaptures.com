# VoiceCaptures design tokens

Extracted from the live stylesheet on 2026-10-20, at commit `c2db2f2`.
Every value below was read from the source; nothing is inferred. Anything that
could not be determined is listed at the end.

## Where the CSS lives

**There are no `.css` files in this repo.** All styling is inline:

| File | What it styles |
|---|---|
| `index.html` → single `<style>` block (line 32–1475) | The home page and, via `build.py`, the five sector pages (`/personal/`, `/home-services/`, `/restaurants-cafes/`, `/clinics-dental/`, `/other-businesses/`) |
| `build-pages.py` → `SHELL` f-string `<style>` block (from line 61) | `/win-back/`, `/about/`, `/careers/`, `/contact/`, `/privacy/`, `/terms/` |

The two blocks are **separate copies** that share conventions but are not
generated from one source. A token changed in one does not change the other.
Line numbers below refer to `index.html` unless stated.

## Theme

The site has **both light and dark**, and **light is the default**.

- `<html lang="en" data-theme="light">` is in the served markup (line 2).
- JS sets the attribute on load: `apply(saved === "dark" ? "dark" : "light")`
  (line 2912). The OS `prefers-color-scheme` is deliberately **not** consulted —
  the comment at line 2910 says so explicitly.
- Choice persists in `localStorage` under the key `vc_theme` (line 2901).
- `<meta name="theme-color">` is rewritten per theme: `#f6f8fc` light,
  `#05070c` dark (line 2906).

### Three cascading token layers

Colours are declared **three times**, and which set is live depends on the
`data-theme` attribute:

1. `:root` (line 33) — the original dark palette.
2. `:root` (line 1053, "2026 visual refresh") — overrides layer 1.
3. `html[data-theme="light"]` (line 239) and `html[data-theme="dark"]`
   (line 351) — higher specificity than `:root`, so **these are what render**
   once JS has run.

Layers 1 and 2 are only visible in the instant before the theme attribute is
applied, or with JS disabled. **Use layer 3 values as the real tokens.**

## Colours

### Light theme — `html[data-theme="light"]` (line 239)

| Token | Hex / value | Role |
|---|---|---|
| `--bg` | `#f6f8fc` | Page background |
| `--bg2` | `#ffffff` | Alt sections, dropdown panels |
| `--bg3` | `#ffffff` | Cards, tiers |
| `--text` | `#0d1729` | Body text |
| `--muted` | `#5a6b82` | Secondary text |
| `--faint` | `#8496ab` | Tertiary text, fine print |
| `--line` | `rgba(13,23,41,.10)` | Hairline borders |
| `--line2` | `rgba(13,23,41,.18)` | Stronger borders, ghost button |
| `--blue` | `#2563EB` | Links, primary button, focus ring |
| `--blue-dk` | `#1D4ED8` | Link and primary hover |
| `--blue-glow` | `rgba(37,99,235,.12)` | Tinted backgrounds |
| `--cyan` | `#0E93B8` | Accent, success text |
| `--cyan-lt` | `#0B7C9C` | Accent hover |
| `--wb` | `#7C3AED` | Win-back product accent |
| `--wb-dk` | `#6D28D9` | Win-back hover |
| `--wb-glow` | `rgba(124,58,237,.10)` | Win-back tint |

Light-only extras: `.alt` background `#eef2f9` (line 248); `header`
`rgba(246,248,252,.85)` (line 249); `footer` `#eef2f9` (line 250).

### Dark theme — `html[data-theme="dark"]` (line 351)

| Token | Hex / value |
|---|---|
| `--bg` | `#05070c` |
| `--bg2` | `#0a0e16` |
| `--bg3` | `#0f141f` |
| `--text` | `#ffffff` |
| `--muted` | `#9fb3cc` |
| `--faint` | `#6d8099` |
| `--line` | `rgba(160,200,255,.10)` |
| `--line2` | `rgba(160,200,255,.20)` |
| `--blue` | `#3B82F6` |
| `--blue-dk` | `#60A5FA` |
| `--blue-glow` | `rgba(59,130,246,.16)` |
| `--cyan` | `#7DD3FC` |
| `--cyan-lt` | `#BAE6FD` |
| `--wb` | `#A78BFA` |
| `--wb-dk` | `#C4B5FD` |
| `--wb-glow` | `rgba(167,139,250,.16)` |

Dark-only extras: `.alt` `#080b12` (line 360); `header` `rgba(5,7,12,.86)`
(line 361); `footer` `#04060a` (line 363).

### Status colours

| Role | Value | Selector |
|---|---|---|
| Error | `--red: #E24B4A` | `:root` line 39; used by `.in-msg.err` (918), `.wl-msg.err` (950), `.nb-msg.err` (708) |
| Success | `var(--cyan)` | `.in-msg.ok` (919), `.wl-msg.ok` (951) — no dedicated green token exists |
| Focus ring | `2px solid var(--blue)`, offset `2px` | `:focus-visible` (line 50) |

`--red` is declared **only** in the base `:root` and is not re-declared per
theme, so error text is `#E24B4A` in both themes.

### Fixed (non-token) colours worth knowing

| Where | Value | Selector |
|---|---|---|
| Announcement bar | `#17365c` bg, `#e4f5ff` text | `.anno` (line 1069) |
| "Book a call" amber | `#F59E0B` → hover `#FBBF24`, text `#1a1205` | `.nav-a.nav-cal` |
| Light primary button | background `var(--blue)`, text `#fff` | `html[data-theme="light"] .btn-primary` (252) |
| Dark primary button | background `var(--cyan)`, text `#05070c` | `html[data-theme="dark"] .btn-primary` (364) |

## Typography

### Loading

Google Fonts, `<link>` in `<head>` (line 31), with `preconnect` to
`fonts.googleapis.com` and `fonts.gstatic.com` (lines 29–30):

```
https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap
```

No self-hosted font files. `display=swap`.

### Families

| Token | Stack | Used for |
|---|---|---|
| `--display` | `'Manrope', sans-serif` | h1, h2, h3, large numerals |
| `--body` | `'DM Sans', sans-serif` | body, buttons, nav |

Weights loaded: Manrope 400/500/600/700/800; DM Sans 400/500/700.

### Scale

Two layers again: base definitions, then the 2026 refresh (line 1053 onward)
overrides most sizes. **The refresh values are what render.**

| Element | Family | Weight | Size (rendered) | Line height | Letter spacing | Selector |
|---|---|---|---|---|---|---|
| `body` | DM Sans | 400 | `15px` | `1.7` | — | `body` (47) + refresh (1055) |
| `h1` | Manrope | 700 | `clamp(44px, 5.1vw, 76px)` | `1.045` | `-.065em` | `h1` (64) + refresh (1059) |
| `h2` | Manrope | 700 | `clamp(32px, 3.6vw, 49px)` | `1.13` | `-.045em` | `h2` (65) + refresh (1060) |
| `h3` | Manrope | 700 | `17px` | `1.4` | `-.045em` | `h3` (66) + refresh (1061) |
| `.lede` | DM Sans | 400 | `clamp(17px, 1.65vw, 20px)` | `1.7` | — | `.lede` (70) + refresh (1063) |
| `.sub` | DM Sans | 400 | `17px` | `1.75` | — | `.sub` (68) + refresh (1064) |
| `.eyebrow` | DM Sans | 700 | `11px` | inherit | `.17em`, uppercase | `.eyebrow` (69) + refresh (1062) |
| `.fine` (small) | DM Sans | 400 | `12px` | `1.6` | — | `.fine` (71) |
| `.btn` | DM Sans | 700 | `15px` | inherit (`1.7`) | — | `.btn` (79) |
| `.btn-arrow` | DM Sans | 700 | `15.5px` | `1.25` | — | `.btn-arrow` (189) |
| `.nav-a` | DM Sans | 500 | `13.5px` | `1` (in bar) | — | `.nav-a` (112), `.nav .nav-a` (1298) |

## Buttons

Base: `.btn` (line 79) + refresh (line 1065).

| State | Declaration | Selector |
|---|---|---|
| **Base** | `font: 700 15px DM Sans`; `padding: 15px 25px`; `border-radius: 10px`; `display:inline-block`; `border:0`; `text-align:center` | `.btn` (79) overridden by refresh (1065) |
| **Primary (light)** | `background: #2563EB`; `color: #fff`; `box-shadow: 0 8px 26px rgba(37,99,235,.22)` | `html[data-theme="light"] .btn-primary` (252) |
| **Primary hover (light)** | `background: #1D4ED8`; `transform: translateY(-3px)`; `box-shadow: 0 15px 38px rgba(52,190,225,.26)` | (254) + refresh (1067) |
| **Primary (dark)** | `background: #7DD3FC`; `color: #05070c`; `box-shadow: 0 8px 30px rgba(125,211,252,.18)` | `html[data-theme="dark"] .btn-primary` (364) |
| **Primary hover (dark)** | `background: #BAE6FD`; `color:#05070c` | (366) |
| **Secondary / ghost** | `background: transparent`; `border: 1px solid var(--line2)`; `color: var(--text)` | `.btn-ghost` (82) |
| **Ghost hover** | `background: var(--bg3)`; `border-color: rgba(255,255,255,.28)`; `transform: translateY(-2px)` | `.btn-ghost:hover` (83) + refresh (1068) |
| **Focus** | `outline: 2px solid var(--blue)`; `outline-offset: 2px` | global `:focus-visible` (50) — no button-specific focus style |
| **Disabled** | **Not defined in CSS.** JS sets `btn.disabled = true` on form submits (e.g. line 3187) but no `:disabled` or `[disabled]` rule exists, so disabled buttons render identically to enabled ones apart from the UA default cursor. | — |

Pill variant: `.btn-arrow` (189) — `border-radius: 100px`,
`padding: 6px 24px 6px 6px`, with a 40px circular masked arrow in `::before`.

Transition: `transform .25s ease, box-shadow .25s ease, background .25s ease, border-color .25s ease` (refresh, line 1065).

## Radii

| Value | Applied to | Selector |
|---|---|---|
| `2px` | Sector-menu accent bar, slider track | `.nav-menu i` (176) |
| `8px` | Base `.btn` before refresh, `.nav-a` | `.btn` (79), `.nav-a` (112) |
| `9px` | Nav trigger, nav links after refresh | `.nav-trigger` (163), `.nav-a` (341) |
| `10px` | **Buttons (rendered)**, theme toggle, `.demonote` | refresh `.btn` (1065), `.theme-btn` (228) |
| `11px` | Sector menu rows | `:is(.nav-menu button,.nav-menu a)` (175) |
| `12px` | Cards, tiers, dropdown panel, `.calframe` | `.card` (608), `.tier` (653) |
| `13px` | Chat bubbles, sector switch | `.mk-line` (578), `.switch` (1080) |
| `14px` | Nav menu panel, stat tiles | `.nav-menu` (172), `.stat` (1084) |
| `16px` | Calculator, demo card | `.calc` (616), `.demo` (638) |
| `18px` | Media frames | line 483 |
| `25px` | Hero mock frame | `.mock` (1086) |
| `100px` / `999px` | Pills, badges, arrow buttons | `.btn-arrow` (190) |
| `50%` | Dots, avatars | various |

## Border widths

**`1px` throughout.** No other border width appears anywhere in the
stylesheet. Colour is `var(--line)` for hairlines and `var(--line2)` for
stronger edges.

## Shadows

| Role | Value | Selector |
|---|---|---|
| Primary button (light) | `0 8px 26px rgba(37,99,235,.22)` | (252) |
| Primary button hover | `0 15px 38px rgba(52,190,225,.26)` | refresh (1067) |
| Primary button (dark) | `0 8px 30px rgba(125,211,252,.18)` | (364) |
| Card (light) | `0 6px 20px rgba(13,23,41,.06)` | (258) |
| Elevated card (light) | `0 18px 44px rgba(13,23,41,.10)` | (270) |
| Dropdown panel (dark) | `0 22px 52px rgba(0,0,0,.55)` | `.nav-menu` (173) |
| Dropdown panel (light) | `0 20px 46px rgba(13,23,41,.16)` | (259) |
| Hero mock | `0 35px 90px rgba(0,0,0,.4), 0 0 80px rgba(50,136,247,.1)` | `.mock` (1086) |
| Sector switch pill | `inset 0 1px 0 rgba(255,255,255,.16), 0 1px 3px rgba(0,0,0,.35)` | (143) |

There is **no named shadow scale** — each value is written at its use site.

## Spacing and layout

| Token | Value | Selector |
|---|---|---|
| Max content width | **`1240px`** | `.wrap,.bar` refresh (1056). Base `.wrap` is `1060px` (52); the standalone pages in `build-pages.py` still use `1060px`. |
| Gutter | `clamp(18px, 4vw, 24px)` | `.wrap` (52) |
| Section padding (vertical) | `clamp(76px, 9vw, 132px)` | `section` refresh (1057); base is `clamp(52px,7vw,80px)` (53) |
| Hero padding | `clamp(66px, 7vw, 110px) 0 90px` | `.hero` (1074) |
| Header bar padding | `18px 24px` | `.bar` (1073) |
| Footer padding | `36px 0` | `footer` (967) |
| Card padding | `24px` | `.card` (608) |
| Tier padding | `28px 24px` | `.tier` (653) |
| Scroll offset (sticky header) | `scroll-padding-top: 88px` | `html` (1054) |

**There is no numeric spacing scale** (no `--space-*` tokens). Padding and gap
values are written per component; common values observed are 4, 6, 8, 10, 12,
14, 16, 20, 24, 26, 28, 30, 36, 48px.

### Breakpoints

`max-width` media queries at: **400, 460, 480, 520, 560, 620, 720, 860, 1000,
1020, 1180px**. Plus `min-width: 1021px` (burger panel hidden) and
`min-width: 1040px` (hero becomes two columns).

The nav collapses to the burger at **≤1020px**.

## Logo and icons

| File | Dimensions | Where referenced |
|---|---|---|
| `/logo-mark.png` | **390 × 174** | Header brand (`width="32" height="32"`) and footer (`width="28" height="28"`) — the file is a wide wordmark, displayed at `height:34px` by `.brand img` (1073) |
| `/favicon.ico` | ICO, 2,736 B (internal sizes not read) | `<link rel="icon" sizes="any">` (line 10) |
| `/icon-16.png` | 16 × 16 | `<link rel="icon">` (11) |
| `/icon-32.png` | 32 × 32 | `<link rel="icon">` (12) |
| `/icon-512.png` | 512 × 512 | `<link rel="icon">` (13), manifest |
| `/icon-180.png` | 180 × 180 | `<link rel="apple-touch-icon">` (14), manifest |
| `/og-image.png` | 1200 × 630 | `og:image` / `twitter:image` (lines 21–23) |

`site.webmanifest`: `theme_color` and `background_color` both `#f6f8fc`,
`display: standalone`, icons 180 and 512 only.

## Could not be determined

- **Disabled button styling** — no CSS rule exists for it (see Buttons).
- **A success/green colour** — success states reuse `var(--cyan)`; there is no
  green token anywhere in the stylesheet.
- **A named spacing scale** — none exists; values are per-component.
- **A named shadow scale** — none exists.
- **`favicon.ico` internal sizes** — the file's embedded icon dimensions were
  not parsed; only the file size (2,736 B) was read.
- **The logo's intended display aspect** — the header and footer `<img>` tags
  declare square `width`/`height` attributes (32×32, 28×28) while the file is
  390×174 and CSS sets `height:34px`. The declared attributes do not match the
  asset; which is intended was not determined.
- **Whether the two stylesheets are meant to stay in sync** — `index.html` and
  the `build-pages.py` SHELL carry separate copies with different max widths
  (1240px vs 1060px) and different base token blocks.
