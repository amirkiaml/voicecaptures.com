#!/usr/bin/env python3
"""
build-legal.py — emit /privacy/ and /terms/.

These are registration pages: a carrier reviewer for the Twilio A2P 10DLC
campaign opens the URL and looks for specific sentences. They are deliberately
NOT generated from index.html — index.html is a single-page app whose script
would run on a page with none of its markup — but they carry the same shell,
fonts, palette and theme toggle so they do not look like someone else's site.

    python build-legal.py
"""

import pathlib

ROOT = pathlib.Path(__file__).parent
UPDATED = "26 September 2026"
EMAIL = "hello@voicecaptures.com"
ADDR = "Toronto, Ontario, Canada"
LEGAL = "Amirhossein Kiani"

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
<meta property="og:title" content="{title} — VoiceCaptures">
<meta property="og:description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{{
  --bg:#0b0d13; --bg2:#12151d; --bg3:#191d27;
  --text:#f0f0ec; --muted:#9a9a90;
  --line:rgba(255,255,255,0.08); --line2:rgba(255,255,255,0.15);
  --blue:#2563EB; --blue-dk:#1D4ED8;
  --cyan:#22D3EE; --cyan-lt:#67E8F9;
  --display:'Manrope',sans-serif; --body:'DM Sans',sans-serif;
}}
html[data-theme="light"]{{
  --bg:#f6f8fc; --bg2:#ffffff; --bg3:#ffffff;
  --text:#0d1729; --muted:#5a6b82;
  --line:rgba(13,23,41,.10); --line2:rgba(13,23,41,.18);
  --blue:#2563EB; --blue-dk:#1D4ED8;
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

/* header — same bar, brand and theme control as the rest of the site */
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
  text-decoration:none;transition:color .18s,background .18s}}
.nav-a:hover{{color:var(--text);background:rgba(255,255,255,.06)}}
html[data-theme="light"] .nav-a:hover{{background:rgba(13,23,41,.05)}}
@media (max-width:700px){{ .nav{{display:none}} }}
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

/* document */
.doc{{padding:clamp(44px,6vw,72px) 0 clamp(56px,7vw,88px);max-width:760px}}
.doc h1{{font-family:var(--display);font-weight:700;font-size:clamp(30px,4.6vw,44px);
  letter-spacing:-.02em;line-height:1.1;margin-bottom:10px}}
.doc .updated{{font-size:13px;color:var(--muted);margin-bottom:8px}}
.doc .intro{{font-size:17px;color:var(--muted);margin:22px 0 8px}}
.doc h2{{font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:-.01em;
  line-height:1.3;margin:40px 0 10px;padding-top:26px;border-top:1px solid var(--line);
  scroll-margin-top:84px}}
.doc h3{{font-size:15.5px;font-weight:700;margin:22px 0 4px;scroll-margin-top:84px}}
.doc p{{font-size:15.5px;margin-bottom:14px}}
.doc ul{{margin:0 0 16px 20px}}
.doc li{{font-size:15.5px;margin-bottom:7px}}
.doc strong{{font-weight:700}}
.doc .box{{background:var(--bg2);border:1px solid var(--line);border-left:3px solid var(--cyan);
  border-radius:10px;padding:16px 18px;margin:18px 0}}
html[data-theme="light"] .doc .box{{box-shadow:0 6px 20px rgba(13,23,41,.06)}}
.doc .box p:last-child{{margin-bottom:0}}
.doc dl{{margin:0 0 16px}}
.doc dt{{font-weight:700;font-size:15.5px;margin-top:12px}}
.doc dd{{font-size:15.5px;color:var(--muted);margin-left:0}}

/* footer — identical to the main site */
footer{{padding:36px 0;border-top:1px solid var(--line);background:var(--bg2)}}
html[data-theme="light"] footer{{background:#eef2f9}}
.foot{{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}}
.foot img{{height:28px;width:auto}}
.foot .tl{{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--muted);margin-top:8px}}
.foot a,.foot .desc{{font-size:13px;color:var(--muted)}}
.foot a:hover{{color:var(--blue)}}
.foot-legal{{display:flex;gap:16px;flex-wrap:wrap}}
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
      <a class="nav-a" href="/privacy/">Privacy</a>
      <a class="nav-a" href="/terms/">Terms</a>
      <a class="nav-a" href="mailto:{email}">Contact</a>
    </nav>
    <button type="button" class="theme-btn" id="theme-btn" aria-label="Switch theme" title="Switch theme">
      <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2 12h2.6M19.4 12H22M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"/></svg>
      <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/></svg>
    </button>
  </div>
</header>

<main class="wrap doc">
{body}
</main>

<footer>
  <div class="wrap foot">
    <div>
      <div class="brand"><img src="/logo-mark.png" alt="" width="28" height="28"><span>VoiceCaptures</span></div>
      <div class="tl">Answers &middot; Qualifies &middot; Books</div>
    </div>
    <div class="foot-legal">
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

</body>
</html>
"""

PRIVACY_BODY = f"""<h1>Privacy Policy</h1>
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
  <li><strong>Caller phone numbers</strong> — the number you are calling from.</li>
  <li><strong>Call recordings and transcripts</strong> — audio of the call and a
      written record of what was said.</li>
  <li><strong>Names and details given during a call</strong> — anything you tell
      the assistant, such as your name, address, the service you need or the time
      you would like to book.</li>
  <li><strong>Contact form submissions</strong> — the name, email address, phone
      number and message you send us through a form on this website.</li>
</ul>

<h2>How we use it</h2>
<ul>
  <li>To run the answering service for the business you called.</li>
  <li>To text you the information you asked for during the call.</li>
  <li>To give the business owner a summary of the call, so they can follow up.</li>
</ul>

<div class="box">
  <p><strong>We do not sell or share your SMS opt-in data or personal information
  with third parties for marketing purposes.</strong></p>
</div>

<h2>Call recording</h2>
<p>Callers are told that calls may be recorded. Recording is used to produce the
transcript and the summary that the business owner receives.</p>

<h2>How long we keep it</h2>
<p>Recordings, transcripts and call details are kept for <strong>14 days</strong>
and then deleted. Extended retention is available on request where a business
client needs a longer record.</p>

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
"""

TERMS_BODY = f"""<h1>Terms of Service</h1>
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
"""

PAGES = [
    ("privacy", "Privacy Policy",
     "How VoiceCaptures collects, uses and deletes call recordings, transcripts, "
     "caller phone numbers and contact form submissions.", PRIVACY_BODY),
    ("terms", "Terms of Service",
     "Terms for the VoiceCaptures AI answering service, including SMS terms, "
     "billing, liability and governing law.", TERMS_BODY),
]


def main():
    for slug, title, desc, body in PAGES:
        folder = ROOT / slug
        folder.mkdir(exist_ok=True)
        html = SHELL.format(title=title, desc=desc, slug=slug, body=body, email=EMAIL)
        (folder / "index.html").write_text(html, encoding="utf-8")
        print(f"  {slug}/index.html")
    print(f"\n{len(PAGES)} legal pages built.")


if __name__ == "__main__":
    main()
