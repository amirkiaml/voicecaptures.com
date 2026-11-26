/* Dashboard V2 (dashboard/layout-v2.js): the whole page, in Chromium, offline, API faked.
 *   - layout not "v2" (the flag off, or a customer not on the list): the page is exactly
 *     the legacy page: same DOM, no class, no style, the ?calendar= query left alone;
 *   - layout "v2": sidebar with 4 tabs, every existing section on its tab with its id,
 *     Back between tabs, charts redrawn at their real width;
 *   - ?calendar=failed&reason=...: Settings opens, the reason is shown as text (never HTML),
 *     the query is removed; ?calendar=connected: "Google Calendar connected.";
 *   - Calendar card first in Settings: the real Connect button when it's usable,
 *     "Coming soon" and a disabled button while the catalog says rolling_out;
 *   - phone width: bottom tab bar, no sideways scroll;
 *   - index.html's load() is byte for byte the same as before V2.
 *   node tests/dashboard-layout-v2.test.js
 * Screenshots (not part of the test): SHOTS=/tmp/dir DASH_FIXTURE=/path/dashboard.json node tests/dashboard-layout-v2.test.js */
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "dashboard", "index.html"), "utf8");

/* load() exactly as it was before V2 (main at 8d3096d): its sha256. V2 must not need it changed. */
const LOAD_SHA256 = "9199277a530350d48b944be029960e0dae3e5283bf18fc660ab83a448426edbc";
const loadSrc = /\nasync function load\(\) \{[\s\S]*?\n\}\n/.exec(html)[0];
eq(require("crypto").createHash("sha256").update(loadSrc).digest("hex"), LOAD_SHA256, "load() byte for byte as before V2");
ok(/<\/script>\n<script src="\/dashboard\/layout-v2\.js"><\/script>\n<\/body>/.test(html), "index.html: the one added line, after the page's own script");

const DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
const call = (i, o) => ({ id: `c${i}`, created_at: new Date(Date.UTC(2026, 10, 25, 14 + i)).toISOString(), vapi_call_id: `v${i}`, caller_name: "Dana", phone: "+14165550100", caller_id: "+14165550100",
  issue_description: "Leaking tap", urgency: "message", job_status: "booked", call_duration_seconds: 90 + i, outcome: "booked", auto_outcome: "booked", has_recording: false, recording_url: null,
  summary: "Dana booked a visit.", silent: false, _silent: false, messages: [], ...o });
const DASH = (o = {}) => ({ businessName: "Bluewave Plumbing", bookingNoun: "Appointment", businessId: "b-1", receptionistNumber: "+14165550123", changeRequests: true, changeRequestForm: "business_selfserve",
  businesses: [{ id: "b-1", name: "Bluewave Plumbing" }], signedInAs: "o@bluewave.test", isAdmin: false,
  features: { recordings: true, usage: true, callbacks: true }, canSeeRecordings: true, canReview: false, days: 7,
  settings: { timezone: "America/Toronto", openHour: 9, closeHour: 18, openDays: [0, 1, 2, 3, 4], bookingLabel: "Appointments", hiddenSections: [], avgJobValue: null, customStatuses: [] },
  usage: { minutesUsed: 18, minutesAllowed: 60, percent: 30, periodStart: "2026-11-24", periodEnd: "2026-12-08", resetDate: "2026-12-09", trial: true, extraMinutes: 0, overMinutes: 0, overageCharge: 0, overageWaived: false, rates: { overage: 1.5, topup50: 65, topup100: 120 }, hardCap: false, whilePaused: "message" },
  retention: { days: 14, nextCleanup: "2026-11-26T09:00:00Z" }, service: { active: true, mode: "auto", reason: null, since: null, salesEmail: "sales@voicecaptures.com", links: [], whilePaused: "message" },
  topCallers: { byCalls: [], byTime: [] },
  totals: { totalCalls: 6, silent: 0, abandoned: 1, booked: 4, emergencies: 0, conversionRate: 80, avgDurationSeconds: 95, estRevenue: null, afterHours: 2, bookedAfterHours: 1, uniqueCallers: 3, repeatCallers: 1 },
  previous: { totalCalls: 2, booked: 1, afterHours: 0, conversionRate: 50 },
  daily: DAYS.map((label, i) => ({ label, calls: i % 3, booked: i % 2 })),
  byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, calls: hour % 5 === 0 ? 1 : 0, afterHours: hour < 9 || hour >= 18 })),
  byWeekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, calls: i, booked: 0, closed: i > 4 })),
  outcomes: { booked: 4, pending: 1, emergency: 0, abandoned: 1, other: 0, spam: 0, silent: 0 }, customOutcomes: {}, sentiment: null,
  calls: [call(0), call(1, { job_status: "pending", outcome: "pending", auto_outcome: "pending" })], ...o });
const F = (status, extra = {}) => ({ status, running: true, ...extra });
const SETTINGS = cal => ({ v2: true, plan: { key: "business_lite", label: "Business Lite", minutes: 100, package: { minutes: 50, price_cad: 75 }, emailRecipientsMax: 3 },
  features: { calendar_google: cal, caller_sms: F("none"), transfer: F("none"), email_recipients: F("live", { emails: [], max: 3, owner: "o@bluewave.test", extra: 2 }), coverage_mode: F("none"),
    textback: F("none"), reminders: F("none"), review_requests: F("none"), report: F("none"), sentiment: F("addon"), history_90: F("addon"), priority_support: F("none"), custom_routing: F("none"),
    answers_existing_number: F("live"), spam_screening: F("live"), messages_summary: F("live"), dashboard: F("live"), tailored_to_business: F("live") },
  consent: { version: "2026-11-17.1" } });

const plan = (key, label, month, year, minutes, cur, co = true) => ({ key, label, month, year, minutes, package: null, checkoutEnabled: co, current: cur });
const BILL = { plan: { key: "business_lite", label: "Business Lite", billing: "month", minutes: 100, package: { minutes: 50, price_cad: 75, lookup_key: "x" }, checkoutEnabled: true },
  period: { kind: "billing", start: "2026-11-01", end: "2026-12-01", used: 40, allowance: 100, packages: [], shortCalls: 0 }, outOfMinutes: false,
  autoPackage: { available: false, running: false, enabled: false, max: 2 }, consent: { version: "2026-11-17.1" }, credit: 0, pendingPlan: null, trial: null };
const PLANS = { plans: [plan("personal", "Personal Line", 19, 190, 30, false), plan("business_lite", "Business Lite", 99, 990, 100, true), plan("business_pro", "Business Pro", 199, 1990, 250, false, false)],
  billing: "month", compare: { stay: { label: "Business Lite", cost: 99, coversMinutes: 100, packages: 0 }, next: { plan: "business_pro", label: "Business Pro", price: 199, minutes: 250 } },
  addons: { addon_calendar: { label: "Extra calendar or line", price_cad: 29, status: "available", active: false }, addon_history_90: { label: "90-day call history", price_cad: 19, status: "available", active: true },
    addon_history_365: { label: "1-year call history", price_cad: 49, status: "available", active: false }, addon_sentiment: { label: "Caller sentiment", price_cad: 9, status: "available", active: false } },
  addonsRunning: false, prompts: [], trial: null };
const SUPABASE_STUB = `window.supabase = { createClient: () => ({ auth: {
  getSession: async () => ({ data: { session: { access_token: "t", user: { email: "o@bluewave.test" } } } }),
  onAuthStateChange: () => {}, signOut: async () => {} } }) };`;

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(ROOT, p.endsWith("/") ? p + "index.html" : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const type = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" }[path.extname(f)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type }); fs.createReadStream(f).pipe(res);
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errs = [];
  async function open(url, { dash = DASH(), settings = SETTINGS(F("live", { connected: false })), width = 1280, height = 900, theme = "light", bill = null, plans = null, tell = false, portal = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
    await ctx.addInitScript(([t, tell]) => { try { localStorage.setItem("vc_theme", t); if (tell) localStorage.setItem("vc_tell_business", "1"); } catch (e) {} }, [theme, tell]);
    await ctx.route("**/*", r => {
      const u = new URL(r.request().url());
      if (u.origin === BASE) return r.continue();
      if (u.hostname === "cdn.jsdelivr.net" && u.pathname.includes("supabase")) return r.fulfill({ contentType: "text/javascript", body: SUPABASE_STUB });
      if (u.hostname === "api.voicecaptures.com") {
        const J = (b, s = 200) => r.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(b) });
        if (u.pathname === "/api/dashboard/config") return J({ supabaseUrl: "https://x.supabase.co", supabaseKey: "k" });
        if (u.pathname === "/api/dashboard") { (globalThis.dashHits = globalThis.dashHits || []).push(u.searchParams.get("business")); return J(dash); }
        if (u.pathname === "/api/dashboard/v2/settings") return J(settings);
        if (u.pathname === "/api/dashboard/callbacks") return J({ open: [], done: [] });
        if (u.pathname === "/api/dashboard/v2/billing") { (globalThis.billHits = globalThis.billHits || []).push(u.search); return J(globalThis.billNow || bill || BILL); }
        if (u.pathname === "/api/dashboard/v2/keep-plan" && r.request().method() === "POST") { globalThis.keepHits = (globalThis.keepHits || 0) + 1; globalThis.billNow = { ...(bill || BILL), cancel: { at: null, cancelled: false, canReactivate: false, top: true } }; return J({ ok: true, kept: true }); }
        if (u.pathname === "/api/dashboard/billing-portal") { if (r.request().method() === "POST") { globalThis.portalHits = (globalThis.portalHits || 0) + 1; return J({ url: "https://billing.stripe.com/p/session/test" }); } return J({ available: portal }); }
        if (u.pathname === "/api/dashboard/v2/plans") return J(plans || PLANS);
        return J({ error: "not here" }, 404);
      }
      return r.abort();
    });
    const page = await ctx.newPage();
    page.on("pageerror", e => errs.push(e.message));
    await page.goto(BASE + url);
    await page.waitForFunction(() => !document.getElementById("app").hidden && document.getElementById("biz").textContent !== "Loading…");
    await page.waitForTimeout(300);
    return page;
  }
  const dom = page => page.evaluate(() => {
    const a = document.getElementById("app");
    return { cls: document.documentElement.className, style: !!document.getElementById("dv2Style"), parent: a.parentElement.className,
      order: [...a.querySelectorAll("[id]")].map(e => e.id).join(","),
      side: !!document.getElementById("dv2Side"), url: location.pathname + location.search };
  });

  if (process.env.SHOTS) {
    const dir = process.env.SHOTS, real = process.env.DASH_FIXTURE ? JSON.parse(fs.readFileSync(process.env.DASH_FIXTURE, "utf8")) : DASH({ layout: "v2" });
    fs.mkdirSync(dir, { recursive: true });
    const shots = [["overview", "/dashboard/#overview", 1366, 1500], ["calls", "/dashboard/#calls", 1366, 1100], ["settings", "/dashboard/#settings", 1366, 1500],
      ["settings-soon", "/dashboard/#settings", 1366, 1000, SETTINGS(F("rolling_out"))], ["billing", "/dashboard/#billing", 1366, 1900],
      ["tablet", "/dashboard/#overview", 900, 1300], ["phone", "/dashboard/#overview", 390, 1700], ["calendar-failed", "/dashboard/?calendar=failed&reason=Google%20said%20no%20access", 1366, 900],
      ["dark", "/dashboard/#overview", 1366, 1200, undefined, "dark"], ["ent-overview", "/dashboard/#overview", 1366, 1500, "ENT"], ["ent-settings", "/dashboard/#settings", 1366, 900, "ENT"],
      ["ent-dark", "/dashboard/#overview", 1366, 900, "ENT", "dark"], ["ent-phone", "/dashboard/#overview", 390, 900, "ENT"]];
    const ENTS = SETTINGS(F("live", { connected: false })); ENTS.plan = { key: "enterprise", label: "Enterprise", minutes: 600, package: null, emailRecipientsMax: 3 };
    const BIZ = ["The Bbq", "Ameer Kiani", "Amir Personal", "Create Ivf", "Del Grande Homes", "Home Services", "Mimi Mumu", "Over The Vines", "Yonge Bloor Dental"].map((name, i) => ({ id: i ? `b-${i}` : real.businessId, name }));
    const FSH = SETTINGS(F("live", { connected: true })); FSH.features.caller_sms = F("live", { enabled: true }); FSH.features.transfer = F("live", { ownerOnly: true, enabled: false, destination: "+14168226186" });
    shots.push(["features", "/dashboard/#settings", 1366, 1700, FSH]);
    shots.push(["customize", "/dashboard/#settings", 1366, 1000, undefined, undefined, false, "gear"], ["billing-manage", "/dashboard/#billing", 1366, 900, undefined, undefined, false, "trial"]);
    shots.push(["switcher", "/dashboard/#overview", 1366, 760, undefined, undefined, true], ["switcher-dark", "/dashboard/#overview", 1366, 760, undefined, "dark", true], ["switcher-phone", "/dashboard/#overview", 390, 700, undefined, undefined, true]);
    for (const [n, u, w, h, s, t, sw, extra] of shots) {
      const p = await open(u, { tell: true, portal: extra === "trial", bill: extra === "trial" ? { ...BILL, trial: { end: "2026-12-08T23:36:48Z" } } : null, dash: sw ? { ...real, businesses: BIZ, isAdmin: true } : real, width: w, height: h, settings: s === "ENT" ? ENTS : s || SETTINGS(F("live", { connected: false })), theme: t || "light" });
      if (extra === "gear") { await p.click("#gear"); await p.waitForTimeout(300); await p.evaluate(() => document.getElementById("settings").scrollIntoView()); }
      if (sw) { await p.click("#dv2SwBtn"); await p.waitForTimeout(250); await p.mouse.move(150, 300); }
      await p.screenshot({ path: path.join(dir, `${n}.png`), fullPage: !sw && extra !== "gear" }); await p.context().close(); console.log("shot", n);
    }
    await browser.close(); server.close(); return;
  }

  console.log("Legacy: layout not v2 → nothing changes");
  const leg = await open("/dashboard/?calendar=failed&reason=x", { dash: DASH() });
  const legDom = await dom(leg);
  eq([legDom.cls, legDom.style, legDom.side, legDom.parent], ["", false, false, "wrap"], "no class, no style, no sidebar; #app where it always was");
  eq(legDom.url, "/dashboard/?calendar=failed&reason=x", "the ?calendar= query is left alone");
  ok(await leg.isVisible("#kpis") && await leg.isVisible('[data-section="log"]'), "the legacy page renders its KPIs and call log");
  const legOrder = legDom.order; await leg.context().close();
  const leg2 = await open("/dashboard/", { dash: DASH({ layout: "v1" }) });
  eq((await dom(leg2)).order, legOrder, "any other layout value: the same legacy DOM, id for id"); await leg2.context().close();

  console.log("V2");
  const v = await open("/dashboard/", { dash: DASH({ layout: "v2" }) });
  const vd = await dom(v);
  ok(vd.cls.split(" ").includes("dv2") && vd.side, "html.dv2 and the sidebar");
  eq(await v.$$eval("#dv2Nav a", a => a.map(x => x.textContent)), ["Overview", "Calls", "Settings", "Billing"], "four tabs");
  const where = id => v.evaluate(i => { const e = document.getElementById(i); const p = e && e.closest(".dv2-panel, #dv2Side"); return p ? p.id : null; }, id);
  for (const [id, tab] of [["hero", "dv2-overview"], ["kpis", "dv2-overview"], ["daily", "dv2-overview"], ["hours", "dv2-overview"], ["outcomes", "dv2-overview"], ["week", "dv2-overview"], ["insights", "dv2-overview"], ["tcGrid", "dv2-overview"],
    ["logRow", "dv2-calls"], ["cbCard", "dv2-calls"], ["retentionNote", "dv2-calls"], ["dv2Cal", "dv2-settings"], ["v2Card", "dv2-settings"], ["rnCard", "dv2-settings"], ["settings", "dv2-settings"], ["crCard", "dv2-settings"], ["pwPanel", "dv2-settings"],
    ["v2Bill", "dv2-billing"], ["usageCard", "dv2Side"]]) eq(await where(id), tab, `#${id} → ${tab}`);
  eq(await v.evaluate(ids => ids.filter(id => !document.getElementById(id)), legOrder.split(",")), [], "every legacy element is still on the page, same id");
  ok(await v.isVisible("#dv2-overview") && await v.isHidden("#dv2-calls"), "opens on Overview");
  const w = await v.$eval("#daily", s => s.clientWidth);
  ok(w > 0 && w < 1000, `Calls per day drawn at the panel's width (${w}px), not the 700px fallback for hidden charts`);
  await v.click('#dv2Nav a[data-tab="calls"]'); await v.waitForTimeout(100);
  ok(await v.isVisible('[data-section="log"]') && await v.isHidden("#dv2-overview"), "Calls tab shows the call log");
  ok((await v.$$("#log tr")).length >= 2, "the call log's rows are drawn by the page's own renderLog");
  await v.click('#dv2Nav a[data-tab="settings"]'); await v.waitForTimeout(100);
  ok(await v.isHidden("#range"), "range selector hidden on Settings");
  eq(await v.evaluate(() => document.querySelector("#dv2-settings").firstElementChild.id), "dv2Cal", "Calendar is the first card in Settings");
  ok(await v.isVisible("#dv2Cal #v2CalOn") && await v.isHidden("#dv2CalSoon"), "usable: the page's own Connect button, inside the Calendar card");
  await v.goBack(); await v.waitForTimeout(100);
  ok(await v.isVisible('[data-section="log"]'), "Back returns to Calls");
  await v.click("#gear"); await v.waitForTimeout(100);
  ok(await v.isVisible("#settings"), "⚙ Customize opens the Customize card on Settings");
  await v.context().close();

  console.log("Round 2: assistant number, account, plan cards, billing");
  const r2 = await open("/dashboard/", { dash: DASH({ layout: "v2", account: { ownerPhone: "+14165550177", ownerEmail: "o@bluewave.test" } }) });
  await r2.waitForFunction(() => document.getElementById("dv2AssistNum").textContent.trim() !== "");
  eq(await r2.$eval("#dv2AssistNum", e => e.textContent.trim()), await r2.$eval("#rnNum", e => e.textContent.trim()), "Overview: the assistant's number, the same number the receptionist card shows");
  ok(await r2.evaluate(() => document.querySelector("#dv2-overview").firstElementChild.id === "dv2Assist"), "…first on Overview");
  await r2.click('#dv2Nav a[data-tab="settings"]'); await r2.waitForTimeout(150);
  const acct = await r2.$$eval("#dv2AcctList dd", d => Object.fromEntries(d.map(x => [x.dataset.k, x.textContent])));
  eq([acct["Owner's phone"], acct["Owner's email"], acct.Business, acct.Plan], ["+1 416-555-0177", "o@bluewave.test", "Bluewave Plumbing", "Business Lite"], "Settings: account card with the owner's phone and email, business and plan");
  ok(!("Signed in as" in acct), "…signed-in email left out when it is the owner's email");
  ok(await r2.$$eval("#v2Card .dv2-onplan .v2-row", r => r.length) >= 5, "plan card: On your plan items drawn as ticks");
  ok(!(await r2.$$eval("#v2Card .v2-h", h => h.some(x => x.textContent.trim() === "Not on your plan"))), "Not on your plan: gone (the Add-ons card replaces it)");
  await r2.waitForSelector("#dv2Addons:not([hidden]) .dv2-addon");
  const ads = await r2.$$eval("#dv2AddonList .dv2-addon", r => r.map(x => [x.querySelector(".dv2-addon-n").textContent, x.querySelector(".dv2-addon-p") && x.querySelector(".dv2-addon-p").textContent, x.querySelector(".dv2-addon-tag").textContent, x.querySelector("a") ? x.querySelector("a").getAttribute("href").startsWith("mailto:sales@voicecaptures.com") : false]));
  eq(ads, [["Extra calendar or line", "$29/mo", "Auto-activation rolling out", true], ["90-day call history", "$19/mo", "Active", false], ["1-year call history", "$49/mo", "Auto-activation rolling out", true],
    ["Caller sentiment", "$9/mo", "Auto-activation rolling out", true], ["Practice-software, field-service, POS or CRM integration", "Quoted on a call", "Auto-activation rolling out", true]],
    "Add-ons: the server's names and prices, Auto-activation rolling out + Email us (sales@), Active when on");
  eq(await r2.$eval("#crCard .panel-title", t => [t.textContent, !!t.querySelector("em")]), ["Request a change", true], "Request a change: same words, contact-form look");
  ok(await r2.$eval("#dv2Cal .dv2-cal-ico img", i => i.getAttribute("src")) === "/dashboard/img/google-calendar.png", "Calendar card: the Google Calendar icon");
  await r2.click('#dv2Nav a[data-tab="billing"]'); await r2.waitForSelector("#v2Plans .v2-plan");
  const boxes = await r2.$$eval("#v2Plans .v2-plan", b => b.map(x => [x.querySelector("b").textContent, x.classList.contains("cur"), x.querySelector(".dv2-email-btn") ? x.querySelector(".dv2-email-btn").textContent : null, x.classList.contains("dv2-ent-plan")]));
  eq(boxes, [["Personal Line", false, "Email us", false], ["Business Lite", true, null, false], ["Business Pro", false, "Email us", false], ["Enterprise", false, "Email us", true]], "Billing: one Email us under each other plan, a black Enterprise box added");
  ok(!(await r2.$("#v2Plans .v2-badge.soon")), "…no Rolling out badge left in the plan boxes");
  ok(!(await r2.$("#v2Tell")) || await r2.isHidden("#v2Tell"), "Tell us about your business: not shown (Request a change covers it)");
  await r2.context().close();
  const PER = JSON.parse(JSON.stringify(PLANS)); PER.plans = [plan("personal", "Personal Line", 19, 190, 30, true), { ...plan("business_lite", "Business Lite", 99, 990, 100, false), byEmail: null }, plan("business_pro", "Business Pro", 199, 1990, 250, false, false)];   // byEmail null: the server lets this one switch itself
  const PB = JSON.parse(JSON.stringify(BILL)); PB.plan = { key: "personal", label: "Personal Line", billing: "month", minutes: 30, package: null, checkoutEnabled: true };
  const pr = await open("/dashboard/#billing", { dash: DASH({ layout: "v2" }), plans: PER, bill: PB });
  await pr.waitForSelector("#v2Plans .v2-plan");
  eq(await pr.$$eval("#v2Plans .v2-plan", b => b.map(x => [x.querySelector("b").textContent, x.querySelector("[data-plan]") ? "Switch" : x.querySelector(".dv2-email-btn") ? "Email us" : x.classList.contains("cur") ? "Current" : "?"])),
    [["Personal Line", "Current"], ["Business Lite", "Switch"], ["Business Pro", "Email us"], ["Enterprise", "Email us"]], "a Personal line keeps its own Switch to Business Lite (no email needed)");
  await pr.context().close();

  console.log("Business switcher");
  const MULTI = DASH({ layout: "v2", businesses: [{ id: "b-1", name: "Bluewave Plumbing" }, { id: "b-2", name: "Create Ivf" }, { id: "b-3", name: "Del Grande Homes" }] });
  const sw = await open("/dashboard/", { dash: MULTI });
  await sw.waitForSelector("#dv2Sw:not([hidden])");
  ok(await sw.isHidden("#bizSelect"), "the page's own select is kept but hidden");
  eq(await sw.$eval("#dv2SwBtn .dv2-sw-name", e => e.textContent), "Bluewave Plumbing", "the button shows the current business");
  ok(await sw.evaluate(() => !!document.querySelector("#dv2Biz #dv2Sw")), "wide screen: in the sidebar");
  await sw.click("#dv2SwBtn");
  eq(await sw.$$eval("#dv2SwList li", l => l.map(x => [x.dataset.name, x.getAttribute("aria-selected")])), [["Bluewave Plumbing", "true"], ["Create Ivf", "false"], ["Del Grande Homes", "false"]], "the list: every business, the current one ticked");
  ok(await sw.isHidden("#dv2SwSearch"), "three businesses: no search box");
  await sw.keyboard.press("ArrowDown"); await sw.keyboard.press("Enter");
  await sw.waitForFunction(() => true);
  await sw.waitForTimeout(300);
  ok((globalThis.dashHits || []).includes("b-2"), "arrow down + Enter: the page's own switch loads Create Ivf");
  ok(await sw.isHidden("#dv2SwPop"), "…and the list closes");
  await sw.context().close();
  const one = await open("/dashboard/", { dash: DASH({ layout: "v2" }) });
  ok(await one.isHidden("#dv2Sw") && await one.isVisible("#dv2BizName"), "one business (not an admin): no switcher, just the name");
  await one.context().close();
  const MANY = DASH({ layout: "v2", businesses: Array.from({ length: 9 }, (_, i) => ({ id: `b-${i + 1}`, name: i ? `Client ${i}` : "Bluewave Plumbing" })) });
  const mp = await open("/dashboard/", { dash: MANY, width: 390, height: 844 });
  await mp.waitForSelector("#dv2Sw:not([hidden])");
  ok(await mp.evaluate(() => !!document.querySelector(".topbar #dv2Sw")) && await mp.isVisible("#dv2SwBtn"), "phone: the switcher is in the top bar (it was unreachable before)");
  await mp.click("#dv2SwBtn"); await mp.fill("#dv2SwSearch", "client 7");
  eq(await mp.$$eval("#dv2SwList li:not([hidden])", l => l.map(x => x.dataset.name)), ["Client 7"], "nine businesses: a search box that filters");
  ok(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "…no sideways scroll");
  await mp.keyboard.press("Escape");
  ok(await mp.isHidden("#dv2SwPop"), "Escape closes it");
  await mp.context().close();

  console.log("Customize and billing");
  const cb = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), portal: true });
  await cb.click("#gear"); await cb.waitForTimeout(150);
  eq(await cb.$eval("#settings .dv2-set-h .panel-title", e => e.textContent), "Customize", "Customize card: a heading like the other cards");
  await cb.click('#dv2Nav a[data-tab="billing"]'); await cb.waitForTimeout(150);
  ok(await cb.isVisible("#dv2Manage"), "Billing: Manage my plan, when the billing portal is available");
  await cb.route("https://billing.stripe.com/**", r => r.fulfill({ body: "ok" }));
  await cb.click("#dv2Manage"); await cb.waitForTimeout(400);
  ok((globalThis.portalHits || 0) >= 1, "…it opens the same Stripe billing portal as Manage billing");
  await cb.context().close();
  const nb = await open("/dashboard/#billing", { dash: DASH({ layout: "v2" }) });
  ok(await nb.isHidden("#dv2BillBar"), "no billing portal for this customer: no Manage my plan");
  await nb.context().close();

  console.log("Feature cards");
  const FS = SETTINGS(F("live", { connected: false }));
  FS.features.caller_sms = F("live", { enabled: true }); FS.features.transfer = F("live", { ownerOnly: true, enabled: false, destination: "+14165550188" });
  const fc = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: FS });
  await fc.waitForSelector("#v2Card .dv2-feat");
  const cards = await fc.$$eval("#v2Card .dv2-feat", c => c.map(x => [x.querySelector(".v2-h").firstChild.textContent.trim(), !!x.querySelector(".dv2-feat-ico svg"), x.querySelector(".dv2-state").hidden ? null : x.querySelector(".dv2-state").textContent]));
  eq(cards.slice(0, 3), [["Texts to callers", true, "On"], ["Live transfer", true, "Off"], ["Who gets call summaries by email", true, null]], "texts, transfer and email as feature cards: icon, title, On/Off where there's one switch");
  eq(await fc.$eval("#v2Card .dv2-feat .v2-row b", b => b.textContent), "+1 416-555-0188", "the transfer number reads as a phone number");
  ok(await fc.$eval("#v2Sms", c => getComputedStyle(c).appearance === "none"), "the checkbox is drawn as a switch");
  await fc.context().close();

  console.log("Calendar: Coming soon");
  const s = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: SETTINGS(F("rolling_out")) });
  ok(await s.isVisible("#dv2CalSoon") && await s.isDisabled("#dv2Cal button"), "rolling_out: Coming soon, button disabled");
  ok(!(await s.$("#v2CalOn")), "no working Connect button anywhere");
  await s.context().close();
  const n = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: SETTINGS(F("none")) });
  ok(await n.isHidden("#dv2Cal"), "not on the plan: no Calendar card"); await n.context().close();

  console.log("Enterprise");
  const ENT = SETTINGS(F("live", { connected: false })); ENT.plan = { key: "enterprise", label: "Enterprise", minutes: 600, package: null, emailRecipientsMax: 3 };
  const e = await open("/dashboard/", { dash: DASH({ layout: "v2" }), settings: ENT });
  await e.waitForSelector("#dv2Tier");
  ok(await e.evaluate(() => document.documentElement.classList.contains("dv2-ent")), "plan enterprise: html.dv2-ent (the premium look)");
  eq(await e.$eval("#dv2Tier", b => b.textContent), "Enterprise", "…and the plan's own label under the business name");
  await e.context().close();
  const EN = JSON.parse(JSON.stringify(ENT)); EN.plan.minutes = null;
  const en = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: EN });
  await en.waitForSelector("#dv2Tier");
  ok(!/null|contract/.test(await en.$eval("#v2Sub", x => x.textContent)), "Enterprise without contract minutes: no \"null minutes a month\"");
  await en.context().close();
  const lite = await open("/dashboard/", { dash: DASH({ layout: "v2" }) });
  await lite.waitForSelector("#dv2Tier");
  ok(!(await lite.evaluate(() => document.documentElement.classList.contains("dv2-ent"))), "any other plan: no Enterprise look");
  eq(await lite.$eval("#dv2Tier", b => [b.textContent, b.dataset.plan, b.hidden]), ["Business Lite", "business_lite", false], "…but its own plan tag, in its own colour");
  await lite.context().close();

  console.log("Deep links");
  const f = await open("/dashboard/?calendar=failed&reason=%3Cb%3EGoogle%3C%2Fb%3E%20refused", { dash: DASH({ layout: "v2" }) });
  ok(await f.isVisible("#dv2-settings") && await f.isVisible("#dv2Notice"), "?calendar=failed opens Settings with the message");
  eq(await f.$eval("#dv2Notice", e => [e.textContent, e.children.length]), ["<b>Google</b> refused", 0], "the reason is text, never HTML");
  eq(await f.evaluate(() => location.pathname + location.search + location.hash), "/dashboard/#settings/calendar", "the query is removed");
  await f.context().close();
  const c = await open("/dashboard/?calendar=connected", { dash: DASH({ layout: "v2" }) });
  eq(await c.$eval("#dv2Notice", e => e.textContent), "Google Calendar connected.", "?calendar=connected: the success message");
  await c.context().close();

  console.log("Cancel scheduled in the portal: said at the top, on every tab (FEATURE_CANCEL_TOP_BANNER)");
  const CXB = (cx, o = {}) => ({ ...BILL, canManage: true, cancel: { at: "2026-12-23T05:00:00Z", cancelled: false, canReactivate: false, ...cx }, ...o });
  globalThis.billHits = []; globalThis.keepHits = 0; globalThis.billNow = null;
  const cx1 = await open("/dashboard/?billing=updated#overview", { dash: DASH({ layout: "v2" }), bill: CXB({ top: true }) });
  ok(await cx1.isVisible("#cancelTopCard") && /Your plan is cancelled\. Service ends /.test(await cx1.textContent("#cancelTopCard")) && await cx1.isVisible("#cancelTopKeep"), "v2, Overview: the top card says the plan is cancelled, with Keep my plan");
  ok(await cx1.evaluate(() => { const t = document.getElementById("cancelTopCard"), p = document.getElementById("dv2-overview"); return !p.contains(t) && !!(t.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING); }), "…above the tab panels, not inside one");
  for (const t of ["calls", "settings", "billing"]) { await cx1.click(`#dv2Nav a[data-tab="${t}"]`); await cx1.waitForTimeout(60); ok(await cx1.isVisible("#cancelTopCard"), `…still shown on ${t}`); }
  eq(globalThis.billHits.filter(q => q.includes("fresh=1")).length, 1, "back from the portal (?billing=updated): the first billing read asks ?fresh=1, once");
  ok(!(await cx1.evaluate(() => location.search)).includes("billing="), "…and the query is removed, so a refresh doesn't ask again");
  await cx1.click("#cancelTopKeep");
  await cx1.waitForFunction(() => document.getElementById("cancelTopCard").hidden);
  eq(globalThis.keepHits, 1, "Keep my plan: one POST to keep-plan, then the card goes");
  await cx1.context().close(); globalThis.billNow = null;
  const cx2 = await open("/dashboard/", { dash: DASH({ layout: "v2" }), bill: CXB({}) });
  ok(await cx2.isHidden("#cancelTopCard"), "no top: true (flag off): no top card; the billing card still has its banner");
  await cx2.context().close();
  const cx3 = await open("/dashboard/", { dash: DASH({ layout: "v2" }), bill: CXB({ top: true }, { canManage: false }) });
  ok(await cx3.isVisible("#cancelTopCard") && !(await cx3.$("#cancelTopKeep")) && /account owner can keep the plan/.test(await cx3.textContent("#cancelTopCard")), "a teammate: the card, no button, says the owner can");
  await cx3.context().close();
  const cx4 = await open("/dashboard/", { dash: DASH(), bill: CXB({ top: true }) });
  ok(await cx4.isVisible("#cancelTopCard"), "legacy layout: the same top card");
  await cx4.context().close();

  console.log("Phone");
  const ph = await open("/dashboard/", { dash: DASH({ layout: "v2" }), width: 390, height: 844 });
  ok(await ph.evaluate(() => getComputedStyle(document.getElementById("dv2Side")).position === "fixed"), "bottom tab bar");
  ok(await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no sideways scroll");
  for (const t of ["calls", "settings", "billing"]) { await ph.click(`#dv2Nav a[data-tab="${t}"]`); await ph.waitForTimeout(80); ok(await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${t}: no sideways scroll`); }
  ok(await ph.evaluate(() => !!document.querySelector("#dv2-billing #usageCard")), "minutes meter moves to Billing");
  await ph.context().close();

  eq(errs, [], "no page errors");
  await browser.close(); server.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
