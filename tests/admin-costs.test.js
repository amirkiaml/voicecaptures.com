/* admin/index.html, Costs (Overview → Rates & fixed costs), in Chromium
 * (offline), with api() faked: Not yet tracked, vendor limits, cost per minute
 * and flags, fixed / outside-Vapi costs, margins, scenarios; edits post the
 * right bodies; a missing server says "not deployed yet".
 *   node tests/admin-costs.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const [i, s] of scripts.entries()) new vm.Script(s, { filename: `admin-inline-${i}.js` });
ok(true, `${scripts.length} inline script(s) parse`);
ok(html.includes('<div id="costsBox" class="small muted">Loading…</div>') && html.includes("    loadCosts();\n"), "Costs lives inside Rates & fixed costs (not a new page)");
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const js = /(\/\* ---------- Costs \(admin-costs\.js[\s\S]*?)\n\/\* ---------- client drill-down ---------- \*\//.exec(html)[1];

const model = { floor_cad_per_min: { vapi_platform: 0.069, voice: 0.03, stt: 0.014, twilio: 0.009 }, alert_cad_per_min: { personal: 0.25, business_lite: 0.35, business_pro: 0.35 },
  prompt_token_caps: { personal: 2000, business_lite: 5000, business_pro: 6000 }, cpm: { best: { personal: 0.136, business: 0.146, clinic: 0.144 }, today: { personal: 0.171, business: 0.25, clinic: 0.22 }, worst: { personal: 0.67, business: 0.52, clinic: 0.46 } },
  overhead_cad: { personal: 4.06, business_lite: 8.93, business_pro: 16.96, clinic: 40 }, usage_pct: { best: 50, expected: 80, heavy: 100 }, clinic: { price_cad: 600, minutes: 1000 },
  scenarios: {}, not_tracked: [{ item: "Vapi spend limit", done: false }, { item: "Twilio backup payment method", done: true }] };
const row = (r, v, f, p, mp) => ({ revenue: r, variable: v, fixed: f, profit: p, marginPct: mp });
const COSTS = { range: { from: "2026-10-18", to: "2026-11-18" }, usdToCad: 1.37, model, floorCadPerMin: 0.122,
  perMinute: { groups: { personal: { clients: 2, minutes: 40, costCad: 14, llmCad: 2, perMinCad: 0.35, threshold: 0.25 }, business_lite: { clients: 1, minutes: 100, costCad: 20, llmCad: 3, perMinCad: 0.2, threshold: 0.35 } },
    flagged: [{ business: "Pers One", perMinCad: 0.35, threshold: 0.25 }], clients: [] },
  toolLoops: [{ callId: "k1", intake: 2, sms: 1 }],
  items: [{ id: 3, item: "Stripe fees", kind: "pct_revenue", pct: 3.6, per_charge: 0.3, currency: "CAD", in_margin: true, note: "x", nowCad: 0 }, { id: 4, item: "Extra Vapi call lines", kind: "monthly", now_amount: 0, at_1000_amount: 100, currency: "USD", in_margin: true, nowCad: 0 }],
  margins: { personal: { best: { price: 19, cost: 8.14, marginPct: 57 }, today: { price: 19, cost: 9.19, marginPct: 52 }, worst: { price: 19, cost: 24.16, marginPct: -27 } } },
  scenarios: { C: { label: "C · target", counts: { personal: 1000, business_lite: 5, business_pro: 5, clinic: 5 }, rows: { "expected/today": row(23490, 9000, 2000, 12490, 53), "heavy/worst": row(23490, 26000, 2000, -4510, -19) }, worstNegative: true } },
  vendorLimits: [{ id: 1, vendor: "OpenAI (Build tier)", balance: "US$8.97 of US$100", auto_reload: "x", hard_stop: "Yes", last_checked: "2026-11-15", note: "" }] };

const page0 = (status = 200) => `<!doctype html><style>${style}</style><body><div id="costsBox"></div><script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const B = "/api/dashboard/admin/billing";
const needsMigration = e => e && e.status === 503;
function confirmInline() { return true; }
window.sent = [];
async function api(p, o = {}) {
  sent.push({ p, m: o.method || "GET", body: o.body ? JSON.parse(o.body) : null });
  if (${status} !== 200) { const e = new Error(${status} === 404 ? "Not found" : "Run migrations/2026-11-17-admin-costs.sql first."); e.status = ${status}; throw e; }
  if (p === B + "/costs/prompt-sizes") return { results: [{}, {}], over: [{ business: "Pers One", tokens: 2250, cap: 2000 }] };
  if (p === B + "/costs") return ${JSON.stringify(COSTS)};
  return { ok: true };
}
${js}
</script>`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  // A new page per load: setContent keeps the window, and the script's consts would clash.
  let page; const errs = [];
  const open = async st => { if (page) await page.close(); page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); page.on("pageerror", e => errs.push(e.message));
    await page.route("**/*", r => r.request().url().startsWith("data:") || r.request().url() === "about:blank" ? r.continue() : r.abort()); await page.setContent(page0(st)); await page.evaluate(() => loadCosts()); };
  await open(404);
  eq(await page.textContent("#costsBox"), "Not deployed yet (TorontoLeads pricing v2 PR 6).", "server without PR 6: says so");
  await open(503);
  ok(/Run migrations\/2026-11-17-admin-costs\.sql/.test(await page.textContent("#costsBox")), "migration not run: says which");
  await open(200);
  const t = await page.textContent("#costsBox");
  ok(/Not yet tracked — 1 open/.test(t) && /Vapi spend limit/.test(t), "Not yet tracked first, with the open count");
  ok(/OpenAI \(Build tier\)/.test(t) && await page.inputValue("[data-vl='1'] [data-f=last_checked]") === "2026-11-15", "vendor limits with last-checked dates");
  ok(/Floor CA\$0\.12\/min/.test(t) && /Over threshold: Pers One CA\$0\.35\/min \(alert CA\$0\.25\)/.test(t), "floor, and the client over its plan's threshold");
  ok(/k1 \(2 intake, 1 sms\)/.test(t), "tool retry loops");
  ok(await page.$eval("tbody tr td.bad-t", el => el.textContent) === "CA$0.35", "Personal's per-minute cost in red (over CA$0.25)");
  ok(/C · target/.test(t) && /⚠ loses money/.test(t), "scenario C: the worst case flagged");
  ok(/-27%/.test(t), "margins per plan, worst Personal negative");
  await page.fill("[data-model='alert_cad_per_min.personal']", "0.3");
  await page.fill("[data-model='scenarios.C.personal']", "1500");
  await page.click("#cmSave"); await page.waitForFunction(() => sent.some(x => x.p.endsWith("/costs/model")));
  const mb = (await page.evaluate(() => sent.find(x => x.p.endsWith("/costs/model")).body));
  eq([mb.alert_cad_per_min.personal, mb.scenarios.C.personal, mb.cpm.worst.personal, mb.usage_pct.expected], [0.3, 1500, 0.67, 80], "Save assumptions: thresholds, scenario counts, cost per minute, usage, all numbers");
  await page.click("[data-nt='0']"); await page.waitForFunction(() => sent.filter(x => x.p.endsWith("/costs/model")).length === 2);
  eq((await page.evaluate(() => sent.filter(x => x.p.endsWith("/costs/model"))[1].body)).not_tracked[0], { item: "Vapi spend limit", done: true }, "ticking a Not-yet-tracked item saves it");
  await page.fill("[data-ci='4'] [data-f=now_amount]", "20"); await page.click("[data-cisave='4']");
  await page.waitForFunction(() => sent.some(x => x.p.endsWith("/costs/items")));
  eq((await page.evaluate(() => sent.find(x => x.p.endsWith("/costs/items")).body)), { id: 4, item: "Extra Vapi call lines", kind: "monthly", now_amount: "20", at_1000_amount: "100", currency: "USD", in_margin: true, note: "" }, "edit a cost item: now / at 1,000 / currency / in margin");
  await page.fill("[data-vl='1'] [data-f=last_checked]", "2026-11-17"); await page.click("[data-vlsave='1']");
  await page.waitForFunction(() => sent.some(x => x.p.endsWith("/vendor-limits")));
  eq((await page.evaluate(() => sent.find(x => x.p.endsWith("/vendor-limits")).body)).last_checked, "2026-11-17", "vendor limit: last-checked date saved");
  await page.click("#psCheck"); await page.waitForFunction(() => /2,250 tokens/.test($("psOut").textContent));
  ok(true, "Check prompt sizes: Personal 2,250 tokens over its cap");
  eq(errs, [], "no page errors");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
