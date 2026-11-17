/* admin/index.html, pricing v2 (offline, no browser):
 *   - the Rates panel reads the read-only catalog from /admin/billing/catalog;
 *   - v2 plan keys are labelled but never offered in a legacy client's Plan picker;
 *   - every inline script still parses.
 *   node tests/admin-pricing-v2.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const [i, s] of scripts.entries()) { new vm.Script(s, { filename: `admin-inline-${i}.js` }); }
ok(scripts.length > 0, `${scripts.length} inline script(s) parse`);
ok(html.includes("api(`${B}/catalog`)") && html.includes('id="catalogBox"'), "Rates shows the catalog from /admin/billing/catalog");
const js = scripts.join("\n");
const PLAN_LABEL = vm.runInNewContext(`(${/const PLAN_LABEL = (\{[\s\S]*?\});/.exec(js)[1]})`);
const V2_LABEL = vm.runInNewContext(`(${/const V2_LABEL = (\{[\s\S]*?\});/.exec(js)[1]})`);
ok(!["business_lite", "business_pro", "enterprise"].some(k => k in PLAN_LABEL), "the legacy Plan picker (PLAN_LABEL) offers no v2 key");
ok(Object.keys(V2_LABEL).join() === "business_lite,business_pro,enterprise", "v2 keys have labels for display");
ok(!/\b(?:19|99|199|190|990|1990)\b[^\n]*(?:plan_personal|plan_lite|plan_pro)/.test(html), "no v2 price is hard-coded beside a v2 lookup key");
console.log(`\n${pass} checks passed`);
