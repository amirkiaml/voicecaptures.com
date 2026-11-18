/* First-party campaign attribution (attr.js), offline.
 *   node tests/attribution.test.js
 * Covers: what is captured, what is forwarded, the length and character-set
 * bounds, that nothing is stored when there is nothing to store, first touch,
 * the referrer fallback, the waitlist POST body, and that it all degrades to
 * plain links with JavaScript off.
 * Serves the repo over http on 127.0.0.1 -- sessionStorage and URL parsing
 * need a real origin -- and talks to nothing else. */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
                ".mp3": "audio/mpeg", ".ico": "image/x-icon", ".webmanifest": "application/json" };

function serve() {
  return new Promise(resolve => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end("no");
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
}

const stored = p => p.evaluate(() => {
  try { return JSON.parse(sessionStorage.getItem("vc_attr")); } catch (e) { return "THREW"; }
});
const hrefs = p => p.evaluate(() =>
  Array.from(document.querySelectorAll("a[href]"), a => a.getAttribute("href")));

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();

  /* ------------------------------------------------------------ capture -- */
  console.log("Capture");
  const ALL = "utm_source=google&utm_medium=cpc&utm_campaign=fall_hvac&utm_content=ad-3&ref=partner.example";
  let ctx = await browser.newContext();
  let p = await ctx.newPage();
  await p.goto(`${base}/pricing/?${ALL}`);
  eq(await stored(p), {
    utm_source: "google", utm_medium: "cpc", utm_campaign: "fall_hvac",
    utm_content: "ad-3", ref: "partner.example",
  }, "all five parameters land in sessionStorage");
  eq(await p.evaluate(() => window.vcAttr.fields), FIELDS, "vcAttr.fields names the contract");
  eq(await p.evaluate(() => window.vcAttr.get().utm_source), "google", "vcAttr.get() reads them back");
  /* A page that is handed only some of them stores only those. */
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/?utm_source=bing`);
  eq(Object.keys(await stored(p)), ["utm_source"], "only the parameters actually present are stored");

  /* `referrer=` is accepted on the way in, and normalised to `ref`. */
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/?referrer=newsletter`);
  eq(await stored(p), { ref: "newsletter" }, "?referrer= is stored under ref, never as referrer");

  /* --------------------------------------------------------- nothing set -- */
  console.log("\nNothing captured when there is nothing to capture");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/`);
  eq(await stored(p), null, "a clean landing writes no storage key at all");
  eq(await p.evaluate(() => window.vcAttr.get()), null, "vcAttr.get() is null, not an empty object");
  const clean = await hrefs(p);
  eq(clean.filter(h => FIELDS.some(f => h.includes(f + "="))), [],
     "no link gains a parameter");

  /* ---------------------------------------------------------- forwarding -- */
  console.log("\nForwarding");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/?${ALL}`);
  const links = await hrefs(p);
  const carrying = h => FIELDS.every(f => h.includes(f + "="));
  const demo = links.filter(h => /^https:\/\/demo\.voicecaptures\.com/.test(h));
  const build = links.filter(h => /^\/demo\//.test(h));
  const cal = links.filter(h => /^https:\/\/calendly\.com\/hello-voicecaptures/.test(h));
  ok(demo.length >= 2, `${demo.length} Get Started links`);
  ok(build.length >= 1, `${build.length} Build your assistant links`);
  ok(cal.length >= 1, `${cal.length} Book a Call links`);
  for (const h of demo) ok(carrying(h), `Get Started carries all five: ${h.slice(0, 60)}...`);
  for (const h of build) ok(carrying(h), `Build your assistant carries all five: ${h.slice(0, 48)}...`);
  for (const h of cal) ok(carrying(h), `Book a Call carries all five`);
  /* Nothing an author wrote is lost. Strip our five parameters back off every
     decorated link and what is left must be exactly the link as it ships --
     compared against the clean landing above, not against a hand-written
     pattern, so ?src=, ?plan= and ?billing= are all covered at once. */
  const undress = h => {
    const u = new URL(h, base);
    FIELDS.forEach(f => u.searchParams.delete(f));
    const q = u.searchParams.toString();
    return (h.startsWith("/") ? u.pathname : u.origin + u.pathname) + (q ? "?" + q : "") + u.hash;
  };
  const cleanSet = new Set(clean);
  const touched = [...demo, ...build, ...cal];
  eq(touched.filter(h => !cleanSet.has(undress(h))), [],
     `all ${touched.length} decorated links are their original href plus our parameters`);
  ok([...cleanSet].some(h => /src=preview/.test(h)), "?src= is among the originals being preserved");
  /* And a link going anywhere else is left alone. */
  const elsewhere = links.filter(h => /^https?:\/\//.test(h) &&
    !/demo\.voicecaptures\.com|calendly\.com\/hello-voicecaptures/.test(h));
  ok(elsewhere.length > 0, `${elsewhere.length} links point elsewhere`);
  eq(elsewhere.filter(h => FIELDS.some(f => h.includes(f + "="))), [],
     "no third-party link is given the campaign parameters");
  /* The billing switch rewrites these hrefs; the parameters must survive it. */
  await p.locator('.pr-sw[data-billing="year"]').first().click();
  const after = (await hrefs(p)).filter(h => /^https:\/\/demo\.voicecaptures\.com/.test(h));
  ok(after.every(h => carrying(h) && /billing=year/.test(h)),
     "the parameters survive the billing switch");

  /* -------------------------------------------------------------- bounds -- */
  console.log("\nLength and character set");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  const long = "a".repeat(300);
  await p.goto(`${base}/pricing/?utm_source=${long}&utm_campaign=${encodeURIComponent("a&b=c <script>x</script>")}&utm_medium=${encodeURIComponent("héllo/wörld")}`);
  const bounded = await stored(p);
  eq(bounded.utm_source.length, 64, "a 300-character value is cut to 64");
  ok(/^[A-Za-z0-9._~-]+$/.test(bounded.utm_campaign),
     `only unreserved characters survive: ${JSON.stringify(bounded.utm_campaign)}`);
  ok(!/[<>&=\s]/.test(bounded.utm_campaign), "no bracket, ampersand, equals or space survives");
  for (const [k, v] of Object.entries(bounded)) {
    ok(v.length <= 64 && /^[A-Za-z0-9._~-]*$/.test(v), `${k} is bounded and clean`);
  }
  /* The real risk of a dirty value is a smuggled parameter, so count them. */
  const one = (await hrefs(p)).find(h => /^https:\/\/demo\.voicecaptures\.com/.test(h));
  const u = new URL(one);
  eq([...u.searchParams.keys()].filter(k => k === "utm_campaign").length, 1,
     "a crafted value cannot smuggle a second parameter into a link");
  ok(!/<|>/.test(one), "nothing bracket-shaped reaches a href");

  /* Junk put into storage by hand is re-cleaned on the way out, not trusted. */
  await p.evaluate(() => sessionStorage.setItem("vc_attr", JSON.stringify({
    utm_source: "<b>x</b>",   // cleaned, not dropped: there are letters in it
    utm_medium: "<>&=/?#",    // nothing survives the clean, so the key goes
    utm_campaign: "a".repeat(200),
    nope: "x",                // not one of ours
  })));
  await p.goto(`${base}/pricing/`);
  const reread = await p.evaluate(() => window.vcAttr.get());
  eq(Object.keys(reread).sort(), ["utm_campaign", "utm_source"],
     "storage is re-cleaned on read: an unknown key and an all-punctuation value are dropped");
  eq(reread.utm_source, "bxb", "a crafted value is stripped, not trusted as stored");
  eq(reread.utm_campaign.length, 64, "an over-long stored value is cut on the way out too");

  /* --------------------------------------------------------- first touch -- */
  console.log("\nFirst touch");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/?utm_source=first&utm_campaign=one`);
  await p.goto(`${base}/pricing/?utm_source=second&utm_campaign=two`);
  eq(await stored(p), { utm_source: "first", utm_campaign: "one" },
     "a second campaign link in the same visit does not overwrite the first");
  await p.goto(`${base}/faq/`);
  eq((await stored(p)).utm_source, "first", "and an ordinary page view does not clear it");

  /* ------------------------------------------------------------ referrer -- */
  console.log("\nReferrer fallback");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/`, { referer: "https://news.ycombinator.com/item?id=42&user=amir" });
  eq(await stored(p), { ref: "news.ycombinator.com" },
     "ref falls back to the referring hostname");
  const hs = (await hrefs(p)).join(" ");
  ok(!/item|id=42|user=amir/.test(hs),
     "the referring URL's path and query never reach a link -- hostname only");
  /* Our own pages linking to each other are not a referral. */
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  await p.goto(`${base}/faq/`);
  await p.evaluate(() => {
    const a = document.createElement("a");
    a.href = "/pricing/"; a.id = "x"; a.textContent = "go";
    a.style.cssText = "position:fixed;top:0;left:0;z-index:9999;background:#fff";
    document.body.appendChild(a);
  });
  await Promise.all([p.waitForNavigation(), p.click("#x")]);
  eq(await stored(p), null, "a same-site referrer is not stored as a referral");

  /* ------------------------------------------------------- waitlist POST -- */
  console.log("\nWaitlist POST");
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  let sent = null;
  await p.route("https://demo.voicecaptures.com/waitlist", route => {
    sent = JSON.parse(route.request().postData() || "{}");
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await p.goto(`${base}/pricing/?${ALL}#waitlist`);
  await p.fill("#wl-email", "someone@example.com");
  await p.selectOption("#wl-country", { index: 2 });
  await p.fill("#wl-type", "Plumber");
  await p.check("#wl-consent");
  await p.click("#wl-send");
  await p.waitForFunction(() => true);
  await p.waitForTimeout(500);
  ok(sent, "the form posted");
  eq(sent.utm, {
    utm_source: "google", utm_medium: "cpc", utm_campaign: "fall_hvac",
    utm_content: "ad-3", ref: "partner.example",
  }, "utm goes as an object, under the same keys the links carry");
  /* The one field that must never travel as attribution. */
  const asText = JSON.stringify(sent.utm);
  ok(!/someone@example\.com|@/.test(asText), "no email anywhere in the utm object");
  ok(!(await hrefs(p)).join(" ").includes("someone@example.com"),
     "no email anywhere in a link href");

  /* A visit with no campaign posts no utm key at all, rather than an empty one. */
  await ctx.close();
  ctx = await browser.newContext();
  p = await ctx.newPage();
  sent = null;
  await p.route("https://demo.voicecaptures.com/waitlist", route => {
    sent = JSON.parse(route.request().postData() || "{}");
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await p.goto(`${base}/pricing/#waitlist`);
  await p.fill("#wl-email", "someone@example.com");
  await p.selectOption("#wl-country", { index: 2 });
  await p.fill("#wl-type", "Plumber");
  await p.check("#wl-consent");
  await p.click("#wl-send");
  await p.waitForTimeout(500);
  ok(sent && !("utm" in sent), "an unattributed signup sends no utm key");

  /* ------------------------------------------------- JavaScript switched off -- */
  console.log("\nWith JavaScript off");
  await ctx.close();
  ctx = await browser.newContext({ javaScriptEnabled: false });
  p = await ctx.newPage();
  await p.goto(`${base}/pricing/?${ALL}`);
  const off = await hrefs(p);
  ok(off.length > 10, `${off.length} links are still on the page`);
  eq(off.filter(h => FIELDS.some(f => h.includes(f + "="))), [],
     "no link carries parameters, which is the intended degradation");
  ok(off.some(h => /^https:\/\/demo\.voicecaptures\.com\/\?plan=/.test(h)),
     "Get Started still points at a real signup URL");
  ok(off.some(h => /^https:\/\/calendly\.com\/hello-voicecaptures/.test(h)),
     "Book a Call still points at the booking link");
  ok(await p.locator("#wl-form").getAttribute("action") === "https://demo.voicecaptures.com/waitlist",
     "the waitlist form still posts to its endpoint without JavaScript");

  await ctx.close();
  await browser.close();
  server.close();
  console.log(`\n${pass} checks passed.`);
})().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
