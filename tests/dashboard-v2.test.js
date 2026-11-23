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
/**
 * THE HANDFUL OF HELPERS BOTH CARDS SHARE, sliced out of the page rather than retyped.
 *
 * "Rolling out" is one badge with one look wherever it appears, so what draws it lives
 * above both cards in the page's single script. This harness takes only the settings
 * section, so without this the section references functions that are not here and the
 * card silently fails to render — which is exactly what it did.
 */
const shared = /(const V2_SALES = [\s\S]*?const v2Switchable = [^\n]*\n)/.exec(html);
if (!shared) throw new Error("the shared rolling-out helpers moved; update this slice");
ok(html.includes("    loadV2();\n"), "load() calls loadV2()");
ok(/v2Post\("review-link", \{ link: \$\("v2Review"\)\.value\.trim\(\) \}\)/.test(html) && /v2Usable\(f\.review_requests\) \? `<div class="v2-row"><label>Google review link/.test(html), "Pro: the Google review link field, shown only where review requests are on the plan");

const CONSENT = { version: "2026-11-17.1", caller_sms: "CALLER TEXT CONSENT", transfer: "TRANSFER CONSENT" };
const F = (status, extra = {}) => ({ status, running: true, ...extra });
/*
 * THE FIXTURE EXERCISES EVERY GATE, which is why it is not one plan's real entitlements:
 *   live + running          -> a working control (calendar, caller texts, transfer, emails, coverage)
 *   live + running: false   -> nothing: the server would refuse the POST (textback, report)
 *   rolling_out             -> nothing (custom_routing)
 *   coming_soon             -> nothing, not even in "Not on your plan" (Outlook, Apple)
 *   none / addon            -> a row in "Not on your plan" (reminders, review requests, caller mood)
 */
const LITE = { v2: true, plan: { key: "business_lite", label: "Business Lite", minutes: 100, package: { minutes: 50, price_cad: 75 }, emailRecipientsMax: 3 },
  features: { caller_sms: F("live", { enabled: false }), transfer: F("live", { enabled: false, destination: null, ringSeconds: 20 }), calendar_google: F("live", { connected: false }),
    calendar_outlook: F("coming_soon"), calendar_apple: F("coming_soon"), email_recipients: F("live", { emails: ["a@x.test"], max: 3 }), coverage_mode: F("live", { value: null }),
    textback: F("live", { value: false, running: false }), reminders: F("none", { value: null }), review_requests: F("none", { value: null }), report: F("live", { value: false, running: false }),
    sentiment: F("addon"), history_90: F("none"), priority_support: F("none"), custom_routing: F("rolling_out") }, consent: CONSENT };
/* Business Pro: the plan that is mostly made of features that have not shipped. */
const PRO = JSON.parse(JSON.stringify(LITE));
Object.assign(PRO.plan, { key: "business_pro", label: "Business Pro", minutes: 250 });
Object.assign(PRO.features, { reminders: F("rolling_out", { value: null }), review_requests: F("rolling_out", { value: null }),
  report: F("rolling_out", { value: null }), custom_routing: F("rolling_out"), sentiment: F("live"), history_90: F("live") });
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
${shared[1]}
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
  ok(await page.isVisible("#v2CalOn"), "Google connect button");
  /* Outlook and Apple were a row of their own under Calendar, and a "Coming soon" badge
     each. A dated promise is not a setting: it belongs on the pricing page. */
  ok(!/Outlook|Apple/.test(await page.textContent("#v2Body")), "no Outlook or Apple row, and no Coming soon badge for them");
  eq(await page.$$eval(".v2Em", a => a.map(i => i.value)), ["a@x.test", "", ""], "three email fields");
  const body = await page.textContent("#v2Body");
  ok(/Appointment reminders Upgrade/.test(body) && /Caller mood Add-on/.test(body), "locked cards: reminders (upgrade), caller mood (add-on)");
  /*
   * NO "ROLLING OUT" TAGS ON LITE.
   *
   * Every one of Calendar, caller texts, live transfer, text-back, coverage mode and email
   * recipients is `rolling_out` in the catalog for Lite, so the card was six headings, six
   * coloured badges and no working control under any of them — tags on the features its
   * customers were already paying for. A feature is drawn when it works, or not at all.
   */
  ok(!/Rolling out/.test(body), "Lite: no Rolling out tag anywhere on the card");
  ok(await page.$$eval("#v2Body .v2-badge", els => els.every(e => !e.classList.contains("soon"))), "...and no coloured badge either: what is left is grey");
  /* Live on the plan, switched off at the server: the POST route would refuse it, so there
     is no control to press and no badge to explain one. */
  ok(await page.$(".v2Tg[data-k=textback]") === null && await page.$(".v2Tg[data-k=report]") === null,
    "a live feature the server has switched off: no control, no badge");
  ok(!/Custom routing/.test(body), "a rolling_out feature: not drawn, and not listed as missing either");
  /* Every live feature on this fixture has a control, so the summary has nothing to add
     and is not drawn as an empty heading. */
  ok(!/On your plan/.test(body), "nothing live without a control: no empty \"On your plan\" heading");

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

  console.log("Business Pro: at most two tags, then the team");
  await open(PRO);
  const pro = await page.textContent("#v2Body");
  /*
   * AND IT SAYS WHAT PRO ACTUALLY HAS. Caller mood and ninety days of history are live on
   * Pro and have no setting of their own, so before this they were on the dashboard
   * nowhere: not in "Not on your plan" (they are on it) and not as a control (there is
   * none). Calendar is live in this fixture AND has a control, so it is not repeated
   * here; text-back and the monthly report are live but switched off at the server, which
   * is not something they have.
   */
  const onPlan = await page.$$eval("#v2Body .v2-sec", els => { const e = els.find(x => /On your plan/.test((x.querySelector(".v2-h") || {}).textContent || ""));
    return e ? [...e.querySelectorAll(".v2-row")].map(r => r.textContent.trim()) : null; });
  eq(onPlan, ["Caller mood", "90 days of call history"], "On your plan: the live features that have no setting of their own");
  ok(!onPlan.some(r => /Calendar/.test(r)), "...not the ones with a working control above");
  ok(!onPlan.some(r => /text-back|Monthly report/i.test(r)), "...and not one the server has switched off");
  const tags = await page.$$eval("#v2Body .v2-badge.soon", els => els.map(e => e.closest(".v2-row").textContent.trim()));
  /*
   * PRO IS SOLD ON WHAT HAS NOT SHIPPED: ten of its entitlements are rolling_out. Drawing
   * none of them tells a Pro customer nothing about what they bought; tagging all ten is
   * the wall of badges this change removes. Two, and one line to the team for the rest.
   */
  eq(tags, ["Appointment reminders Rolling out", "Review requests Rolling out"], "two named, and only two");
  const mails = await page.$$eval("#v2Body a[href^='mailto:sales@voicecaptures.com']", els => els.map(e => e.textContent));
  eq(mails, ["Talk to us (sales@voicecaptures.com)"], "the rest is one line to the team, with the address in it");
  ok(await page.$(".v2Tg[data-k=reminders]") === null && await page.$(".v2Tg[data-k=review_requests]") === null,
    "...and a tag is not a switch: neither has a control");
  ok(!/Not on your plan/.test(pro) || !/Appointment reminders Upgrade/.test(pro), "a feature that is rolling out is not also listed as an upgrade");

  console.log("Personal");
  await open(PER);
  eq(await page.$$eval(".v2Em", a => a.length), 1, "one email field, with the upgrade note");
  ok(await page.$("#v2Sms") === null && await page.$("#v2TrSave") === null && await page.$("#v2CalOn") === null, "no caller texts, transfer or calendar controls");
  ok(/Confirmation texts to callers Upgrade/.test(await page.textContent("#v2Body")), "…shown as locked cards");

  eq(errs, [], "no page errors");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
