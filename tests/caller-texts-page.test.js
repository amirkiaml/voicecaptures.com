/* /caller-texts/: the consent version shown is the in-product caller-texts consent
 * (TorontoLeads consent-texts.js CALLER_SMS_CONSENT_VERSION, 2026-11-25.1), and the page
 * says what that consent says: asked once, sent only on a yes.
 * Run: node tests/caller-texts-page.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "caller-texts", "index.html"), "utf8");
const py = fs.readFileSync(path.join(__dirname, "..", "build-pages.py"), "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/&middot;/g, "·").replace(/&mdash;/g, "—").replace(/\s+/g, " ");
ok(/Last updated: 25 November 2026 · consent version 2026-11-25\.1/.test(text), "shows consent version 2026-11-25.1, updated 25 November 2026 (text-back asked on the call)");
ok(/CONSENT_VERSION = "2026-11-25\.1"/.test(py), "build-pages.py: CONSENT_VERSION is 2026-11-25.1 (the page is generated from it)");
ok(/asks the caller once whether they would like a text confirming it, and sends one only if they say yes/.test(text), "confirmation texts: asked once, sent only on a yes");
ok(!/to a caller who wants them/.test(text), "the old wording is gone");
// Missed-call text-back: the receptionist asks for permission on the call (owner, 24 Nov 2026).
const page = d => fs.readFileSync(path.join(__dirname, "..", d, "index.html"), "utf8").replace(/<[^>]+>/g, " ").replace(/&rsquo;/g, "’").replace(/&middot;/g, "·").replace(/&mdash;/g, "—").replace(/\s+/g, " ");
ok(/asks them during the call whether it may text them at that number, and texts them only if they say yes\. Their answer is kept with the call record/.test(text), "caller texts: text-back asked on the call, sent only on a yes, answer kept");
ok(!/a text to someone whose call was not answered/.test(text), "…the old text-back wording is gone");
const terms = page("terms"), privacy = page("privacy");
ok(/Missed-call text-back is sent only with the caller’s permission\./.test(terms) && /We text only callers who say yes, and we keep their answer with the call record\./.test(terms), "terms: text-back only with the caller's permission, asked on the call");
ok(/text-back to a caller who, during the call, said we may text them/.test(terms) && !/text-back to a caller whose call was missed/.test(terms), "terms: the Text messages list says the same");
/* The terms page carries its own date, and the point is that it MOVED when this wording
 * landed -- not that it says one particular day forever. Pinned to the literal, this broke
 * the next time the terms page was edited for an unrelated reason. Read it off the source
 * that generates it, exactly as the consent version above is read. */
const termsDate = /TERMS_UPDATED = "([^"]+)"/.exec(py)[1];
ok(new RegExp(`Last updated: ${termsDate}`).test(terms), `terms: updated ${termsDate}, the date build-pages.py generates`);
ok(/our receptionist asks the caller during the call whether it may text them at that number, and the text is sent only if they say yes/.test(privacy), "privacy: the same sentence");
ok(/Reply STOP to opt out|Reply STOP|reply STOP/i.test(terms) && /STOP/.test(privacy), "STOP kept on both");
console.log(`\n${pass} checks passed`);
