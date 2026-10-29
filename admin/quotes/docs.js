/* ------------------------------------------------------------------ *
 * docs.js — client-facing documents for the quote calculator.
 *   quoteHtml(Q, R, opts)   order form / quote (print to PDF)
 *   invoiceHtml(Q, R, inv)  invoice for one-off charges paid outside Stripe
 *   stripeText(Q, R)        what to set up in Stripe by hand
 *   plainText(Q, R)         the quote as plain text for an email
 * R is VCQ.compute(Q). Nothing from R.internal ever goes into these.
 * No em or en dashes anywhere in the output (noDash runs on all of it).
 * ------------------------------------------------------------------ */
(function (root) {
  "use strict";
  const C = root.VCQ || (typeof require !== "undefined" ? require("./calc.js") : null);
  const noDash = C.noDash;
  const esc = s => noDash(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n, dp = 2) => {
    const v = Number(n) || 0, a = Math.abs(v).toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (v < 0 ? "-$" : "$") + a;
  };
  const fmtDate = s => {
    if (!s) return "";
    const d = new Date(String(s).slice(0, 10) + "T12:00:00Z");
    return isNaN(d) ? String(s) : d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  };
  const SIGN = { name: "Amir", title: "Founder, VoiceCaptures", email: "amir@voicecaptures.com" };
  const LOGO_MARK = "https://voicecaptures.com/logo-mark.png";

  const CSS = `
  @page { size: Letter; margin: 0.55in 0.6in 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.5pt/1.45 "DM Sans", -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #0d1729; background: #fff;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc { max-width: 7.3in; margin: 0 auto; }
  .bar { height: 8px; background: #2563EB; border-radius: 0 0 3px 3px; margin-bottom: 18px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .brand img { width: 30px; height: 30px; }
  .brand b { font: 800 17pt/1 Manrope, "DM Sans", Arial, sans-serif; letter-spacing: -0.2px; }
  .brand small { display: block; color: #5a6b82; font-size: 8.5pt; margin-top: 3px; }
  .meta { text-align: right; font-size: 9pt; color: #5a6b82; }
  .meta .t { font: 800 14pt/1.2 Manrope, Arial, sans-serif; color: #0d1729; }
  h1 { font: 800 15pt/1.25 Manrope, Arial, sans-serif; margin: 6px 0 2px; }
  .sub { color: #5a6b82; margin-bottom: 12px; }
  .keys { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #c9d6f5; background: #f2f6fe; border-radius: 8px; margin: 10px 0 16px; }
  .keys div { padding: 8px 10px; border-left: 1px solid #c9d6f5; }
  .keys div:first-child { border-left: 0; }
  .keys span { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .6px; color: #2563EB; font-weight: 700; }
  .keys b { font-size: 10pt; }
  h2 { font: 800 11.5pt/1.3 Manrope, Arial, sans-serif; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #e3e8f1; break-after: avoid; }
  h2 .n { color: #2563EB; margin-right: 6px; }
  p { margin: 4px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
  th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .5px; color: #5a6b82; border-bottom: 1px solid #d5dcea; padding: 5px 6px; }
  td { padding: 5px 6px; border-bottom: 1px solid #eef1f6; vertical-align: top; }
  tr { break-inside: avoid; }
  table.keep { break-inside: avoid; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  tr.disc td { color: #0B7C9C; }
  tr.sub td { font-weight: 700; border-top: 1px solid #d5dcea; }
  tr.total td { font-weight: 800; font-size: 11.5pt; border-top: 2px solid #0d1729; border-bottom: 0; }
  .muted { color: #5a6b82; }
  .small { font-size: 8.5pt; }
  .box { border: 1px solid #e3e8f1; border-radius: 8px; padding: 10px 12px; margin: 6px 0 10px; break-inside: avoid; }
  .loc { border: 1px solid #e3e8f1; border-radius: 8px; padding: 8px 12px; margin: 6px 0; break-inside: avoid; }
  .loc b { font-size: 10.5pt; }
  ul { margin: 4px 0 8px 18px; padding: 0; }
  li { margin: 2px 0; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 10px; break-inside: avoid; }
  .sig .line { border-bottom: 1px solid #0d1729; height: 34px; margin-bottom: 4px; }
  .sig .who { font-size: 9pt; color: #5a6b82; }
  .foot { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e3e8f1; font-size: 8pt; color: #5a6b82; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  a { color: #2563EB; }
  .pb { break-before: page; }
  .big { font: 800 20pt/1.1 Manrope, Arial, sans-serif; }
  .vgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 12px; }
  .vgrid div { border: 1px solid #e3e8f1; border-radius: 8px; padding: 8px 10px; }
  .vgrid span { display: block; font-size: 8pt; color: #5a6b82; text-transform: uppercase; letter-spacing: .5px; }
  @media screen { body { background: #e9edf4; padding: 24px 12px; } .doc { background: #fff; padding: 0 0.6in 0.5in; box-shadow: 0 2px 14px rgba(0,0,0,.12); } }
  @media screen and (max-width: 640px) { .doc { padding: 0 14px 20px; } .keys { grid-template-columns: 1fr 1fr; } .keys div:nth-child(3) { border-left: 0; } .vgrid { grid-template-columns: 1fr; } .sig { grid-template-columns: 1fr; } }
  `;

  function shell(title, body) {
    return noDash(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="doc"><div class="bar"></div>${body}</div></body></html>`);
  }

  function header(kind, number, Q) {
    return `<div class="head">
      <div class="brand"><img src="${LOGO_MARK}" alt=""><div><b>VoiceCaptures</b><small>AI phone receptionist · voicecaptures.com</small></div></div>
      <div class="meta"><div class="t">${esc(kind)}</div>${number ? `<div>${esc(number)}</div>` : ""}<div>${esc(fmtDate(Q.quoteDate))}</div></div>
    </div>`;
  }

  function clientBlock(Q) {
    const c = Q.client || {};
    const bits = [c.contact, c.email, c.phone, c.address].filter(Boolean).map(esc);
    return `<div class="box"><div class="small muted">Prepared for</div><b>${esc(c.name || "Client")}</b>${bits.length ? `<div class="small">${bits.join(" · ")}</div>` : ""}</div>`;
  }

  function scopeHtml(Q, R) {
    return R.locs.map(l => {
      const minutesNote = l.plan.minutes ? `Up to ${l.plan.minutes.toLocaleString("en-CA")} minutes a month` : "";
      const add = l.addons.map(a => `${a.name}${a.qty > 1 ? ` x${a.qty}` : ""}`);
      return `<div class="loc"><b>${esc(l.name)}</b> <span class="muted">· ${esc(l.plan.name)} plan · ${esc(l.coverage)}</span>
        <div class="small">${esc(minutesNote)}${add.length ? ` · Add-ons: ${esc(add.join(", "))}` : ""}${l.loc.scopeNote ? `<br>${esc(l.loc.scopeNote)}` : ""}</div></div>`;
    }).join("") + (R.items.length ? `<p class="small" style="margin-top:8px"><b>Custom work:</b> ${R.items.map(i => esc(i.name || "Custom work")).join("; ")}.${R.items.some(i => i.note) ? " " + R.items.filter(i => i.note).map(i => esc(i.note)).join(" ") : ""}</p>` : "");
  }

  function priceTable(Q, R) {
    const rows = [];
    for (const l of R.locs) {
      rows.push(`<tr><td>${esc(l.name)}: ${esc(l.plan.name)} plan</td><td class="num">${money(l.plan.price)}</td></tr>`);
      for (const a of l.addons) rows.push(`<tr><td class="muted">&nbsp;&nbsp;${esc(a.name)}${a.qty > 1 ? ` x${a.qty}` : ""}</td><td class="num">${money(a.monthly)}</td></tr>`);
    }
    for (const i of R.items) if (i.monthly) rows.push(`<tr><td>${esc(i.name || "Custom work")} (monthly)</td><td class="num">${money(i.monthly)}</td></tr>`);
    rows.push(`<tr class="sub"><td>Monthly list price</td><td class="num">${money(R.listMonthly)}</td></tr>`);
    for (const d of R.recurringLines) rows.push(`<tr class="disc"><td>${esc(d.label)}</td><td class="num">${money(d.amount)}</td></tr>`);
    if (R.recurringLines.length) rows.push(`<tr class="sub"><td>Monthly price</td><td class="num">${money(R.monthlyNet)}</td></tr>`);
    let termRows = "";
    if (R.prepaid) {
      termRows = `<tr><td>${R.months} months x ${money(R.monthlyNet)}</td><td class="num">${money(R.termGross)}</td></tr>
        <tr class="disc"><td>${esc(R.termLabel)}</td><td class="num">${money(-R.termDiscount)}</td></tr>
        ${R.freeAddonLines.map(d => `<tr class="disc"><td>${esc(d.label)}</td><td class="num">${money(d.amount)}</td></tr>`).join("")}
        <tr class="sub"><td>Prepaid term (${money(R.effectiveMonthly)}/month effective)</td><td class="num">${money(R.termTotal - R.freeAddonCredit)}</td></tr>`;
    } else if (R.freeAddonLines.length) {
      termRows = R.freeAddonLines.map(d => `<tr class="disc"><td>${esc(d.label)}, credited ${money(d.perMonth)} a month</td><td class="num">${money(-d.perMonth)}/mo</td></tr>`).join("");
    }
    const ot = R.oneTimeLines.length ? `</table><table class="keep">
      <tr><th>One-time</th><th class="num">CAD</th></tr>
      ${R.oneTimeLines.map(x => `<tr><td>${esc(x.label)}</td><td class="num">${money(x.amount)}</td></tr>`).join("")}
      ${R.oneTimeDiscounts.map(x => `<tr class="disc"><td>${esc(x.label)}</td><td class="num">${money(x.amount)}</td></tr>`).join("")}
      <tr class="sub"><td>One-time total</td><td class="num">${money(R.oneTimeNet)}</td></tr>` : "";
    const what = R.prepaid ? (R.oneTimeLines.length ? "prepaid term + one-time" : "prepaid term") : (R.oneTimeLines.length ? "first month + one-time" : "first month");
    const due = `${R.oneTimeLines.length ? "" : `</table><table class="keep">`}
      ${R.taxPct ? `<tr class="sub"><td>Due at start (${what}), before tax</td><td class="num">${money(R.dueAtStart)}</td></tr>
      <tr><td>HST ${R.taxPct}%${Q.tax && Q.tax.number ? ` (${esc(Q.tax.number)})` : ""}</td><td class="num">${money(R.dueAtStartTax)}</td></tr>` : ""}
      <tr class="total"><td>Total due at start (${R.taxPct ? "including HST" : what})</td><td class="num">${money(R.dueAtStartWithTax)} CAD</td></tr>`;
    const after = R.prepaid
      ? `<p class="small muted">After the prepaid term, the plan renews monthly at ${money(R.monthlyNet)}${R.taxPct ? " plus HST" : ""} unless you choose another term. We email you the renewal rate during the final month.</p>`
      : `<p class="small muted">Billed monthly at ${money(R.monthlyNet)}${R.taxPct ? ` plus HST (${money(R.monthlyNetWithTax)})` : ""}. Cancel any time before the next billing date.</p>`;
    const offer = R.inactiveCredits.length ? `<p class="small">${R.inactiveCredits.map(c => `${esc(c.label)}: ${money(-c.amount)} with a ${c.needsTermMonths}-month prepaid term.`).join(" ")}</p>` : "";
    return `<table><tr><th>Monthly</th><th class="num">CAD</th></tr>${rows.join("")}${termRows}${ot}${due}</table>${after}${offer}`;
  }

  function trialHtml(R) {
    if (!R.trial) return "<p>No free trial is included in this quote.</p>";
    return `<p>A free ${R.trial.days}-day trial${R.trial.location ? ` at ${esc(R.trial.location)}` : ""}, up to ${R.trial.cap.toLocaleString("en-CA")} minutes. Nothing is charged during the trial. If the trial ends or reaches its minutes, calls ring your phone directly until the paid term starts. ${R.prepaid ? `The ${R.months}-month prepaid term starts the day after the trial ends.` : "Monthly billing starts the day after the trial ends."}${R.locs.length > 1 ? " The other locations go live on the paid plan." : ""}</p>`;
  }

  function valuePage(Q, R) {
    const V = R.value; if (!V) return "";
    return `<div class="pb"></div><div class="bar" style="margin-top:0"></div>${header("Value summary", Q.quoteNumber, Q)}
      <h1>What this is worth to ${esc((Q.client || {}).name || "you")}</h1>
      <p class="sub">Estimates from the numbers you gave us. We kept them conservative.</p>
      <div class="vgrid"><div><span>Value per month</span><b class="big">${money(V.monthly, 0)}</b></div>
        <div><span>Your price per month</span><b class="big">${money(V.clientMonthly, 0)}</b></div>
        <div><span>Return</span><b class="big">${V.roi != null ? V.roi + "x" : "n/a"}</b></div></div>
      <table><tr><th>Where the value comes from</th><th class="num">Per month</th></tr>
        ${V.lines.map(l => `<tr><td>${esc(l.label)}<div class="small muted">${esc(l.detail)}</div></td><td class="num">${money(l.monthly, 0)}</td></tr>`).join("")}
        <tr class="sub"><td>Total value</td><td class="num">${money(V.monthly, 0)}</td></tr>
        <tr><td>Your price (effective monthly)</td><td class="num">${money(V.clientMonthly, 0)}</td></tr>
        <tr class="total"><td>Net gain per month</td><td class="num">${money(V.netMonthly, 0)}</td></tr></table>
      <p>Over a year that is about ${money(V.annual, 0)} of value for ${money(V.annualCost, 0)} in fees${V.paybackMonths != null ? `. The amount due at start is covered in about ${V.paybackMonths} month${V.paybackMonths === 1 ? "" : "s"} of value` : ""}.</p>
      <p class="small muted">These are estimates, not a promise of results. They depend on your call volume, how many callers book, and what a booking is worth to you. We show them so you can check the price against your own numbers.</p>`;
  }

  function quoteHtml(Q, R, opts = {}) {
    const number = Q.quoteNumber || "Draft";
    const c = Q.client || {};
    let n = 0; const h = t => `<h2><span class="n">${++n}.</span>${esc(t)}</h2>`;
    const body = `${header("Quote", number, Q)}
      <h1>VoiceCaptures for ${esc(c.name || "your business")}</h1>
      <div class="sub">${R.locs.length} location${R.locs.length === 1 ? "" : "s"} · AI phone receptionist${R.items.length ? " with custom work" : ""}</div>
      <div class="keys">
        <div><span>Quote date</span><b>${esc(fmtDate(Q.quoteDate))}</b></div>
        <div><span>Valid until</span><b>${esc(fmtDate(Q.validUntil))}</b></div>
        <div><span>Free trial</span><b>${R.trial ? `${R.trial.days} days, ${R.trial.cap} min` : "None"}</b></div>
        <div><span>Term</span><b>${R.prepaid ? `${R.months} months prepaid` : "Monthly"}</b></div>
      </div>
      ${clientBlock(Q)}
      ${h("What we set up")}${scopeHtml(Q, R)}
      ${h("Price")}${priceTable(Q, R)}
      ${h("Free trial")}${trialHtml(R)}
      ${h("Minutes")}<p>Each plan's minutes are monthly and do not carry over. We text you at 80% and at 100% of a location's minutes, and your line keeps answering. Top-ups are 50 minutes for $65 or 100 minutes for $120 for that month. Minutes used past the plan without a top-up are $1.50 each on the next invoice.</p>
      ${Q.client && Q.client.notes ? h("Notes") + `<p>${esc(Q.client.notes)}</p>` : ""}
      ${h("Terms")}<p>This quote is valid until ${esc(fmtDate(Q.validUntil))}. Prices are in Canadian dollars${R.taxPct ? ` and HST is shown separately` : " and do not include tax"}. ${R.prepaid ? `A prepaid term locks these rates for the term.` : ""} Our <a href="https://voicecaptures.com/terms">Terms of Service</a> and <a href="https://voicecaptures.com/privacy">Privacy Policy</a> apply.</p>
      ${h("Accepted by")}
      <div class="sig"><div><div class="line"></div><div class="who">${esc(c.name || "Client")}: name, title and date</div></div>
        <div><div class="line"></div><div class="who">${SIGN.name}, ${SIGN.title}, ${SIGN.email}</div></div></div>
      <div class="foot"><span>VoiceCaptures · voicecaptures.com · ${SIGN.email}</span><span>${esc(number)}</span></div>
      ${opts.value ? valuePage(Q, R) : ""}`;
    return shell(`VoiceCaptures Quote ${number} ${c.name || ""}`.trim(), body);
  }

  function invoiceLines(R) {
    // One-off charges paid outside Stripe: the one-time lines and their discounts.
    return R.oneTimeLines.map(x => ({ label: x.label, amount: x.amount })).concat(R.oneTimeDiscounts.map(x => ({ label: x.label, amount: x.amount })));
  }

  function invoiceHtml(Q, R, inv = {}) {
    const lines = invoiceLines(R);
    const sub = Math.max(0, lines.reduce((a, x) => a + x.amount, 0));
    const tax = R.taxPct ? Math.round(sub * R.taxPct) / 100 : 0;
    const c = Q.client || {};
    const body = `${header("Invoice", inv.number || "Draft", { quoteDate: inv.issueDate || Q.quoteDate })}
      <div class="keys">
        <div><span>Invoice</span><b>${esc(inv.number || "Draft")}</b></div>
        <div><span>Issued</span><b>${esc(fmtDate(inv.issueDate))}</b></div>
        <div><span>Due</span><b>${esc(fmtDate(inv.dueDate))}</b></div>
        <div><span>Quote</span><b>${esc(Q.quoteNumber || "")}</b></div>
      </div>
      ${clientBlock(Q)}
      <table><tr><th>Item</th><th class="num">CAD</th></tr>
        ${lines.map(x => `<tr class="${x.amount < 0 ? "disc" : ""}"><td>${esc(x.label)}</td><td class="num">${money(x.amount)}</td></tr>`).join("")}
        <tr class="sub"><td>Subtotal</td><td class="num">${money(sub)}</td></tr>
        ${R.taxPct ? `<tr><td>HST ${R.taxPct}%${Q.tax && Q.tax.number ? ` (${esc(Q.tax.number)})` : ""}</td><td class="num">${money(tax)}</td></tr>` : ""}
        <tr class="total"><td>Amount due</td><td class="num">${money(sub + tax)} CAD</td></tr></table>
      <h2>How to pay</h2><p>${esc(inv.instructions || `Interac e-Transfer to ${SIGN.email}, with ${inv.number || "the invoice number"} in the message.`).replace(/\n/g, "<br>")}</p>
      <p class="small muted">Monthly or prepaid plan charges are billed separately through Stripe.</p>
      <div class="foot"><span>VoiceCaptures · voicecaptures.com · ${SIGN.email}</span><span>${esc(inv.number || "")}</span></div>`;
    return shell(`VoiceCaptures Invoice ${inv.number || "Draft"} ${c.name || ""}`.trim(), body);
  }

  function stripeText(Q, R) {
    const out = [], c = Q.client || {};
    const interval = R.prepaid ? (R.months === 12 ? "yearly" : `every ${R.months} months`) : "monthly";
    out.push(`STRIPE SETUP: ${c.name || "Client"} (${Q.quoteNumber || "draft quote"})`, `Currency: CAD${R.taxPct ? `. Tax: HST ${R.taxPct}% (add a tax rate in Stripe)` : ". No tax"}`, "");
    out.push(`1. Customer: ${c.name || ""}${c.email ? ` <${c.email}>` : ""}`, "");
    out.push(`2. Subscription (${interval}${R.trial ? `, ${R.trial.days}-day trial` : ""}). One price per line:`);
    const f = R.prepaid ? (R.term.freeMonths ? (R.months - R.term.freeMonths) : R.months * (1 - (R.term.pct || 0) / 100)) : 1;
    const per = x => Math.round(x * f * 100) / 100;
    for (const l of R.locs) {
      out.push(`   - ${l.plan.name} plan, ${l.name}: ${money(per(l.plan.price))} CAD ${interval}, qty 1${R.prepaid ? ` (= ${money(l.plan.price)}/mo x ${R.months}${R.term.freeMonths ? ` less ${R.term.freeMonths} free` : ` less ${R.term.pct}%`})` : ""}`);
      for (const a of l.addons) out.push(`   - ${a.name}, ${l.name}: ${money(per(a.unit))} CAD ${interval}, qty ${a.qty}`);
    }
    for (const i of R.items) if (i.monthly) out.push(`   - ${i.name || "Custom work"} (monthly): ${money(per(i.monthly))} CAD ${interval}, qty 1`);
    out.push(`   Subscription total per ${R.prepaid ? "term" : "month"} before coupons: ${money(per(R.listMonthly))}`);
    const coupons = R.recurringLines.filter(d => d.amount);
    if (coupons.length || R.freeAddonLines.length) {
      out.push("", "3. Coupons on the subscription:");
      for (const d of coupons) out.push(`   - ${d.label}: ${d.kind === "multi" ? `${Q.discounts.multiPct}% off the plan prices` : `${money(-d.amount)} off per month`}, duration: forever${R.prepaid ? ` (= ${money(-d.amount * f)} per term)` : ""}`);
      for (const d of R.freeAddonLines) out.push(`   - ${d.label}: ${money(-d.amount)} off once${R.prepaid ? " (first term)" : `, or ${money(d.perMonth)} off for ${d.months} months`}`);
    }
    const ot = R.oneTimeLines.concat(R.oneTimeDiscounts);
    if (ot.length) {
      out.push("", `${coupons.length || R.freeAddonLines.length ? 4 : 3}. One-time invoice items (add to the first invoice, or use the Invoice tab if paid outside Stripe):`);
      for (const x of ot) out.push(`   - ${x.label}: ${money(x.amount)} CAD${x.amount < 0 ? " (negative invoice item / credit)" : ""}`);
      out.push(`   One-time total: ${money(R.oneTimeNet)}`);
    }
    out.push("", `First invoice: ${money(R.dueAtStart)}${R.taxPct ? ` + HST ${money(R.dueAtStartTax)} = ${money(R.dueAtStartWithTax)}` : ""} CAD`);
    if (R.prepaid) out.push(`Renews ${interval}. To switch to monthly after the term, change the prices to the monthly ones (${money(R.monthlyNet)}/mo).`);
    return noDash(out.join("\n"));
  }

  function plainText(Q, R) {
    const c = Q.client || {}, out = [];
    out.push(`VoiceCaptures quote ${Q.quoteNumber || ""} for ${c.name || "your business"}`.replace(/\s+/g, " ").trim());
    out.push(`Valid until ${fmtDate(Q.validUntil)}. All prices CAD${R.taxPct ? `, HST ${R.taxPct}% shown separately` : ", before tax"}.`, "");
    out.push("What we set up:");
    for (const l of R.locs) out.push(`- ${l.name}: ${l.plan.name} plan (${money(l.plan.price)}/mo, up to ${l.plan.minutes} minutes), ${l.coverage.toLowerCase()}${l.addons.length ? `; ${l.addons.map(a => `${a.name}${a.qty > 1 ? ` x${a.qty}` : ""} ${money(a.monthly)}/mo`).join(", ")}` : ""}`);
    for (const i of R.items) out.push(`- ${i.name || "Custom work"}: ${i.oneTime ? `${money(i.oneTime)} one-time` : ""}${i.oneTime && i.monthly ? " + " : ""}${i.monthly ? `${money(i.monthly)}/mo` : ""}`);
    out.push("", `Monthly list price: ${money(R.listMonthly)}`);
    for (const d of R.recurringLines) out.push(`${d.label}: ${money(d.amount)}/mo`);
    if (R.prepaid) {
      out.push(`${R.months}-month prepaid: ${money(R.termGross)}, ${R.termLabel.toLowerCase().replace(/^\d+-month prepaid term: /, "")} (${money(-R.termDiscount)})`);
      for (const d of R.freeAddonLines) out.push(`${d.label}: ${money(d.amount)}`);
      out.push(`Prepaid term total: ${money(R.termTotal - R.freeAddonCredit)} (${money(R.effectiveMonthly)}/month effective)`);
    } else out.push(`Monthly price: ${money(R.monthlyNet)}`);
    if (R.oneTimeLines.length) {
      out.push("", "One-time:");
      for (const x of R.oneTimeLines.concat(R.oneTimeDiscounts)) out.push(`- ${x.label}: ${money(x.amount)}`);
      out.push(`One-time total: ${money(R.oneTimeNet)}`);
    }
    out.push("", `Due at start: ${money(R.dueAtStart)}${R.taxPct ? ` + HST ${money(R.dueAtStartTax)} = ${money(R.dueAtStartWithTax)}` : ""}`);
    if (R.trial) out.push(`Free trial: ${R.trial.days} days${R.trial.location ? ` at ${R.trial.location}` : ""}, up to ${R.trial.cap} minutes. Billing starts after the trial.`);
    for (const c2 of R.inactiveCredits) out.push(`${c2.label}: ${money(-c2.amount)} with a ${c2.needsTermMonths}-month prepaid term.`);
    out.push("", "Minutes are monthly and don't carry over. Extra minutes: 50 for $65, 100 for $120, or $1.50 each on the next invoice.");
    out.push("Terms: https://voicecaptures.com/terms  Privacy: https://voicecaptures.com/privacy", "");
    out.push(SIGN.name, SIGN.title, SIGN.email);
    return noDash(out.join("\n"));
  }

  const api = { quoteHtml, invoiceHtml, stripeText, plainText, invoiceLines, money, fmtDate };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.VCQDocs = api;
})(typeof window !== "undefined" ? window : globalThis);
