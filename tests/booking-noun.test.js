/* dashboard/index.html: a booked call is an "Appointment" on a self-serve / pricing-v2 line
 * (/api/dashboard sends bookingNoun: "Appointment"), and stays a "Tour" for the legacy tour
 * client (no bookingNoun, as before). The Calendar card's hours note is in settings-card tests.
 * node tests/booking-noun.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
let pass = 0;
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); pass++; console.log("  ✓", m); };
const html = fs.readFileSync(path.join(__dirname, "..", "dashboard", "index.html"), "utf8");
const noun = /(const bookingNoun = [^\n]*\n)/.exec(html)[1];
const pill = /(function statusPill\(c\) \{[\s\S]*?\n\}\n)/.exec(html)[1];
const detail = /\$\{c\.tour_start \? `<div class="k">\$\{bookingNoun\(\)\}<\/div><div class="v">\$\{esc\(c\.tour_start\)\}<\/div>` : ""\}/.test(html);
eq(detail, true, "the call's detail labels tour_start with the same word");
const run = last => {
  const ctx = { last, esc: s => String(s) };
  vm.runInNewContext(`${noun}${pill}; out = [statusPill({ outcome: "booked", tour_booking_id: "evt1" }), statusPill({ outcome: "booked" }), bookingNoun()];`, ctx);
  return JSON.parse(JSON.stringify(ctx.out));
};
eq(run({ bookingNoun: "Appointment" }), ['<span class="pill p-booked">Appointment booked</span>', '<span class="pill p-booked">Booked</span>', "Appointment"], "self-serve / v2: \"Appointment booked\", \"Appointment\"");
eq(run({}), ['<span class="pill p-booked">Tour booked</span>', '<span class="pill p-booked">Booked</span>', "Tour"], "legacy (no bookingNoun): \"Tour booked\", as before");
eq(run(null)[2], "Tour", "before anything has loaded: as before");
eq(run({ bookingNoun: "<b>x</b>" })[2], "Tour", "anything else from the API: ignored");
console.log(`\n${pass} checks passed`);
