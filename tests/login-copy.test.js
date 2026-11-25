/* /login/: no copy points at an invite email (self-serve accounts are created without one,
 * TorontoLeads SELFSERVE_SILENT_LOGIN); Forgot password is the way to a first password.
 * Run: node tests/login-copy.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "login", "index.html"), "utf8");
for (const [i, s] of [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).entries()) new vm.Script(s, { filename: `login-inline-${i}.js` });
ok(true, "inline scripts parse");
ok(!/invite email/i.test(html), "nothing tells a customer to look for an invite email");
ok(html.includes("First time here? Use “Forgot password?” with the email you signed up with to set your password."), "first time: Forgot password");
ok(html.includes("If you haven't set a password yet, use “Forgot password?” to set one."), "a wrong or unset password: the same way");
ok(/resetPasswordForEmail\(email, \{ redirectTo: location\.origin \+ "\/login\/" \}\)/.test(html), "Forgot password sends the reset link back to /login/ (which sets a first password too)");
console.log(`\n${pass} checks passed`);
