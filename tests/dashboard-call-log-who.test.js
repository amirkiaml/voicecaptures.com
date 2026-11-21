/* dashboard/index.html, the call log's "who was this text sent to", in a vm (offline):
 *   - a business line says "To your team", which is what it always said;
 *   - a PERSONAL line says "To you": it is one person's own phone and there is no team;
 *   - a text to the caller says "To caller" on both;
 *   - before the billing payload arrives, the wording is the business one.
 *   node tests/dashboard-call-log-who.test.js */
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log("  ✓", m); };

const html = fs.readFileSync(path.join(__dirname, "..", "dashboard", "index.html"), "utf8");

/**
 * THE FUNCTION ITSELF, lifted from the page rather than copied into this file.
 *
 * `renderMessages` is the only thing here that decides the wording, and it needs three
 * things from the page around it: `esc`, `TZ` and `v2b`. Running it in a context that
 * supplies exactly those is enough to ask it the question, and it keeps this test honest —
 * if the function moves or the wording is hard-coded again, the slice stops matching.
 */
const src = /\nfunction renderMessages\(list\) \{[\s\S]*?\n\}/.exec(html);
ok(!!src, "renderMessages found in the page");

const MSG = (over = {}) => ({ recipient: "owner", channel: "sms", status: "sent", created_at: "2026-11-20T15:04:00Z", body: "Dana called about a dripping tap.", ...over });

/** Renders one message with the given billing payload in scope, and returns the text. */
function who(v2b, msg = MSG()) {
  const ctx = vm.createContext({
    v2b,
    esc: s => String(s ?? ""),
    TZ: () => "America/Toronto",
    Date,
  });
  vm.runInContext(`${src[0]}\nglobalThis.__out = renderMessages([${JSON.stringify(msg)}]);`, ctx);
  return ctx.__out;
}

const PERSONAL = { plan: { key: "personal", label: "Personal Line" } };
const BUSINESS = { plan: { key: "business_lite", label: "Business Lite" } };

ok(/<b>To your team<\/b>/.test(who(BUSINESS)), "a business line: To your team");
ok(/<b>To you<\/b>/.test(who(PERSONAL)) && !/To your team/.test(who(PERSONAL)), "a personal line: To you, and never To your team");
ok(/<b>To caller<\/b>/.test(who(PERSONAL, MSG({ recipient: "caller" }))), "a text to the caller is To caller on a personal line");
ok(/<b>To caller<\/b>/.test(who(BUSINESS, MSG({ recipient: "caller" }))), "...and on a business one");

/**
 * BEFORE THE PAYLOAD ARRIVES. The log draws from its own data and `loadV2Bill` re-renders
 * it once the plan is known, so for a moment `v2b` is null — and the wording then is the
 * one that has always been there, not a blank or a guess.
 */
ok(/<b>To your team<\/b>/.test(who(null)), "no billing payload yet: the wording is unchanged");
ok(/<b>To your team<\/b>/.test(who({})), "a payload without a plan: the same");

/** And the page re-renders the log once it knows, rather than leaving the first wording. */
ok(/typeof allCalls !== "undefined" && allCalls\.length && typeof renderLog === "function"/.test(html),
  "loadV2Bill re-renders the log when the plan arrives, guarded so a missing log hides no card");

console.log(`\n${pass} checks passed`);
