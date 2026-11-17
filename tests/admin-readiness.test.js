/* admin/index.html, Costs → Launch readiness, in Chromium (offline), api()
 * faked: the list, the warning banner for a plan open for checkout with a
 * feature that has no manual fallback, saving clears it.
 *   node tests/admin-readiness.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
ok(html.indexOf('<div id="readyBox"') < html.indexOf('<div id="costsBox"') && html.includes("    loadReadiness();\n"), "Launch readiness sits at the top of Costs and loads with it");
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const js = /(\/\* ---------- Launch readiness[\s\S]*?)\/\* ---------- Costs \(admin-costs\.js/.exec(html)[1];
const item = (plan_key, plan, feature, status, co, fb) => ({ plan_key, plan, feature, status, checkout_enabled: co, manual_fallback: fb, target_date: null, owner_note: null, missingFallback: co && !fb });
const D0 = { items: [item("business_lite", "Business Lite", "live_transfer", "rolling_out", true, null), item("business_lite", "Business Lite", "calendar_outlook", "coming_soon", true, "Google only for now"),
  item("business_pro", "Business Pro", "reminders", "rolling_out", false, null)], warning: { plans: ["Business Lite"], count: 1, text: "Business Lite is open for checkout with 1 not-live feature that has no manual fallback written." } };
const D1 = { items: D0.items.map(i => ({ ...i, manual_fallback: i.manual_fallback || (i.checkout_enabled ? "We transfer by hand" : null), missingFallback: false })), warning: null };
const page0 = `<!doctype html><style>${style}</style><body><div id="readyBox"></div><script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const B = "/api/dashboard/admin/billing"; const needsMigration = e => e && e.status === 503;
window.sent = [];
async function api(p, o = {}) { sent.push({ p, body: o.body ? JSON.parse(o.body) : null }); return o.method === "POST" ? ${JSON.stringify(D1)} : ${JSON.stringify(D0)}; }
${js}
</script>`;
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.setContent(page0); await page.evaluate(() => loadReadiness());
  ok(/⚠ Business Lite is open for checkout with 1 not-live feature that has no manual fallback written\./.test(await page.textContent("#readyWarn")), "warning banner names the open plan");
  eq(await page.$$eval("#readyTable tbody tr", r => r.map(x => [x.dataset.plan, x.dataset.feature])), [["business_lite", "live_transfer"], ["business_lite", "calendar_outlook"], ["business_pro", "reminders"]], "one row per plan × not-live feature");
  ok(/checkout closed/.test(await page.textContent("#readyTable")), "closed plans are marked");
  await page.fill("[data-rd='0'] [data-f=manual_fallback]", "We transfer by hand"); await page.fill("[data-rd='0'] [data-f=target_date]", "2026-12-01"); await page.fill("[data-rd='0'] [data-f=owner_note]", "Amir");
  await page.click("[data-rdsave='0']"); await page.waitForFunction(() => /Saved/.test($("readyMsg").textContent));
  eq(await page.evaluate(() => sent.find(x => x.body).body), { plan_key: "business_lite", feature: "live_transfer", manual_fallback: "We transfer by hand", target_date: "2026-12-01", owner_note: "Amir" }, "save: plan, feature, fallback, date, note");
  ok(await page.$("#readyWarn") === null, "…the banner goes once every open plan has its fallbacks");
  eq(errs, [], "no page errors");
  await browser.close(); console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
