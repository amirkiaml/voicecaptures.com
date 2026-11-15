/* /login/: an invite or reset link that was already opened (an email app's
 * safety scan, a second click) or ran out lands on
 * #error=access_denied&error_code=otp_expired. It shows a calm "Get a new
 * link" form, not a red error, and sends a fresh set-password link. Everything
 * else on the page behaves as before.
 * Real login/index.html and vc-auth.js in Chromium, offline: every request is
 * answered from here (Supabase is a stub recording calls).
 *   node tests/login-spent-link.test.js
 * Needs Playwright with a Chromium (preinstalled here; or npm i --no-save playwright). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const root = path.join(__dirname, "..");
const SITE = "https://voicecaptures.com";
const PAGE = fs.readFileSync(path.join(root, "login/index.html"), "utf8");
const AUTH = fs.readFileSync(path.join(root, "vc-auth.js"), "utf8");

// The Supabase client the page gets: no session unless the URL carries an
// access_token; every auth call is recorded in window.calls.
const STUB = `window.calls = [];
window.supabase = { createClient: function () {
  var h = new URLSearchParams(location.hash.replace(/^#/, ""));
  var session = h.get("access_token") ? { user: { email: "owner@example.test" } } : null;
  var rec = function (name, out) { return function () { window.calls.push([name].concat([].slice.call(arguments))); return Promise.resolve(out || { error: null }); }; };
  return { auth: {
    onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
    getSession: function () { return Promise.resolve({ data: { session: session } }); },
    resetPasswordForEmail: rec("resetPasswordForEmail"), signInWithPassword: rec("signInWithPassword", { error: { message: "Invalid login credentials" } }),
    updateUser: rec("updateUser"), signInWithOAuth: rec("signInWithOAuth")
  } };
} };`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(hash) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", e => errors.push(e.message));
    await p.route("**/*", r => {
      const u = new URL(r.request().url());
      if (u.origin === SITE && u.pathname === "/login/") return r.fulfill({ contentType: "text/html", body: PAGE });
      if (u.origin === SITE && u.pathname === "/vc-auth.js") return r.fulfill({ contentType: "application/javascript", body: AUTH });
      if (u.hostname === "cdn.jsdelivr.net" && u.pathname.includes("supabase-js")) return r.fulfill({ contentType: "application/javascript", body: STUB });
      if (u.hostname === "api.voicecaptures.com" && u.pathname === "/api/dashboard/config")
        return r.fulfill({ contentType: "application/json", body: JSON.stringify({ supabaseUrl: "https://stub.supabase.test", supabaseKey: "sb_publishable_stub" }) });
      if (u.origin === SITE && u.pathname === "/dashboard/") return r.fulfill({ contentType: "text/html", body: "<p>dashboard</p>" });
      return r.abort();
    });
    await p.goto(`${SITE}/login/${hash}`);
    await p.waitForFunction(() => ["vLogin", "vForgot", "vSet"].some(id => !document.getElementById(id).hidden) || location.pathname === "/dashboard/");
    return { p, ctx, errors };
  }
  const shown = p => p.evaluate(() => ["vLogin", "vForgot", "vSet", "vBusy"].filter(id => !document.getElementById(id).hidden));
  const text = (p, id) => p.$eval(`#${id}`, e => e.textContent.trim());
  const reds = p => p.$$eval(".msg.err", es => es.map(e => e.textContent.trim()).filter(Boolean));

  console.log("A spent invite link (the report: error_code=otp_expired)");
  const SPENT = "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
  let s = await open(SPENT);
  eq(await shown(s.p), ["vForgot"], "lands on the new-link form, not the login form");
  eq(await text(s.p, "fTitle"), "Get a new link", "titled \"Get a new link\"");
  ok((await text(s.p, "fLede")).startsWith("That link has already been opened, which is normal: some email apps open links to check them"), "…says why, calmly");
  eq(await reds(s.p), [], "no red message anywhere");
  ok(!(await s.p.evaluate(() => document.body.innerText)).includes("That link has expired or was already used"), "the old error sentence is not shown");
  eq(await text(s.p, "forgotBtn"), "Send me a new link", "button: \"Send me a new link\"");
  await s.p.fill("#fEmail", "owner@example.test");
  await s.p.click("#forgotBtn");
  await s.p.waitForFunction(() => document.getElementById("forgotMsg").textContent);
  eq(await s.p.evaluate(() => window.calls), [["resetPasswordForEmail", "owner@example.test", { redirectTo: `${SITE}/login/` }]], "sends a fresh link that lands back on /login/ (the set-password screen)");
  eq([await text(s.p, "forgotMsg"), await s.p.$eval("#forgotMsg", e => e.className)], ["If owner@example.test has an account, a reset link is on its way.", "msg ok"], "…same neutral answer as Forgot password (doesn't reveal which emails have accounts)");
  eq(await text(s.p, "forgotBtn"), "Send me a new link", "…the button keeps its label");
  await s.p.click("#backToLogin");
  eq(await shown(s.p), ["vLogin"], "← Back to log in still works");
  await s.p.click("#toForgot");
  eq([await text(s.p, "fTitle"), await text(s.p, "forgotBtn")], ["Reset your password", "Send reset link"], "then Forgot password shows its own title and button again");
  eq(s.errors, [], "no script errors");
  await s.ctx.close();

  s = await open("#error=access_denied&error_code=otp_expired");
  eq(await shown(s.p), ["vForgot"], "error_code=otp_expired without a description: the same form");
  await s.ctx.close();
  s = await open("?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  eq(await shown(s.p), ["vForgot"], "…and in the query string");
  await s.p.fill("#fEmail", "not-an-email");
  await s.p.click("#forgotBtn");
  eq([await text(s.p, "forgotMsg"), await s.p.evaluate(() => window.calls.length)], ["Enter a valid email.", 0], "a bad email is refused, nothing sent");
  await s.ctx.close();

  console.log("Unchanged");
  s = await open("#error=server_error&error_description=Database+error+saving+new+user");
  eq([await shown(s.p), await reds(s.p)], [["vLogin"], ["Database error saving new user"]], "another link error: the login form with that error, as before");
  await s.ctx.close();
  s = await open("");
  eq([await shown(s.p), await reds(s.p), await text(s.p, "fTitle")], [["vLogin"], [], "Reset your password"], "no link: the login form, nothing in red");
  await s.p.click("#toForgot");
  eq([await shown(s.p), await text(s.p, "fTitle"), await text(s.p, "forgotBtn")], [["vForgot"], "Reset your password", "Send reset link"], "Forgot password: as before");
  await s.ctx.close();
  s = await open("#access_token=stub&type=invite");
  eq([await shown(s.p), await text(s.p, "setTitle")], [["vSet"], "Welcome! Set your password"], "a good invite link: Set your password, as before");
  await s.ctx.close();
  s = await open("#access_token=stub&type=recovery");
  eq([await shown(s.p), await text(s.p, "setTitle")], [["vSet"], "Choose a new password"], "a good reset link: Choose a new password, as before");
  await s.ctx.close();

  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
