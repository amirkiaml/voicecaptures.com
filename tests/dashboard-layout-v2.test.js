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
    textback: F("none"), reminders: F("none"), review_requests: F("none"), report: F("none"), sentiment: F("addon"), history_90: F("none"), priority_support: F("none"), custom_routing: F("none") },
  consent: { version: "2026-11-17.1" } });

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
  async function open(url, { dash = DASH(), settings = SETTINGS(F("live", { connected: false })), width = 1280, height = 900, theme = "light" } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
    await ctx.addInitScript(t => { try { localStorage.setItem("vc_theme", t); } catch (e) {} }, theme);
    await ctx.route("**/*", r => {
      const u = new URL(r.request().url());
      if (u.origin === BASE) return r.continue();
      if (u.hostname === "cdn.jsdelivr.net" && u.pathname.includes("supabase")) return r.fulfill({ contentType: "text/javascript", body: SUPABASE_STUB });
      if (u.hostname === "api.voicecaptures.com") {
        const J = (b, s = 200) => r.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(b) });
        if (u.pathname === "/api/dashboard/config") return J({ supabaseUrl: "https://x.supabase.co", supabaseKey: "k" });
        if (u.pathname === "/api/dashboard") return J(dash);
        if (u.pathname === "/api/dashboard/v2/settings") return J(settings);
        if (u.pathname === "/api/dashboard/callbacks") return J({ open: [], done: [] });
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
      ["settings-soon", "/dashboard/#settings", 1366, 1000, SETTINGS(F("rolling_out"))], ["billing", "/dashboard/#billing", 1366, 900],
      ["tablet", "/dashboard/#overview", 900, 1300], ["phone", "/dashboard/#overview", 390, 1700], ["calendar-failed", "/dashboard/?calendar=failed&reason=Google%20said%20no%20access", 1366, 900],
      ["dark", "/dashboard/#overview", 1366, 1200, undefined, "dark"]];
    for (const [n, u, w, h, s, t] of shots) {
      const p = await open(u, { dash: real, width: w, height: h, settings: s || SETTINGS(F("live", { connected: false })), theme: t || "light" });
      await p.screenshot({ path: path.join(dir, `${n}.png`), fullPage: true }); await p.context().close(); console.log("shot", n);
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

  console.log("Calendar: Coming soon");
  const s = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: SETTINGS(F("rolling_out")) });
  ok(await s.isVisible("#dv2CalSoon") && await s.isDisabled("#dv2Cal button"), "rolling_out: Coming soon, button disabled");
  ok(!(await s.$("#v2CalOn")), "no working Connect button anywhere");
  await s.context().close();
  const n = await open("/dashboard/#settings", { dash: DASH({ layout: "v2" }), settings: SETTINGS(F("none")) });
  ok(await n.isHidden("#dv2Cal"), "not on the plan: no Calendar card"); await n.context().close();

  console.log("Deep links");
  const f = await open("/dashboard/?calendar=failed&reason=%3Cb%3EGoogle%3C%2Fb%3E%20refused", { dash: DASH({ layout: "v2" }) });
  ok(await f.isVisible("#dv2-settings") && await f.isVisible("#dv2Notice"), "?calendar=failed opens Settings with the message");
  eq(await f.$eval("#dv2Notice", e => [e.textContent, e.children.length]), ["<b>Google</b> refused", 0], "the reason is text, never HTML");
  eq(await f.evaluate(() => location.pathname + location.search + location.hash), "/dashboard/#settings/calendar", "the query is removed");
  await f.context().close();
  const c = await open("/dashboard/?calendar=connected", { dash: DASH({ layout: "v2" }) });
  eq(await c.$eval("#dv2Notice", e => e.textContent), "Google Calendar connected.", "?calendar=connected: the success message");
  await c.context().close();

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
