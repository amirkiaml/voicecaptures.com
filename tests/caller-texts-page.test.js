/* /caller-texts/: the consent version shown is the in-product caller-texts consent
 * (TorontoLeads consent-texts.js CALLER_SMS_CONSENT_VERSION, 2026-11-24.1), and the page
 * says what that consent says: asked once, sent only on a yes.
 * Run: node tests/caller-texts-page.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "caller-texts", "index.html"), "utf8");
const py = fs.readFileSync(path.join(__dirname, "..", "build-pages.py"), "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/&middot;/g, "·").replace(/&mdash;/g, "—").replace(/\s+/g, " ");
ok(/Last updated: 24 November 2026 · consent version 2026-11-24\.1/.test(text), "shows consent version 2026-11-24.1, updated 24 November 2026");
ok(/CONSENT_VERSION = "2026-11-24\.1"/.test(py), "build-pages.py: CONSENT_VERSION is 2026-11-24.1 (the page is generated from it)");
ok(/asks the caller once whether they would like a text confirming it, and sends one only if they say yes/.test(text), "confirmation texts: asked once, sent only on a yes");
ok(!/to a caller who wants them/.test(text), "the old wording is gone");
console.log(`\n${pass} checks passed`);
