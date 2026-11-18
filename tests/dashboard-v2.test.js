/* dashboard/index.html, pricing v2 settings card, in Chromium (offline):
 * the card's markup, the page's own styles and the v2 script, with api() faked.
 *   - legacy ({ v2: false }) and a 404 (server flag off): card hidden;
 *   - Lite: plan line, Google connect, caller texts behind the consent modal,
 *     transfer, 3 email fields, settings, locked cards; Personal: 1 email field, locked;
 *   - nothing is sent without ticking the consent box; phone width has no sideways scroll.
 *   node tests/dashboard-v2.test.js   (Playwright with a Chromium; preinstalled here) */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "dashboard", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const [i, s] of scripts.entries()) new vm.Script(s, { filename: `dashboard-inline-${i}.js` });
ok(true, `${scripts.length} inline script(s) parse`);
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const markup = /(<div class="card v2" id="v2Card"[\s\S]*?<\/dialog>)/.exec(html)[1];
const js = /(\/\* ---------- Pricing v2 settings ----------[\s\S]*?)\nasync function api\(/.exec(html)[1];
ok(html.includes("    loadV2();\n"), "load() calls loadV2()");
ok(/v2Post\("review-link", \{ link: \$\("v2Review"\)\.value\.trim\(\) \}\)/.test(html) && /v2Usable\(f\.review_requests\) \? `<div class="v2-row"><label>Google review link/.test(html), "Pro: the Google review link field, shown only where review requests are on the plan");

const CONSENT = { version: "2026-11-17.1", caller_sms: "CALLER TEXT CONSENT", transfer: "TRANSFER CONSENT" };
const F = (status, extra = {}) => ({ status, running: true, ...extra });
const LITE = { v2: true, plan: { key: "business_lite", label: "Business Lite", minutes: 100, package: { minutes: 50, price_cad: 75 }, emailRecipientsMax: 3 },
  features: { caller_sms: F("rolling_out", { enabled: false }), transfer: F("rolling_out", { enabled: false, destination: null, ringSeconds: 20 }), calendar_google: F("live", { connected: false }),
    calendar_outlook: F("coming_soon"), calendar_apple: F("coming_soon"), email_recipients: F("live", { emails: ["a@x.test"], max: 3 }), coverage_mode: F("live", { value: null, running: false }),
    textback: F("live", { value: false, running: false }), reminders: F("none", { value: null }), review_requests: F("none", { value: null }), report: F("live", { value: false, running: false }),
    sentiment: F("addon"), history_90: F("none"), priority_support: F("none"), custom_routing: F("none") }, consent: CONSENT };
const PER = JSON.parse(JSON.stringify(LITE));
Object.assign(PER.plan, { key: "personal", label: "Personal", minutes: 30, package: { minutes: 20, price_cad: 20 }, emailRecipientsMax: 1 });
Object.assign(PER.features, { caller_sms: F("none"), transfer: F("none"), calendar_google: F("none"), email_recipients: F("live", { emails: [], max: 1 }) });

const page0 = (settings, status = 200) => `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>${style}</style><body>${markup}<script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
window.sent = []; window.SETTINGS = ${JSON.stringify(settings)};
async function api(p, o = {}) {
  window.sent.push({ p, body: o.body ? JSON.parse(o.body) : null });
  if (p === "/api/dashboard/v2/settings") return new Response(JSON.stringify(window.SETTINGS), { status: ${status} });
  if (p === "/api/dashboard/calendar/connect") return new Response(JSON.stringify({ error: "Google sign-in isn't set up on the server." }), { status: 503 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
${js}
</script>`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route("**/*", r => r.request().url().startsWith("data:") ? r.continue() : r.abort());
  // A new page each time: setContent keeps the same window, so the script's consts would clash.
  let page; const errs = [];
  const open = async (s, st) => { if (page) await page.close(); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message)); await page.setContent(page0(s, st)); await page.evaluate(() => loadV2()); };

  console.log("Hidden");
  await open({ v2: false }); ok(await page.isHidden("#v2Card"), "legacy customer ({ v2: false }): card hidden");
  await open({ error: "Not found" }, 404); ok(await page.isHidden("#v2Card"), "server flag off (404): card hidden");

  console.log("Business Lite");
  await open(LITE);
  ok(await page.isVisible("#v2Card"), "shown");
  eq([await page.textContent("#v2Title"), await page.textContent("#v2Sub")], ["Your plan: Business Lite", "100 minutes a month · extra 50 minutes for $75"], "plan line from the API (no price in the page)");
  ok(await page.isVisible("#v2CalOn") && /Outlook Coming soon · Apple Coming soon/.test(await page.textContent("#v2Body")), "Google connect button; Outlook and Apple coming soon");
  eq(await page.$$eval(".v2Em", a => a.map(i => i.value)), ["a@x.test", "", ""], "three email fields");
  const body = await page.textContent("#v2Body");
  ok(/Appointment reminders Upgrade/.test(body) && /Caller mood Add-on/.test(body), "locked cards: reminders (upgrade), caller mood (add-on)");
  ok(/Texts to callers Rolling out/.test(body), "caller texts marked rolling out");

  console.log("Consent");
  await page.fill(".v2Em >> nth=2", "typed@x.test");
  await page.click("#v2Sms");
  ok(await page.isVisible("#v2Modal") && (await page.textContent("#v2ModalText")) === "CALLER TEXT CONSENT", "the switch opens the modal with the server's exact text");
  ok(await page.isDisabled("#v2ModalYes"), "Switch on disabled until the box is ticked");
  await page.click("#v2ModalNo");
  eq([await page.isChecked("#v2Sms"), (await page.evaluate(() => sent)).filter(x => x.p.includes("caller-sms")).length], [false, 0], "cancel: still off, nothing sent");
  await page.click("#v2Sms"); await page.check("#v2ModalOk"); await page.click("#v2ModalYes");
  await page.waitForFunction(() => sent.some(x => x.p.includes("caller-sms")));
  eq((await page.evaluate(() => sent)).find(x => x.p.includes("caller-sms")).body, { enabled: true, accept: true, consent_version: "2026-11-17.1" }, "accepted: sends enabled + accept + the version shown");
  await page.waitForFunction(() => $("v2SmsMsg") && $("v2SmsMsg").textContent === "On.");
  ok(true, "…then the card reloads from the server and says On.");
  eq(await page.inputValue(".v2Em >> nth=2"), "typed@x.test", "…keeping what was typed, unsaved, in another field");

  console.log("Transfer, emails, settings, calendar");
  await page.fill("#v2TrNum", "416-555-0188"); await page.selectOption("#v2TrRing", "25");
  await page.click("#v2TrSave"); ok((await page.textContent("#v2ModalText")) === "TRANSFER CONSENT", "transfer asks for its own consent");
  await page.check("#v2ModalOk"); await page.click("#v2ModalYes");
  await page.waitForFunction(() => sent.some(x => x.p.includes("transfer")));
  eq((await page.evaluate(() => sent)).find(x => x.p.includes("transfer")).body, { enabled: true, destination: "416-555-0188", ring_seconds: 25, accept: true, consent_version: "2026-11-17.1" }, "transfer: number, ring time, consent");
  await page.waitForFunction(() => $("v2TrMsg").textContent === "Saved.");
  await page.fill(".v2Em >> nth=1", "b@x.test"); await page.click("#v2EmSave");
  await page.waitForFunction(() => sent.some(x => x.p.includes("email-recipients")));
  eq((await page.evaluate(() => sent)).find(x => x.p.includes("email-recipients")).body, { emails: ["a@x.test", "b@x.test", "typed@x.test"] }, "emails: the filled fields");
  await page.selectOption("#v2Cov", "after_hours");
  await page.waitForFunction(() => sent.some(x => x.p.includes("/feature")));
  eq((await page.evaluate(() => sent)).find(x => x.p.includes("/feature")).body, { key: "coverage_mode", value: "after_hours" }, "coverage mode saved");
  await page.click("#v2CalOn"); await page.waitForFunction(() => $("v2CalMsg").textContent.includes("set up"));
  ok(true, "Google connect: the server's error shown when it isn't set up");
  eq(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "390 px wide: no sideways scroll");

  console.log("Personal");
  await open(PER);
  eq(await page.$$eval(".v2Em", a => a.length), 1, "one email field, with the upgrade note");
  ok(await page.$("#v2Sms") === null && await page.$("#v2TrSave") === null && await page.$("#v2CalOn") === null, "no caller texts, transfer or calendar controls");
  ok(/Confirmation texts to callers Upgrade/.test(await page.textContent("#v2Body")), "…shown as locked cards");

  eq(errs, [], "no page errors");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
