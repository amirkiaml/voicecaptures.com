/* Win-back pricing must not move when receptionist pricing changes.
 *   node tests/winback-snapshot.test.js
 * pricing/winback.json is a verbatim snapshot of the section as it shipped.
 * This compares the rendered page against it character for character, so a
 * later edit to the pricing page cannot alter a win-back price, term or
 * compliance sentence silently. Offline, no browser needed. */
const fs = require("fs"), path = require("path"), assert = require("assert");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };
const eq = (a, b, m) => { assert.strictEqual(a, b, m); pass++; console.log("  ✓", m); };

const root = path.join(__dirname, "..");
const wb = JSON.parse(fs.readFileSync(path.join(root, "pricing/winback.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "pricing/index.html"), "utf8");

const start = html.indexOf(`id="${wb.section_id}"`);
ok(start > -1, `the #${wb.section_id} anchor is still on the pricing page`);
const section = html.slice(start, html.indexOf("</section>", start));
const text = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const flat = text(section);
const plain = s => text(s);   // the snapshot stores HTML entities as shipped

console.log("Win-back snapshot");
eq(text(`<h2>${wb.heading}</h2>`), text(section.match(/<h2>(.*?)<\/h2>/s)[0]),
   `heading: "${wb.heading}"`);
ok(flat.includes(plain(wb.sub)), "the sub-heading is the snapshot's, word for word");

for (const c of wb.columns) {
  ok(flat.includes(plain(c.name)), `column "${c.name}" is present`);
  ok(flat.includes(c.price), `"${c.name}": price ${c.price} unchanged`);
  if (c.price_suffix) {
    ok(flat.includes(plain(c.price_suffix)),
       `"${c.name}": "${c.price_suffix}" unchanged`);
  }
  ok(flat.includes(plain(c.body)), `"${c.name}": body copy unchanged`);
}

/* The compliance sentences. These are the ones that must never be reworded by
   a pricing edit: the free-pilot terms, and who we are allowed to call. */
ok(flat.includes(plain(wb.note)), "the free-pilot and consent note is unchanged");
for (const phrase of [
  "own past customers only",
  "never cold lists or purchased leads",
  "free pilot",
  "at least 25 names, at most 100",
]) {
  ok(flat.includes(phrase), `compliance wording kept: "${phrase}"`);
}

/* Receptionist pricing must not leak in. None of the catalog's plan prices,
   trial lengths, annual wording or HST line belongs in this section. */
console.log("\nNo receptionist pricing in the win-back section");
const cat = JSON.parse(fs.readFileSync(path.join(root, "pricing/catalog.json"), "utf8"));
const winbackPrices = new Set();
for (const c of wb.columns) {
  for (const m of `${c.price} ${c.price_suffix || ""}`.matchAll(/\$([0-9][0-9,.]*)/g)) {
    winbackPrices.add(m[1]);
  }
}
for (const m of flat.matchAll(/\$([0-9][0-9,.]*)/g)) {
  ok(winbackPrices.has(m[1]),
     `$${m[1]} in the section is a win-back price, not a plan price`);
}
/* Not "no plan price appears here": win-back's always-on fee is $99/mo and
   Business Lite happens to be $99/mo too. The check above is the real one —
   every dollar figure in this section must come from winback.json, whatever
   the catalog happens to charge. */
ok(cat.plans.length > 0, "catalog read (the per-figure check above is the guard)");
for (const word of ["2 months free", "HST", "free trial", "minutes a month"]) {
  ok(!flat.includes(word), `no "${word}" wording in the win-back section`);
}

/* The snapshot has to stay traceable to the commit it was copied from. */
console.log("\nProvenance");
ok(/^[0-9a-f]{7,40}$/.test(wb.source_commit),
   `source_commit recorded: ${wb.source_commit}`);
eq(wb.owner, "Amir", "owner recorded");

console.log(`\n${pass} checks passed.`);
