/* The pricing page against pricing/catalog.json, offline.
 *   node tests/pricing-catalog.test.js
 * Covers: catalog drift, no price on any page outside the catalog, the
 * Get Started links, the mobile layout, and the billing switch's keyboard
 * and contrast behaviour.
 * Needs Playwright with a Chromium (preinstalled here; or npm i --no-save playwright). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const cat = JSON.parse(fs.readFileSync(path.join(root, "pricing/catalog.json"), "utf8"));
const plans = Object.fromEntries(cat.plans.map(p => [p.key, p]));
const page = f => fs.readFileSync(path.join(root, f), "utf8");

/* ---------------------------------------------------------------- drift --
 * The dashboard repo owns the catalog; this repo holds a copy. These are the
 * values the public page was built against, written out so a copy that has
 * drifted fails here instead of quietly repricing the site. */
const CONTRACT = {
  personal:      { monthly: 19,  annual: 190,  minutes: 30,  trial: { days: 7,  minutes_cap: 15 }, package: "pkg_personal_20" },
  business_lite: { monthly: 99,  annual: 990,  minutes: 100, trial: { days: 14, minutes_cap: 60 }, package: "pkg_lite_50" },
  business_pro:  { monthly: 199, annual: 1990, minutes: 250, trial: { days: 14, minutes_cap: 60 }, package: "pkg_pro_100" },
};
const PACKAGES = { pkg_personal_20: [20, 20], pkg_lite_50: [50, 75], pkg_pro_100: [100, 110] };

console.log("Catalog");
eq(cat.schema_version, 1, "schema_version is 1");
eq(cat.plans.map(p => p.key),
   ["personal", "business_lite", "business_pro", "enterprise"], "plan keys and order");
for (const [key, want] of Object.entries(CONTRACT)) {
  const p = plans[key];
  eq([p.monthly, p.annual, p.minutes], [want.monthly, want.annual, want.minutes],
     `${key}: ${want.monthly}/mo, ${want.annual}/yr, ${want.minutes} min`);
  eq(p.trial.days, want.trial.days, `${key}: ${want.trial.days}-day trial`);
  eq(p.trial.minutes_cap, want.trial.minutes_cap, `${key}: ${want.trial.minutes_cap}-minute trial cap`);
  eq(p.package, want.package, `${key}: package ${want.package}`);
  eq(p.annual, p.monthly * 10, `${key}: annual is 10x monthly (${cat.annual.label})`);
}
for (const [k, [minutes, price]] of Object.entries(PACKAGES)) {
  eq([cat.packages[k].minutes, cat.packages[k].price], [minutes, price], `${k}: ${minutes} min for $${price}`);
}
eq(plans.enterprise.monthly, null, "enterprise carries no price");
eq(plans.enterprise.checkout_enabled, false, "enterprise is never checkout_enabled");
ok(Object.values(cat.plan_key_aliases).every(v => plans[v]),
   "every old ?plan= alias resolves to a current plan");
/* Statuses are internal tracking. Every feature that points at an entitlement
   must still have one, so the dashboard can flip it as features ship... */
let withStatus = 0;
for (const p of cat.plans) {
  for (const f of p.features) {
    if (!f.key) continue;
    const e = cat.entitlements[f.key];
    ok(!!e, `${p.key}: "${f.label.slice(0, 34)}..." points at a known entitlement`);
    ok(!!e.status, `${f.key}: has a status (${e.status})`);
    withStatus++;
  }
}
ok(withStatus > 10, `${withStatus} features carry a status`);
for (const [key, e] of Object.entries(cat.entitlements)) {
  ok(["live", "rolling_out", "coming_soon", "addon", "none", "quoted"].includes(e.status),
     `${key}: status "${e.status}" is one of the allowed values`);
}

/* ...and none of them renders. Amir decided on 17 November that the page does
   not caveat itself, so no status tag appears anywhere, for any status. */
console.log("\nNo status tags render");
const builtPages = ["index.html", "pricing/index.html", "faq/index.html"];
for (const f of builtPages) {
  const html = page(f);
  ok(!/class="[^"]*pr-chip/.test(html), `${f}: no status chip markup`);
  ok(!html.includes(">Rolling out<"), `${f}: no "Rolling out" tag`);
}
/* "Coming soon" is checked on the pricing page only. The home page has its own
   badge component that predates the catalog and says it about the integrations
   card, which is still true and is not a catalog status tag. */
ok(!page("pricing/index.html").includes(">Coming soon<"),
   "pricing: no \"Coming soon\" tag");
/* The one place a status is still spoken aloud is the calendar label, which is
   written into the feature text on purpose and stays as it is. */
ok(page("pricing/index.html").includes("Google now; Outlook and Apple coming soon"),
   "the calendar wording is kept as written");

/* --------------------------------------------------------------- prices --
 * Every dollar figure the catalog permits, including the ones computed from
 * it (per-minute rates, per-month annual, and the move-up comparisons). */
const allowed = new Set();
const add = n => allowed.add(Number(n).toFixed(2));
for (const p of cat.plans) { if (p.monthly) { add(p.monthly); add(p.annual); add(p.annual / 12); } }
for (const k of Object.values(cat.packages)) { add(k.price); add(k.price / k.minutes); }
for (const a of cat.addons) add(a.price);
add(cat.integration.one_time_from); add(cat.integration.monthly);
// Move-up comparisons: a plan plus N packages, and the step between plans.
add(plans.business_lite.monthly - plans.personal.monthly);
add(plans.business_pro.monthly - plans.business_lite.monthly);
for (const [key, n] of [["personal", 4], ["business_lite", 1], ["business_lite", 2]]) {
  add(plans[key].monthly + cat.packages[plans[key].package].price * n);
}
/* Figures that are deliberately not plan pricing. Each one is listed with why,
 * so a new unexplained number on a page fails this test rather than sliding in. */
const NOT_PLAN_PRICING = {
  "2.50": "win-back: per customer called (a different product, priced on its own page)",
  "450.00": "home page ROI calculator: default average job value",
  "5670.00": "home page ROI calculator: the worked example it starts on",
  "1200.00": "home page stat: the top of the missed-service-call range",
  "20.00": "careers: hourly pay (also the Personal package price)",
  "25.00": "careers: hourly pay",
  "0.00": "admin: an empty amount",
};
Object.keys(NOT_PLAN_PRICING).forEach(v => allowed.add(v));

console.log("\nPrices on the built pages");
const pages = ["index.html", ...fs.readdirSync(root)
  .filter(d => fs.existsSync(path.join(root, d, "index.html")))
  /* admin, dashboard and login are internal. win-back sells a different
     product (outbound reactivation, priced per customer called on its own
     page), so the plan catalog does not govern its figures. */
  .filter(d => !["admin", "dashboard", "login", "win-back"].includes(d))
  .map(d => `${d}/index.html`)];
let checked = 0;
for (const f of pages) {
  const html = page(f);
  for (const m of html.matchAll(/\$([0-9][0-9,]*(?:\.[0-9]{2})?)/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    checked++;
    ok(allowed.has(n.toFixed(2)),
       `${f}: $${m[1]} is in the catalog or on the not-plan-pricing list`);
  }
}
ok(checked > 20, `scanned ${checked} dollar figures across ${pages.length} pages`);

/* ---------------------------------------------------------------- links --
 * Get Started must carry a real plan key and a billing period, and a plan with
 * checkout_enabled=false must never link to checkout. */
console.log("\nGet Started links");
const pricing = page("pricing/index.html");
const links = [...pricing.matchAll(/href="(https:\/\/demo\.voicecaptures\.com\/\?plan=[^"]+)"/g)]
  .map(m => m[1].replace(/&amp;/g, "&"));
ok(links.length >= 3, `${links.length} checkout links on the pricing page`);
for (const href of links) {
  const u = new URL(href);
  const key = u.searchParams.get("plan");
  ok(!!plans[key], `link plan=${key} is a current plan key`);
  ok(plans[key].checkout_enabled, `link plan=${key} has checkout_enabled`);
  ok(["month", "year"].includes(u.searchParams.get("billing")),
     `link plan=${key} carries billing=${u.searchParams.get("billing")}`);
}
ok(!/plan=enterprise/.test(pricing), "enterprise never links to checkout");
for (const old of Object.keys(cat.plan_key_aliases)) {
  if (plans[old]) continue;
  ok(!new RegExp(`plan=${old}\\b`).test(pricing), `no page link still uses the old key ${old}`);
}

(async () => {
  const browser = await chromium.launch();

  /* -------------------------------------------------------------- mobile --
   * The grid has to become one column on a phone, with nothing spilling
   * sideways: a horizontal scrollbar on a pricing page costs real signups. */
  console.log("\nMobile layout (390px)");
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto("file://" + path.join(root, "pricing/index.html"));
  const over = await m.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(over <= 1, `no horizontal overflow (${over}px past the viewport)`);
  const cols = await m.evaluate(() => {
    const g = document.querySelector(".pr-grid-4");
    return getComputedStyle(g).gridTemplateColumns.split(" ").length;
  });
  eq(cols, 1, "plan cards stack to one column");
  const stacked = await m.evaluate(() =>
    getComputedStyle(document.querySelector(".pth")).flexDirection);
  eq(stacked, "column", "the move-up path stacks to one column");
  ok(await m.locator(".pr-switch").isVisible(), "the billing switch is on screen");

  /* ------------------------------------------------------------ the switch --
   * It is a radiogroup, so it has to be reachable and operable from the
   * keyboard, and the prices have to actually change. */
  console.log("\nBilling switch");
  const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await d.goto("file://" + path.join(root, "pricing/index.html"));
  const first = d.locator(".pr-sw").first();
  const price = d.locator(".pr-card .pr-price .pr-n").first();
  eq(await price.textContent(), "$19", "monthly shows by default");
  await first.focus();
  ok(await d.evaluate(() => document.activeElement.classList.contains("pr-sw")),
     "the switch takes keyboard focus");
  await d.keyboard.press("ArrowRight");
  eq(await price.textContent(), "$190", "ArrowRight switches to annual pricing");
  eq(await d.locator('.pr-sw[data-billing="year"]').getAttribute("aria-checked"), "true",
     "aria-checked follows the selection");
  eq(await d.locator('.pr-sw[data-billing="month"]').getAttribute("aria-checked"), "false",
     "the unselected option reports aria-checked=false");
  const href = await d.locator("a[data-plan]").first().getAttribute("href");
  ok(/billing=year/.test(href), "the signup link carries the chosen billing period");
  await d.keyboard.press("ArrowLeft");
  eq(await price.textContent(), "$19", "ArrowLeft switches back to monthly");
  eq(await d.locator(".pr-switch").getAttribute("role"), "radiogroup",
     "the switch is a radiogroup");

  /* ------------------------------------------------------------- contrast --
   * The selected pill is white on brand blue and the dark card is light text
   * on navy; both have to clear WCAG AA for body text. */
  console.log("\nContrast");
  const lum = c => {
    const [r, g, b] = c.match(/\d+/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const pairs = await d.evaluate(() => {
    const read = sel => {
      const el = document.querySelector(sel);
      let bg = "rgb(255, 255, 255)";
      for (let n = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; }
      }
      return [getComputedStyle(el).color, bg];
    };
    return {
      "selected pill": read(".pr-sw.is-on b"),
      "dark card body": read(".pr-dark .pr-feat li"),
      "feature text": read(".pr-card .pr-feat li"),
    };
  });
  for (const [what, [fg, bg]] of Object.entries(pairs)) {
    const r = ratio(fg, bg);
    ok(r >= 4.5, `${what}: contrast ${r.toFixed(2)}:1 (AA needs 4.5)`);
  }

  await browser.close();
  console.log(`\n${pass} checks passed.`);
})().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
