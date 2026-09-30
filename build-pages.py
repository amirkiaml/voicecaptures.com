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
UPDATED = "30 September 2026"
EMAIL = "hello@voicecaptures.com"
ADDR = "Toronto, Ontario, Canada"
LEGAL = "Amirhossein Kiani"
API = "https://torontoleads-production.up.railway.app"
CAL = "https://calendly.com/hello-voicecaptures"

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
  --display:'Manrope',sans-serif; --body:'DM Sans',sans-serif;
}}
html[data-theme="light"]{{
  --bg:#f6f8fc; --bg2:#ffffff; --bg3:#ffffff;
  --text:#0d1729; --muted:#5a6b82; --faint:#8496ab;
  --line:rgba(13,23,41,.10); --line2:rgba(13,23,41,.18);
  --blue:#2563EB; --blue-dk:#1D4ED8; --blue-glow:rgba(37,99,235,.12);
  --cyan:#0E93B8; --cyan-lt:#0B7C9C;
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
@media (max-width:820px){{ .nav{{display:none}} }}
/* ---- "Book a call" is the highest-intent action in the nav, and as plain
   text it read as one more link. Amber keeps it clear of the blue primary
   CTA and the cyan demo-line dot, so the three don't compete. ---- */
.theme-btn{{flex:0 0 auto;width:38px;height:38px;border-radius:10px;cursor:pointer;
  background:none;border:1px solid var(--line2);color:var(--muted);
  display:flex;align-items:center;justify-content:center;margin-left:auto;
  transition:color .18s,border-color .18s}}
.nav + .theme-btn{{margin-left:0}}
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
</style>
</head>
<body>

<header>
  <div class="bar">
    <a class="brand" href="/" aria-label="VoiceCaptures home">
      <img src="/logo-mark.png" alt="" width="32" height="32">
      <span>VoiceCaptures</span>
    </a>
    <nav class="nav" aria-label="Main">
      <a class="nav-a" href="/">Home</a>
      <a class="nav-a" href="/about/"{cur_about}>About</a>
      <a class="nav-a" href="/careers/"{cur_careers}>Careers</a>
      <a class="nav-a" href="/about/#contact">Contact</a>
      <a class="nav-a nav-cal" href="{cal}" target="_blank" rel="noopener">Book a call</a>
    </nav>
    <button type="button" class="theme-btn" id="theme-btn" aria-label="Switch theme" title="Switch theme">
      <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2 12h2.6M19.4 12H22M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"/></svg>
      <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/></svg>
    </button>
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
      <a href="/about/">About</a>
      <a href="/careers/">Careers</a>
      <a href="/privacy/">Privacy Policy</a>
      <a href="/terms/">Terms of Service</a>
    </div>
    <a href="mailto:{email}">{email}</a>
  </div>
</footer>

<script>
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
    for small and mid-sized businesses across Toronto and the GTA &mdash; so the
    calls that arrive while you are on a job, mid-service or closed for the night
    still turn into booked work.</p>
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
    <p>We are an early-stage team based in {ADDR}, working with businesses
    across the city and the wider GTA. Being local matters more than it sounds:
    we know the neighbourhoods callers name, the trades that get seasonal
    spikes, and the difference between a slow Tuesday and a phone that has been
    ringing out for a week.</p>
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
        <p>Recordings and transcripts are kept 14 days and then deleted, and
        recording storage is off by default. A clinic line hears things that
        should not sit on a server indefinitely.</p>
      </div>
    </div>
  </div>
</section>

<section class="alt" id="contact">
  <div class="wrap">
    <h2>Get in touch</h2>
    <p class="lede">Questions about the product, pricing, or whether it fits how
    your calls actually work &mdash; send a note and we will come back to you.
    If you would rather talk it through,
    <a href="{CAL}" target="_blank" rel="noopener">book a call</a>.</p>

    <div class="formwrap">
      <form id="contact-form" novalidate>
        <div class="grid2">
          <div class="f">
            <label for="c-name">Your name</label>
            <input id="c-name" name="name" type="text" autocomplete="name" required>
          </div>
          <div class="f">
            <label for="c-email">Email</label>
            <input id="c-email" name="email" type="email" autocomplete="email" required>
          </div>
        </div>
        <div class="grid2">
          <div class="f">
            <label for="c-phone">Phone <span class="opt">optional</span></label>
            <input id="c-phone" name="phone" type="tel" autocomplete="tel">
          </div>
          <div class="f">
            <label for="c-business">Business <span class="opt">optional</span></label>
            <input id="c-business" name="business" type="text" autocomplete="organization">
          </div>
        </div>
        <div class="f">
          <label for="c-message">Message</label>
          <textarea id="c-message" name="message" required
            placeholder="What you'd like to know, or what your calls look like today."></textarea>
        </div>
        <button class="btn btn-primary" type="submit" id="c-submit" style="width:100%">Send message</button>
        <div class="f-msg" id="c-msg" role="alert"></div>
      </form>

      <div class="f-ok" id="c-ok">
        <div class="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg></div>
        <h3>Message sent</h3>
        <p>Thanks &mdash; we have it, and we will get back to you at the email you gave.</p>
      </div>
    </div>
  </div>
</section>
"""

ABOUT_SCRIPT = f"""
<script>
(function(){{
  var API = "{API}";
  var form = document.getElementById("contact-form"),
      msg  = document.getElementById("c-msg"),
      ok   = document.getElementById("c-ok"),
      btn  = document.getElementById("c-submit");
  if (!form) return;

  function fail(t){{ msg.textContent = t; msg.className = "f-msg err"; }}

  form.addEventListener("submit", function(e){{
    e.preventDefault();
    msg.className = "f-msg";

    var body = {{
      name:     form.name.value.trim(),
      email:    form.email.value.trim(),
      phone:    form.phone.value.trim(),
      business: form.business.value.trim(),
      message:  form.message.value.trim(),
      source:   "about"
    }};
    if (!body.name || !body.email || !body.message) {{
      return fail("Name, email and a message are needed.");
    }}
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(body.email)) {{
      return fail("That email doesn't look right.");
    }}

    btn.disabled = true;
    btn.textContent = "Sending...";

    fetch(API + "/contact", {{
      method: "POST",
      headers: {{ "Content-Type": "application/json" }},
      body: JSON.stringify(body)
    }})
    .then(function(r){{ return r.json().catch(function(){{ return {{ ok:false }}; }}); }})
    .then(function(d){{
      if (d && d.ok) {{ form.style.display = "none"; ok.style.display = "block"; return; }}
      fail((d && d.error) || "Couldn't send that. Try again, or email {EMAIL}.");
      btn.disabled = false; btn.textContent = "Send message";
    }})
    .catch(function(){{
      fail("Couldn't reach the server. Try again, or email {EMAIL}.");
      btn.disabled = false; btn.textContent = "Send message";
    }});
  }});
}})();
</script>
"""

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

# ------------------------------------------------------------ legal text ----

PRIVACY_BODY = f"""<main class="wrap doc">
<h1>Privacy Policy</h1>
<p class="updated">Last updated: {UPDATED}</p>

<p class="intro">VoiceCaptures is a trading name of <strong>{LEGAL}</strong>, a sole
proprietor based in {ADDR}. This policy explains what we collect when our AI
voice assistant answers a call on behalf of one of our business clients, what we
do with it, and how to have it deleted.</p>

<h2>Who we are</h2>
<p>The registered business behind this service is <strong>{LEGAL}</strong>, trading
as <strong>VoiceCaptures</strong>, {ADDR}. You can reach us at
<a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
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

<p>Callers opt in verbally during a phone call by agreeing when our assistant
offers to send a text. Messages are transactional and sent only in response to
that request &mdash; typically one message per call. Message and data rates may
apply. Reply <strong>STOP</strong> to opt out, or <strong>HELP</strong> for help.
Our terms of service are at <a href="/terms/">voicecaptures.com/terms</a> and this
privacy policy is at <a href="/privacy/">voicecaptures.com/privacy</a>.</p>

<h2>Call recording</h2>
<p>Callers are told at the start of the call that it may be recorded. Calls
answered by the assistant are recorded and transcribed. The recording and
transcript are used to produce the summary the business owner receives, and to
improve how the assistant handles calls for that business. Recordings and
transcripts are deleted after 14 days. If you would prefer your recording deleted
sooner, email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>

<h2>How long we keep it</h2>
<p>Recordings, transcripts and call details are kept for <strong>14 days</strong>
and then deleted. Extended retention is available on request where a business
client needs a longer record. Job applications are kept while we consider them
and for future opportunities, until you ask us to delete them.</p>

<h2>Service providers</h2>
<p>We use the following providers to operate the service. Your information is
shared with them only so that the service can run, and for no other purpose.</p>
<dl>
  <dt>Twilio</dt><dd>Telephony and messaging &mdash; carrying the call and sending the text.</dd>
  <dt>Vapi</dt><dd>Voice &mdash; running the assistant's side of the conversation.</dd>
  <dt>Supabase</dt><dd>Data storage &mdash; where call records are stored.</dd>
  <dt>Google Calendar</dt><dd>Where a business client has connected one, so bookings
      land on their real calendar.</dd>
</dl>

<h2>Requesting deletion</h2>
<p>To have your information deleted, email
<a href="mailto:{EMAIL}">{EMAIL}</a>. Tell us the phone number you called from and
roughly when you called, so we can find the record.</p>

<h2>Contact</h2>
<p><strong>{LEGAL}</strong>, trading as VoiceCaptures<br>
{ADDR}<br>
<a href="mailto:{EMAIL}">{EMAIL}</a></p>
</main>
"""

TERMS_BODY = f"""<main class="wrap doc">
<h1>Terms of Service</h1>
<p class="updated">Last updated: {UPDATED}</p>

<p class="intro">These terms cover the use of VoiceCaptures, a service operated by
<strong>{LEGAL}</strong>, a sole proprietor based in {ADDR}, trading as
<strong>VoiceCaptures</strong>.</p>

<h2>The service</h2>
<p>VoiceCaptures provides an AI voice assistant that answers inbound phone calls
for a business. The assistant greets the caller, answers questions about the
business, takes down the caller's details, books appointments where a calendar is
connected, and sends the business owner a summary of the call. Where a caller asks
for information by text, the assistant sends it as a single SMS.</p>

<h2>Acceptable use</h2>
<p>You may not use the service to break the law, to harass anyone, to send
unsolicited marketing, or to impersonate another business. You are responsible for
the accuracy of the information you give us to put in the assistant's script, and
for holding any licence or registration your own business needs.</p>

<h2>Billing and cancellation</h2>
<p>Plans are billed monthly, month to month. You can cancel at any time; the
service runs to the end of the period you have already paid for, and is not
renewed after that. One-off setup and integration work is quoted and charged
separately.</p>

<h2>No warranty</h2>
<p>The service is provided as is. We do not warrant that the AI assistant is
error-free. It can mishear a caller, misunderstand a request, or be unavailable
because of a fault at one of the providers the service depends on. It is not a
substitute for a person where a call is urgent or an emergency.</p>

<h2>Limitation of liability</h2>
<p>To the extent permitted by law, our total liability for any claim arising out of
the service is limited to the fees you paid us in the three months before the
claim. We are not liable for indirect or consequential loss, including lost
business, lost bookings or lost revenue.</p>

<h2>SMS Terms</h2>

<h3>What we send</h3>
<p>A single text message, sent in response to a caller's request during a phone
call, containing the information they asked for.</p>

<h3>How consent is obtained</h3>
<p>Verbally, during an inbound call that the caller initiated. The assistant asks
the caller whether they would like the information by text, and a message is sent
only if they say yes. The message goes to the number the caller is calling from.</p>

<h3>Frequency</h3>
<p>Messages are sent only in response to a caller's request. There are no recurring
messages and no marketing messages.</p>

<div class="box">
  <p><strong>Message and data rates may apply.</strong></p>
</div>

<h3>Opting out and getting help</h3>
<p>Reply <strong>STOP</strong> to any message to opt out. Reply <strong>HELP</strong>
for help, or email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>

<h3>Delivery</h3>
<p>Carriers are not liable for delayed or undelivered messages.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of the Province of Ontario, Canada, and the
federal laws of Canada that apply there.</p>

<h2>Contact</h2>
<p><strong>{LEGAL}</strong>, trading as VoiceCaptures<br>
{ADDR}<br>
<a href="mailto:{EMAIL}">{EMAIL}</a></p>
</main>
"""

# ---------------------------------------------------------------- build ----

PAGES = [
    ("about", "About VoiceCaptures",
     "VoiceCaptures builds AI voice assistants that answer the phone for small "
     "businesses across Toronto and the GTA. Who we are, how we build, and how "
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
            email=EMAIL, cal=CAL,
            cur_about=' aria-current="page"' if slug == "about" else "",
            cur_careers=' aria-current="page"' if slug == "careers" else "",
        )
        (folder / "index.html").write_text(html, encoding="utf-8")
        print(f"  {slug}/index.html")
    print(f"\n{len(PAGES)} pages built.")


if __name__ == "__main__":
    main()
