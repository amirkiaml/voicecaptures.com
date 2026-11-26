/* The pricing page against pricing/catalog.json, offline.
 *   node tests/pricing-catalog.test.js
 * Covers: catalog drift, no price on any page outside the catalog, the
 * Get Started links, the mobile layout, and the billing switch's keyboard
 * and contrast behaviour.
 *
 * The catalog is TorontoLeads' file, copied here byte for byte. Since #126 it
 * is keyed by plan, prices sit under price_cad.{month,year}, each package
 * hangs off its plan, and entitlement status is PER PLAN rather than one
 * global status per entitlement. pricing/presentation.json holds this site's
 * wording around those figures and no figures of its own.
 * Needs Playwright with a Chromium (preinstalled here; or npm i --no-save playwright). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  \u2713", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  \u2713", m); };

const root = path.join(__dirname, "..");
const cat = JSON.parse(fs.readFileSync(path.join(root, "pricing/catalog.json"), "utf8"));
const py = fs.readFileSync(path.join(root, "build-pages.py"), "utf8");
const pres = JSON.parse(fs.readFileSync(path.join(root, "pricing/presentation.json"), "utf8"));
const plans = cat.plans;
const page = f => fs.readFileSync(path.join(root, f), "utf8");
const ORDER = ["personal", "business_lite", "business_pro", "enterprise"];

/* ---------------------------------------------------------------- drift --
 * The dashboard repo owns the catalog; this repo holds a copy. These are the
 * values the public page was built against, written out so a copy that has
 * drifted fails here instead of quietly repricing the site. */
const CONTRACT = {
  personal:      { month: 19,  year: 190,  minutes: 30,  trial: { days: 7,  minutes_cap: 15 }, pkg: ["pkg_personal_20", 20, 20] },
  business_lite: { month: 99,  year: 990,  minutes: 100, trial: { days: 14, minutes_cap: 60 }, pkg: ["pkg_lite_50", 50, 75] },
  business_pro:  { month: 199, year: 1990, minutes: 250, trial: { days: 14, minutes_cap: 60 }, pkg: ["pkg_pro_100", 100, 110] },
};

console.log("Catalog");
eq(cat.schema, 1, "schema is 1");
eq(Object.keys(plans), ORDER, "plan keys and order");
for (const [key, want] of Object.entries(CONTRACT)) {
  const p = plans[key];
  eq([p.price_cad.month, p.price_cad.year, p.minutes], [want.month, want.year, want.minutes],
     `${key}: ${want.month}/mo, ${want.year}/yr, ${want.minutes} min`);
  eq(p.trial.days, want.trial.days, `${key}: ${want.trial.days}-day trial`);
  eq(p.trial.minutes_cap, want.trial.minutes_cap, `${key}: ${want.trial.minutes_cap}-minute trial cap`);
  const [lk, minutes, price] = want.pkg;
  eq([p.package.lookup_key, p.package.minutes, p.package.price_cad], [lk, minutes, price],
     `${key}: package ${lk}, ${minutes} min for $${price}`);
  eq(p.price_cad.year, p.price_cad.month * cat.rules.annual_multiplier,
     `${key}: annual is ${cat.rules.annual_multiplier}x monthly (${pres.annual.label})`);
}
eq(plans.enterprise.price_cad, "quoted", "enterprise carries no price");
eq(plans.enterprise.minutes, "contract", "enterprise minutes are sized on a call");
/* #126 gave Enterprise a trial cap. It had none before, and the terms page
   says it out loud, so it is pinned here rather than left to drift back. */
eq(plans.enterprise.trial, { days: 21, minutes_cap: 60, note: "one location" },
   "enterprise trial: 21 days, 60 minutes, one location");
eq(Object.fromEntries(ORDER.map(k => [k, plans[k].checkout_enabled])),
   { personal: true, business_lite: true, business_pro: false, enterprise: false },
   "checkout_enabled: Personal and Lite only (Pro until Amir flips it in TorontoLeads)");

/* ------------------------------------------------------- entitlements ----
 * One list of keys, and every plan must rule on every one of them. A key added
 * in the dashboard and left unanswered by a plan would otherwise read as
 * absent rather than as an oversight. */
console.log("\nEntitlements");
const keys = cat.entitlement_keys;
eq(keys.length, 24, `${keys.length} entitlement keys`);
eq(new Set(keys).size, keys.length, "no duplicate entitlement key");
ok(keys.includes("history_365"), "history_365 is in the key list (new in #126)");
const statuses = new Set(cat.entitlement_statuses);
for (const key of ORDER) {
  const ents = plans[key].entitlements;
  eq(Object.keys(ents).sort(), [...keys].sort(), `${key}: rules on all ${keys.length} keys`);
  const bad = Object.entries(ents).filter(([, s]) => !statuses.has(s));
  eq(bad, [], `${key}: every status is one of ${[...statuses].join(", ")}`);
}
/* The same entitlement can mean different things on different plans now --
 * this is the shape change #126 made, so it is asserted rather than assumed. */
eq([plans.business_lite.entitlements.sentiment, plans.business_pro.entitlements.sentiment],
   ["addon", "live"], "status is per plan: sentiment is an add-on on Lite, live on Pro");
eq(ORDER.map(k => plans[k].entitlements.history_365),
   ["none", "addon", "addon", "quoted"], "history_365 across the four plans");

/* presentation.json is this site's wording. It must label every key and
 * invent none, and every feature line must point at a real entitlement. */
console.log("\nPresentation");
eq(Object.keys(pres.plans), ORDER, "presentation covers the same plans, in order");
eq(keys.filter(k => !(k in pres.entitlement_labels)), [], "every entitlement has a label");
eq(Object.keys(pres.entitlement_labels).filter(k => !keys.includes(k)), [],
   "no label for an entitlement the catalog does not have");
let features = 0;
for (const key of ORDER) {
  for (const f of pres.plans[key].features) {
    if (!f.key) continue;
    ok(keys.includes(f.key), `${key}: "${f.label.slice(0, 34)}..." points at a known entitlement`);
    features++;
  }
}
ok(features > 10, `${features} feature lines point at an entitlement`);
eq(Object.keys(cat.addons).filter(k => !(k in pres.addon_notes)), [],
   "every add-on has a note");
/* Old ?plan= values: the canonical legacy_map plus the short forms this site
 * has linked to and the dashboard does not carry. */
const aliases = { ...cat.legacy_map };
for (const [k, v] of Object.entries(pres.extra_plan_aliases)) if (k !== "about") aliases[k] = v;
eq(Object.entries(aliases).filter(([, v]) => !plans[v]), [],
   `all ${Object.keys(aliases).length} old ?plan= aliases resolve to a current plan`);
/* presentation.json holds wording, not figures. If a price or a minute count
 * is ever written into it there are two sources of truth again. alerts is the
 * one exemption, and it carries a TODO(owner) saying why. */
const owned = new Set();
for (const k of ORDER) {
  const p = plans[k];
  if (p.price_cad !== "quoted") { owned.add(p.price_cad.month); owned.add(p.price_cad.year); }
  if (typeof p.minutes === "number") owned.add(p.minutes);
  if (p.package && p.package !== "quoted") { owned.add(p.package.minutes); owned.add(p.package.price_cad); }
}
for (const a of Object.values(cat.addons)) owned.add(a.price_cad);
owned.add(cat.integration.setup_from_cad); owned.add(cat.integration.monthly_cad);
const strays = [];
(function walk(node, where) {
  if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${where}[${i}]`));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) { if (where === "" && k === "alerts") continue; walk(v, `${where}.${k}`); }
  else if (typeof node === "number" && owned.has(node)) strays.push(`${where} = ${node}`);
})(pres, "");
eq(strays, [], "presentation.json holds no figure the catalog owns");

/* ...and no status renders. Amir decided on 17 November that the page does
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
for (const k of ORDER) {
  const p = plans[k];
  if (p.price_cad === "quoted") continue;
  add(p.price_cad.month); add(p.price_cad.year); add(p.price_cad.year / 12);
  if (p.package && p.package !== "quoted") { add(p.package.price_cad); add(p.package.price_cad / p.package.minutes); }
}
for (const a of Object.values(cat.addons)) add(a.price_cad);
add(cat.integration.setup_from_cad); add(cat.integration.monthly_cad);
// Move-up comparisons: a plan plus N packages, and the step between plans.
add(plans.business_lite.price_cad.month - plans.personal.price_cad.month);
add(plans.business_pro.price_cad.month - plans.business_lite.price_cad.month);
for (const [key, n] of [["personal", 4], ["business_lite", 1], ["business_lite", 2]]) {
  add(plans[key].price_cad.month + plans[key].package.price_cad * n);
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
/* Two since #126 turned Business Pro's checkout off: Personal and Business
   Lite. Pro and Enterprise must not link to checkout at all. */
ok(links.length >= 2, `${links.length} checkout links on the pricing page`);
for (const href of links) {
  const u = new URL(href);
  const key = u.searchParams.get("plan");
  ok(!!plans[key], `link plan=${key} is a current plan key`);
  ok(plans[key].checkout_enabled, `link plan=${key} has checkout_enabled`);
  ok(["month", "year"].includes(u.searchParams.get("billing")),
     `link plan=${key} carries billing=${u.searchParams.get("billing")}`);
}
ok(!/plan=enterprise/.test(pricing), "enterprise never links to checkout");
/* The flip side of checkout_enabled: a plan the catalog says cannot be bought
   must not carry a buy button anywhere on the page. */
for (const key of ORDER) {
  if (plans[key].checkout_enabled) continue;
  ok(!new RegExp(`plan=${key}\\b`).test(pricing),
     `${key} has checkout_enabled=false, so nothing links to its checkout`);
}

/* ------------------------------------------------------- the plan grid --
 * The four cards, read on their own. The rest of the page has a waitlist
 * section of its own, so these checks are scoped to the grid by walking its
 * divs rather than by searching the whole document. */
function planGrid(html) {
  const start = html.indexOf('<div class="pr-grid pr-grid-4">');
  assert.ok(start > -1, "the plan grid is on the page");
  let depth = 0;
  for (const m of html.slice(start).matchAll(/<div\b|<\/div>/g)) {
    depth += m[0] === "</div>" ? -1 : 1;
    if (depth === 0) return html.slice(start, start + m.index + m[0].length);
  }
  throw new Error("the plan grid's divs do not balance");
}
const grid = planGrid(pricing);
eq((grid.match(/class="pr-card/g) || []).length, ORDER.length, "four plan cards in the grid");

/* The waitlist on this site means one thing: the list for countries we have
   not opened in yet. A plan card offering a Canadian customer a place on it
   would say something untrue, so the word is not allowed on these cards --
   whatever a plan's checkout_enabled happens to be. */
ok(!/waitlist/i.test(grid), "the word \"waitlist\" appears nowhere on the plan cards");
/* ...while the international block it belongs to is still there. */
ok(/waitlist/i.test(pricing.slice(pricing.indexOf(grid) + grid.length)),
   "the international waitlist section is untouched below the grid");

/* A plan that cannot be bought here sends you to the booking link, the same
   one Enterprise uses -- not to a contact anchor and not to a waitlist. */
const CAL = "https://calendly.com/hello-voicecaptures/30min";
/* Read off build-pages.py rather than retyped, so renaming a button is one edit
   and this file cannot drift from the page it is checking. */
const SELF = /CTA_SELF_SERVE = "([^"]+)"/.exec(py)[1];
const CALL = /CTA_CALL = "([^"]+)"/.exec(py)[1];
const ctas = [...grid.matchAll(/<a class="btn[^"]*pr-cta-btn"[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
  .map(m => ({ href: m[1].replace(/&amp;/g, "&"), label: m[2] }));
eq(ctas.length, ORDER.length, `${ctas.length} plan buttons, one per card`);
ORDER.forEach((key, i) => {
  const c = ctas[i];
  if (plans[key].checkout_enabled) {
    eq(c.label, SELF, `${key}: buyable, so the button says ${SELF}`);
    ok(c.href.includes(`plan=${key}`), `${key}: ${SELF} carries its own plan key`);
  } else {
    eq(c.href, CAL, `${key}: not buyable, so the button opens the booking link`);
    eq(c.label, CALL, `${key}: not buyable, so the button says ${CALL}`);
  }
});
/* TWO LABELS, NOT THREE. Pro and Enterprise point at the same booking link, so
   wording them differently ("Talk to us" / "Book a Call") was two names for one
   action. Whatever the labels say, a card offers exactly one of the two things
   that can happen next: you build it, or you book a call. */
eq([...new Set(ctas.map(c => c.label))].sort(), [CALL, SELF].sort(),
   "two labels across the four cards, one per kind of action");
eq(ctas.map(c => c.label), [SELF, SELF, CALL, CALL], "the four buttons, in order");
for (const old of Object.keys(aliases)) {
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
