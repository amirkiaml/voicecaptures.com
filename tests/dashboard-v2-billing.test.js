/* dashboard/index.html, pricing v2 usage / packages / plan / add-ons card, in
 * Chromium (offline), with api() faked:
 *   - hidden for legacy (403) and when the server flag is off (404);
 *   - usage meter, buy button, Personal out-of-minutes banner, trial card;
 *   - auto-package behind its consent modal; plan switch (monthly/annual),
 *     upgrade and downgrade confirmations; add-ons; prompts; receipts;
 *   - no sideways scroll at 390 px; no page errors.
 *   node tests/dashboard-v2-billing.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "dashboard", "index.html"), "utf8");
const vm = require("vm");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const [i, sc] of scripts.entries()) new vm.Script(sc, { filename: `dashboard-inline-${i}.js` });
ok(true, `${scripts.length} inline script(s) parse (no name clashes with the rest of the page)`);
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
/*
 * GREEDY TO THE LAST </dialog>, deliberately. This card has two dialogs behind it now —
 * its own plan dialog and the consent one it shares with the settings card — and a lazy
 * match stops at whichever comes first in the file, which silently left the consent modal
 * out of the harness the day a second dialog was added.
 */
const markup = /(<div class="card v2" id="v2Bill"[\s\S]*<\/dialog>)/.exec(html)[1];
const js = /(\/\* ---------- Pricing v2 usage, packages, plan, add-ons ----------[\s\S]*?)\nasync function api\(/.exec(html)[1];
ok(html.includes("    loadV2Bill();\n"), "load() calls loadV2Bill()");
ok(!/\$(19|99|199|20|75|110)\b/.test(js.replace(/\$\{[^}]*\}/g, "")), "no plan or package price written into the page script");

const plan = (key, label, month, year, minutes, cur, co = true) => ({ key, label, month, year, minutes, package: null, checkoutEnabled: co, current: cur });
const BILL = (o = {}) => ({ plan: { key: "business_lite", label: "Business Lite", billing: "month", minutes: 100, package: { minutes: 50, price_cad: 75, lookup_key: "x" }, checkoutEnabled: true },
  period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 120, allowance: 150, packages: [{ minutes: 50, price_cad: 75, source: "package" }], shortCalls: 2 },
  outOfMinutes: false, autoPackage: { available: true, running: true, enabled: false, max: 2 }, consent: { version: "2026-11-17.1", auto_package: "AUTO PACKAGE CONSENT" },
  credit: 30, pendingPlan: null, trial: null, ...o });
const PLANS = (o = {}) => ({ plans: [plan("personal", "Personal Line", 19, 190, 30, false), plan("business_lite", "Business Lite", 99, 990, 100, true), plan("business_pro", "Business Pro", 199, 1990, 250, false, false)],
  billing: "month", compare: { stay: { label: "Business Lite", cost: 174, coversMinutes: 150, packages: 1 }, next: { plan: "business_pro", label: "Business Pro", price: 199, minutes: 250 } },
  addons: { addon_calendar: { label: "Extra calendar or line", price_cad: 29, status: "available", active: false }, addon_history_90: { label: "90-day call history", price_cad: 19, status: "available", active: true },
    addon_history_365: { label: "1-year call history", price_cad: 49, status: "quoted", active: false } },
  addonsRunning: true, prompts: [{ kind: "lite_to_pro", title: "Time for Business Pro?", body: "Lite plus two extra packages is $249 for 200 minutes; Business Pro is $199 for 250." }], trial: null, ...o });

const page0 = (bill, plans, status = 200, rep = { reports: [{ month: "2026-11-01", data: { calls: 42, spam: 3, minutes: 96, booked: 7, busiestHour: 10 } }] }, inv = { invoices: [{ date: "2026-11-01", total_cad: 111.87, status: "paid", url: "https://invoice.stripe.com/i/x" }] }, repStatus = 200, invStatus = 200) => `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>${style}</style><body>${markup}<script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
window.sent = []; window.confirms = []; window.confirm = t => { confirms.push(t); return true; };
window.last = { businessName: "Bluewave Plumbing" };
const BILL = ${JSON.stringify(bill)}, PLANS = ${JSON.stringify(plans)};
async function api(p, o = {}) {
  sent.push({ p, body: o.body ? JSON.parse(o.body) : null });
  const R = (b, s = 200) => new Response(JSON.stringify(b), { status: s });
  if (p === "/api/dashboard/v2/billing") return R(BILL, ${status});
  if (p === "/api/dashboard/v2/plans") return R(PLANS, ${status});
  if (p === "/api/dashboard/v2/settings") return R({ v2: false });
  if (p === "/api/dashboard/v2/reports") return R(${JSON.stringify(rep)}, ${repStatus});
  if (p === "/api/dashboard/v2/invoices") return R(${JSON.stringify(inv)}, ${invStatus});
  if (p === "/api/dashboard/v2/package/checkout") return R({ error: "Buying minutes isn't available right now." }, 503);
  if (p === "/api/dashboard/v2/plan") return R(o.body.includes('"expect":"trial"') ? { changed: "now", trial: true, firstChargeAt: "2026-11-27T15:00:00Z" } : { changed: o.body.includes("personal") ? "at_period_end" : "now", at: "2026-12-01T00:00:00Z" });
  if (p === "/api/dashboard/change-request") return R({ ok: true, message: "Thanks, we have got it." });
  return R({ ok: true });
}
${js}
async function loadV2() {}
</script>`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route("**/*", r => r.request().url().startsWith("data:") ? r.continue() : r.abort());
  let page; const errs = [];
  const open = async (b, p, st, ...rest) => { if (page) await page.close(); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message)); await page.setContent(page0(b, p, st, ...rest)); await page.evaluate(() => loadV2Bill()); };
  const sentTo = path => page.evaluate(p => sent.filter(x => x.p === p), path);
  /* The plan dialog's contents, and the button that confirms it. */
  const planModal = () => page.evaluate(() => ({
    title: $("v2PlanModalH").textContent,
    facts: [...$("v2PlanModalFacts").children].map(e => e.textContent),
    text: $("v2PlanModalText").textContent,
    yes: $("v2PlanModalYes").textContent,
    danger: $("v2PlanModalYes").className === "btn-danger",
    open: $("v2PlanModal").open,
  }));

  console.log("Hidden");
  await open({ error: "Not found" }, {}, 404); ok(await page.isHidden("#v2Bill"), "flag off (404): hidden");
  await open({ legacy: true }, {}, 403); ok(await page.isHidden("#v2Bill"), "legacy (403): hidden");

  console.log("Business Lite");
  await open(BILL(), PLANS());
  const t = await page.textContent("#v2Bill");
  ok(/120\s*of 150 minutes used · resets 2026-12-01/.test(t) && /Extra this period: 50 min/.test(t) && /under 10 seconds don't count/.test(t), "meter: used of allowance, reset date, packages, what doesn't count");
  ok(/Buy 50 extra minutes for \$75/.test(t), "buy button from the API's package");
  ok(/Time for Business Pro\?/.test(t) && /\$249 for 200 minutes/.test(t), "this period's prompt with the math");
  ok(/At this period's usage, Business Lite costs \$174 for 150 minutes \(1 extra package\)\. Business Pro is \$199 for 250\./.test(t), "cost of staying vs the next plan");
  ok(/Account credit: \$30/.test(t), "credit balance");
  eq(await page.$$eval("[data-addon]", a => a.map(x => [x.dataset.addon, x.textContent])), [["addon_calendar", "Add"], ["addon_history_90", "Remove"]], "add-ons: add / remove; the quoted one not shown");
  await page.click("[data-buy]"); await page.waitForFunction(() => $("v2BuyMsg").textContent.includes("isn't available"));
  ok(true, "buy: the server's refusal is shown");

  console.log("Consent and changes");
  await page.click("#v2Auto");
  ok((await page.textContent("#v2ModalText")) === "AUTO PACKAGE CONSENT" && await page.isDisabled("#v2ModalYes"), "auto-package: the consent text, Switch on disabled until ticked");
  await page.click("#v2ModalNo"); eq((await sentTo("/api/dashboard/v2/auto-package")).length, 0, "cancel: nothing sent");
  await page.click("#v2Auto"); await page.check("#v2ModalOk"); await page.click("#v2ModalYes");
  await page.waitForFunction(() => $("v2AutoMsg").textContent === "On.");
  eq((await sentTo("/api/dashboard/v2/auto-package"))[0].body, { enabled: true, accept: true, consent_version: "2026-11-17.1" }, "accepted: enabled + the version shown");
  await page.click("[data-plan=personal]");
  const down = await planModal();
  ok(down.open && down.title === "Move to Personal Line?", "downgrade: a dialog, not a confirm()");
  ok(down.facts.join(" | ").includes("$19 + tax a month"), "downgrade: the price, with tax named the way the rest of the service names it");
  ok(/Takes effect\s*2026-12-01/.test(down.facts.join(" ")), "downgrade: the date it takes effect");
  ok(/no refund for the rest of this period/.test(down.text), "downgrade: no refund");
  ok(/everything your assistant already knows about your business is kept/i.test(down.text), "downgrade: the knowledge base is kept");
  await page.click("#v2PlanModalYes");
  await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/v2/plan"));
  eq((await sentTo("/api/dashboard/v2/plan"))[0].body, { plan_key: "personal", billing: "month", expect: "paid" }, "…sends the plan, interval, and that it expects a paid plan");
  ok(await page.$("[data-plan=business_pro]") === null && /Rolling out/.test(await page.textContent(".v2-plans")), "Pro with checkout off: no switch button, Rolling out");
  await page.check("input[name=v2Iv][value=year]");
  ok(/\$990\/year/.test(await page.textContent(".v2-plans")) && await page.$("[data-plan=business_lite]"), "annual: prices per year; switching Lite to annual is offered");
  await page.click("[data-plan=business_lite]");
  const up = await planModal();
  ok(up.facts.join(" | ").includes("$990 + tax a year"), "monthly → annual: the annual price with tax");
  ok(/Charged now/.test(up.facts.join(" ")) && /charged for the rest of this period at the new price/.test(up.text), "monthly → annual: an upgrade, charged now and prorated");
  ok(/Stripe works out that part-period amount to the day/.test(up.text), "...and it says who works the part-period amount out, rather than inventing one");
  const planCalls = (await sentTo("/api/dashboard/v2/plan")).length;
  await page.click("#v2PlanModalNo");
  eq((await sentTo("/api/dashboard/v2/plan")).length, planCalls, "Cancel on the dialog changes nothing");
  ok(await page.evaluate(() => !$("v2PlanModal").open), "...and closes it");
  await page.click("[data-addon=addon_calendar]");
  await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/v2/addon"));
  eq((await sentTo("/api/dashboard/v2/addon"))[0].body, { key: "addon_calendar", enabled: true }, "add-on: confirm, then sent");
  await page.click("[data-dismiss=lite_to_pro]"); await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/v2/prompts/dismiss"));
  ok(true, "Not now: dismissed");
  /* Both lists come with the card now, so there is no button to press and none to fail. */
  ok(await page.$("#v2Rcpt") === null && await page.$("#v2Reports") === null, "no Show buttons: the lists arrive with the card");
  eq(await page.getAttribute(".v2-sec a[href^='https://invoice.stripe.com']", "href"), "https://invoice.stripe.com/i/x", "receipts: Stripe's hosted links");
  ok(/2026-11: 42 calls \(3 spam screened out\), 96 minutes, 7 booked, busiest at 10:00/.test(await page.textContent("#v2BillBody")), "monthly reports listed");
  eq(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "390 px: no sideways scroll");

  console.log("Personal out of minutes, trial");
  await open(BILL({ plan: { key: "personal", label: "Personal Line", billing: "month", minutes: 30, package: { minutes: 20, price_cad: 20 } }, outOfMinutes: true, autoPackage: { available: false, running: true, enabled: false, max: 2 },
    period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 34, allowance: 30, packages: [] }, credit: 0 }), PLANS({ prompts: [] }));
  ok(/Your receptionist is paused: you're out of minutes\./.test(await page.textContent(".v2-banner")) && /Buy 20 minutes for \$20/.test(await page.textContent(".v2-banner")), "Personal out of minutes: banner with the package");
  ok(await page.$("#v2Auto") === null && await page.$eval(".v2-meter", e => e.classList.contains("over")), "no auto-package on Personal; the meter shows over");
  await open(BILL({ trial: { end: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), cap: 60 }, period: { kind: "trial", start: "2026-11-15", end: "2026-11-29", used: 12, allowance: 60, packages: [] } }), PLANS({ prompts: [] }));
  ok(/(4|5) days and 48 of 60 minutes left/.test(await page.textContent("#v2Bill")), "trial card: days and minutes left");
  /* The red button sits with the plan change now, not in the trial card above it. */
  ok(await page.$eval("#v2Start", e => e.className) === "btn-danger", "start my plan now: a red button");
  ok(await page.$eval("#v2Start", e => !!e.closest("#v2Plans")), "...beside the plan change, not in the trial card");
  await page.click("#v2Start");
  const start = await planModal();
  ok(start.danger, "start my plan now: the confirming button is the red one too");
  /* And the rule reaches it: the dialog is outside the card, so a .v2-scoped rule would not. */
  ok(await page.$eval("#v2PlanModalYes", e => getComputedStyle(e).backgroundColor) === "rgb(220, 38, 38)",
    "...and it is actually painted red, not just classed as it");
  ok(start.facts.join(" | ").includes("Charged today") && start.facts.join(" | ").includes("+ tax"), "start my plan now: what is charged today, with tax");
  ok(/every month on the same day/.test(start.facts.join(" ")), "...and when it recurs");
  ok(/ends your free trial now and charges the card on file today/i.test(start.text), "start my plan now: says plainly what it does");
  await page.click("#v2PlanModalYes");
  await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/v2/start-plan"));
  ok(true, "...and only then is it sent");

  /* And in a trial a plan change promises no charge until the trial ends. A fresh card,
     because the one above has just started its plan. */
  await open(BILL({ trial: { end: "2026-12-04", cap: 60 }, period: { kind: "trial", start: "2026-11-15", end: "2026-11-29", used: 12, allowance: 60, packages: [] } }), PLANS({ prompts: [] }));
  await page.click("[data-plan=personal]");
  const inTrial = await planModal();
  ok(/no charge until/.test(inTrial.facts.join(" ")), "a plan change during a trial: no charge until the trial ends");
  ok(/still in your free trial, so nothing is charged today/.test(inTrial.text) && !/Charged now/.test(inTrial.facts.join(" ")), "...and it never says charged now");
  /* From #62, and it has to survive the dialog: a trial switch is immediate, so a trial
     DOWNGRADE is not "scheduled" — the button says Switch, not Schedule. */
  ok(inTrial.title === "Switch to Personal Line?" && inTrial.yes === "Switch to Personal Line", "...a trial change is a switch, not a scheduled one");
  ok(/trial's minutes and end date stay the same/.test(inTrial.text), "...and the trial itself is untouched");
  await page.click("#v2PlanModalNo");

  console.log("Personal trial: one minutes figure, and switching in a trial");
  const tEnd = new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10);
  const PER_T = (per, trial) => BILL({ plan: { key: "personal", label: "Personal Line", billing: "month", minutes: 30, package: { minutes: 20, price_cad: 20 }, checkoutEnabled: true },
    autoPackage: { available: false, running: true, enabled: false, max: 2 }, credit: 0, trial: { end: tEnd, cap: 15, ...trial }, period: { kind: "trial", start: "2026-11-20", end: tEnd, allowance: 15, packages: [], ...per } });
  const PPLANS = PLANS({ prompts: [], plans: [plan("personal", "Personal Line", 19, 190, 30, true), plan("business_lite", "Business Lite", 99, 990, 100, false), plan("business_pro", "Business Pro", 199, 1990, 250, false, false)] });
  for (const [label, bill] of [["API before this fix (1:29 = 1.48)", PER_T({ used: 1.48 }, {})], ["API with the rule", PER_T({ used: 2, left: 13 }, { left: 13 })]]) {
    await open(bill, PPLANS);
    const tt = await page.textContent("#v2Bill");
    ok(/13 of 15 minutes left/.test(tt) && /2\s*of 15 minutes used/.test(tt), `1:29 call, ${label}: "13 of 15 minutes left" and "2 of 15 minutes used"`);
  }
  await open(PER_T({ used: 1, left: 14 }, { left: 14 }), PPLANS);
  ok(/14 of 15 minutes left/.test(await page.textContent("#v2Bill")) && /1\s*of 15 minutes used/.test(await page.textContent("#v2Bill")), "0:59 call: 14 left, 1 used");
  await page.click("[data-plan=business_lite]");
  /* #62's wording, now in the dialog rather than a confirm(): the same four promises. */
  const tc = await planModal();
  ok(tc.title === "Switch to Business Lite?", "in a trial: a switch, offered as one");
  ok(tc.facts.join(" ").includes(`no charge until ${tEnd}`), "in a trial: nothing charged today, and the date it starts");
  ok(/still in your free trial, so nothing is charged today/.test(tc.text) && !/charged the difference/.test(tc.text), "in a trial: no \"charged the difference today\"");
  ok(new RegExp(`first charge is the Business Lite price on ${tEnd}`).test(tc.text), "in a trial: the first charge is the NEW plan's price, when the trial ends");
  ok(/trial's minutes and end date stay the same/.test(tc.text), "in a trial: the trial itself is untouched");
  await page.click("#v2PlanModalYes");
  await page.waitForFunction(() => /First charge/.test($("v2PlanMsg").textContent));
  eq([(await sentTo("/api/dashboard/v2/plan"))[0].body, await page.textContent("#v2PlanMsg")], [{ plan_key: "business_lite", billing: "month", expect: "trial" }, "You're on Business Lite. First charge $99 a month on 2026-11-27."], "…sends expect: trial; says when the first charge is");
  console.log("Figures the server did not send");
  /*
   * "$NaN" REACHED THE PAGE. `compare()` builds `stay.cost` as `cur.price_cad.month + ...`,
   * and a plan whose `price_cad` is the string "quoted" has no `.month`, so the sum is NaN
   * and the sentence read "Personal Line costs $NaN for 30 minutes".
   */
  await open(BILL({ plan: { key: "personal", label: "Personal Line", billing: "month", minutes: 30, package: null, checkoutEnabled: true },
      period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 12, allowance: 30, packages: [] }, credit: 0 }),
    PLANS({ compare: { stay: { label: "Personal Line", cost: undefined, coversMinutes: 30, packages: 0 }, next: { plan: "business_lite", label: "Business Lite", price: 99, minutes: 100 } }, prompts: [] }));
  const noFig = await page.textContent("#v2BillBody");
  ok(!/NaN/.test(noFig), "a figure the server did not send never renders as $NaN");
  ok(!/Personal Line costs/.test(noFig), "...and the half of the sentence that needed it is dropped whole");
  ok(/Business Lite is \$99 for 100\./.test(noFig), "...while the half that has its figures still reads");

  console.log("Rolling out: nothing to press, and somewhere to write");
  await open(BILL(), PLANS({ addonsRunning: false, prompts: [],
    addons: { addon_calendar: { label: "Extra calendar or line", price_cad: 29, status: "none", active: false },
      addon_history_90: { label: "90-day call history", price_cad: 19, status: "available", active: false } } }));
  const sections = await page.$$eval(".v2-sec", els => els.map(e => ({ h: (e.querySelector(".v2-h") || {}).textContent || "", t: e.textContent, btns: e.querySelectorAll("button").length })));
  const addonSec = sections.find(x => /Add-ons/.test(x.h));
  ok(/Rolling out/.test(addonSec.h) && /sales@voicecaptures\.com/.test(addonSec.h), "add-ons rolling out: a Rolling out badge and the address, in the heading");
  eq(addonSec.btns, 0, "add-ons rolling out: no Add, no Remove");
  ok(!/Upgrade/.test(addonSec.t), "add-ons rolling out: no Upgrade badge either");
  ok(/Extra calendar or line · \$29\/month/.test(addonSec.t) && /90-day call history · \$19\/month/.test(addonSec.t), "add-ons rolling out: rows keep their name and price");
  ok(await page.$eval(".v2-sec .v2-badge.soon", e => getComputedStyle(e).backgroundColor !== getComputedStyle(e.closest(".v2-sec")).backgroundColor), "the Rolling out badge is a coloured badge, not the grey one");
  const proTile = await page.$eval(".v2-plans .v2-plan:last-child", e => ({ t: e.textContent, btns: e.querySelectorAll("button").length, mail: !!e.querySelector("a[href^='mailto:']") }));
  ok(/Rolling out/.test(proTile.t) && proTile.btns === 0 && proTile.mail, "Business Pro tile: no button, a Rolling out badge and the address");

  console.log("A prompt that leads nowhere");
  await open(BILL(), PLANS({ prompts: [{ kind: "lite_to_pro", title: "Time for Business Pro?", body: "…" }],
    compare: { stay: { label: "Business Lite", cost: 174, coversMinutes: 150, packages: 1 }, next: { plan: "business_pro", label: "Business Pro", price: 199, minutes: 250, checkoutEnabled: false } } }));
  ok(await page.$("[data-up]") === null, "no 'See Business Pro' button while that plan cannot be switched to");
  ok(/Time for Business Pro\?/.test(await page.textContent(".v2-prompt")) && await page.$("[data-dismiss]") !== null, "...the prompt keeps its words and its Not now");

  console.log("Reports and receipts: shown, said plainly, or not at all");
  await open(BILL({ credit: 0, trial: { end: "2026-12-04", cap: 60 } }), PLANS({ prompts: [] }), 200, { reports: [], running: true }, { invoices: [] });
  const empty = await page.textContent("#v2BillBody");
  ok(/Monthly reports/.test(empty) && /Your first report appears after your first full month\./.test(empty), "reports, none yet: the section is shown and says so");
  ok(/No receipts yet: your first charge is 2026-12-04\./.test(empty), "receipts in a trial: the section names the day the trial ends");
  ok(!/Show reports|Show receipts/.test(empty), "and neither is a button that would have to ask");

  /* Off a trial there is no first charge to name: the period end is when the NEXT one
     lands, which is a different promise, so no date is attached to it. */
  await open(BILL({ credit: 0, trial: null }), PLANS({ prompts: [] }), 200, { reports: [], running: true }, { invoices: [] });
  const noTrial = await page.textContent("#v2BillBody");
  ok(/No receipts yet\./.test(noTrial) && !/first charge/.test(noTrial), "receipts off a trial: no date promised");

  await open(BILL({ credit: 0 }), PLANS({ prompts: [] }), 200, { reports: [], running: false }, { invoices: [] });
  ok(!/Monthly reports/.test(await page.textContent("#v2BillBody")), "reports the server says are not running: no section");
  await open(BILL({ credit: 0 }), PLANS({ prompts: [] }), 200, { error: "no" }, { error: "no" }, 404, 500);
  const gone = await page.textContent("#v2BillBody");
  ok(!/Monthly reports/.test(gone) && !/Billing/.test(gone), "a request that failed: no section at all, and no button to an error");

  console.log("Rolling out, everywhere it is said");
  await open(BILL({ autoPackage: { available: true, running: false, enabled: false, max: 2 } }), PLANS({ prompts: [] }));
  const auto = await page.$$eval(".v2-sec", els => (els.find(e => /Automatic extra minutes/.test((e.querySelector(".v2-h") || {}).textContent || "")) || {}).outerHTML || "");
  ok(/v2-badge soon">Rolling out</.test(auto) && /mailto:sales@voicecaptures\.com/.test(auto), "automatic extra minutes: the same coloured badge and the same address");
  const grey = await page.$$eval(".v2-badge:not(.soon)", els => els.map(e => e.textContent));
  ok(!grey.includes("Rolling out"), "no grey 'Rolling out' badge is left anywhere on the card");

  console.log("After an upgrade to Business");
  await open(BILL({ plan: { key: "personal", label: "Personal Line", billing: "month", minutes: 30, package: null, checkoutEnabled: true },
      period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 12, allowance: 30, packages: [] }, credit: 0, trial: null }),
    PLANS({ prompts: [], compare: { stay: { label: "Personal Line", cost: 19, coversMinutes: 30, packages: 0 }, next: { plan: "business_lite", label: "Business Lite", price: 99, minutes: 100 } },
      plans: [plan("personal", "Personal Line", 19, 190, 30, true), plan("business_lite", "Business Lite", 99, 990, 100, false), plan("business_pro", "Business Pro", 199, 1990, 250, false, false)] }));
  ok(await page.$("#v2Tell") === null, "before the upgrade there is no card asking about the business");
  await page.click("[data-plan=business_lite]");
  await page.click("#v2PlanModalYes");
  await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/v2/plan"));
  /*
   * THE CARD IS ARMED BY THE UPGRADE AND SHOWN BY THE PAYLOAD, which is two steps on
   * purpose: an upgrade that did not actually land must not produce the card. The fake
   * server here keeps answering with the old plan, so the two are asserted separately —
   * first that the upgrade armed it, then that a business payload draws it.
   */
  ok(await page.evaluate(() => v2TellWanted()), "an upgrade to Business that took effect now arms the card");
  ok(await page.$("#v2Tell") === null, "...and it stays away while the billing payload still says Personal");
  ok(await page.evaluate(() => { v2TellSet(false); v2AfterPlanChange({ key: "personal" }, { changed: "at_period_end" }); return v2TellWanted(); }) === false,
    "a scheduled downgrade arms nothing");
  ok(await page.evaluate(() => { v2AfterPlanChange({ key: "business_pro" }, { changed: "now" }); return v2TellWanted(); }), "any Business plan arms it");

  await open(BILL({ plan: { key: "business_lite", label: "Business Lite", billing: "month", minutes: 100, package: null, checkoutEnabled: true },
      period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 12, allowance: 100, packages: [] }, credit: 0, trial: null }), PLANS({ prompts: [] }));
  await page.evaluate(() => { v2TellSet(true); renderV2Bill(); });
  await page.waitForSelector("#v2Tell");
  ok(true, "on a Business plan, with the card armed, it is drawn");
  eq(await page.$$eval("#v2Tell .v2TellF", els => els.map(e => e.dataset.k)), ["name", "type", "what", "hours", "area", "asks"],
    "...with the Business builder's six fields, in its order");
  eq(await page.inputValue("#v2Tell-name"), "Bluewave Plumbing", "...the business name prefilled from what we already know");

  /* It is sent down the team's own authenticated, rate-limited channel. */
  await page.fill("#v2Tell-what", "Drain cleaning, water heaters");
  await page.fill("#v2Tell-hours", "Mon-Fri 8-6");
  await page.click("#v2TellSend");
  await page.waitForFunction(() => sent.some(x => x.p === "/api/dashboard/change-request"));
  const tell = (await sentTo("/api/dashboard/change-request"))[0].body;
  ok(/Bluewave Plumbing/.test(tell.text) && /Drain cleaning, water heaters/.test(tell.text) && /Mon-Fri 8-6/.test(tell.text), "the answers reach the team");
  ok(/What do callers usually ask\?\n—/.test(tell.text), "...and a question left blank is sent as blank, not left out");
  ok(tell.text.length <= 1000, "...inside the route's 1000-character limit");
  eq(tell.topics, ["name", "hours", "services"], "...with topics the route accepts");
  await page.waitForFunction(() => /Thanks/.test($("v2TellMsg").textContent));
  ok(true, "the team's reply is shown");

  console.log("Nothing to send, and Not now");
  await open(BILL({ plan: { key: "business_lite", label: "Business Lite", billing: "month", minutes: 100, package: null, checkoutEnabled: true },
      period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 12, allowance: 100, packages: [] }, credit: 0, trial: null }), PLANS({ prompts: [] }));
  await page.evaluate(() => { v2TellSet(true); renderV2Bill(); });
  await page.waitForSelector("#v2Tell");
  const before = (await sentTo("/api/dashboard/change-request")).length;
  /* Cleared, because the name arrives prefilled and a prefilled card is not an empty one. */
  await page.fill("#v2Tell-name", "");
  await page.click("#v2TellSend");
  await page.waitForFunction(() => /Fill in what you can/.test($("v2TellMsg").textContent));
  eq((await sentTo("/api/dashboard/change-request")).length, before, "an empty card sends nothing");
  await page.click("#v2TellNo");
  ok(await page.$("#v2Tell") === null, "Not now puts it away");

  console.log("After a downgrade");
  await open(BILL({ plan: { key: "business_lite", label: "Business Lite", billing: "month", minutes: 100, package: null, checkoutEnabled: true },
      period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 12, allowance: 100, packages: [] }, credit: 0, trial: null,
      pendingPlan: { plan_key: "personal", billing: "month", at: "2026-12-01" } }), PLANS({ prompts: [] }));
  const kept = await page.textContent("#v2BillBody");
  ok(/What happens to what we know/.test(kept) && /is kept/.test(kept), "a scheduled downgrade says the business knowledge base is kept");
  ok(await page.$("#v2Tell") === null, "...and does not ask them to fill the business form in again");

  console.log("A plan priced on a call (price_cad \"quoted\")");
  await open(BILL(), PLANS({ prompts: [], compare: { stay: { plan: "enterprise", label: "Enterprise", quoted: true }, next: null } }));
  const qt = await page.textContent("#v2Plans");
  ok(/Enterprise is priced on a call/.test(qt) && !/NaN|undefined/.test(qt), "Your plan: \"Enterprise is priced on a call\", no $NaN / undefined");

  eq(errs, [], "no page errors");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
