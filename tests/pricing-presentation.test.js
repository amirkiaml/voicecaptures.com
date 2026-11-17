/* Presentation of the pricing page: sparkles, card density, the boxed
 * minutes section, and the Beta tag on the CTA.
 *   node tests/pricing-presentation.test.js
 * Offline. Needs Playwright with a Chromium. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const pricing = fs.readFileSync(path.join(root, "pricing/index.html"), "utf8");

/* The sparkle set, written out here rather than imported from the generator:
 * this is the list Amir specified, and a test that reads the constant it is
 * checking would pass however the constant drifted. */
const SPARKLES = {
  "Business Lite": [
    "Custom-tailored to your business: services, hours, FAQs, area",
    "Live booking into your calendar (Google now; Outlook and Apple coming soon)",
    "Confirmation texts to your callers",
  ],
  "Business Pro": [
    "Up to 3 calendars",
    "Appointment reminders (text + email)",
    "Review-request texts after a job or visit",
  ],
  "Enterprise": [
    "Multi-location and multi-team setup",
    "Custom integrations: CRM, EMR, POS, field service",
  ],
  "Personal Line": [],
};

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("file://" + path.join(root, "pricing/index.html"));
  await p.waitForTimeout(200);

  console.log("Sparkles");
  const marked = await p.evaluate(() => {
    const out = {};
    document.querySelectorAll(".pr-card").forEach(c => {
      out[c.querySelector("h3").textContent] =
        [...c.querySelectorAll("li.pr-star span")].map(s => s.textContent);
    });
    return out;
  });
  for (const [plan, labels] of Object.entries(SPARKLES)) {
    eq(marked[plan], labels, `${plan}: exactly ${labels.length} sparkled`);
  }
  const total = Object.values(SPARKLES).reduce((n, l) => n + l.length, 0);
  // Count the markup, not the stylesheet: ".pr-spark" also appears in CSS.
  eq((pricing.match(/class="pr-ico pr-spark"/g) || []).length, total,
     `${total} sparkles rendered`);

  console.log("\n  Decorative, and no layout shift");
  const icons = await p.evaluate(() => {
    const i = [...document.querySelectorAll(".pr-feat .pr-ico")];
    return {
      hidden: i.every(e => e.getAttribute("aria-hidden") === "true"),
      focusable: i.every(e => e.getAttribute("focusable") === "false"),
      inAcc: [...document.querySelectorAll("li.pr-star")].map(l => l.textContent.trim()),
      /* offsetWidth, not getBoundingClientRect: the sparkle is mid-twinkle
         when this runs and its painted box is scaled, but the box it reserves
         in layout must not move. That is what "no layout shift" means here. */
      boxes: [...new Set(i.map(e => `${e.offsetWidth}x${e.offsetHeight}`))],
    };
  });
  ok(icons.hidden, "every icon is aria-hidden");
  ok(icons.focusable, "no icon is focusable");
  ok(icons.boxes.length === 1, `tick and sparkle reserve the same box (${icons.boxes[0]})`);
  ok(icons.inAcc.every(t => t.length > 0),
     "the feature text is still the accessible name of the row");

  console.log("\n  Twinkle");
  const anim = await p.evaluate(() => {
    const s = getComputedStyle(document.querySelector(".pr-spark"));
    return { name: s.animationName, dur: s.animationDuration,
             timing: s.animationTimingFunction, count: s.animationIterationCount,
             delays: [...document.querySelectorAll(".pr-card .pr-spark")]
               .slice(0, 3).map(e => getComputedStyle(e).animationDelay) };
  });
  eq(anim.dur, "3.2s", "3.2s");
  eq(anim.timing, "ease-in-out", "ease-in-out");
  eq(anim.count, "infinite", "infinite");
  eq(anim.delays, ["0s", "0.45s", "0.9s"], "staggered 0.45s apart");

  const css = pricing.slice(pricing.indexOf("<style"), pricing.indexOf("</style>"));
  ok(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*pr-spark[^}]*animation:\s*none/
     .test(css.replace(/\s+/g, " ")),
     "a prefers-reduced-motion rule turns the animation off");

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await reduced.goto("file://" + path.join(root, "pricing/index.html"));
  const red = await reduced.evaluate(() => {
    const s = getComputedStyle(document.querySelector(".pr-spark"));
    return { name: s.animationName, opacity: s.opacity };
  });
  eq(red.name, "none", "with reduced motion the animation is off");
  eq(red.opacity, "1", "and the sparkle is fully opaque");
  await reduced.close();

  console.log("\n  Dark card");
  const darkSpark = await p.evaluate(() =>
    getComputedStyle(document.querySelector(".pr-dark .pr-spark")).color);
  const lightSpark = await p.evaluate(() =>
    getComputedStyle(document.querySelector(".pr-pop .pr-spark")).color);
  ok(darkSpark !== lightSpark, `the dark card gets its own sparkle colour (${darkSpark})`);

  console.log("\n  Card height");
  for (const [w, limit] of [[1440, 760], [1024, 760], [390, 900]]) {
    const v = await browser.newPage({ viewport: { width: w, height: 900 } });
    await v.goto("file://" + path.join(root, "pricing/index.html"));
    await v.waitForTimeout(150);
    const tallest = await v.evaluate(() => Math.max(...[...document.querySelectorAll(".pr-card")]
      .map(c => c.getBoundingClientRect().height)));
    ok(tallest < limit, `${w}px: tallest card ${Math.round(tallest)}px (under ${limit})`);
    const over = await v.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 1, `${w}px: no horizontal overflow`);
    await v.close();
  }

  console.log("\n  Minutes section");
  const m = await p.evaluate(() => {
    const cards = [...document.querySelectorAll("#p-minutes .mcard")];
    return {
      n: cards.length,
      heads: cards.map(c => c.querySelector("h3").textContent.trim()),
      icons: cards.every(c => c.querySelector(".mcard-head .mi")),
      heights: [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().height)))],
      cols: getComputedStyle(document.querySelector(".pr-three")).gridTemplateColumns.split(" ").length,
      nowrap: [...document.querySelectorAll(".pr-table-pkg td, .pr-table-pkg th")]
        .every(e => getComputedStyle(e).whiteSpace === "nowrap"),
      pills: document.querySelectorAll(".pr-addons .ad-p").length,
      callout: !!document.querySelector(".mcard-callout"),
      facts: document.querySelectorAll(".mcard-facts li").length,
    };
  });
  eq(m.n, 3, "three cards");
  eq(m.heads, ["If you need more minutes", "Add-ons", "Setup, trial and annual"], "headings");
  ok(m.icons, "each card has an icon");
  eq(m.heights.length, 1, `equal height (${m.heights[0]}px)`);
  eq(m.cols, 3, "three columns at 1440");
  ok(m.nowrap, "the package table does not wrap its cells");
  eq(m.pills, 5, "five add-on price pills");
  ok(m.callout, "the never-stop-answering callout is highlighted");
  eq(m.facts, 3, "three setup fact rows");

  const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await narrow.goto("file://" + path.join(root, "pricing/index.html"));
  const cols = await narrow.evaluate(() =>
    getComputedStyle(document.querySelector(".pr-three")).gridTemplateColumns.split(" ").length);
  eq(cols, 1, "one column below 1024");
  await narrow.close();

  console.log("\n  Beta tag on the CTA");
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  ok(!/Build your demo/.test(home) && !/Build your demo/.test(pricing),
     "no \"Build your demo\" label anywhere");
  ok(/Build your assistant/.test(home), "the label is \"Build your assistant\"");
  ok(!/<em class="beta">\(beta\)<\/em>/.test(home), "no \"(beta)\" parenthetical left");
  ok(/aria-label="Build your assistant \(beta\)"/.test(home),
     "the aria-label still says beta");
  ok(/<span class="beta-tag" aria-hidden="true">Beta<\/span>/.test(home),
     "the tag is decorative");

  const h = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await h.goto("file://" + path.join(root, "index.html"));
  await h.waitForTimeout(150);
  const tag = await h.evaluate(() => {
    const t = document.querySelector(".beta-tag");
    const btn = t.closest(".btn");
    const s = getComputedStyle(t);
    const tr = t.getBoundingClientRect(), br = btn.getBoundingClientRect();
    return { pos: s.position, size: s.fontSize, weight: s.fontWeight,
             upper: s.textTransform, wrap: s.whiteSpace,
             outside: tr.top < br.top && tr.right > br.right - 1,
             label: btn.textContent.replace(/\s+/g, " ").trim() };
  });
  eq(tag.pos, "absolute", "positioned out of flow, so it cannot change the button size");
  eq(tag.size, "10px", "10px");
  eq(tag.weight, "800", "bold");
  eq(tag.upper, "uppercase", "uppercase");
  eq(tag.wrap, "nowrap", "never wraps");
  ok(tag.outside, "it sits on the button's top-right corner");
  await h.close();

  console.log("\n  Beta tag at 390px, including the menu");
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto("file://" + path.join(root, "index.html"));
  await mob.waitForTimeout(200);
  const clipped = await mob.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll(".beta-tag")]
      .filter(t => t.getBoundingClientRect().width > 0)
      .some(t => { const r = t.getBoundingClientRect(); return r.right > vw || r.left < 0; });
  });
  ok(!clipped, "no tag is clipped by the viewport");
  const overflow = await mob.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(overflow <= 1, "the page does not scroll sideways");
  await mob.close();

  await browser.close();
  console.log(`\n${pass} checks passed.`);
})().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
