/* The serif-italic half of a page heading must stay inline text.
 *   node tests/heading-italic.test.js
 * The ported stylesheet carries a .pay rule that is a card -- display:flex, a
 * tinted background, a border, 24px of padding -- for a pricing block of the
 * same name. The headings on /demo/, /terms/ and /privacy/ use .pay for their
 * italic half and were getting both: the right typeface inside a grey box.
 * Offline. Needs Playwright with a Chromium. */
const path = require("path"), assert = require("assert");
const { chromium } = require("playwright");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.strictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const PAGES = ["demo", "terms", "privacy"];

(async () => {
  const browser = await chromium.launch();
  for (const page of PAGES) {
    console.log(`\n/${page}/`);
    for (const width of [390, 1280]) {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      await p.goto("file://" + path.join(root, page, "index.html"));
      await p.waitForTimeout(120);
      const r = await p.evaluate(() => {
        const el = document.querySelector("h1 .pay, h2 .pay");
        if (!el) return null;
        const s = getComputedStyle(el);
        return { display: s.display, bg: s.backgroundColor, border: s.borderTopWidth,
                 pad: s.paddingTop, family: s.fontFamily, style: s.fontStyle,
                 shadow: s.boxShadow };
      });
      ok(r, `${width}px: the heading has an italic span`);
      eq(r.display, "inline", `${width}px: it is inline text, not a block`);
      ok(/rgba\(0, 0, 0, 0\)|transparent/.test(r.bg), `${width}px: no background`);
      eq(r.border, "0px", `${width}px: no border`);
      eq(r.pad, "0px", `${width}px: no padding`);
      ok(r.shadow === "none", `${width}px: no box shadow`);
      /* The typography is the point of the class, so it has to survive. */
      ok(/Instrument Serif/.test(r.family), `${width}px: still Instrument Serif`);
      eq(r.style, "italic", `${width}px: still italic`);
      await p.close();
    }
  }
  await browser.close();
  console.log(`\n${pass} checks passed.`);
})().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
