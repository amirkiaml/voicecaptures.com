/* admin/index.html, client page → Dashboard login, in Chromium (offline),
 * api() faked: hidden when the server says 404; a failed invite in red; Resend
 * posts once, then shows the new status.
 *   node tests/admin-resend-invite.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
ok(html.includes('<div class="card mb" id="loginCard" hidden></div>') && html.includes("    wireLogin();\n"), "card on the client page, wired");
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const js = /(\/\* ---------- Dashboard login \(dashboard-login\.js[\s\S]*?)\/\* ---------- Map to new plan/.exec(html)[1];
const page0 = mode => `<!doctype html><style>${style}</style><body><div id="loginCard" hidden></div><script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const B = "/api/dashboard/admin/billing"; const CL = { id: "11111111-1111-4111-8111-111111111111" };
window.sent = []; let state = "failed";
async function api(p, o = {}) {
  sent.push({ p, m: o.method || "GET" });
  if ("${mode}" === "off") { const e = new Error("Not found"); e.status = 404; throw e; }
  if (o.method === "POST") { state = "invited"; return { login: "invited" }; }
  return { status: state, at: "2026-11-18T20:00:00Z", email: "ow…@riza.test", selfServe: true, needsAction: state === "failed" };
}
${js}
</script>`;
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errs = []; let page;
  const open = async m => { if (page) await page.close(); page = await browser.newPage(); page.on("pageerror", e => errs.push(e.message)); await page.setContent(page0(m)); await page.evaluate(() => wireLogin()); };
  await open("off"); ok(await page.isHidden("#loginCard"), "flag off (404): hidden");
  await open("on");
  ok(/Invite FAILED: no way in yet · 2026-11-18 20:00 · ow…@riza\.test/.test(await page.textContent("#lgStatus")) && await page.$eval("#lgStatus", e => e.classList.contains("err")), "failed invite shown in red, email masked");
  await page.click("#lgResend"); await page.waitForFunction(() => /Invite sent\./.test(document.body.textContent));
  eq(await page.evaluate(() => sent.filter(x => x.m === "POST").map(x => x.p)), ["/api/dashboard/admin/billing/client/11111111-1111-4111-8111-111111111111/resend-invite"], "Resend: one POST");
  ok(/^Invite sent · /.test(await page.textContent("#lgStatus")), "…then the new status");
  eq(errs, [], "no page errors");
  await browser.close(); console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
