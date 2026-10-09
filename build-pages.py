#!/usr/bin/env python3
"""
build-pages.py — emit the standalone pages: /about/, /careers/, /privacy/, /terms/.

These are NOT generated from index.html. index.html is a single-page app whose
script expects its own markup; running it on a page that has none of it would
throw on first paint. They carry the same shell instead — fonts, palette,
header, theme toggle, footer — so they read as part of the same site.

Replaces the older build-legal.py. Delete that file; deploy.ps1 calls this one.

    python build-pages.py
"""

import pathlib

ROOT = pathlib.Path(__file__).parent
UPDATED = "9 October 2026"
EMAIL = "hello@voicecaptures.com"
ADDR = "Toronto, Ontario, Canada"
# The legal owner's name is deliberately not published. Carriers and
# regulators get it from the registration record; the site shows the
# trading name only.
BRAND = "VoiceCaptures"
API = "https://torontoleads-production.up.railway.app"
CAL = "https://calendly.com/hello-voicecaptures"
# The 30-minute event, for pages that should skip the chooser.
CAL30 = CAL + "/30min"

# ---------------------------------------------------------------- shell ----

SHELL = """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#f6f8fc">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://voicecaptures.com/{slug}/">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VoiceCaptures">
<meta property="og:url" content="https://voicecaptures.com/{slug}/">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://voicecaptures.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://voicecaptures.com/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{{
  --bg:#0b0d13; --bg2:#12151d; --bg3:#191d27;
  --text:#f0f0ec; --muted:#9a9a90; --faint:#555;
  --line:rgba(255,255,255,0.08); --line2:rgba(255,255,255,0.15);
  --blue:#2563EB; --blue-dk:#1D4ED8; --blue-glow:rgba(37,99,235,0.15);
  --cyan:#22D3EE; --cyan-lt:#67E8F9;
  --wb:#A78BFA; --wb-dk:#C4B5FD; --wb-glow:rgba(167,139,250,.14);
  --red:#E24B4A;
  --display:'Manrope',sans-serif; --body:'DM Sans',sans-serif;
}}
html[data-theme="light"]{{
  --bg:#f6f8fc; --bg2:#ffffff; --bg3:#ffffff;
  --text:#0d1729; --muted:#5a6b82; --faint:#8496ab;
  --line:rgba(13,23,41,.10); --line2:rgba(13,23,41,.18);
  --blue:#2563EB; --blue-dk:#1D4ED8; --blue-glow:rgba(37,99,235,.12);
  --cyan:#0E93B8; --cyan-lt:#0B7C9C;
  --wb:#7C3AED; --wb-dk:#6D28D9; --wb-glow:rgba(124,58,237,.10);
  --red:#D13B3A;
}}
*{{margin:0;padding:0;box-sizing:border-box;min-width:0}}
html{{overflow-x:clip}}
body{{background:var(--bg);color:var(--text);font-family:var(--body);
  line-height:1.7;-webkit-font-smoothing:antialiased;overflow-x:clip;max-width:100%}}
img{{display:block;max-width:100%}}
a{{color:var(--blue);text-decoration:none}}
a:hover{{color:var(--blue-dk)}}
:focus-visible{{outline:2px solid var(--blue);outline-offset:2px}}
.wrap{{width:100%;max-width:1060px;margin:0 auto;padding:0 clamp(18px,4vw,24px)}}
.alt{{background:var(--bg2)}}
html[data-theme="light"] .alt{{background:#eef2f9}}

/* header */
header{{position:sticky;top:0;z-index:50;background:rgba(11,13,19,.76);
  -webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%);
  border-bottom:1px solid var(--line)}}
html[data-theme="light"] header{{background:rgba(246,248,252,.85)}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){{
  header{{background:rgba(11,13,19,.94)}}
  html[data-theme="light"] header{{background:#f6f8fc}}
}}
.bar{{max-width:1060px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:14px}}
.brand{{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}}
.brand:hover{{color:inherit;opacity:.85}}
.brand img{{height:32px;width:auto}}
.brand span{{font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:-.01em}}
.nav{{display:flex;align-items:center;gap:4px;margin-left:auto;margin-right:12px}}
.nav-a{{font-family:var(--body);font-size:13.5px;font-weight:500;color:var(--muted);
  background:none;border:0;cursor:pointer;padding:8px 12px;border-radius:8px;
  text-decoration:none;white-space:nowrap;transition:color .18s,background .18s}}
.nav-a:hover{{color:var(--text);background:rgba(255,255,255,.06)}}
.nav-a[aria-current="page"]{{color:var(--text);font-weight:700}}
html[data-theme="light"] .nav-a:hover{{background:rgba(13,23,41,.05)}}

/* ---- "Book a call" is the highest-intent action in the nav, and as plain
   text it read as one more link. Amber keeps it clear of the blue primary
   CTA and the cyan demo-line dot, so the three don't compete. ---- */
.theme-btn{{flex:0 0 auto;width:38px;height:38px;border-radius:10px;cursor:pointer;
  background:none;border:1px solid var(--line2);color:var(--muted);
  display:flex;align-items:center;justify-content:center;margin-left:0;
  transition:color .18s,border-color .18s}}
.theme-btn:hover{{color:var(--text)}}
.theme-btn svg{{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round}}
.t-moon{{display:none}}
html[data-theme="light"] .t-sun{{display:none}}
html[data-theme="light"] .t-moon{{display:block}}

/* type */
h1{{font-family:var(--display);font-weight:700;font-size:clamp(30px,4.6vw,46px);
  letter-spacing:-.02em;line-height:1.1;margin-bottom:16px}}
h2{{font-family:var(--display);font-weight:700;font-size:clamp(22px,3.2vw,30px);
  letter-spacing:-.02em;line-height:1.2;margin-bottom:10px;scroll-margin-top:86px}}
h3{{font-family:var(--display);font-size:16.5px;font-weight:700;line-height:1.4;margin-bottom:6px}}
h1 .hl,h2 .hl{{color:var(--blue)}}
.eyebrow{{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);margin-bottom:18px}}
.lede{{font-size:17.5px;color:var(--muted);max-width:640px;margin-bottom:22px}}
section{{padding:clamp(44px,6vw,72px) 0}}
.prose p{{font-size:16px;margin-bottom:16px;max-width:680px}}
.fine{{font-size:12.5px;color:var(--muted);line-height:1.6}}

/* buttons */
.btn{{font-family:var(--body);font-size:15px;font-weight:700;padding:14px 30px;border-radius:8px;
  display:inline-block;border:0;cursor:pointer;text-align:center;
  transition:background .2s,transform .1s,border-color .2s}}
.btn-primary{{background:var(--cyan);color:var(--bg)}}
.btn-primary:hover{{background:var(--cyan-lt);color:var(--bg);transform:translateY(-1px)}}
html[data-theme="light"] .btn-primary{{background:var(--blue);color:#fff;
  box-shadow:0 8px 26px rgba(37,99,235,.22)}}
html[data-theme="light"] .btn-primary:hover{{background:var(--blue-dk);color:#fff}}
.btn-ghost{{background:transparent;border:1px solid var(--line2);color:var(--text)}}
.btn-ghost:hover{{background:var(--bg3);color:var(--text)}}
.btn[disabled]{{opacity:.55;cursor:not-allowed;transform:none}}

/* cards */
.cards{{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-top:28px}}
.card{{background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:22px}}
html[data-theme="light"] .card{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.card p{{font-size:14.5px;color:var(--muted);margin:0}}
.card .ic{{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;
  justify-content:center;background:var(--blue-glow);color:var(--blue);margin-bottom:14px;
  font-family:var(--display);font-weight:700;font-size:15px}}

/* badge strip */
.badges{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}}
.badge{{font-size:12.5px;font-weight:700;padding:6px 13px;border-radius:999px;
  border:1px solid var(--line2);color:var(--muted)}}
.badge-live{{border-color:color-mix(in srgb,var(--cyan) 55%,transparent);color:var(--cyan)}}

/* callout box (legal pages) */
.box{{background:var(--bg2);border:1px solid var(--line);border-left:3px solid var(--cyan);
  border-radius:10px;padding:16px 18px;margin:18px 0;max-width:680px}}
html[data-theme="light"] .box{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.box p:last-child{{margin-bottom:0}}

/* document pages */
.doc{{padding:clamp(44px,6vw,72px) 0 clamp(56px,7vw,88px);max-width:760px}}
.doc .updated{{font-size:13px;color:var(--muted);margin-bottom:8px}}
.doc .intro{{font-size:17px;color:var(--muted);margin:22px 0 8px}}
.doc h2{{font-size:21px;margin:40px 0 10px;padding-top:26px;border-top:1px solid var(--line)}}
.doc h3{{font-size:15.5px;margin:22px 0 4px;scroll-margin-top:86px}}
.doc p{{font-size:15.5px;margin-bottom:14px}}
.doc ul{{margin:0 0 16px 20px}}
.doc li{{font-size:15.5px;margin-bottom:7px}}
.doc dt{{font-weight:700;font-size:15.5px;margin-top:12px}}
.doc dd{{font-size:15.5px;color:var(--muted);margin-left:0}}

/* roles */
.role{{background:var(--bg2);border:1px solid var(--line);border-radius:16px;
  margin-bottom:16px;overflow:hidden}}
html[data-theme="light"] .role{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.role summary{{list-style:none;cursor:pointer;padding:24px;display:block}}
.role summary::-webkit-details-marker{{display:none}}
.role summary:hover{{background:rgba(127,127,127,.04)}}
.role-top{{display:flex;align-items:flex-start;gap:16px}}
.role-top h3{{font-size:19px;margin-bottom:6px}}
.role-sum{{font-size:14.5px;color:var(--muted);margin:0}}
.role-toggle{{margin-left:auto;flex:0 0 auto;font-size:13px;font-weight:700;color:var(--blue);
  display:flex;align-items:center;gap:6px;white-space:nowrap}}
.role-toggle svg{{width:12px;height:12px;transition:transform .2s}}
.role[open] .role-toggle svg{{transform:rotate(180deg)}}
.role[open] .role-toggle .lbl-more{{display:none}}
.role:not([open]) .role-toggle .lbl-less{{display:none}}
.role-meta{{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}}
.role-body{{padding:0 24px 26px;border-top:1px solid var(--line);margin-top:4px;padding-top:22px}}
.role-body h4{{font-family:var(--display);font-size:13px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--muted);margin:22px 0 8px}}
.role-body h4:first-child{{margin-top:0}}
.role-body ul{{margin:0 0 4px 20px}}
.role-body li{{font-size:14.5px;margin-bottom:6px}}
.role-body .apply{{margin-top:22px}}

/* forms */
.formwrap{{background:var(--bg2);border:1px solid var(--line);border-radius:16px;
  padding:clamp(22px,3vw,30px);max-width:760px}}
html[data-theme="light"] .formwrap{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.grid2{{display:grid;gap:16px;grid-template-columns:1fr 1fr}}
@media (max-width:620px){{ .grid2{{grid-template-columns:1fr}} }}
.f{{margin-bottom:16px}}
.f label{{display:block;font-size:13px;font-weight:700;margin-bottom:6px}}
.f .opt{{font-weight:400;color:var(--muted)}}
.f input,.f select,.f textarea{{width:100%;font-family:var(--body);font-size:15px;
  color:var(--text);background:var(--bg3);border:1px solid var(--line2);border-radius:9px;
  padding:11px 13px;transition:border-color .18s}}
html[data-theme="light"] .f input,html[data-theme="light"] .f select,
html[data-theme="light"] .f textarea{{background:#fbfcfe}}
.f textarea{{min-height:104px;resize:vertical;line-height:1.6}}
.f input:focus,.f select:focus,.f textarea:focus{{border-color:var(--blue);outline:none}}
.f .hint{{font-size:12.5px;color:var(--muted);margin-top:6px}}
.f input[type=file]{{padding:9px;cursor:pointer}}
.f input[type=file]::file-selector-button{{font-family:var(--body);font-size:13px;font-weight:700;
  margin-right:12px;padding:7px 14px;border-radius:7px;border:1px solid var(--line2);
  background:var(--bg2);color:var(--text);cursor:pointer}}
.check{{display:flex;gap:11px;align-items:flex-start;font-size:14px;margin:4px 0 20px;
  line-height:1.55}}
.check input{{width:17px;height:17px;flex:0 0 auto;margin-top:3px;accent-color:var(--blue)}}
.f-msg{{font-size:14px;margin-top:14px;padding:12px 14px;border-radius:9px;display:none}}
.f-msg.err{{display:block;background:rgba(226,75,74,.12);color:#E24B4A;
  border:1px solid rgba(226,75,74,.3)}}
.f-ok{{display:none;text-align:center;padding:12px 0}}
.f-ok h3{{font-size:19px;margin-bottom:8px}}
.f-ok p{{color:var(--muted);font-size:15px;max-width:440px;margin:0 auto}}
.f-ok .tick{{width:46px;height:46px;border-radius:50%;background:var(--blue-glow);
  color:var(--blue);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}}
.f-ok .tick svg{{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round}}

/* footer */
footer{{padding:36px 0;border-top:1px solid var(--line);background:var(--bg2)}}
html[data-theme="light"] footer{{background:#eef2f9}}
.foot{{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}}
.foot img{{height:28px;width:auto}}
.foot .tl{{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--muted);margin-top:8px}}
.foot a,.foot .desc{{font-size:13px;color:var(--muted)}}
.foot a:hover{{color:var(--blue)}}
.foot-legal{{display:flex;gap:16px;flex-wrap:wrap}}

/* ---- "Book a call" is the highest-intent action in the nav, and as plain
   text it read as one more link. Amber keeps it clear of the blue primary
   CTA and the cyan demo-line dot, so the three don't compete. The themed
   selectors are deliberate: the generic .nav-a rules are themed too. ---- */
html .nav-a.nav-cal,
html[data-theme="light"] .nav-a.nav-cal,
html[data-theme="dark"] .nav-a.nav-cal{{
  background:#F59E0B;color:#1a1205;font-weight:700;border-color:#F59E0B}}
html .nav-a.nav-cal:hover,
html[data-theme="light"] .nav-a.nav-cal:hover,
html[data-theme="dark"] .nav-a.nav-cal:hover{{
  background:#FBBF24;color:#1a1205;border-color:#FBBF24}}
html[data-theme="light"] .nav-a.nav-cal{{box-shadow:0 4px 14px rgba(245,158,11,.28)}}

/* ---- Client dashboard link. Red because it is the one nav item aimed at
   existing customers rather than prospects, so it should not read as part of
   the sales path. The dot pulses once the page settles; it is a "this is new"
   marker, not a live-status indicator. ---- */
html .nav-a.nav-dash,
html[data-theme="light"] .nav-a.nav-dash,
html[data-theme="dark"] .nav-a.nav-dash{{
  background:none;color:var(--text);font-weight:600;
  border:1px solid color-mix(in srgb,var(--blue) 42%,transparent);
  display:inline-flex;align-items:center;gap:7px}}
html .nav-a.nav-dash:hover,
html[data-theme="light"] .nav-a.nav-dash:hover,
html[data-theme="dark"] .nav-a.nav-dash:hover{{
  background:var(--blue-glow);color:var(--text);
  border-color:color-mix(in srgb,var(--blue) 70%,transparent)}}
.nav-dash .dot{{width:8px;height:8px;border-radius:50%;background:#38BDF8;flex:0 0 auto;
  box-shadow:0 0 0 0 rgba(56,189,248,.8);animation:dashblip 1.9s ease-out infinite}}
@keyframes dashblip{{
  0%  {{box-shadow:0 0 0 0 rgba(56,189,248,.85);opacity:1}}
  70% {{box-shadow:0 0 0 7px rgba(56,189,248,0);opacity:.55}}
  100%{{box-shadow:0 0 0 0 rgba(56,189,248,0);opacity:1}}
}}
.nav-dash .tag{{display:none}}
@media (prefers-reduced-motion:reduce){{ .nav-dash .dot{{animation:none}} }}

/* Between the nav's hide breakpoint and ~1180px the bar is now one item
   longer than it used to be and spills past the logo. Tighten the spacing
   through that band rather than hiding the whole nav on a laptop. */
@media (max-width:1180px){{
  .nav{{gap:1px;margin-right:8px}}
  .nav-a{{padding:8px 9px;font-size:13px}}
  .nav-dash .tag{{display:none}}
}}

/* ---- Compact nav: same burger as the main site, so a phone visitor can
   still reach Members, Careers and the rest. ---- */
.bar > *{{flex:0 0 auto}}
.nav > *{{flex:0 0 auto}}
/* The auto margin goes on the nav, not the brand: on the brand it collects
   the bar's slack right after the logo and opens a hole there. */
.brand{{margin-right:0}}
.nav{{margin-left:0;margin-right:0}}
.burger{{display:none;flex:0 0 auto;width:40px;height:40px;border-radius:10px;cursor:pointer;
  background:none;border:1px solid var(--line2);
  align-items:center;justify-content:center;flex-direction:column;gap:4px;margin-left:auto}}
.burger span{{display:block;width:17px;height:2px;border-radius:2px;background:var(--text);
  transition:transform .22s,opacity .18s}}
.burger[aria-expanded="true"] span:nth-child(1){{transform:translateY(6px) rotate(45deg)}}
.burger[aria-expanded="true"] span:nth-child(2){{opacity:0}}
.burger[aria-expanded="true"] span:nth-child(3){{transform:translateY(-6px) rotate(-45deg)}}
.mnav{{border-top:1px solid var(--line);background:var(--bg2);
  max-height:calc(100vh - 68px);overflow-y:auto}}
.mnav[hidden]{{display:none}}
.mnav-in{{max-width:1060px;margin:0 auto;padding:14px clamp(18px,4vw,24px) 20px}}
.mnav-a{{display:block;width:100%;text-align:left;font-family:var(--body);font-size:16px;
  font-weight:600;color:var(--text);background:none;border:0;cursor:pointer;margin:0;
  padding:11px 12px;border-radius:10px;text-decoration:none;line-height:1.4}}
.mnav-a:hover{{background:rgba(127,127,127,.09);color:var(--text)}}
.mnav-dash{{display:flex;align-items:center;gap:10px;font-size:15.5px;font-weight:700;
  color:var(--text);background:var(--bg3);
  border:1px solid color-mix(in srgb,var(--blue) 40%,transparent);
  border-radius:12px;padding:13px 14px;margin-bottom:10px;text-decoration:none}}
.mnav-dash:hover{{background:var(--blue-glow);color:var(--text)}}
.mnav-dash .mnav-dash-t{{display:block;line-height:1.3}}
.mnav-dash .mnav-dash-s{{display:block;font-size:12.5px;font-weight:500;color:var(--muted);
  line-height:1.35;margin-top:1px}}
.mnav-dash .dot{{width:8px;height:8px;border-radius:50%;background:#38BDF8;flex:0 0 auto;
  animation:dashblip 1.9s ease-out infinite}}
.mnav-dash .tag{{margin-left:auto;align-self:flex-start;font-style:normal;font-size:9.5px;
  font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue);
  background:var(--blue-glow);border-radius:4px;padding:2px 5px}}
.mnav-foot{{display:flex;flex-direction:column;gap:9px;margin-top:16px;
  padding-top:16px;border-top:1px solid var(--line)}}
.mnav-foot .btn{{width:100%;font-size:14.5px;padding:12px 18px}}
@media (max-width:900px){{
  .nav{{display:none}}
  .burger{{display:flex}}
  .theme-btn{{margin-left:0}}
}}
@media (min-width:901px){{ .mnav{{display:none}} }}

/* One shared height for every control in the bar. */
.bar{{align-items:center}}
.nav .nav-a{{height:38px;display:inline-flex;align-items:center;padding:0 11px;
  font-size:14px;line-height:1}}
.theme-btn{{width:38px;height:38px}}

.mnav .btn-amber,header .mnav .btn-amber{{background:#F59E0B;color:#1a1205;
  border:1px solid #F59E0B;box-shadow:none}}
.mnav .btn-amber:hover,header .mnav .btn-amber:hover{{background:#FBBF24;color:#1a1205;
  border-color:#FBBF24}}

/* ---- Win-back accent -----------------------------------------------------
   Outbound is a different product from the receptionist, sold to a different
   moment, so it carries its own colour wherever it shows up. Violet is the one
   hue nothing else in the palette uses: links are blue, the primary CTA is
   cyan, Book a call is amber. ---- */
html .nav-a.nav-wb,
html[data-theme="light"] .nav-a.nav-wb{{color:var(--wb);font-weight:600}}
html .nav-a.nav-wb:hover,
html[data-theme="light"] .nav-a.nav-wb:hover{{color:var(--wb-dk);background:var(--wb-glow)}}
html .nav-a.nav-wb[aria-current="page"]{{color:var(--wb);font-weight:700}}
.mnav-a.mnav-wb{{display:flex;align-items:center;gap:9px;color:var(--wb);font-weight:600}}
.mnav-a.mnav-wb:hover{{background:var(--wb-glow);color:var(--wb)}}
.mnav-wb .wbdot{{width:7px;height:7px;border-radius:50%;background:var(--wb);flex:0 0 auto}}
.foot-legal a.f-wb{{color:var(--wb)}}
.foot-legal a.f-wb:hover{{color:var(--wb-dk)}}

/* Panel headings and the indented sector rows, matching the main site. */
.mnav-h{{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);margin:14px 0 4px;padding:0 12px}}
.mnav-a.sub{{font-weight:500;font-size:15px;color:var(--muted);padding-left:20px}}
.mnav-a.sub:hover{{color:var(--text)}}

/* The outbound page itself runs on the accent -- links, highlights and primary
   buttons -- so landing there feels like a different room of the same house. */
body[data-page="win-back"]{{--blue:var(--wb);--blue-dk:var(--wb-dk);
  --blue-glow:var(--wb-glow);--cyan:var(--wb);--cyan-lt:var(--wb-dk)}}
/* Members keeps its blue there: it belongs to the receptionist product. */
body[data-page="win-back"] .nav-a.nav-dash,
body[data-page="win-back"] .mnav-dash{{border-color:rgba(59,130,246,.42)}}
body[data-page="win-back"] .nav-a.nav-dash:hover,
body[data-page="win-back"] .mnav-dash:hover{{background:rgba(59,130,246,.14);
  border-color:rgba(59,130,246,.7)}}
body[data-page="win-back"] .mnav-dash .tag{{color:#3B82F6;background:rgba(59,130,246,.14)}}
body[data-page="win-back"] .eyebrow{{color:var(--wb)}}

/* ---- The one contact form. Lifted from the home page, where it used to sit
   inside the sector flow; the markup and class names are unchanged so the two
   do not drift apart. ---- */
.in-card{{max-width:640px;margin:0 auto;background:var(--bg3);border:1px solid var(--line);
  border-radius:16px;padding:clamp(24px,4vw,36px)}}
html[data-theme="light"] .in-card{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.in-leg{{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--cyan);margin:0 0 14px;padding-bottom:9px;border-bottom:1px solid var(--line)}}
.in-leg + .in-row{{margin-top:0}}
.in-card .in-leg:not(:first-child){{margin-top:26px}}
.in-row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));
  gap:14px;margin-bottom:14px}}
.in-f{{display:block}}
.in-f > span{{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}}
.in-f > span em{{font-style:normal;color:var(--faint)}}
.in-f input,.in-f select,.in-f textarea{{width:100%;background:var(--bg2);
  border:1px solid var(--line2);border-radius:9px;padding:12px 14px;color:var(--text);
  font-family:var(--body);font-size:14.5px}}
.in-f textarea{{resize:vertical;line-height:1.55}}
.in-f input:focus,.in-f select:focus,.in-f textarea:focus{{outline:2px solid var(--cyan);
  outline-offset:1px}}
.in-f select{{appearance:none;cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),
                   linear-gradient(135deg,var(--muted) 50%,transparent 50%);
  background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:36px}}
.in-note{{font-size:11.5px;color:var(--faint);margin:18px 0 14px;line-height:1.6}}
.in-go{{width:100%;padding:15px}}
.in-msg{{font-size:13px;color:var(--muted);margin-top:14px;text-align:center;min-height:18px}}
.in-msg.err{{color:var(--red)}}
.in-msg.ok{{color:var(--cyan)}}
.in-alt{{text-align:center;margin-top:26px;font-size:14px;color:var(--muted)}}

/* ---- Sector dropdown, so the bar is the same one the home page has ---- */
.nav-drop{{position:relative;display:flex;align-items:center}}
.nav-trigger{{display:inline-flex;align-items:center;gap:7px;cursor:pointer;
  background:none;border:1px solid var(--line2);border-radius:9px}}
.nav-trigger:hover{{border-color:color-mix(in srgb,var(--cyan) 50%,transparent)}}
.nav-trigger[aria-expanded="true"]{{border-color:var(--cyan);color:var(--cyan)}}
html[data-theme="light"] .nav-trigger{{border-color:rgba(18,35,63,.22);color:#12233f}}
html[data-theme="light"] .nav-trigger:hover{{border-color:#2563EB;color:#1D4ED8}}
.nav-car{{width:12px;height:12px;opacity:.75;transition:transform .2s}}
.nav-trigger[aria-expanded="true"] .nav-car{{transform:rotate(180deg);opacity:1}}
.nav-menu{{position:absolute;left:0;top:calc(100% + 12px);min-width:292px;padding:8px;
  border-radius:14px;background:var(--bg2);border:1px solid var(--line);
  box-shadow:0 22px 52px rgba(0,0,0,.45);z-index:60}}
html[data-theme="light"] .nav-menu{{box-shadow:0 22px 52px rgba(13,23,41,.14)}}
.nav-menu[hidden]{{display:none}}
.nav-menu a{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;row-gap:1px;
  align-items:center;padding:11px 13px;border-radius:11px;text-decoration:none}}
.nav-menu a:hover{{background:rgba(127,127,127,.09)}}
.nav-menu a i{{grid-row:1/span 2;width:4px;height:26px;border-radius:2px;display:block;
  background:var(--line2);transition:background .16s}}
.nav-menu a:hover i{{background:var(--cyan)}}
.nav-menu a b{{font-size:14px;font-weight:700;color:var(--text);line-height:1.3}}
.nav-menu a em{{font-style:normal;font-size:12px;color:var(--muted);line-height:1.35}}
.nav-menu .nm-h{{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);margin:10px 0 2px;padding:10px 13px 0;border-top:1px solid var(--line)}}

/* A fixed height with the button's own padding still in play pushed the label
   off centre; the flex centring is what actually holds it. */
header .btn.nav-cta{{height:38px;padding:0 18px;font-size:13.5px;margin-left:4px;
  display:inline-flex;align-items:center;justify-content:center;line-height:1}}

/* The demo line belongs to home services, so it is signposted there rather
   than sold as a separate button in the bar. */
.nm-demo{{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;
  font-family:var(--body);font-style:normal;font-size:10px;font-weight:700;
  letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;
  color:var(--cyan);background:color-mix(in srgb,var(--cyan) 15%,transparent);
  border-radius:999px;padding:3px 9px;margin-left:8px}}
.nm-demo .pulse{{width:6px;height:6px;border-radius:50%;background:var(--cyan);
  box-shadow:0 0 8px var(--cyan);animation:nmblip 1.7s ease-in-out infinite}}
@keyframes nmblip{{0%,100%{{opacity:1;transform:scale(1)}}50%{{opacity:.3;transform:scale(.8)}}}}
@media (prefers-reduced-motion:reduce){{ .nm-demo .pulse{{animation:none}} }}
@media (max-width:1020px){{
  .nav{{display:none}}
  header .bar .btn.nav-cta{{display:none}}
  .burger{{display:flex}}
}}
@media (min-width:1021px){{ .mnav{{display:none}} }}

/* ---- Win-back ---- */
.wb-hero{{padding-top:clamp(40px,5vw,62px)}}
.wb-art{{display:block;margin-top:38px}}
.wb-art img{{width:100%;height:auto;border-radius:16px;border:1px solid var(--line)}}
html[data-theme="light"] .wb-art img{{box-shadow:0 18px 44px rgba(13,23,41,.10)}}
.th-dark{{display:none}}
html[data-theme="dark"] .th-light{{display:none}}
html[data-theme="dark"] .th-dark{{display:block}}
.btns-l{{display:flex;gap:12px;flex-wrap:wrap}}
.wb-list{{margin:0;padding-left:20px}}
.wb-list li{{font-size:15.5px;margin-bottom:10px;line-height:1.6}}
.wb-list li:last-child{{margin-bottom:0}}
.wb-faq .role summary h3{{font-size:17px;margin:0}}
.wb-faq .role-body p{{font-size:15.5px;margin:0}}
.center .badges{{justify-content:center}}

/* ---- Pay options -------------------------------------------------------
   Three cards of unequal length, so they stretch to a shared height and the
   CTA pins to the bottom; otherwise the buttons stagger and the row reads as
   broken rather than as three choices. ---- */
.pays{{display:grid;gap:16px;grid-template-columns:repeat(2,1fr);margin-top:30px;
  max-width:760px}}
@media (max-width:900px){{ .pays{{grid-template-columns:1fr}} }}
.pay{{display:flex;flex-direction:column;background:var(--bg2);border:1px solid var(--line);
  border-radius:16px;padding:24px}}
html[data-theme="light"] .pay{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.pay h3{{font-size:19px;margin-bottom:6px}}
.pay h3 em{{display:block;font-style:normal;font-family:var(--body);font-size:13px;
  font-weight:500;color:var(--muted);margin-top:3px}}
.pay-d{{font-size:14.5px;color:var(--muted);margin-bottom:18px}}
.pay-h{{font-size:11px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;
  color:var(--faint);margin-bottom:8px}}
.pay-l{{margin:0 0 18px 18px;padding:0}}
.pay-l li{{font-size:14.5px;margin-bottom:7px;line-height:1.5}}
.pay-b{{font-size:14.5px;margin:0 0 20px;padding-top:16px;border-top:1px solid var(--line)}}
.pay-b span{{display:block;font-size:11px;font-weight:700;letter-spacing:.11em;
  text-transform:uppercase;color:var(--faint);margin-bottom:4px}}
.pay .btn{{margin-top:auto;width:100%}}

/* Pros and cons, side by side where there is room. */
.procon{{display:grid;gap:26px;grid-template-columns:1fr 1fr}}
@media (max-width:720px){{ .procon{{grid-template-columns:1fr}} }}
.procon h4{{margin-top:0}}
.procon ul{{margin:0 0 0 18px;padding:0}}
.procon li{{font-size:14.5px;margin-bottom:8px;line-height:1.55}}

/* A one-word badge per card, so the three options can be told apart before
   reading them. */
.pay-badge{{align-self:flex-start;font-size:10px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--blue);background:var(--blue-glow);
  border-radius:5px;padding:4px 8px;margin-bottom:12px}}

/* ---- Price line on the pay cards ---- */
.pay-p{{font-family:var(--display);font-size:30px;font-weight:700;letter-spacing:-.02em;
  line-height:1.1;margin:0 0 6px}}
.pay-p em{{display:block;font-style:normal;font-family:var(--body);font-size:13px;
  font-weight:500;color:var(--muted);letter-spacing:0;margin-top:4px}}
.pay-p-q{{font-size:20px;color:var(--text)}}

/* ---- Campaign cost calculator -------------------------------------------
   Two columns on desktop: the inputs stay put while the numbers to their
   right change, so the cause and the effect are visible at once. ---- */
.calc2{{display:grid;gap:20px;grid-template-columns:1fr 1fr;margin-top:30px;align-items:start}}
@media (max-width:860px){{ .calc2{{grid-template-columns:1fr}} }}
.calc2-in,.calc2-out{{background:var(--bg2);border:1px solid var(--line);
  border-radius:16px;padding:24px}}
html[data-theme="light"] .calc2-in,html[data-theme="light"] .calc2-out{{
  box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.cf{{margin-bottom:22px}}
.cf:last-child{{margin-bottom:0}}
.cf label{{display:block;font-size:13px;font-weight:700;margin-bottom:8px}}
.cf-row{{display:flex;align-items:center;gap:12px}}
.cf-row input[type=range]{{flex:1 1 auto;min-width:0;accent-color:var(--blue);height:26px}}
.cf-row input[type=number]{{flex:0 0 92px;width:92px;font-family:var(--body);font-size:15px;
  color:var(--text);background:var(--bg3);border:1px solid var(--line2);border-radius:9px;
  padding:9px 10px;text-align:right}}
html[data-theme="light"] .cf-row input[type=number]{{background:#fbfcfe}}
.cf-row input[type=number]:focus{{border-color:var(--blue);outline:none}}
.cf-help{{font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:8px}}
.chips{{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}}
.chip{{font-family:var(--body);font-size:12px;font-weight:600;color:var(--muted);
  background:none;border:1px solid var(--line2);border-radius:999px;padding:5px 11px;
  cursor:pointer;transition:color .15s,border-color .15s}}
.chip:hover{{color:var(--text);border-color:color-mix(in srgb,var(--blue) 55%,transparent)}}

.co-big{{font-family:var(--display);font-size:clamp(26px,4vw,34px);font-weight:700;
  letter-spacing:-.02em;line-height:1.1;margin-bottom:4px}}
.co-sub{{font-size:13.5px;color:var(--muted);margin-bottom:16px}}
.co-rev{{font-size:15px;margin-bottom:20px}}
.co-rev b{{font-family:var(--display);font-size:19px}}
.co-note{{display:block;font-size:12px;color:var(--muted);margin-top:2px}}
.co-cards{{display:grid;gap:12px;grid-template-columns:1fr}}
.co-cards[hidden]{{display:none}}
.co-card{{position:relative;background:var(--bg3);border:1px solid var(--line);
  border-radius:12px;padding:16px}}
.co-k{{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted);margin-bottom:4px}}
.co-v{{font-family:var(--display);font-size:24px;font-weight:700;line-height:1.1}}
.co-x{{font-size:13px;color:var(--muted);margin-top:2px}}
.co-free{{background:var(--bg3);border:1px solid color-mix(in srgb,var(--blue) 45%,transparent);
  border-radius:12px;padding:16px;font-size:15px;font-weight:600}}
.co-free[hidden]{{display:none}}
.co-more{{font-size:13px;color:var(--muted);margin-top:14px;text-align:center;line-height:1.55}}
.co-more-s{{font-size:12px;color:var(--faint);margin-top:6px}}
.calc2-out .fine{{margin:16px 0 18px}}
.calc2-out .btn{{width:100%}}

/* ---- Add-ons: a price list, not a card grid ---- */
.addons{{margin:28px 0 0;max-width:860px}}
.addons > div{{display:flex;justify-content:space-between;align-items:baseline;gap:24px;
  padding:13px 0;border-bottom:1px solid var(--line)}}
.addons > div:first-child{{border-top:1px solid var(--line)}}
.addons dt{{font-size:15px;line-height:1.5}}
.addons dd{{margin:0;flex:0 0 auto;font-size:15px;font-weight:700;white-space:nowrap;
  color:var(--text)}}
@media (max-width:600px){{
  .addons > div{{flex-direction:column;gap:3px}}
  .addons dd{{font-size:14.5px;color:var(--blue)}}
}}
</style>
</head>
<body data-page="{slug}">

<header>
  <div class="bar">
    <a class="brand" href="/" aria-label="VoiceCaptures home">
      <img src="/logo-mark.png" alt="" width="32" height="32">
      <span>VoiceCaptures</span>
    </a>
    <nav class="nav" aria-label="Main">
      <div class="nav-drop">
        <button type="button" class="nav-a nav-trigger" id="nav-sectors" aria-expanded="false" aria-haspopup="true">
          AI receptionist
          <svg class="nav-car" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor"
                  stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="nav-menu" id="nav-menu" hidden>
          <a href="/personal/"><i></i><b>Personal line</b><em>Screens calls to your own phone</em></a>
          <p class="nm-h">Businesses</p>
          <a href="/home-services/"><i></i><b>Home services <span class="nm-demo" data-demo-go><span class="pulse" aria-hidden="true"></span>Try the demo</span></b><em>Plumbing, HVAC, electrical</em></a>
          <a href="/restaurants-cafes/"><i></i><b>Restaurants &amp; caf&eacute;s</b><em>Reservations, takeout, catering</em></a>
          <a href="/clinics-dental/"><i></i><b>Clinics &amp; dental</b><em>Patients, bookings, overflow</em></a>
          <a href="/other-businesses/"><i></i><b>Something else</b><em>Salons, studios, venues</em></a>
        </div>
      </div>
      <a class="nav-a nav-wb" href="/win-back/"{cur_winback}>Win-back</a>
      <a class="nav-a" href="/contact/"{cur_contact}>Contact</a>
      <a class="nav-a nav-cal" href="{cal}" target="_blank" rel="noopener">Book a call</a>
      <a class="nav-a nav-dash" href="/login" title="Members dashboard &mdash; for VoiceCaptures client businesses"><span class="dot" aria-hidden="true"></span>Dashboard<em class="tag">New</em></a>
    </nav>
    <button type="button" class="burger" id="burger" aria-label="Menu"
            aria-expanded="false" aria-controls="mnav">
      <span></span><span></span><span></span>
    </button>
    <button type="button" class="theme-btn" id="theme-btn" aria-label="Switch theme" title="Switch theme">
      <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2 12h2.6M19.4 12H22M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"/></svg>
      <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/></svg>
    </button>
{cta}
  </div>

  <div class="mnav" id="mnav" hidden>
    <div class="mnav-in">
      <a class="mnav-dash" href="/login">
        <span class="dot" aria-hidden="true"></span>
        <span>
          <span class="mnav-dash-t">Members dashboard</span>
          <span class="mnav-dash-s">For VoiceCaptures client businesses</span>
        </span>
        <em class="tag">New</em>
      </a>
      <a class="mnav-a" href="/">Home</a>
      <p class="mnav-h">AI receptionist</p>
      <a class="mnav-a sub" href="/personal/">Personal line</a>
      <a class="mnav-a sub" href="/home-services/">Home services <span class="nm-demo" data-demo-go><span class="pulse" aria-hidden="true"></span>Try the demo</span></a>
      <a class="mnav-a sub" href="/restaurants-cafes/">Restaurants &amp; caf&eacute;s</a>
      <a class="mnav-a sub" href="/clinics-dental/">Clinics &amp; dental</a>
      <a class="mnav-a sub" href="/other-businesses/">Something else</a>
      <p class="mnav-h">Outbound</p>
      <a class="mnav-a mnav-wb" href="/win-back/"><span class="wbdot" aria-hidden="true"></span>Win-back campaigns</a>
      <p class="mnav-h">Company</p>
      <a class="mnav-a sub" href="/about/">About</a>
      <a class="mnav-a sub" href="/careers/">Careers</a>
      <a class="mnav-a sub" href="/contact/">Contact</a>
      <div class="mnav-foot">
        <a class="btn btn-amber" href="{cal}" target="_blank" rel="noopener">Book a call</a>
      </div>
    </div>
  </div>
</header>

{body}

<footer>
  <div class="wrap foot">
    <div>
      <div class="brand"><img src="/logo-mark.png" alt="" width="28" height="28"><span>VoiceCaptures</span></div>
      <div class="tl">Answers &middot; Qualifies &middot; Books</div>
    </div>
    <div class="foot-legal">
      <a href="/login">Client dashboard</a>
      <a class="f-wb" href="/win-back/">Win-back campaigns</a>
      <a href="/about/">About</a>
      <a href="/careers/">Careers</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy Policy</a>
      <a href="/terms/">Terms of Service</a>
    </div>
    <a href="mailto:{email}">{email}</a>
    <span class="desc">A human-sounding AI receptionist, configured for your business</span>
  </div>
</footer>

<script>
(function(){{
  var d = document.querySelector(".nav-drop");
  if (d) {{
    var t = d.querySelector(".nav-trigger"), m = d.querySelector(".nav-menu");
    function shut(){{ m.hidden = true; t.setAttribute("aria-expanded", "false"); }}
    t.addEventListener("click", function(e){{
      e.stopPropagation();
      if (m.hidden) {{ m.hidden = false; t.setAttribute("aria-expanded", "true"); }}
      else shut();
    }});
    m.addEventListener("click", function(e){{ e.stopPropagation(); }});
    document.addEventListener("click", shut);
    document.addEventListener("keydown", function(e){{ if (e.key === "Escape") shut(); }});
  }}
  // The badge sits inside the Home services row; clicking it means the demo,
  // not the sector page it is pinned to.
  document.addEventListener("click", function(e){{
    if (!e.target.closest("[data-demo-go]")) return;
    e.preventDefault();
    location.href = "/home-services/#demo";
  }}, true);
}})();

(function(){{
  var btn = document.getElementById("theme-btn");
  if (!btn) return;
  var KEY = "vc_theme";
  function apply(t){{
    document.documentElement.setAttribute("data-theme", t);
    btn.setAttribute("aria-label", t === "light" ? "Switch to dark mode" : "Switch to light mode");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? "#f6f8fc" : "#05070c");
  }}
  var saved;
  try {{ saved = localStorage.getItem(KEY); }} catch(e){{}}
  apply(saved === "dark" ? "dark" : "light");
  btn.addEventListener("click", function(){{
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next);
    try {{ localStorage.setItem(KEY, next); }} catch(e){{}}
  }});
}})();
</script>

<script>
(function(){{
  var btn = document.getElementById("burger"), panel = document.getElementById("mnav");
  if (!btn || !panel) return;
  function close(){{ panel.hidden = true; btn.setAttribute("aria-expanded","false"); }}
  btn.addEventListener("click", function(e){{
    e.stopPropagation();
    if (panel.hidden) {{ panel.hidden = false; btn.setAttribute("aria-expanded","true"); }}
    else close();
  }});
  panel.addEventListener("click", function(e){{ if (e.target.closest("a")) close(); }});
  document.addEventListener("keydown", function(e){{ if (e.key === "Escape") close(); }});
  window.addEventListener("resize", function(){{
    if (window.innerWidth > 900 && !panel.hidden) close();
  }});
}})();
</script>
{script}

</body>
</html>
"""

# ---------------------------------------------------------------- about ----

ABOUT_BODY = f"""
<section>
  <div class="wrap">
    <p class="eyebrow">About us</p>
    <h1>Every call answered. <span class="hl">Every lead captured.</span></h1>
    <p class="lede">VoiceCaptures builds AI voice assistants that answer the phone
    for small and mid-sized businesses, wherever they are &mdash; so the calls
    that arrive while you are on a job, mid-service or closed for the night still
    turn into booked work.</p>
  </div>
</section>

<section class="alt">
  <div class="wrap prose">
    <h2>What we do</h2>
    <p>Most small businesses still run on the phone. A caller who reaches
    voicemail rarely leaves a message &mdash; they call the next name on the list.
    For a trade, a clinic or a restaurant, that is revenue walking out the door
    several times a week, and it usually goes uncounted because a missed call
    leaves no trace.</p>

    <p>We put a voice assistant on the line instead. It answers in your
    business's name, sounds like a person rather than a phone tree, and handles
    the call the way your front desk would: it works out what the caller needs,
    asks the qualifying questions that matter for your trade, books the
    appointment straight into your real calendar, and texts you a summary of who
    called and what they wanted. If the caller asks for details by text, it sends
    them before hanging up.</p>

    <h2>How we build</h2>
    <p>We do not ship a generic bot with your name swapped into the greeting.
    Each assistant is configured around one business &mdash; its services, its
    pricing questions, its booking rules, its calendar, the objections its
    callers actually raise. A dental office needs to separate a new patient from
    an emergency; a plumber needs to know whether water is currently on the
    floor. Those are different assistants, not different greetings.</p>

    <p>That extends to the systems you already run. Where a business has a CRM,
    a booking tool or a scheduling system, we integrate with it rather than
    asking anyone to work somewhere new. Custom integration work is quoted
    separately, because it is real work and pretending otherwise leads to a
    worse product.</p>

    <h2>Where we are</h2>
    <p>We are headquartered in {ADDR}, and we work with businesses wherever they
    are. The assistant answers on your existing number, so nothing about the
    setup depends on where you or we happen to be: numbers, time zones, hours,
    currency and the way the assistant speaks are configured per business.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>What we care about</h2>
    <p class="lede">Three things shape most of the decisions we make about the
    product.</p>
    <div class="cards">
      <div class="card">
        <div class="ic">01</div>
        <h3>It has to sound human</h3>
        <p>If a caller realises they are talking to a machine and hangs up, the
        assistant has failed no matter how good the transcript looks. Natural
        speech is the product, not a feature of it.</p>
      </div>
      <div class="card">
        <div class="ic">02</div>
        <h3>Booked work, not call volume</h3>
        <p>Answering a call is easy. We measure whether the call turned into an
        appointment on a calendar, because that is the only number that shows up
        in a business owner's month.</p>
      </div>
      <div class="card">
        <div class="ic">03</div>
        <h3>Careful with what callers say</h3>
        <p>Recordings and transcripts are kept 14 days and then deleted unless
        a business chooses longer, and for clinics, call recording is off by
        default. A clinic line hears things that should not sit on a server
        indefinitely.</p>
      </div>
    </div>
  </div>
</section>

<section class="alt" id="contact">
  <div class="wrap">
    <h2>Get in touch</h2>
    <p class="lede">Questions about the product, pricing, or whether it fits how
    your calls actually work &mdash; send us the details and we will come back to
    you within a day. If you would rather talk it through,
    <a href="{CAL30}" target="_blank" rel="noopener">book a 30-minute call</a>.</p>
    <div class="pcta" style="margin-top:22px">
      <a class="btn btn-primary" href="/contact/">Contact us</a>
      <a class="btn btn-ghost" href="mailto:{EMAIL}">{EMAIL}</a>
    </div>
  </div>
</section>
"""

ABOUT_SCRIPT = ""

# -------------------------------------------------------------- careers ----

def role_block(rid, title, summary, location, commitment, comp,
               responsibilities, looking, why):
    def li(items):
        return "\n".join(f"      <li>{x}</li>" for x in items)
    return f"""
<details class="role" id="role-{rid}">
  <summary>
    <div class="role-top">
      <div>
        <h3>{title}</h3>
        <p class="role-sum">{summary}</p>
      </div>
      <span class="role-toggle">
        <span class="lbl-more">Details</span><span class="lbl-less">Close</span>
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"
          fill="none" stroke="currentColor" stroke-width="1.7"
          stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </div>
    <div class="role-meta">
      <span class="badge">{location}</span>
      <span class="badge">{commitment}</span>
      <span class="badge">{comp}</span>
      <span class="badge badge-live">Rolling applications</span>
    </div>
  </summary>
  <div class="role-body">
    <h4>What you'd do</h4>
    <ul>
{li(responsibilities)}
    </ul>
    <h4>Who we're looking for</h4>
    <ul>
{li(looking)}
    </ul>
    <h4>Why consider it</h4>
    <ul>
{li(why)}
    </ul>
    <div class="apply">
      <a class="btn btn-primary" href="#apply" data-role="{rid}">Apply for this role</a>
    </div>
  </div>
</details>
"""


SDR = role_block(
    "sdr",
    "Part-Time Sales Development Representative",
    "Help us reach local business owners, introduce VoiceCaptures, qualify interest, and book product demos.",
    "GTA preferred &middot; primarily remote",
    "~6&ndash;10 hrs/week",
    "CA$20&ndash;$25/hr + bonuses",
    [
        "Call local businesses from lead lists we provide",
        "Speak with owners and decision-makers",
        "Give a short, conversational introduction to VoiceCaptures",
        "Ask basic qualifying questions",
        "Book qualified product demos",
        "Track call outcomes, notes, and follow-ups",
        "Share objections and customer feedback so we can improve the sales process",
    ],
    [
        "Comfortable speaking with strangers on the phone",
        "Clear and professional communicator",
        "Reliable and consistent",
        "Able to handle rejection without losing momentum",
        "Comfortable working independently",
        "Interested in sales, startups, entrepreneurship, or AI",
        "Previous sales, customer service, retail, fundraising, or call-centre experience is helpful but not required",
        "Students and recent graduates are encouraged to apply",
    ],
    [
        "Real B2B sales experience",
        "Direct exposure to startup customer acquisition",
        "Practice with cold calling, qualification, and objection handling",
        "Work directly with the founder",
        "Flexible schedule",
        "Performance bonuses",
        "Opportunity to take on more responsibility if there is mutual fit",
    ],
)

MKT = role_block(
    "marketing",
    "Part-Time Digital Marketing Associate",
    "Help test and improve our digital customer-acquisition channels, especially Meta advertising and landing-page conversion.",
    "Toronto / GTA preferred &middot; remote-friendly",
    "~5&ndash;10 hrs/week",
    "CA$20&ndash;$25/hr + possible bonuses",
    [
        "Help create and launch small-budget Meta/Facebook/Instagram ad campaigns",
        "Create or adapt simple ad creatives and copy",
        "Test different verticals, offers, hooks, and audiences",
        "Monitor campaign metrics",
        "Track qualified leads, booked demos, and conversions rather than vanity metrics",
        "Suggest landing-page and funnel improvements",
        "Help organize campaign results and learnings",
        "Work directly with the founder on short marketing experiments",
    ],
    [
        "Some practical familiarity with Meta Ads Manager or paid social",
        "Good written communication and basic visual judgment",
        "Comfortable working with small budgets and testing quickly",
        "Analytical enough to distinguish clicks from actual business outcomes",
        "Interested in startups, growth, AI, or performance marketing",
        "Student, recent grad, junior marketer, or freelancer is fine",
        "A portfolio or examples of campaigns/creative are useful but not mandatory",
    ],
    [
        "Run real campaigns rather than classroom exercises",
        "Direct responsibility for measurable acquisition experiments",
        "Exposure to AI/startup go-to-market work",
        "Flexible hours",
        "Direct founder collaboration",
        "Potential for a larger role if the channel works",
    ],
)

CAREERS_BODY = f"""
<section>
  <div class="wrap">
    <p class="eyebrow">Careers</p>
    <h1>Build with <span class="hl">VoiceCaptures</span></h1>
    <p class="lede">We're building AI voice systems that help businesses answer
    every call, qualify customers, and capture more opportunities.</p>
    <p class="lede">We're a small, early-stage team looking for people who want
    real ownership, direct exposure to customers, and the chance to help shape
    how the company grows.</p>
    <div class="badges">
      <span class="badge">Toronto-based</span>
      <span class="badge">Remote-friendly</span>
      <span class="badge badge-live">Rolling applications</span>
    </div>
    <a class="btn btn-primary" href="#roles">View open roles</a>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <h2>Why join</h2>
    <div class="cards">
      <div class="card">
        <div class="ic">01</div>
        <h3>Real ownership</h3>
        <p>You'll own a channel or a process outright. The work you do in a
        week is visible in the numbers the same week &mdash; there is nowhere
        for it to disappear.</p>
      </div>
      <div class="card">
        <div class="ic">02</div>
        <h3>Direct founder access</h3>
        <p>You work directly with the founder. Decisions take hours rather than
        sprints, and feedback comes from the person who sees every customer
        conversation.</p>
      </div>
      <div class="card">
        <div class="ic">03</div>
        <h3>AI and startup experience</h3>
        <p>This is a real commercial AI product with paying customers, not a
        prototype. You'll see how one gets sold, priced and supported.</p>
      </div>
      <div class="card">
        <div class="ic">04</div>
        <h3>Flexible work</h3>
        <p>Part-time and remote-friendly. We care about the hours landing, not
        about when in the week you put them in.</p>
      </div>
    </div>
  </div>
</section>

<section id="roles">
  <div class="wrap">
    <h2>Open roles</h2>
    <p class="lede">We review applications on an ongoing basis. There's no
    closing date &mdash; if the fit is right, we'll be in touch.</p>
    {SDR}
    {MKT}
  </div>
</section>

<section class="alt" id="apply">
  <div class="wrap">
    <h2>Apply</h2>
    <p class="lede">One form for both roles. A resume is required; a cover
    letter is optional but read.</p>

    <div class="formwrap">
      <form id="apply-form" novalidate>
        <div class="grid2">
          <div class="f">
            <label for="a-name">Full name</label>
            <input id="a-name" name="full_name" type="text" autocomplete="name" required>
          </div>
          <div class="f">
            <label for="a-email">Email</label>
            <input id="a-email" name="email" type="email" autocomplete="email" required>
          </div>
        </div>

        <div class="grid2">
          <div class="f">
            <label for="a-phone">Phone <span class="opt">optional</span></label>
            <input id="a-phone" name="phone" type="tel" autocomplete="tel">
          </div>
          <div class="f">
            <label for="a-city">City / location</label>
            <input id="a-city" name="city" type="text" autocomplete="address-level2"
                   placeholder="e.g. Toronto, ON">
          </div>
        </div>

        <div class="grid2">
          <div class="f">
            <label for="a-role">Role you're applying for</label>
            <select id="a-role" name="role" required>
              <option value="">Choose a role</option>
              <option value="sdr">Part-Time Sales Development Representative</option>
              <option value="marketing">Part-Time Digital Marketing Associate</option>
              <option value="general">Something else / future opportunities</option>
            </select>
          </div>
          <div class="f">
            <label for="a-avail">Availability per week</label>
            <input id="a-avail" name="availability" type="text" placeholder="e.g. 8 hours, weekday evenings">
          </div>
        </div>

        <div class="grid2">
          <div class="f">
            <label for="a-bg">School / program or current role <span class="opt">optional</span></label>
            <input id="a-bg" name="background" type="text">
          </div>
          <div class="f">
            <label for="a-li">LinkedIn <span class="opt">optional</span></label>
            <input id="a-li" name="linkedin" type="url" placeholder="https://">
          </div>
        </div>

        <div class="f" id="f-portfolio" hidden>
          <label for="a-port">Portfolio or campaign examples <span class="opt">optional</span></label>
          <input id="a-port" name="portfolio" type="url" placeholder="https://">
        </div>

        <div class="grid2">
          <div class="f">
            <label for="a-resume">Resume</label>
            <input id="a-resume" name="resume" type="file" accept=".pdf,.doc,.docx,.txt" required>
            <div class="hint">PDF, Word or plain text. Up to 5 MB.</div>
          </div>
          <div class="f">
            <label for="a-cover">Cover letter <span class="opt">optional</span></label>
            <input id="a-cover" name="cover" type="file" accept=".pdf,.doc,.docx,.txt">
            <div class="hint">If you'd rather write it in the box below, skip this.</div>
          </div>
        </div>

        <div class="f">
          <label for="a-standout">What makes you a standout for this role?</label>
          <textarea id="a-standout" name="standout" required
            placeholder="The thing about you we wouldn't work out from a resume."></textarea>
        </div>

        <div class="f">
          <label for="a-why">Why are you interested in this role? <span class="opt">optional</span></label>
          <textarea id="a-why" name="why"></textarea>
        </div>

        <div class="f" id="f-q-sdr" hidden>
          <label for="a-q-sdr">A business owner says, &ldquo;We already answer our phones.&rdquo;
            In 2&ndash;4 sentences, how would you respond?</label>
          <textarea id="a-q-sdr"></textarea>
        </div>

        <div class="f" id="f-q-mkt" hidden>
          <label for="a-q-mkt">Briefly describe a paid social campaign you would test
            first for VoiceCaptures.</label>
          <textarea id="a-q-mkt"></textarea>
        </div>

        <label class="check">
          <input type="checkbox" id="a-consent" required>
          <span>I agree that VoiceCaptures may use the information I provide to
          evaluate my application and contact me about current or future
          opportunities.</span>
        </label>

        <button class="btn btn-primary" type="submit" id="a-submit" style="width:100%">Submit application</button>
        <div class="f-msg" id="a-msg" role="alert"></div>
      </form>

      <div class="f-ok" id="a-ok">
        <div class="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg></div>
        <h3>Application received</h3>
        <p>We review applications on a rolling basis and will contact candidates
        whose experience matches a current need.</p>
      </div>
    </div>

    <p class="fine" style="margin-top:18px;max-width:760px">What you send is stored
    securely and used only to assess your application. See our
    <a href="/privacy/">privacy policy</a>, or email
    <a href="mailto:{EMAIL}">{EMAIL}</a> to have it deleted.</p>
  </div>
</section>
"""

CAREERS_SCRIPT = f"""
<script>
(function(){{
  var API = "{API}";
  var MAX = 5 * 1024 * 1024;

  var form = document.getElementById("apply-form"),
      msg  = document.getElementById("a-msg"),
      ok   = document.getElementById("a-ok"),
      btn  = document.getElementById("a-submit"),
      role = document.getElementById("a-role");
  if (!form) return;

  function fail(t){{
    msg.textContent = t; msg.className = "f-msg err";
    btn.disabled = false; btn.textContent = "Submit application";
  }}

  /* Show only the question that belongs to the chosen role. A blank box for a
     role someone isn't applying to reads as a form that wasn't finished. */
  function syncRole(){{
    var v = role.value;
    document.getElementById("f-q-sdr").hidden = v !== "sdr";
    document.getElementById("f-q-mkt").hidden = v !== "marketing";
    document.getElementById("f-portfolio").hidden = v !== "marketing";
  }}
  role.addEventListener("change", syncRole);
  syncRole();

  /* "Apply for this role" inside a role card preselects it, so nobody has to
     scroll back up to remember which one they opened. */
  document.querySelectorAll('.apply a[data-role]').forEach(function(a){{
    a.addEventListener("click", function(){{
      role.value = a.getAttribute("data-role");
      syncRole();
    }});
  }});

  function readFile(input, label){{
    return new Promise(function(resolve, reject){{
      var f = input.files && input.files[0];
      if (!f) return resolve(null);
      if (f.size > MAX) return reject(new Error(label + " is larger than 5 MB."));
      var fr = new FileReader();
      fr.onerror = function(){{ reject(new Error("Couldn't read your " + label.toLowerCase() + ".")); }};
      fr.onload = function(){{
        // Strip the "data:...;base64," prefix; the server wants the payload.
        var s = String(fr.result);
        resolve({{ name: f.name, type: f.type || "application/octet-stream",
                  data: s.slice(s.indexOf(",") + 1) }});
      }};
      fr.readAsDataURL(f);
    }});
  }}

  form.addEventListener("submit", function(e){{
    e.preventDefault();
    msg.className = "f-msg";

    var name = form.full_name.value.trim(),
        email = form.email.value.trim();

    if (!name || !email) return fail("Name and email are needed.");
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) return fail("That email doesn't look right.");
    if (!role.value) return fail("Pick the role you're applying for.");
    if (!form.standout.value.trim()) return fail("Tell us what makes you a standout.");
    if (!document.getElementById("a-resume").files[0]) return fail("A resume is needed.");
    if (!document.getElementById("a-consent").checked) return fail("Please tick the consent box.");

    btn.disabled = true;
    btn.textContent = "Uploading...";

    var answer = role.value === "sdr"       ? document.getElementById("a-q-sdr").value.trim()
               : role.value === "marketing" ? document.getElementById("a-q-mkt").value.trim()
               : "";

    Promise.all([
      readFile(document.getElementById("a-resume"), "Resume"),
      readFile(document.getElementById("a-cover"), "Cover letter")
    ]).then(function(files){{
      btn.textContent = "Submitting...";
      return fetch(API + "/apply", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          full_name: name,
          email: email,
          phone: form.phone.value.trim(),
          city: form.city.value.trim(),
          role: role.value,
          background: form.background.value.trim(),
          linkedin: form.linkedin.value.trim(),
          portfolio: document.getElementById("a-port").value.trim(),
          availability: form.availability.value.trim(),
          standout: form.standout.value.trim(),
          why: form.why.value.trim(),
          role_answer: answer,
          consent: true,
          source: "careers",
          resume: files[0],
          cover: files[1]
        }})
      }});
    }})
    .then(function(r){{ return r.json().catch(function(){{ return {{ ok:false }}; }}); }})
    .then(function(d){{
      if (d && d.ok) {{ form.style.display = "none"; ok.style.display = "block"; return; }}
      fail((d && d.error) || "Couldn't submit that. Try again, or email {EMAIL}.");
    }})
    .catch(function(err){{
      fail(err && err.message ? err.message
           : "Couldn't reach the server. Try again, or email {EMAIL}.");
    }});
  }});
}})();
</script>
"""


# -------------------------------------------------------------- win-back ----

WINBACK_BODY = f"""

<section class="wb-hero">
  <div class="wrap">
    <p class="eyebrow">Outbound campaigns</p>
    <h1>Send us the customers you haven&rsquo;t seen in a year.<br>
    <span class="hl">We call them and book them back in.</span></h1>
    <p class="lede">One flat price per campaign, or own the system outright.</p>
    <p class="lede">You already have the list. Every business does &mdash; the
    clients who were regulars and then quietly stopped coming, the ones due for a
    seasonal service, the renewals nobody chased. We work through it and book the
    ones who are ready.</p>
    <div class="btns-l">
      <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a 30-minute chat</a>
    </div>
    <div class="badges" style="margin-top:22px">
      <span class="badge">Bookings on your calendar</span>
      <span class="badge">Results report after every campaign</span>
      <span class="badge badge-live">One price, or own it</span>
    </div>
    <picture class="wb-art th-light">
      <source srcset="/winback-light.webp" type="image/webp">
      <img src="/winback-light.png" alt="A stack of past-customer records on the left, connected by call icons to booked appointments filling a calendar on the right." width="1400" height="788" loading="lazy" decoding="async">
    </picture>
    <picture class="wb-art th-dark">
      <source srcset="/winback-dark.webp" type="image/webp">
      <img src="/winback-dark.png" alt="" width="1400" height="788" loading="lazy" decoding="async">
    </picture>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <h2>Where it fits</h2>
    <p class="lede">Anywhere the work comes back round on a cycle.</p>
    <div class="cards">
      <div class="card">
        <h3>HVAC</h3>
        <p>Fall furnace maintenance callbacks, before the first cold snap fills
        your schedule with emergencies instead.</p>
      </div>
      <div class="card">
        <h3>Home services</h3>
        <p>Check in with past clients for repeat work &mdash; the jobs that only
        happen because somebody remembered to ask.</p>
      </div>
      <div class="card">
        <h3>Real estate &amp; staging</h3>
        <p>Follow up with past clients who have moved on and would come back
        if prompted.</p>
      </div>
      <div class="card">
        <h3>Mortgage &amp; finance</h3>
        <p>Renewal and check-in calls, made before the renewal date rather
        than after someone else has called.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>How it works</h2>
    <p class="lede">Four steps. The only work on your side is the first one.</p>
    <div class="cards">
      <div class="card">
        <div class="ic">01</div>
        <h3>You send a list</h3>
        <p>A CSV export from your booking or practice software: name, phone,
        and the date you last saw them. Most systems export this in a couple of
        clicks.</p>
      </div>
      <div class="card">
        <div class="ic">02</div>
        <h3>We reach out</h3>
        <p>We reach out on your behalf, under your business name. Every contact
        is logged, so you can see exactly who was approached and when.</p>
      </div>
      <div class="card">
        <div class="ic">03</div>
        <h3>The agent books them</h3>
        <p>It talks through what they&rsquo;re due for, finds a slot that works,
        and puts the appointment straight on your real calendar.</p>
      </div>
      <div class="card">
        <div class="ic">04</div>
        <h3>You see all of it</h3>
        <p>Every call, recording and booking shows up in your dashboard, with a
        results report at the end of the campaign.</p>
      </div>
    </div>
  </div>
</section>

<section class="alt" id="pay">
  <div class="wrap">
    <h2>Choose how you pay</h2>
    <p class="lede">Two ways to run it. Which one fits depends on how much you
    want to own, and how much you want handled.</p>

    <div class="pays">
      <div class="pay">
        <span class="pay-badge">Simplest</span>
        <h3>Per campaign</h3>
        <p class="pay-p">$2.50<em> per customer on your list</em></p>
        <p class="pay-d">$500 minimum (covers 200 customers). One flat price,
        start to finish.</p>
        <p class="pay-h">What&rsquo;s included</p>
        <ul class="pay-l">
          <li>A call script tailored to your business</li>
          <li>All calling and AI usage</li>
          <li>Bookings on your calendar</li>
          <li>Dashboard with recordings</li>
          <li>Results report</li>
          <li>Support during the campaign</li>
        </ul>
        <p class="pay-b"><span>Best for</span>A one-time push, like seasonal
        maintenance or annual recalls.</p>
        <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a 30-minute chat</a>
      </div>

      <div class="pay">
        <span class="pay-badge">Own it</span>
        <h3>Custom</h3>
        <p class="pay-p pay-p-q">Priced on a call</p>
        <p class="pay-d">We build the system and hand it over, running on phone
        and AI accounts you own.</p>
        <p class="pay-h">What&rsquo;s included</p>
        <ul class="pay-l">
          <li>One-time build fee</li>
          <li>You pay the providers directly, at cost &mdash; no markup</li>
          <li>Support is optional: a monthly maintenance plan, or hourly</li>
        </ul>
        <p class="pay-b"><span>Best for</span>Businesses that want full ownership
        of the system and their data.</p>
        <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a 30-minute chat</a>
      </div>
    </div>

    <p class="fine" style="margin-top:16px">All prices in CAD, plus HST. Most
    reactivation services won&rsquo;t quote without a sales call. Ours is above.</p>

    <p class="fine" style="margin-top:10px">The free pilot is the first 20% of
    your list, up to 100 names and never fewer than 25. Custom is a build, so it
    starts with a scoping call instead.</p>

    <details class="role" style="margin-top:22px">
      <summary><div class="role-top"><div><h3>Is Custom right for you?</h3>
        <p class="role-sum">The honest trade-offs, both directions.</p></div>
        <span class="role-toggle"><span class="lbl-more">Read</span><span class="lbl-less">Close</span>
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
          stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span></div></summary>
      <div class="role-body">
        <div class="procon">
          <div>
            <h4>Worth it</h4>
            <ul>
              <li>You own the system, data and accounts end to end</li>
              <li>Your customer list never sits on our systems</li>
              <li>No markup on usage &mdash; you pay providers at cost</li>
              <li>Fully customizable call flows and integrations</li>
              <li>No ongoing dependency on us</li>
            </ul>
          </div>
          <div>
            <h4>Costs you</h4>
            <ul>
              <li>Higher upfront cost</li>
              <li>Several bills &mdash; phone provider, AI provider &mdash; instead of one</li>
              <li>You manage your accounts and usage</li>
              <li>Upkeep when providers change their platforms, covered by the
                  maintenance plan or billed hourly</li>
              <li>You&rsquo;re responsible for calling compliance</li>
              <li>Longer setup than a managed campaign</li>
            </ul>
          </div>
        </div>
      </div>
    </details>
  </div>
</section>

<section id="calculator">
  <div class="wrap">
    <h2>What would a campaign cost you?</h2>
    <p class="lede">Enter your list size and what a visit is worth, and
    we&rsquo;ll price the campaign.</p>

    <div class="calc2">
      <div class="calc2-in">
        <div class="cf">
          <label for="c-list">Customers on your list</label>
          <div class="cf-row">
            <input id="c-list" type="range" min="50" max="5000" step="50" value="500"
                   aria-describedby="c-list-n">
            <input id="c-list-n" type="number" min="50" max="5000" step="50" value="500"
                   aria-label="Customers on your list">
          </div>
        </div>

        <div class="cf">
          <label for="c-val">Average value of one booked visit ($)</label>
          <div class="cf-row">
            <input id="c-val" type="range" min="50" max="2000" step="10" value="150"
                   aria-describedby="c-val-n">
            <input id="c-val-n" type="number" min="50" max="2000" step="10" value="150"
                   aria-label="Average value of one booked visit in dollars">
          </div>
          <div class="chips">
            <button type="button" class="chip" data-val="150">HVAC tune-up $150</button>
            <button type="button" class="chip" data-val="200">Dental cleaning $200</button>
            <button type="button" class="chip" data-val="100">Physio visit $100</button>
            <button type="button" class="chip" data-val="150">Vet exam $150</button>
          </div>
          <p class="cf-help">Examples only. Change to your own.</p>
        </div>

        <div class="cf">
          <label for="c-rate">Expected booking rate (%)</label>
          <div class="cf-row">
            <input id="c-rate" type="range" min="1" max="15" step="0.5" value="4"
                   aria-describedby="c-rate-n">
            <input id="c-rate-n" type="number" min="1" max="15" step="0.5" value="4"
                   aria-label="Expected booking rate, percent">
          </div>
          <p class="cf-help">Results vary with how recent your list is and what
          you&rsquo;re offering. The free pilot shows your real rate.</p>
        </div>
      </div>

      <div class="calc2-out" aria-live="polite">
        <p class="co-big" id="co-bookings">About 20 bookings</p>
        <p class="co-sub" id="co-pilot">including about 4 from the free first 100 names</p>
        <p class="co-rev">Estimated revenue to you: <b id="co-rev">$3,000</b>
          <span class="co-note">before no-shows</span></p>

        <div class="co-cards" id="co-cards">
          <div class="co-card" id="co-c-campaign">
            <p class="co-k">Per campaign</p>
            <p class="co-v" id="co-v-campaign">$1,000</p>
            <p class="co-x" id="co-x-campaign">3.0&times; return</p>
          </div>
        </div>
        <p class="co-free" id="co-free" hidden>Your whole list fits in the free
        pilot. No charge.</p>

        <p class="fine" id="co-disc">Estimates only, not a quote or a guarantee.
        CAD, plus HST. Add-ons not included.</p>

        <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Start with a free pilot</a>

        <p class="co-more">Lists over 2,000, multiple locations, or ongoing
        campaigns? <a href="{CAL}" target="_blank" rel="noopener">Let&rsquo;s talk &rarr;</a></p>
        <p class="co-more co-more-s">Prefer to pay per booking? Ask us after your pilot.</p>
      </div>
    </div>
  </div>
</section>

<section class="alt" id="add-ons">
  <div class="wrap">
    <h2>Add-ons</h2>
    <p class="lede">Every campaign includes a CSV upload, basic list cleanup, one
    call script, booking into Google Calendar, and a results report. Anything
    beyond that is listed here, priced upfront.</p>

    <dl class="addons">
      <div><dt>Pull your list straight from your software (Jobber, Housecall Pro, Jane, your CRM)</dt><dd>from $500</dd></div>
      <div><dt>Record each call&rsquo;s outcome back in your software</dt><dd>from $500, or $750 with the list pull</dd></div>
      <div><dt>Book into your scheduling software instead of Google Calendar</dt><dd>from $1,000</dd></div>
      <div><dt>Integration upkeep</dt><dd>$39/mo per integration</dd></div>
      <div><dt>Extra script for a different customer group</dt><dd>$99 each</dd></div>
      <div><dt>Calls in another language</dt><dd>$99 per language, per campaign</dd></div>
      <div><dt>Live transfer of interested customers to your staff</dt><dd>$149 setup</dd></div>
      <div><dt>Always-on campaign: each customer called automatically when they&rsquo;re due</dt><dd>$2.50 per customer called, plus $99/mo</dd></div>
      <div><dt>Results sent to your own spreadsheet or report format</dt><dd>$150 one-time</dd></div>
      <div><dt>Extra list cleanup</dt><dd>first hour free, then $125/hr</dd></div>
    </dl>

    <p class="fine" style="margin-top:18px;max-width:760px">Software connections
    are a fixed price agreed in writing before work starts. Some software only
    opens its connections to approved partners. If yours doesn&rsquo;t, we use a
    CSV export and Google Calendar instead, and we&rsquo;ll tell you before you
    pay. CAD, plus HST.</p>
  </div>
</section>

<section id="booking">
  <div class="wrap">
    <h2>What counts as a booking</h2>
    <p class="lede">Worth being precise about, since it is what the results
    report counts.</p>
    <div class="formwrap" style="max-width:720px">
      <ul class="wb-list">
        <li>An appointment our agent creates on your calendar, for someone on
            the list you sent.</li>
        <li>Cancelled within 48 hours of being booked &mdash; <strong>not
            billed</strong>.</li>
        <li>A reschedule counts once. The same person booked twice counts
            once.</li>
        <li>Anyone who already had an upcoming appointment is not billed.</li>
        <li>Every billed booking is itemized, and each one matches a call
            recording you can listen to.</li>
      </ul>
    </div>
  </div>
</section>


<section>
  <div class="wrap center">
    <h2>Start with a free pilot</h2>
    <p class="sub">We work the first 20% of your list at no cost &mdash; up to 100
    names, and never fewer than 25. If it books people, you continue at the rates
    above. If it doesn&rsquo;t, you&rsquo;ve lost nothing but the export.</p>
    <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a 30-minute chat</a>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <h2>Questions</h2>
    <div class="wb-faq">
      <details class="role">
        <summary><div class="role-top"><div><h3>Will it sound robotic?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Judge it yourself rather than taking our word for it &mdash; the demo line is live on <a href="tel:+16476921081">+1 (647) 692-1081</a>. It answers as a real business and books a real slot.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>What do you need from me?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>A CSV with name, phone number and last visit date, plus access to the calendar you want appointments to land on. That is the whole setup.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Will my customers know it&rsquo;s an AI?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Yes. Every call opens by saying it&rsquo;s an AI assistant calling on behalf of your business. Anyone can ask not to be called again, and we remove them right away.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>How often do you contact each customer?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Up to 3 calls and 1 text per customer per campaign, on weekdays 9am&ndash;9:30pm and weekends 10am&ndash;6pm, in your customer&rsquo;s local time.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Can I include customers I haven&rsquo;t seen in years?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Yes. We check them against the National Do Not Call List first, and any registry fees are passed through at cost.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Do you need access to my practice or business software?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>No. A CSV export is enough. If you&rsquo;d rather we connect directly, see <a href="#add-ons">Add-ons</a>. For clinics, we only take name, phone number and last visit date, and a privacy agreement is signed before anything connects.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Who pays for the calling and AI costs?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Per campaign: included &mdash; all calling and AI usage is covered.</p><p>Custom: you pay the providers directly, at cost. We put no markup on usage.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Do you provide support?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Included for Per campaign.</p><p>Custom: optional. Either a monthly maintenance plan &mdash; updates when providers change their platforms, script changes, fixes &mdash; or hourly.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>What about no-shows?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>A no-show is billed &mdash; the booking was made, and confirming it is your front desk&rsquo;s job as it would be for any other appointment. If you would rather pay only on attendance, a show-based price is available; ask on the call.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>What happens to my customers&rsquo; data?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>The list is used for your campaign and nothing else. We never store health details &mdash; the agent works from &ldquo;due for a visit&rdquo;, not from anyone&rsquo;s record. Call recordings and transcripts follow the same retention as the rest of the service; see the <a href="/privacy/">privacy policy</a>. On Custom, none of it touches our systems at all.</p></div>
      </details>
      <details class="role">
        <summary><div class="role-top"><div><h3>Can it answer my inbound calls too?</h3></div>
          <span class="role-toggle"><span class="lbl-more">Answer</span><span class="lbl-less">Close</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span></div></summary>
        <div class="role-body"><p>Yes &mdash; that is the main product. An AI receptionist answers every incoming call, qualifies it and books it. <a href="/">See how inbound works</a>.</p></div>
      </details>
    </div>
  </div>
</section>

<!-- PLACEHOLDER: proof / case study. Nothing goes here until there is a real
     campaign with real numbers and the client's permission to quote them. -->

<section>
  <div class="wrap center">
    <h2>Also fits</h2>
    <p class="sub">Anything with a &ldquo;you&rsquo;re due&rdquo; cycle.</p>
    <div class="badges" style="justify-content:center">
      <span class="badge">Dental hygiene recall</span>
      <span class="badge">Physio and chiro lapsed patients</span>
      <span class="badge">Vet annual exams</span>
      <span class="badge">Pest control</span>
      <span class="badge">Auto service</span>
      <span class="badge">Seasonal maintenance plans</span>
    </div>
    <div style="margin-top:30px">
      <a class="btn btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a 30-minute chat</a>
    </div>
  </div>
</section>
"""


WINBACK_SCRIPT = """
<script>
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var list = $("c-list"), listN = $("c-list-n"),
      val  = $("c-val"),  valN  = $("c-val-n"),
      rate = $("c-rate"), rateN = $("c-rate-n");
  if (!list) return;

  function money(n){ return "$" + Math.round(n).toLocaleString("en-US"); }

  // One decimal, and never "Infinity" when there is nothing to pay.
  function mult(rev, cost){ return cost > 0 ? (Math.round(rev / cost * 10) / 10).toFixed(1) : null; }

  function clamp(el, v){
    var lo = parseFloat(el.min), hi = parseFloat(el.max);
    if (isNaN(v)) v = parseFloat(el.defaultValue || lo);
    return Math.min(hi, Math.max(lo, v));
  }

  function render(){
    var N = clamp(list, parseFloat(list.value));
    var V = clamp(val,  parseFloat(val.value));
    var R = clamp(rate, parseFloat(rate.value)) / 100;

    // The pilot scales with the list. A flat 100 was half a 200-name list and
    // a rounding error on a 2,000-name one; 20% is the same gesture at any size.
    // The floor keeps it big enough to mean something on a short list.
    var pilot    = Math.min(N, Math.max(25, Math.min(100, Math.round(N * 0.2))));
    var billable = N - pilot;
    var pilotBk  = Math.round(pilot * R);
    var paidBk   = Math.round(billable * R);
    var total    = pilotBk + paidBk;
    var revenue  = total * V;

    var costCampaign = billable > 0 ? Math.max(billable * 2.5, 500) : 0;

    $("co-bookings").textContent = "About " + total + (total === 1 ? " booking" : " bookings");
    $("co-pilot").textContent = "including about " + pilotBk
      + " from the free first " + pilot + (pilot === 1 ? " name" : " names");
    $("co-rev").textContent = money(revenue);

    var free = billable === 0;
    $("co-cards").hidden = free;
    $("co-free").hidden = !free;

    if (!free) {
      $("co-v-campaign").textContent = money(costCampaign);
      var mc = mult(revenue, costCampaign);
      $("co-x-campaign").innerHTML = mc ? mc + "\\u00d7 return" : "\\u2014";
    }
  }

  // Keep each slider and its number box in step, in both directions.
  function pair(a, b){
    a.addEventListener("input", function(){ b.value = a.value; render(); });
    b.addEventListener("input", function(){
      var v = clamp(a, parseFloat(b.value));
      a.value = v; render();
    });
    b.addEventListener("blur", function(){
      var v = clamp(a, parseFloat(b.value));
      b.value = v; a.value = v; render();
    });
  }
  pair(list, listN); pair(val, valN); pair(rate, rateN);

  document.querySelectorAll(".chip").forEach(function(c){
    c.addEventListener("click", function(){
      val.value = c.getAttribute("data-val");
      valN.value = val.value;
      render();
    });
  });

  render();
})();
</script>
"""

# ------------------------------------------------------------ legal text ----

PRIVACY_BODY = f"""<main class="wrap doc">
<h1>Privacy Policy</h1>
<p class="updated">Last updated: {UPDATED}</p>

<p class="intro"><strong>{BRAND}</strong> is a registered business based in
{ADDR}. This policy explains what we collect when our AI voice assistant answers
a call on behalf of one of our business clients, what we do with it, and how to
have it deleted.</p>

<h2>Who we are</h2>
<p>The registered business behind this service is <strong>{BRAND}</strong>,
{ADDR}. You can reach us at <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<p>We provide an AI voice assistant that answers inbound phone calls for small
businesses. When you call one of our clients, you may be speaking to our
assistant rather than a person.</p>

<h2>What we collect</h2>
<ul>
  <li><strong>Caller phone numbers</strong> &mdash; the number you are calling from.</li>
  <li><strong>Call recordings and transcripts</strong> &mdash; audio of the call and a
      written record of what was said.</li>
  <li><strong>Names and details given during a call</strong> &mdash; anything you tell
      the assistant, such as your name, address, the service you need or the time
      you would like to book.</li>
  <li><strong>Contact form submissions</strong> &mdash; the name, email address, phone
      number and message you send us through a form on this website.</li>
  <li><strong>Job applications</strong> &mdash; if you apply through our careers page,
      the details, resume and cover letter you submit.</li>
  <li><strong>Customer lists for win-back campaigns</strong> &mdash; names, phone
      numbers and last visit dates that a business client gives us, so we can
      contact their past customers on their behalf.</li>
  <li><strong>Billing details for our business clients</strong> &mdash; handled by
      Stripe. We never see or store full card numbers.</li>
</ul>

<h2>How we use it</h2>
<ul>
  <li>To run the answering service for the business you called.</li>
  <li>To text you the information you asked for during the call.</li>
  <li>To give the business owner a summary of the call, so they can follow up.</li>
  <li>To assess a job application and contact you about it.</li>
</ul>

<div class="box">
  <p><strong>We do not sell or share your SMS opt-in data or personal information
  with third parties for marketing purposes.</strong></p>
</div>

<h2>SMS Messaging and Consent</h2>

<div class="box">
  <p><strong>No mobile information will be shared with third parties or affiliates
  for marketing or promotional purposes. All other categories exclude text
  messaging originator opt-in data and consent; this information will not be
  shared with any third parties.</strong></p>
</div>

<p>Texts to callers are sent as part of handling their call: confirmations,
information they asked for, missed-call text-backs and appointment reminders.
Promotional texts, such as review requests or win-back messages, are sent only on
behalf of a business the person has bought from, and always allow opting out. We
do not sell or share mobile numbers or SMS consent with third parties for their
marketing.</p>
<p>Message and data rates may apply. Reply <strong>STOP</strong> to opt out, or
<strong>HELP</strong> for help. Our terms of service are at
<a href="/terms/">voicecaptures.com/terms</a> and this privacy policy is at
<a href="/privacy/">voicecaptures.com/privacy</a>.</p>

<h2>Call recording</h2>
<p>Callers are told at the start of the call that it may be recorded. For most
businesses, calls are recorded and transcribed; for clinics, recording is off by
default and only a transcript is kept. Recordings and transcripts are used to
produce the summary for the business, to show it in their dashboard, and to
improve how the assistant handles their calls.</p>

<h2>Clinics</h2>
<p>When we answer calls for a clinic, the assistant collects only contact details
and the general reason for the call, such as booking a cleaning or a billing
question. It does not ask for symptoms, diagnoses or health card numbers. We
handle this information only on the clinic&rsquo;s instructions and for the
clinic&rsquo;s purposes.</p>

<h2>How long we keep it</h2>
<p>Recordings, transcripts and call details are kept for <strong>14 days</strong>
and then deleted. A business client can choose to keep them for 90 days or one
year. Win-back lists are used only for that business&rsquo;s campaigns and are
deleted when the business asks, or when they stop working with us. To have your
own record deleted sooner, email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<p>Job applications are kept while we consider them and for future opportunities,
until you ask us to delete them.</p>

<h2>Where your information is stored and processed</h2>
<p>The call records we keep &mdash; recordings, transcripts and call details
&mdash; are stored in Canada. The live call runs on providers in the United
States: our phone provider carries the call and stores no call audio, and our
AI provider holds a copy of the conversation for 14 days, the shortest window
it offers, before deleting it. Text message records are kept for 14 days.
Deleted data can take up to a further 30 days to clear a provider&rsquo;s
backup systems. While information is with a provider it may be subject to US
law. We use service providers only to run the service, and each one receives
only what it needs to do its part.</p>

<h2>Your rights</h2>
<p>You can ask to see, correct or delete the information we hold about you. Email
<a href="mailto:{EMAIL}">{EMAIL}</a> with the number you called from and roughly
when you called. We will reply within 30 days.</p>

<h2>Contact</h2>
<p><strong>{BRAND}</strong><br>
{ADDR}<br>
<a href="mailto:{EMAIL}">{EMAIL}</a></p>
</main>
"""

TERMS_BODY = f"""<main class="wrap doc">
<h1>Terms of Service</h1>
<p class="updated">Last updated: {UPDATED}</p>

<p class="intro">These terms cover your <strong>{BRAND}</strong> subscription and
any campaign you run with us. By ticking the box at checkout, or by signing a
quote with us, you agree to them. {BRAND} is a registered business in Ontario,
Canada.</p>

<h2>The service</h2>
<p>We provide an AI phone assistant that answers calls your business forwards to
it. Depending on your plan, it answers questions, takes callers&rsquo; details,
books appointments into your calendar, transfers calls to you, and sends text
messages to you and to your callers. We set it up for you. AI can mishear or
misunderstand a caller, so check your bookings and messages. It is not an
emergency service; callers with emergencies are told to call 911.</p>

<h2>Plans and locations</h2>
<p>Each plan covers one business location, with the minutes, lines and calendars
shown on our pricing page. Two or more locations need a plan for each location,
or a quote from us.</p>

<h2>Free trial</h2>
<p>Your first 14 days are free, up to 100 minutes of calls, on your real business
number. We take a card when you sign up. If you don&rsquo;t cancel before the
trial ends, your plan starts automatically on day 15 and we charge that card. We
email you a reminder before the trial ends. Cancel during the trial and you pay
nothing.</p>

<h2>Billing and taxes</h2>
<p>Plans are billed monthly in Canadian dollars, in advance, on the same date each
month, to the card you gave us. Prices are before HST and other applicable taxes,
which are added to your bill. Add-ons are billed with your plan. One-time setup
and integration work is quoted in writing and billed separately. You can update
your card or download invoices at any time from your billing portal.</p>

<h2>Minutes</h2>
<p>A minute is time our assistant spends on a live call, including transfers. Spam
calls are not counted. Unused minutes don&rsquo;t carry over. We text you when you
reach 80% of your monthly minutes. If you go over, we will offer you extra
minutes, at $100 per 100 minutes, or a larger plan. We will not charge you for
extra minutes without telling you first.</p>

<h2>Missed payments</h2>
<p>If a payment fails, we retry it and email you. If it still hasn&rsquo;t gone
through after about two weeks, your subscription is cancelled and the line stops
answering.</p>

<h2>Cancelling</h2>
<p>Cancel anytime from your billing portal or by emailing
<a href="mailto:{EMAIL}">{EMAIL}</a>. After the trial, your service runs to the end
of the month you&rsquo;ve paid for, and we don&rsquo;t refund partial months. When
you leave, turn off call forwarding on your phone so calls ring through to you
again.</p>

<h2>Text messages</h2>
<p>Our assistant sends texts that are part of handling a call: a summary to you; a
confirmation, booking details or information to a caller who asks for it; a
text-back to a caller whose call was missed; and appointment reminders. We also
text you about your account, such as usage alerts.</p>
<p>Some plans include texts or calls that promote your business, such as review
requests and win-back messages. These go only to your own customers, on your
behalf and under your business name, and every one identifies your business and
lets the person opt out. You are responsible for having the consent Canadian
anti-spam law requires to contact them; generally, that means they bought from you
in the last two years, or they agreed to hear from you.</p>
<p>Anyone can reply <strong>STOP</strong> to any text to opt out, or
<strong>HELP</strong> for help.</p>

<div class="box">
  <p><strong>Message and data rates may apply.</strong></p>
</div>

<p>Carriers are not liable for delayed or undelivered messages.</p>

<h2>Win-back calls and campaigns</h2>
<p>We only contact your own past customers, people who have already bought from
you, from a list you give us. We never use cold lists or purchased leads. Every
call opens by saying it&rsquo;s an AI assistant calling for your business. We check
numbers against Canada&rsquo;s National Do Not Call List where the law requires it,
call only during permitted hours, and remove anyone who asks not to be contacted.
You confirm that you collected the list lawfully and may contact the people on it.
Campaign prices and what counts as a booking are set out in your quote.</p>

<h2>Your responsibilities</h2>
<p>Give us accurate information for your assistant&rsquo;s script, use the service
lawfully, and hold any licence your own business needs. Don&rsquo;t use the service
to harass anyone, impersonate another business, or collect information we
haven&rsquo;t agreed to handle.</p>

<h2>Call records</h2>
<p>We keep call recordings, transcripts and call details for 14 days, then delete
them, unless your plan includes longer history. For clinics, call recording is off
by default, and our assistant collects only contact details and the general reason
for the call &mdash; never symptoms, diagnoses or health card numbers. If your
practice needs a privacy agreement with us, we will work through it with you
before going live. Our <a href="/privacy/">Privacy Policy</a> explains how we
handle this information.</p>

<h2>No warranty</h2>
<p>The service is provided as is. We don&rsquo;t promise the assistant will be
error-free or always available; it depends on phone, AI and internet providers we
don&rsquo;t control.</p>

<h2>Limitation of liability</h2>
<p>To the extent the law allows, our total liability for any claim is limited to
the fees you paid us in the three months before the claim. We are not liable for
indirect or consequential loss, including lost business, bookings or revenue.</p>

<h2>Changes</h2>
<p>We will email you at least 30 days before we change these terms or your price.
If you don&rsquo;t agree, you can cancel before the change takes effect.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Ontario and the federal laws of Canada
that apply there.</p>

<h2>Contact</h2>
<p><strong>{BRAND}</strong> &middot;
<a href="mailto:{EMAIL}">{EMAIL}</a></p>
</main>
"""

# ---------------------------------------------------------------- build ----

CONTACT_BODY = f"""
<section class="hero">
  <div class="wrap">
    <p class="eyebrow">Contact</p>
    <h1>Tell us what you <span class="hl">need.</span></h1>
    <p class="lede">One form for everything &mdash; a receptionist, a win-back
    campaign, or a question. A few details and we will come back within a day.
    No obligation.</p>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <form class="in-card" id="in-form">
      <p class="in-leg">Contact</p>
      <div class="in-row">
        <label class="in-f"><span>First name</span><input id="in-first" required autocomplete="given-name"></label>
        <label class="in-f"><span>Last name</span><input id="in-last" autocomplete="family-name"></label>
      </div>
      <div class="in-row">
        <label class="in-f"><span>Email</span><input id="in-email" type="email" required autocomplete="email"></label>
        <label class="in-f"><span>Phone</span><input id="in-phone" type="tel" required autocomplete="tel"></label>
      </div>

      <p class="in-leg">About you</p>
      <div class="in-row">
        <label class="in-f"><span>Business name</span><input id="in-business" required autocomplete="organization" placeholder="Or your own name"></label>
        <label class="in-f"><span>What you do</span><select id="in-type"></select></label>
      </div>
      <div class="in-row">
        <label class="in-f"><span>Software you use</span><select id="in-system"></select></label>
        <label class="in-f"><span>What you&rsquo;re after</span><select id="in-plan"></select></label>
      </div>

      <label class="in-f"><span>Anything else <em>optional</em></span>
        <textarea id="in-comments" rows="3" placeholder="How calls reach you today, what you&rsquo;d want it to handle, anything unusual."></textarea>
      </label>

      <p class="in-note">Whatever you pick here shapes the onboarding. Nothing is locked in.</p>
      <button class="btn btn-primary in-go" type="submit" id="in-go">Send it over</button>
      <p class="in-msg" id="in-msg"></p>
    </form>

    <p class="in-alt">Would rather talk it through?
      <a href="{CAL}" target="_blank" rel="noopener">Book a 30-minute call</a>,
      or email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
  </div>
</section>
"""

CONTACT_SCRIPT = f"""
<script>
(function(){{
  var API = "{API}";
  var TYPES = ["Home services & trades","Restaurant, caf\u00e9 or bar",
    "Clinic, dental or medical","Health, wellness or veterinary",
    "Salon, spa or fitness","Professional services \u2014 legal, real estate, consulting",
    "A personal line, not a business","Something else"];
  var SYSTEMS = ["None \u2014 phone and calendar","Google Calendar",
    "Outlook or Microsoft 365","Calendly","Jobber","Housecall Pro","ServiceTitan",
    "Square","Acuity or Squarespace Scheduling","Mindbody","Jane",
    "Dentrix, Open Dental or Eaglesoft","OpenTable, Resy or Toast",
    "HubSpot or another CRM","Something else","Not sure"];
  var PLANS = ["AI receptionist for my business","Personal line (beta)",
    "Win-back campaign","A custom build we own","Not sure yet"];

  function $(id){{ return document.getElementById(id); }}
  function esc(t){{ return String(t).replace(/[&<>"]/g, function(c){{
    return {{ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }}[c]; }}); }}
  function fill(el, opts){{
    el.innerHTML = '<option value="">Select\u2026</option>' + opts.map(function(o){{
      return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }}).join("");
  }}
  fill($("in-type"), TYPES); fill($("in-system"), SYSTEMS); fill($("in-plan"), PLANS);

  var form = $("in-form");
  form.addEventListener("submit", function(e){{
    e.preventDefault();
    var btn = $("in-go"), m = $("in-msg");
    var payload = {{
      first_name:    $("in-first").value.trim(),
      last_name:     $("in-last").value.trim(),
      email:         $("in-email").value.trim(),
      phone:         $("in-phone").value.trim(),
      business_name: $("in-business").value.trim(),
      business_type: $("in-type").value,
      system:        $("in-system").value,
      plan:          $("in-plan").value,
      comments:      $("in-comments").value.trim(),
      vertical:      "contact",
      source:        "site"
    }};
    if (!payload.first_name || !payload.email || !payload.business_name) {{
      m.className = "in-msg err";
      m.textContent = "Name, email and business name, and we can take it from there.";
      return;
    }}
    // This is a phone product; a number is how the conversation starts.
    if (payload.phone.replace(/\D/g, "").length < 10) {{
      m.className = "in-msg err";
      m.textContent = "A phone number too \u2014 it's the quickest way to sort the setup.";
      return;
    }}
    m.className = "in-msg"; m.textContent = "Sending\u2026"; btn.disabled = true;

    fetch(API + "/intake-form", {{
      method: "POST", headers: {{ "Content-Type": "application/json" }},
      body: JSON.stringify(payload)
    }})
    .then(function(r){{ return r.json(); }})
    .then(function(d){{
      if (!d || !d.ok) throw new Error((d && d.error) || "Couldn't send that.");
      m.className = "in-msg ok";
      m.textContent = "Got it \u2014 we'll come back to you within a day.";
      form.reset();
      fill($("in-type"), TYPES); fill($("in-system"), SYSTEMS); fill($("in-plan"), PLANS);
    }})
    .catch(function(err){{
      m.className = "in-msg err";
      m.textContent = (err.message || "Couldn't send that.") + " Or email {EMAIL}.";
    }})
    .then(function(){{ btn.disabled = false; }});
  }});
}})();
</script>
"""

PAGES = [
    ("contact", "Contact VoiceCaptures",
     "Tell us what you need \u2014 an AI receptionist, a win-back campaign, or a "
     "question. One form, and we come back within a day.", CONTACT_BODY, CONTACT_SCRIPT),

    ("win-back", "Outbound campaigns | VoiceCaptures",
     "Bring back customers you already have. We call your past customers, book "
     "them on your calendar, and send you the results. $2.50 per customer "
     "called, with a free pilot first.", WINBACK_BODY, WINBACK_SCRIPT),

    ("about", "About VoiceCaptures",
     "VoiceCaptures builds AI voice assistants that answer the phone for small "
     "businesses wherever they are. Who we are, how we build, and how "
     "to reach us.", ABOUT_BODY, ABOUT_SCRIPT),

    ("careers", "Careers | VoiceCaptures",
     "Join VoiceCaptures and work on AI voice technology, B2B sales, and digital "
     "growth. Explore part-time opportunities in Toronto and remote-friendly roles.",
     CAREERS_BODY, CAREERS_SCRIPT),

    # Titles here are bare on purpose: a carrier reviewer checking the A2P 10DLC
    # campaign looks for exactly "Privacy Policy" and "Terms of Service".
    ("privacy", "Privacy Policy",
     "How VoiceCaptures collects, uses and deletes call recordings, transcripts, "
     "caller phone numbers and contact form submissions.", PRIVACY_BODY, ""),

    ("terms", "Terms of Service",
     "Terms for the VoiceCaptures AI answering service, including SMS terms, "
     "billing, liability and governing law.", TERMS_BODY, ""),
]


def main():
    for slug, title, desc, body, script in PAGES:
        folder = ROOT / slug
        folder.mkdir(exist_ok=True)
        html = SHELL.format(
            title=title, desc=desc, slug=slug, body=body, script=script,
            email=EMAIL,
            cur_about=' aria-current="page"' if slug == "about" else "",
            cur_contact=' aria-current="page"' if slug == "contact" else "",
            cal=CAL30 if slug == "about" else CAL,
            cta="" if slug == "win-back" else
                '<a class="btn btn-primary nav-cta" href="/#yourline">Try it on your business</a>',
            cur_winback=' aria-current="page"' if slug == "win-back" else "",
            cur_careers=' aria-current="page"' if slug == "careers" else "",
        )
        (folder / "index.html").write_text(html, encoding="utf-8")
        print(f"  {slug}/index.html")
    print(f"\n{len(PAGES)} pages built.")


if __name__ == "__main__":
    main()
