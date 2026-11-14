/* The forwarding guide: dashboard/forwarding-guide.json rendered by
 * dashboard/forwarding-guide.js, in Chromium (offline), plus the email text.
 *   node tests/forwarding-guide.test.js          check
 *   node tests/forwarding-guide.test.js --write  refresh dashboard/forwarding-guide.txt
 * Needs Playwright with a Chromium (preinstalled here; or npm i --no-save playwright). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
const G = require("../dashboard/forwarding-guide.js");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const root = path.join(__dirname, "..");
const guide = JSON.parse(fs.readFileSync(path.join(root, "dashboard/forwarding-guide.json"), "utf8"));
const N = "+16475550142";
const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  android: "Mozilla/5.0 (Linux; Android 15; SM-S921W) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36",
  desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
};

(async () => {
  console.log("The text");
  const codes = Object.fromEntries(guide.codes.options.map(o => [o.id, [o.on, o.off]]));
  eq(codes, { unanswered: ["**61*{number}**15#", "##61#"], conditional_all: ["**004*{number}#", "##004#"] }, "codes: **61*<n>**15# / ##61#, **004*<n># / ##004#");
  eq(guide.codes.check.code, "*#61#", "check: *#61#");
  eq(guide.faq.map(f => f.q), ["It still goes to voicemail", "Do I have to turn voicemail off?", "How do I turn it off?", "Which carrier?", "Not on a mobile?"], "the Q&A (no 'How do I test it?': the Test it section is the one place)");
  eq(guide.voicemail, { text: "If your carrier's voicemail still answers first, ask your carrier to turn voicemail off on your line." }, "voicemail: one sentence, no carrier list");
  const raw = JSON.stringify(guide);
  eq([(raw.match(/Koodo/g) || []).length, guide.faq.find(f => f.q === "Which carrier?").a.includes("Tested on Koodo with an iPhone; other carriers not tested yet.")], [1, true], "carrier detail only in 'Which carrier?', one line");
  ok(!("undo" in guide.codes) && guide.faq.some(f => f.q === "How do I turn it off?"), "turning it off is said once (the Q&A), plus each code's own Turn off");
  ok(!raw.includes("`"), "no backticks anywhere in the text");
  eq([guide.codeNumberFormat, G.codeNumber(N, "e164"), G.codeNumber(N, "10digit"), G.codeNumber("6475550142", "e164")], ["e164", N, "6475550142", N], "the number inside a code: one constant (codeNumberFormat), e164 or 10digit");
  const txt = G.toText(guide, "{number}");
  const txtFile = path.join(root, "dashboard/forwarding-guide.txt");
  if (process.argv.includes("--write")) fs.writeFileSync(txtFile, txt);
  eq(fs.readFileSync(txtFile, "utf8"), txt, "forwarding-guide.txt (the email's text) is the JSON rendered: refresh with --write after editing the JSON");
  const mail = G.toText(guide, N);
  ok(mail.includes(`Turn on:  **61*${N}**15#`) && mail.includes(`Turn on:  **004*${N}#`) && mail.includes("It should show +1 647 555 0142") && !/\{\w+\}/.test(mail) && !mail.includes("`"), "the email text: the dial number in every code, +1 647 555 0142 in sentences, no placeholder, no backticks");
  ok(txt.includes("Turn on:  **61*{code_number}**15#") && txt.includes("receptionist at {number}."), "forwarding-guide.txt marks the code's number apart: {code_number}");
  const order = ["OPTION 1", "OPTION 2", "If your carrier's voicemail still answers first", "TEST IT", "QUESTIONS", "Not on a mobile?", "Stuck?"].map(k => mail.indexOf(k));
  ok(order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1])), "email order: options, the voicemail sentence, Test it, questions, stuck");
  ok(!/Koodo/.test(mail.slice(0, mail.indexOf("QUESTIONS"))), "the email names no carrier before the questions");
  ok(!/TODO/.test(mail), "no TODO(owner) reaches a customer (email)");
  eq([G.deviceOf(UA.iphone), G.deviceOf(UA.android), G.deviceOf(UA.desktop), G.deviceOf("")], ["iphone", "android", null, null], "device from the user agent");

  console.log("The dashboard guide, in Chromium");
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const js = fs.readFileSync(path.join(root, "dashboard/forwarding-guide.js"), "utf8");
  const page = async (ua, g = guide) => {
    const ctx = await browser.newContext({ userAgent: ua });
    const p = await ctx.newPage();
    await p.route("**/*", r => r.abort());   // offline: nothing leaves the page
    // The clipboard is stubbed: what Copy writes is recorded, nothing leaves the page.
    await p.setContent(`<!doctype html><div id="g"></div><script>window.copied = []; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: t => { window.copied.push(t); return Promise.resolve(); } } });</script><script>${js}</script>`);
    const res = await p.evaluate(([g, n]) => window.VCForwardingGuide.render(document.getElementById("g"), g, n, { ua: navigator.userAgent }), [g, N]);
    return { p, ctx, res };
  };
  const state = p => p.evaluate(() => ({
    mode: document.querySelector(".fg-tab[aria-selected=true]").textContent,
    panel: [...document.querySelectorAll(".fg-panel")].filter(x => !x.hidden).map(x => x.dataset.panel),
    device: (document.querySelector(".fg-device.on") || {}).textContent,
    devicePanel: [...document.querySelectorAll(".fg-device-panel")].filter(x => !x.hidden).map(x => x.dataset.device)
  }));

  const d = await page(UA.desktop);
  eq(await state(d.p), { mode: "Phone settings", panel: ["settings"], device: "Android (Samsung, Pixel)", devicePanel: ["android"] }, "desktop (device unknown): Phone settings, Android shown first");
  const text = await d.p.evaluate(() => document.getElementById("g").innerText);
  ok(text.startsWith("Send the calls you don't answer to your receptionist at +1 647 555 0142."), "the intro names the real number, readable");
  ok(!/TODO/.test(text) && !/\{number\}/.test(await d.p.evaluate(() => document.getElementById("g").textContent)), "no TODO(owner), no placeholder on the page");
  await d.p.click(".fg-tab[data-mode=code]");
  eq((await state(d.p)).panel, ["code"], "the toggle switches to Dial a code");
  const shown = await d.p.$$eval(".fg-code", bs => bs.map(b => [b.dataset.code, [...b.querySelectorAll("code")].map(c => c.textContent)]));
  eq(shown, [["unanswered", [`**61*${N}**15#`, "##61#"]], ["conditional_all", [`**004*${N}#`, "##004#"]]], "the codes, with the real Twilio number, nothing around them");
  eq(await d.p.$$eval(".fg-code dd", ds => ds.map(x => x.childNodes.length)), [2, 2, 2, 2], "each code box: the code and its Copy button, no stray text");
  await d.p.click(`.fg-copy[data-copy="**61*${N}**15#"]`);
  await d.p.click('.fg-copy[data-copy="##004#"]');
  eq(await d.p.evaluate(() => window.copied), [`**61*${N}**15#`, "##004#"], "Copy copies exactly the code");
  eq(await d.p.$eval(".fg-copy", b => b.textContent), "Copied", "…and says so");
  eq(await d.p.$$eval(".fg-check", ps => ps.map(p => p.textContent)), ["To check: dial *#61#. It should show +1 647 555 0142 for unanswered calls."], "how to check (*#61#); no separate undo paragraph");
  const tenD = JSON.parse(JSON.stringify(guide)); tenD.codeNumberFormat = "10digit";
  const t10 = await page(UA.iphone, tenD);
  eq(await t10.p.$$eval(".fg-code code", cs => cs.map(c => c.textContent)), ["**61*6475550142**15#", "##61#", "**004*6475550142#", "##004#"], "codeNumberFormat 10digit: the codes switch with the one constant");
  await t10.ctx.close();
  const blocks = await d.p.$$eval("#g > *", xs => xs.map(x => x.className + (x.dataset.panel ? ":" + x.dataset.panel : "")));
  eq(blocks, ["fg-intro", "fg-tabs", "fg-panel:settings", "fg-panel:code", "fg-section fg-voicemail", "fg-section fg-test", "fg-section fg-faq", "fg-stuck"], "page order: toggle, steps or codes, the voicemail sentence, Test it, Q&A, stuck");
  ok(!(await d.p.evaluate(() => document.getElementById("g").textContent)).includes("`"), "no backticks on the page");
  eq(await d.p.$$eval(".fg-q summary", s => s.map(x => x.textContent)), guide.faq.map(f => f.q), "the Q&A as accordions");
  eq(await d.p.$$eval(".fg-q", q => q.filter(x => x.open).length), 0, "…all closed at first");
  await d.p.click(".fg-q:nth-child(4) summary");
  ok(await d.p.$eval(".fg-q:nth-child(4)", x => x.open && x.innerText.includes("Tested on Koodo with an iPhone; other carriers not tested yet.")), "'Which carrier?' holds the one carrier line");
  eq([await d.p.$eval(".fg-voicemail", x => x.textContent), await d.p.$$eval(".fg-carriers", x => x.length)], [guide.voicemail.text, 0], "voicemail: the one sentence, no carrier bullets");
  const visible = await d.p.evaluate(() => { const g = document.getElementById("g"); return [...g.children].filter(x => !x.classList.contains("fg-faq")).map(x => x.innerText).join(" "); });
  ok(!/Koodo/.test(visible), "no carrier named outside the Q&A");
  ok(await d.p.$eval(".fg-test", x => x.innerText.includes("Don't decline it") && x.innerText.includes("can't see from here")), "a test step, and no claim that forwarding is verified");
  eq(await d.p.$eval(".fg-stuck a", a => a.getAttribute("href")), "mailto:hello@voicecaptures.com?subject=Help%20setting%20up%20call%20forwarding", "Stuck? links to hello@");
  await d.p.click(".fg-tab[data-mode=settings]");
  await d.p.click(".fg-device[data-device=iphone]");
  ok(await d.p.$eval(".fg-device-panel[data-device=iphone]", x => !x.hidden && /forwards every call, all the time, so your own phone would never ring/.test(x.innerText)), "iPhone settings: says plainly it forwards ALL calls");
  await d.p.click(".fg-switch");
  eq((await state(d.p)).panel, ["code"], "…and 'Show me the code' goes to Dial a code");
  await d.ctx.close();

  const i = await page(UA.iphone);
  eq(await state(i.p), { mode: "Dial a code", panel: ["code"], device: "iPhone", devicePanel: ["iphone"] }, "iPhone visitor: starts on Dial a code (its settings only forward every call)");
  await i.ctx.close();
  const a = await page(UA.android);
  eq(await state(a.p), { mode: "Phone settings", panel: ["settings"], device: "Android (Samsung, Pixel)", devicePanel: ["android"] }, "Android visitor: Phone settings, Android");
  ok(await a.p.$eval(".fg-device-panel[data-device=android]", x => /When unanswered, When busy, and When unreachable/.test(x.innerText) && /Leave Always forward off/.test(x.innerText)), "…unanswered, busy and unreachable; Always forward left off");
  await a.ctx.close();

  const evil = JSON.parse(JSON.stringify(guide)); evil.intro = "<img src=x onerror=\"window.pwned=1\"> {number}"; evil.faq[0].q = "<b>x</b>";
  const e = await page(UA.desktop, evil);
  eq([await e.p.evaluate(() => window.pwned || 0), await e.p.$$eval("#g img, #g .fg-q summary b", x => x.length)], [0, 0], "JSON text is never parsed as HTML (textContent only)");
  await e.ctx.close();

  console.log("The dashboard page");
  const html = fs.readFileSync(path.join(root, "dashboard/index.html"), "utf8");
  ok(html.includes('<script src="/dashboard/forwarding-guide.js"></script>') && html.includes('fetch("/dashboard/forwarding-guide.json"') && html.includes('<div id="fwdGuide" class="fg"></div>'), "the card renders the guide from the JSON");
  ok(!/\*\*21\*|\*\*67\*|\*\*62\*|RN_OPTIONS|RN_CAVEATS/.test(html), "no forwarding wording left in the page itself (one source)");
  await browser.close();
  console.log(`\n${pass} checks passed`);
})().catch(e => { console.log("FAILED:", e.message); process.exit(1); });
