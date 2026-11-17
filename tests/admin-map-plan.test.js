/* admin/index.html, client page → "Map to new plan", in Chromium (offline),
 * api() faked: preview list, the button stays disabled until the exact
 * business name and a reason are given, the POST body, a server refusal shown.
 *   node tests/admin-map-plan.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
ok(html.includes('<div class="card mb" id="mapCard" hidden></div>') && html.includes("    wireMapPlan();\n"), "the card is on the client page and wired");
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const js = /(\/\* ---------- Map to new plan \(admin-plan-map\.js\)[\s\S]*?)async function wireRelease\(\) \{/.exec(html)[1];
const page0 = `<!doctype html><style>${style}</style><body><div id="mapCard" hidden></div><script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const B = "/api/dashboard/admin/billing"; const CL = { id: "11111111-1111-4111-8111-111111111111" };
window.sent = []; window.refuse = false;
async function api(p, o = {}) {
  sent.push({ p, m: o.method || "GET", body: o.body ? JSON.parse(o.body) : null });
  if (o.method === "POST") { if (refuse) { const e = new Error("Type the business name exactly (over_the_vines) to confirm."); e.status = 400; throw e; } return { ok: true, audit: 7 }; }
  const q = new URLSearchParams(p.split("?")[1]);
  return { business: "over_the_vines", confirmWith: "over_the_vines", after: { plan_key: q.get("plan_key") || "business_lite", billing_interval: q.get("billing") || "month" },
    changes: ["Plan: home_starter (legacy) → " + (q.get("plan_key") || "business_lite"), q.get("use_catalog_price") === "true" ? "Price and minutes → catalog" : "Price ($149/mo) and minutes (150) stay as they are", "Not touched: Stripe, the phone line, the assistant and its prompt"] };
}
${js}
</script>`;
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.setContent(page0); await page.evaluate(() => wireMapPlan());
  ok(/Price \(\$149\/mo\) and minutes \(150\) stay as they are/.test(await page.textContent("#mpChanges")), "preview: the suggested plan (old → new mapping) and what stays");
  await page.selectOption("#mpPlan", "business_pro"); await page.selectOption("#mpBill", "year");
  await page.waitForFunction(() => /business_pro/.test($("mpChanges").textContent));
  ok(await page.evaluate(() => sent.some(x => /plan_key=business_pro&billing=year/.test(x.p))), "changing the plan or billing re-previews");
  ok(await page.isDisabled("#mpGo"), "button disabled at first");
  await page.fill("#mpConfirm", "Over The Vines"); await page.fill("#mpReason", "told Slava");
  ok(await page.isDisabled("#mpGo"), "…still disabled with a near-miss name");
  await page.fill("#mpConfirm", "over_the_vines");
  ok(!(await page.isDisabled("#mpGo")), "…enabled with the exact name and a reason");
  await page.click("#mpGo"); await page.waitForFunction(() => /Mapped/.test($("mpMsg").textContent));
  eq(await page.evaluate(() => sent.find(x => x.m === "POST").body), { plan_key: "business_pro", billing: "year", use_catalog_price: false, confirm: "over_the_vines", reason: "told Slava" }, "POST: plan, billing, catalog price off, typed name, reason");
  ok(await page.isDisabled("#mpGo"), "after mapping, the button stays off (no double submit)");
  await page.evaluate(() => { refuse = true; return wireMapPlan(); });
  await page.fill("#mpConfirm", "over_the_vines"); await page.fill("#mpReason", "x"); await page.click("#mpGo");
  await page.waitForFunction(() => /Type the business name/.test($("mpMsg").textContent));
  ok(true, "a server refusal is shown");
  eq(errs, [], "no page errors");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
