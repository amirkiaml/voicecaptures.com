/* dashboard/index.html: the top cards for a cancelled pricing-v2 customer (live test, Nov 23),
 * in Chromium (offline), with the page's own renderService / renderUsage / usageNote and api() faked:
 *   - the red card says the plan is cancelled and carries Reactivate (it used to say only
 *     "paused", with the button far down in the Billing card);
 *   - a released number: no button, says to start again;
 *   - the usage card says "Cancelled <day>", not "Resets" or "Trial ends";
 *   - anything else paused: the card is as before;
 *   - what callers hear while paused follows the API (self-serve: a short message, never the owner's phone).
 *   node tests/dashboard-cancelled.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "dashboard", "index.html"), "utf8");
const guide = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dashboard", "forwarding-guide.json"), "utf8"));
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const cut = (from, to) => { const a = html.indexOf(from), b = html.indexOf(to, a); assert.ok(a > 0 && b > a, `found ${from}`); return html.slice(a, b); };
const top = [/(const TZ = \(\) => [^\n]*)/.exec(html)[1], /(const fmtWhen = [^\n]*)/.exec(html)[1], /(const fmtDay = d => \{[\s\S]*?\n\};)/.exec(html)[1],
  cut("/* Minutes this period", "/* Read-only: retention"), cut("// Reactivate (a new Checkout)", "function wireV2Bill()")].join("\n");

const page0 = () => `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>${style}</style><body>
<div class="card paused-card" id="pausedCard" hidden></div><div class="card usage" id="usageCard" hidden></div><script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
let S = null, last = null, v2b = null; window.sent = [];
const loadGuide = () => Promise.resolve(${JSON.stringify(guide)});
async function api(p, o = {}) { sent.push(p); window.record && window.record(p); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_top" }), { status: 200 }); }
${top}
</script>`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  const posted = []; await page.exposeFunction("record", p => { posted.push(p); });
  await page.setContent(page0());
  const svc = { active: false, mode: "auto", reason: "cancelled", salesEmail: "sales@voicecaptures.com", links: [] };
  const bill = (cancel) => ({ plan: { label: "Personal Line" }, cancel });

  console.log("Cancelled: the top card");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true })]);
  const t1 = await page.textContent("#pausedCard");
  ok(/Your plan is cancelled/.test(t1) && /past calls are still here/.test(t1) && !/ring your phone/.test(t1), "the red card: cancelled, past calls kept (no \"calls ring your phone\")");
  ok(!!(await page.$("#pausedCard #pausedReactivate")) && /Reactivate Personal Line/.test(t1), "…with Reactivate on it, at the top");
  const nav = [];
  await page.route("https://checkout.stripe.com/**", r => { nav.push(r.request().url()); r.abort(); });
  await page.click("#pausedReactivate").catch(() => {});
  await page.waitForTimeout(300);
  ok(posted.includes("/api/dashboard/v2/reactivate") && nav[0] === "https://checkout.stripe.com/c/pay/cs_top", "…which POSTs reactivate and opens the new Checkout");
  await page.setContent(page0());
  await page.evaluate(([s, b]) => { v2b = { ...b, canManage: false }; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true })]);
  ok(!(await page.$("#pausedReactivate")) && /The account owner can reactivate it/.test(await page.textContent("#pausedCard")), "a teammate (canManage false): no button that would only answer 403; says the owner can");
  await page.evaluate(([s, b]) => { v2b = { ...b, canManage: true }; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true })]);
  ok(!!(await page.$("#pausedReactivate")), "the owner (canManage true): the button");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: false })]);
  ok(!(await page.$("#pausedReactivate")) && /Your old number has been released/.test(await page.textContent("#pausedCard")), "number released: no button, says to start again");
  await page.evaluate(s => { v2b = null; renderService({ ...s, reason: "minutes_used" }); }, svc);
  ok(/Your AI receptionist is paused/.test(await page.textContent("#pausedCard")) && !(await page.$("#pausedReactivate")), "any other pause (no cancel block): the card as before");

  console.log("Paused: what callers hear (the API's whilePaused)");
  await page.evaluate(s => { v2b = null; renderService({ ...s, reason: "trial_cap", whilePaused: "message" }); }, svc);
  const pm = await page.textContent("#pausedCard");
  ok(/callers hear a short message that you can't take the call right now/.test(pm) && !/ring your phone/.test(pm), "self-serve paused: \"callers hear a short message\" (what the email, the text and the call itself say)");
  await page.evaluate(s => { renderService({ ...s, reason: "minutes_used" }); }, svc);
  ok(/your calls ring your phone directly until it's back on/.test(await page.textContent("#pausedCard")), "no whilePaused (legacy): \"calls ring your phone directly\", as before (and true for them)");
  await page.evaluate(() => renderUsage({ minutesUsed: 16, minutesAllowed: 15, percent: 106, periodStart: "2026-11-23", periodEnd: "2026-12-07", resetDate: "2026-12-08", trial: true, whilePaused: "message", rates: {} }));
  ok(/then callers hear a short message until you start your plan/.test(await page.textContent("#usageCard")), "the trial usage note says the same");

  console.log("Paused or cancelled: turn call forwarding off");
  const offA = guide.faq.find(f => f.q === "How do I turn it off?").a.join(" ");
  await page.evaluate(s => { v2b = null; renderService({ ...s, reason: "trial_cap", whilePaused: "message" }); }, svc);
  await page.waitForSelector("#pausedCard .paused-fwd");
  const fw = await page.textContent("#pausedCard .paused-fwd");
  ok(fw === `${guide.whilePaused.text} ${offA}` && /##61#/.test(fw) && /##004#/.test(fw), "self-serve paused: \"If you forwarded your phone… turn forwarding off:\" + the guide's own off answer (##61#, or ##004#)");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true })]);
  await page.waitForSelector("#pausedCard .paused-fwd");
  ok(/##61#/.test(await page.textContent("#pausedCard")), "cancelled card: the same forwarding note");
  await page.evaluate(s => { v2b = null; renderService({ ...s, reason: "minutes_used" }); }, svc);
  await page.waitForTimeout(100);
  ok(!(await page.$("#pausedCard .paused-fwd")), "legacy paused (calls really ring the owner): no forwarding note");
  ok(!/##61#|##004#/.test(html.replace(/<script src[^>]*><\/script>/g, "")), "the off codes aren't written into the page: they come from forwarding-guide.json");

  console.log("Reactivate: what it will cost (owner, 2026-11-23)");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true, reactivate: { mode: "trial", until: "2026-12-04T02:00:00Z" } })]);
  eq(await page.textContent("#pausedReactivateTerms"), "Nothing is charged until Dec 3.", "cancelled during the trial, 3+ days left: \"Nothing is charged until Dec 3.\" (the trial end, in Toronto)");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true, reactivate: { mode: "today", amount_cad: 19, billing: "month" } })]);
  eq(await page.textContent("#pausedReactivateTerms"), "You'll be charged $19 + tax today.", "otherwise: \"You'll be charged $19 + tax today.\"");
  await page.evaluate(([s, b]) => { v2b = b; renderService(s); }, [svc, bill({ at: null, cancelled: true, canReactivate: true })]);
  ok(!(await page.$("#pausedReactivateTerms")) && !!(await page.$("#pausedReactivate")), "an API that doesn't say: the button, and no promise either way");

  console.log("Cancelled: the usage card");
  await page.evaluate(() => renderUsage({ minutesUsed: 0, minutesAllowed: 15, percent: 0, periodStart: "2026-11-23", periodEnd: "2026-12-07", resetDate: "2026-12-08", trial: true, cancelled: true, cancelledOn: "2026-11-23", rates: {} }));
  const u = await page.textContent("#usageCard");
  ok(/Cancelled Nov 23/.test(u) && !/Resets|Trial ends/.test(u), "\"Cancelled Nov 23\", not \"Resets Dec 7\" or \"Trial ends\"");
  await page.evaluate(() => renderUsage({ minutesUsed: 3, minutesAllowed: 30, percent: 10, periodStart: "2026-11-01", periodEnd: "2026-11-30", resetDate: "2026-12-01", trial: false, rates: {} }));
  ok(/Resets Dec 1/.test(await page.textContent("#usageCard")), "not cancelled: \"Resets\" as before");

  ok(errs.length === 0, `no page errors ${errs.join(" | ")}`);
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
