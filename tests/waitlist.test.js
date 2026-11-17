/* The international waitlist block, in both flag states.
 *   node tests/waitlist.test.js
 * Builds the site twice — WAITLIST_ENABLED off, then on — and checks the
 * rendered page each time, then drives the form in Chromium with the network
 * stubbed. Offline: the endpoint is never actually called. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.strictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const SRC = path.join(root, "build-pages.py");
const PAGE = path.join(root, "pricing/index.html");

/* The exact text, written out here rather than read from the source. A test
   that reads the constant it is checking proves nothing: this is the string
   Amir approved, and the version that goes with it. */
const CONSENT = "Email me when VoiceCaptures launches in my country. I can unsubscribe at any time.";
const VERSION = "waitlist-2026-11-17";
const COPY_ON = "VoiceCaptures is live in Canada. We’re rolling out to more countries soon. Join the waitlist and we’ll email you the moment it opens in yours.";
const COPY_OFF = "VoiceCaptures is live in Canada. We’re rolling out to more countries soon.";

const build = enabled => {
  const src = fs.readFileSync(SRC, "utf8");
  const want = `"enabled": ${enabled ? "True" : "False"},`;
  const now = src.match(/"enabled": (True|False),/);
  assert.ok(now, "the WAITLIST enabled flag is where the test expects it");
  fs.writeFileSync(SRC, src.replace(now[0], want));
  execFileSync("python3", ["build-pages.py"], { cwd: root, stdio: "ignore" });
  return fs.readFileSync(PAGE, "utf8");
};
const original = fs.readFileSync(SRC, "utf8");
const text = s => s.replace(/<[^>]+>/g, " ")
  .replace(/&rsquo;/g, "\u2019").replace(/&mdash;/g, "\u2014")
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

try {
  /* ------------------------------------------------------------- flag off -- */
  console.log("WAITLIST_ENABLED = off");
  let html = build(false);
  let block = html.slice(html.indexOf('id="waitlist"'), html.indexOf('id="waitlist"') + 2000);
  ok(html.includes('id="waitlist"'), "the block is on the page");
  ok(text(block).includes(COPY_OFF), "it shows the short copy");
  ok(!/<form[^>]*wl-form/.test(html), "there is no form");
  ok(!html.includes(CONSENT), "the consent text is not rendered");
  ok(!html.includes("demo.voicecaptures.com/waitlist"), "the endpoint is not in the page");
  ok(!text(block).includes("Join the waitlist"),
     "it does not invite anyone to join a list that cannot take them");

  /* -------------------------------------------------------------- flag on -- */
  console.log("\nWAITLIST_ENABLED = on");
  html = build(true);
  ok(text(html).includes(COPY_ON), "it shows the full copy, word for word");

  console.log("\n  Consent");
  ok(html.includes(CONSENT), "the consent text is exact");
  ok(html.includes(`data-consent-version="${VERSION}"`), `the version is ${VERSION}`);
  const box = html.match(/<input type="checkbox" id="wl-consent"[^>]*>/)[0];
  ok(/required/.test(box), "the consent box is required");
  ok(!/checked/.test(box), "the consent box is unticked by default");
  ok(html.includes("hello@voicecaptures.com"), "the sender is identified beside it");
  ok(/VoiceCaptures, .*, hello@voicecaptures\.com/.test(text(html)),
     "sender identification is in the CASL shape");

  console.log("\n  Fields");
  ok(/<input type="email" id="wl-email"[^>]*required/.test(html), "email is required");
  ok(/<select id="wl-country"[^>]*required/.test(html), "country is required");
  const countries = JSON.parse(fs.readFileSync(path.join(root, "pricing/countries.json"), "utf8")).countries;
  ok(!countries.some(c => c.code === "CA"), "Canada is not in the country list");
  ok(!/<option value="CA">/.test(html), "Canada is not offered in the dropdown");
  ok(countries.length > 200, `${countries.length} countries offered`);
  ok(!/id="wl-type"[^>]*required/.test(html), "business type is optional");
  ok(!/id="wl-site"[^>]*required/.test(html), "website is optional");

  console.log("\n  Honeypot and third parties");
  ok(/class="wl-hp"/.test(html), "there is a honeypot field");
  ok(/id="wl-company"[^>]*tabindex="-1"/.test(html), "it is out of the tab order");
  ok(/wl-hp[^}]*left:-9999px/.test(html.replace(/\s+/g, "")),
     "it is hidden off-screen rather than with display:none");
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  ok(srcs.every(u => !/^https?:\/\//.test(u) || u.includes("voicecaptures.com")),
     `no third-party script (${srcs.length} script srcs, all first-party)`);

  console.log("\n  Without JavaScript");
  ok(/<noscript>[\s\S]*demo\.voicecaptures\.com\/waitlist[\s\S]*<\/noscript>/.test(html),
     "noscript offers the hosted waitlist page");
  ok(/<form[^>]*action="https:\/\/demo\.voicecaptures\.com\/waitlist"/.test(html),
     "the form has a real action to fall back to");
  ok(/<form[^>]*hidden/.test(html), "the form ships hidden and is shown by script");

  (async () => {
    const browser = await chromium.launch();

    console.log("\n  The form in a browser");
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const sent = [];
    // Stub the endpoint: this suite never touches the network.
    await p.route("https://demo.voicecaptures.com/waitlist", async (route, req) => {
      sent.push(JSON.parse(req.postData() || "{}"));
      const mode = await p.evaluate(() => window.__mode || 200);
      if (mode === 429) return route.fulfill({ status: 429, body: "" });
      if (mode === 400) return route.fulfill({ status: 400, body: "" });
      route.fulfill({ status: 200, contentType: "application/json",
                      body: JSON.stringify({ ok: true }) });
    });
    await p.goto("file://" + PAGE);
    ok(await p.locator("#wl-form").isVisible(), "the form is shown once script runs");

    const state = p.locator("#wl-state");
    const fill = async (email, country, consent) => {
      await p.fill("#wl-email", email);
      await p.selectOption("#wl-country", country);
      const c = p.locator("#wl-consent");
      if (consent !== (await c.isChecked())) await c.setChecked(consent);
    };

    console.log("\n  Validation");
    await fill("not-an-email", "", false);
    await p.locator("#wl-send").click();
    ok(/email address/i.test(await state.textContent()), "a bad email is refused");
    eq(sent.length, 0, "nothing was sent");

    await fill("someone@example.com", "", false);
    await p.locator("#wl-send").click();
    ok(/country/i.test(await state.textContent()), "a missing country is refused");
    eq(sent.length, 0, "still nothing sent");

    await fill("someone@example.com", "GB", false);
    await p.locator("#wl-send").click();
    ok(/tick the box/i.test(await state.textContent()), "an unticked consent box is refused");
    eq(sent.length, 0, "consent is required before anything is sent");

    console.log("\n  Honeypot");
    await fill("bot@example.com", "GB", true);
    await p.evaluate(() => { document.getElementById("wl-company").value = "Acme"; });
    await p.locator("#wl-send").click();
    await p.waitForTimeout(150);
    eq(sent.length, 0, "a filled honeypot sends nothing");
    ok(/on the list/i.test(await state.textContent()),
       "and says the same thing it says on success, so the bot learns nothing");
    await p.evaluate(() => { document.getElementById("wl-company").value = ""; });

    console.log("\n  Success, and the payload");
    await fill("someone@example.com", "GB", true);
    await p.fill("#wl-type", "Dental clinic");
    await p.locator("#wl-send").click();
    await p.waitForFunction(() => /on the list/i.test(
      document.getElementById("wl-state").textContent));
    eq(sent.length, 1, "one request was sent");
    const body = sent[0];
    eq(body.email, "someone@example.com", "payload carries the email");
    eq(body.country, "GB", "payload carries an ISO alpha-2 country");
    eq(body.consent, true, "payload carries consent:true");
    eq(body.consent_version, VERSION, "payload carries the consent version");
    eq(body.business_type, "Dental clinic", "payload carries the optional field given");
    ok(!("website" in body), "an empty optional field is left out");
    ok(!("company" in body), "the honeypot is never sent");
    ok(/on the list/i.test(await state.textContent()), "success is shown");

    console.log("\n  Errors");
    await p.evaluate(() => { window.__mode = 429; });
    await fill("someone@example.com", "GB", true);
    await p.locator("#wl-send").click();
    await p.waitForFunction(() => /minute/i.test(
      document.getElementById("wl-state").textContent));
    ok(/minute/i.test(await state.textContent()), "429 says to try again in a minute");

    await p.evaluate(() => { window.__mode = 400; });
    await fill("someone@example.com", "GB", true);
    await p.locator("#wl-send").click();
    await p.waitForFunction(() => /not right/i.test(
      document.getElementById("wl-state").textContent));
    ok(/not right/i.test(await state.textContent()), "400 asks them to check the fields");
    ok(await p.locator("#wl-send").isEnabled(), "the button is usable again after an error");

    console.log("\n  No personal data leaves the page by any other route");
    const urls = [];
    p.on("request", r => urls.push(r.url()));
    await p.evaluate(() => { window.__mode = 200; });
    await fill("private@example.com", "GB", true);
    await p.locator("#wl-send").click();
    await p.waitForTimeout(250);
    const leaked = urls.filter(u => !u.startsWith("file://") &&
      !u.startsWith("https://demo.voicecaptures.com/waitlist"));
    eq(leaked.length, 0, `no request anywhere but the endpoint (${urls.length} seen)`);
    ok(!urls.some(u => u.includes("private@example.com") || u.includes("private%40")),
       "the address never appears in a URL or query string");

    console.log("\n  Mobile (390px)");
    const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await m.goto("file://" + PAGE);
    const over = await m.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 1, `no horizontal overflow (${over}px)`);
    const wide = await m.evaluate(() => {
      const f = document.getElementById("wl-email");
      return f.getBoundingClientRect().width;
    });
    ok(wide > 200 && wide <= 390, `the email field fits the viewport (${Math.round(wide)}px)`);
    const fontPx = await m.evaluate(() =>
      parseFloat(getComputedStyle(document.getElementById("wl-email")).fontSize));
    ok(fontPx >= 16, `inputs are ${fontPx}px, so iOS does not zoom on focus`);

    await browser.close();
    console.log(`\n${pass} checks passed.`);
  })().catch(e => { throw e; }).finally(() => {
    fs.writeFileSync(SRC, original);
    execFileSync("python3", ["build-pages.py"], { cwd: root, stdio: "ignore" });
  });
} catch (e) {
  fs.writeFileSync(SRC, original);
  execFileSync("python3", ["build-pages.py"], { cwd: root, stdio: "ignore" });
  console.error("\nFAILED:", e.message);
  process.exit(1);
}
