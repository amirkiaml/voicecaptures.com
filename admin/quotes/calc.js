/* ------------------------------------------------------------------ *
 * calc.js — the maths for the internal pricing & quote calculator.
 * Pure functions, no DOM: index.html renders what these return, and the
 * same file runs under Node for tests.
 *
 * PRICE_BOOK and COST_DEFAULTS are the editable config. Prices are CAD and
 * match voicecaptures.com/pricing (checked 2026-10-28). Every saved quote
 * keeps its own copy of both, so changing them here never changes a quote
 * you already sent.
 * ------------------------------------------------------------------ */
(function (root) {
  "use strict";

  /* ================= EDITABLE CONFIG ================= */
  const PRICE_BOOK = {
    currency: "CAD",
    verticals: {
      home:   { label: "Home services & trades", plans: [
        { id: "home_starter", name: "Starter", price: 179, minutes: 150 },
        { id: "home_growth",  name: "Growth",  price: 349, minutes: 300 },
        { id: "home_pro",     name: "Pro",     price: 599, minutes: 550 }] },
      food:   { label: "Restaurants & cafés", plans: [
        { id: "cafe_starter",      name: "Café Starter",      price: 199, minutes: 160 },
        { id: "restaurant_growth", name: "Restaurant Growth", price: 349, minutes: 300 }] },
      clinic: { label: "Clinics & dental", plans: [
        { id: "clinic_essentials", name: "Essentials", price: 349, minutes: 300 },
        { id: "clinic_growth",     name: "Growth",     price: 599, minutes: 550 },
        { id: "clinic_pro",        name: "Pro",        price: 899, minutes: 850 }] },
      other:  { label: "Other business", plans: [
        { id: "other_starter", name: "Starter", price: 179, minutes: 150 },
        { id: "other_growth",  name: "Growth",  price: 349, minutes: 300 },
        { id: "other_pro",     name: "Pro",     price: 599, minutes: 550 }] }
    },
    multiLocation: { id: "multi_location", name: "Multi-location", price: 549, minutes: 500 }, // per location, "from"
    terms: [
      { months: 1,  label: "Monthly",   pct: 0 },
      { months: 3,  label: "3 months",  pct: 5 },
      { months: 6,  label: "6 months",  pct: 10 },
      { months: 12, label: "12 months", freeMonths: 2 }
    ],
    overagePerMin: 1.50,
    topups: [{ minutes: 50, price: 65 }, { minutes: 100, price: 120 }],
    addons: {
      extra_line: { name: "Extra line or calendar", monthly: 29, qty: true },
      history90:  { name: "90-day call history",    monthly: 19 },
      history365: { name: "1-year call history",    monthly: 49 }
    },
    setup: { standard: 0, multiOrCustom: 249 },      // setup is included; multi-location / custom flows $249 once
    integration: { oneTimeFrom: 500, monthlyFrom: 39 },
    hstPct: 13
  };

  const COST_DEFAULTS = {
    fx: 1.37,                    // CAD per USD
    minMarginPct: 60,
    hourlyRate: 100,             // CAD, your time on one-time work
    setupHours: 3,               // for the multi-location / custom flow setup
    usd: {                       // blended ≈ $0.15 USD per minute
      vapi: 0.05, stt: 0.01, llm: 0.02, voice: 0.06, twilioMin: 0.0085,
      numberMonthly: 1.15, sms: 0.0083, email: 0.001
    },
    smsPerCall: 2,               // summary to the business + confirmation to the caller
    emailsPerCall: 1
  };
  /* =================================================== */

  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const n0 = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const fm = n => "$" + (Math.round(Number(n) || 0)).toLocaleString("en-CA");
  const cap = s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
  const COVERAGE = { after_hours: "After hours only", overflow: "Overflow (calls your team can't answer)", all_day: "All day" };

  function blendedUsd(c) { const u = c.usd; return n0(u.vapi) + n0(u.stt) + n0(u.llm) + n0(u.voice) + n0(u.twilioMin); }

  function findPlan(pb, planId) {
    if (planId === pb.multiLocation.id) return { ...pb.multiLocation, vertical: null };
    for (const [vk, v] of Object.entries(pb.verticals)) {
      const p = v.plans.find(x => x.id === planId);
      if (p) return { ...p, vertical: vk, verticalLabel: v.label };
    }
    return null;
  }

  function locPlan(pb, loc) {
    if (loc.plan === "custom") return { id: "custom", name: loc.customName || "Custom plan", price: n0(loc.customPrice), minutes: n0(loc.customMinutes), custom: true };
    return findPlan(pb, loc.plan) || { id: loc.plan, name: "Unknown plan", price: 0, minutes: 0 };
  }

  function locAddons(pb, loc) {
    const out = [], a = loc.addons || {};
    const q = Math.max(0, Math.floor(n0(a.extra_line)));
    if (q) out.push({ key: "extra_line", name: pb.addons.extra_line.name, qty: q, unit: pb.addons.extra_line.monthly, monthly: q * pb.addons.extra_line.monthly });
    if (a.history === "365") out.push({ key: "history365", name: pb.addons.history365.name, qty: 1, unit: pb.addons.history365.monthly, monthly: pb.addons.history365.monthly });
    else if (a.history === "90") out.push({ key: "history90", name: pb.addons.history90.name, qty: 1, unit: pb.addons.history90.monthly, monthly: pb.addons.history90.monthly });
    return out;
  }

  function estMinutes(loc) {
    if (loc.volumeMode === "minutes") return n0(loc.minutes);
    return n0(loc.calls) * n0(loc.avgMin);
  }
  function estCalls(loc) {
    if (loc.volumeMode === "minutes") return n0(loc.avgMin) > 0 ? n0(loc.minutes) / n0(loc.avgMin) : n0(loc.calls);
    return n0(loc.calls);
  }

  /* The whole deal: client-side prices, discounts, totals, plus the
   * internal cost / margin view and the value side. */
  function compute(Q) {
    const pb = Q.priceBook || PRICE_BOOK, cost = Q.internal || COST_DEFAULTS;
    const fx = n0(cost.fx) || 1.37;
    const term = pb.terms.find(t => t.months === Number(Q.term)) || pb.terms[0];
    const months = term.months;
    const warnings = [];

    // ---- locations (list prices) ----
    const locs = (Q.locations || []).map((loc, i) => {
      const plan = locPlan(pb, loc), addons = locAddons(pb, loc);
      const addonsMonthly = addons.reduce((a, x) => a + x.monthly, 0);
      return { id: loc.id, idx: i, name: loc.name || `Location ${i + 1}`, loc, plan, addons, addonsMonthly,
        listMonthly: r2(plan.price + addonsMonthly), coverage: COVERAGE[loc.coverage] || COVERAGE.all_day,
        estMin: estMinutes(loc), estCalls: estCalls(loc) };
    });
    const items = (Q.items || []).map(it => ({ ...it, oneTime: n0(it.oneTime), monthly: n0(it.monthly), hours: n0(it.hours), monthlyCostUsd: n0(it.monthlyCostUsd) }));
    const plansMonthly = r2(locs.reduce((a, l) => a + l.plan.price, 0));
    const addonsMonthly = r2(locs.reduce((a, l) => a + l.addonsMonthly, 0));
    const itemsMonthly = r2(items.reduce((a, x) => a + x.monthly, 0));
    const listMonthly = r2(plansMonthly + addonsMonthly + itemsMonthly);

    // ---- recurring discounts (each its own line) ----
    const D = Q.discounts || {};
    const recurringLines = [];
    const multiPct = Math.max(0, Math.min(100, n0(D.multiPct)));
    if (multiPct && locs.length) recurringLines.push({ kind: "multi", label: `Multi-location discount (${multiPct}% on plans)`, amount: -r2(plansMonthly * multiPct / 100) });
    let running = r2(listMonthly + recurringLines.reduce((a, x) => a + x.amount, 0));
    for (const m of (D.manual || []).filter(m => m.applies === "monthly" && n0(m.value))) {
      const amt = m.type === "pct" ? r2(running * Math.min(100, n0(m.value)) / 100) : r2(n0(m.value));
      recurringLines.push({ kind: "manual", label: `${m.reason || "Discount"}${m.type === "pct" ? ` (${n0(m.value)}%)` : ""}`, amount: -amt });
      running = r2(running - amt);
    }
    const monthlyNet = Math.max(0, running);

    // ---- prepaid term ----
    const termGross = r2(monthlyNet * months);
    let termDiscount = 0, termLabel = null;
    if (term.freeMonths) { termDiscount = r2(monthlyNet * term.freeMonths); termLabel = `${months}-month prepaid term: ${term.freeMonths} months free`; }
    else if (term.pct) { termDiscount = r2(termGross * term.pct / 100); termLabel = `${months}-month prepaid term: save ${term.pct}%`; }
    const termTotal = r2(termGross - termDiscount);

    // ---- free add-ons for N months (credited on the first invoice when prepaid) ----
    const freeAddonLines = [];
    for (const f of D.freeAddons || []) {
      const l = locs.find(x => x.id === f.locationId);
      const a = l && l.addons.find(x => x.key === f.addon || (f.addon === "history" && /^history/.test(x.key)));
      const n = Math.max(0, Math.floor(n0(f.months)));
      if (l && !a) { warnings.push(`Free add-on on ${l.name}: that location doesn't have ${f.addon === "extra_line" ? "an extra line" : "a call history add-on"}, so nothing is credited. Add it to the location first.`); continue; }
      if (!a || !n) continue;
      const covered = months > 1 ? Math.min(n, months) : n;
      freeAddonLines.push({ kind: "free_addon", label: `${a.name} free for ${n} month${n > 1 ? "s" : ""} (${l.name})`, amount: -r2(a.monthly * covered), months: n, perMonth: a.monthly });
    }
    const freeAddonCredit = r2(-freeAddonLines.reduce((a, x) => a + x.amount, 0));

    // ---- one-time ----
    const oneTimeLines = [];
    const setupOn = Q.setup && Q.setup.on;
    if (setupOn) oneTimeLines.push({ kind: "setup", label: locs.length > 1 ? "Multi-location setup and call flows" : "Custom call flow setup", amount: pb.setup.multiOrCustom });
    for (const it of items) if (it.oneTime) oneTimeLines.push({ kind: "item", itemId: it.id, label: it.name || "Custom work", amount: it.oneTime });
    const oneTimeGross = r2(oneTimeLines.reduce((a, x) => a + x.amount, 0));
    const oneTimeDiscounts = [];
    if (setupOn && D.waiveSetup) oneTimeDiscounts.push({ kind: "waive_setup", label: "Setup fee waived", amount: -pb.setup.multiOrCustom });
    const inactiveCredits = [];
    for (const c of D.credits || []) {
      const needs = n0(c.needsTermMonths);
      let amt = 0, base = null;
      if (c.type === "pct_item") { base = items.find(x => x.id === c.itemId); amt = base ? r2(base.oneTime * Math.min(100, n0(c.pct)) / 100) : 0; }
      else amt = r2(n0(c.amount));
      if (!amt) continue;
      const label = c.label || (base ? `${n0(c.pct)}% of ${base.name} credited` : "Credit");
      if (needs && months < needs) { inactiveCredits.push({ label, amount: -amt, needsTermMonths: needs }); continue; }
      oneTimeDiscounts.push({ kind: "credit", label: label + (needs ? ` (${needs}-month term)` : ""), amount: -amt, itemId: c.itemId || null });
    }
    let otRunning = r2(oneTimeGross + oneTimeDiscounts.reduce((a, x) => a + x.amount, 0));
    for (const m of (D.manual || []).filter(m => m.applies === "one_time" && n0(m.value))) {
      const amt = m.type === "pct" ? r2(otRunning * Math.min(100, n0(m.value)) / 100) : r2(n0(m.value));
      oneTimeDiscounts.push({ kind: "manual", label: `${m.reason || "Discount"}${m.type === "pct" ? ` (${n0(m.value)}%)` : ""}`, amount: -amt });
      otRunning = r2(otRunning - amt);
    }
    if (otRunning < 0) warnings.push("One-time discounts are larger than the one-time fees; the extra is ignored.");
    const oneTimeNet = Math.max(0, otRunning);

    // ---- what the client pays ----
    const prepaid = months > 1;
    // Prepaid: the whole term (less free add-on months) is on the first invoice.
    // Monthly: the first month, less one month of each free add-on.
    const month1Credit = r2(freeAddonLines.reduce((a, x) => a + x.perMonth, 0));
    const firstRecurring = prepaid ? r2(termTotal - freeAddonCredit) : r2(monthlyNet - month1Credit);
    const dueAtStart = r2(oneTimeNet + Math.max(0, firstRecurring));
    const effectiveMonthly = r2((termTotal - (prepaid ? freeAddonCredit : 0)) / months);
    const tax = Q.tax && Q.tax.hst ? (pb.hstPct || 13) : 0;
    const withTax = n => r2(n * (1 + tax / 100));
    const firstTermTotal = r2(firstRecurring + oneTimeNet + (prepaid ? 0 : 0));   // = due at start; for monthly, the first month

    // ---- trial ----
    const T = Q.trial || {};
    const trialLoc = locs.find(l => l.id === T.locationId) || locs[0] || null;
    const trial = T.on ? { days: n0(T.days), cap: n0(T.cap), location: trialLoc ? trialLoc.name : null } : null;

    // ---- internal: cost and margin (never on client documents) ----
    const perMinUsd = blendedUsd(cost);
    const ratio = listMonthly > 0 ? effectiveMonthly / listMonthly : 0;   // how much of list price we actually get
    const locMargin = locs.map(l => {
      const minutes = l.estMin, calls = l.estCalls;
      const lines = 1 + n0(l.loc.addons && l.loc.addons.extra_line);
      const costUsd = minutes * perMinUsd + lines * n0(cost.usd.numberMonthly) + calls * n0(cost.smsPerCall) * n0(cost.usd.sms) + calls * n0(cost.emailsPerCall) * n0(cost.usd.email);
      const costCad = costUsd * fx;
      const overMin = Math.max(0, Math.ceil(minutes - l.plan.minutes));
      const overageCad = r2(overMin * pb.overagePerMin);
      const priceCad = r2(l.listMonthly * ratio);
      const revenue = r2(priceCad + overageCad);
      const margin = r2(revenue - costCad);
      // Cheapest standard plan that covers the estimate, if it costs the client less than plan + overage.
      let upgrade = null;
      if (overMin > 0 && !l.plan.custom) {
        const v = l.plan.vertical ? pb.verticals[l.plan.vertical] : null;
        const options = (v ? v.plans : []).concat([pb.multiLocation]).filter(p => p.minutes >= minutes && p.price > l.plan.price);
        const best = options.sort((a, b) => a.price - b.price)[0];
        if (best && best.price < l.plan.price + overageCad) upgrade = { name: best.name, price: best.price, saves: r2(l.plan.price + overageCad - best.price) };
      }
      return { id: l.id, name: l.name, plan: l.plan.name, minutes: r2(minutes), included: l.plan.minutes, calls: Math.round(calls), overMin, overageCad,
        unusedMin: Math.max(0, Math.floor(l.plan.minutes - minutes)), costUsd: r2(costUsd), costCad: r2(costCad), priceCad, revenue, margin,
        marginPct: revenue > 0 ? Math.round(margin / revenue * 1000) / 10 : null, breakEven: r2(costCad), minPrice: r2(costCad / (1 - n0(cost.minMarginPct) / 100)), upgrade };
    });
    const itemMargin = items.filter(x => x.monthly || x.monthlyCostUsd).map(x => {
      const priceCad = r2(x.monthly * ratio), costCad = r2(x.monthlyCostUsd * fx);
      return { id: x.id, name: x.name, priceCad, costUsd: r2(x.monthlyCostUsd), costCad, margin: r2(priceCad - costCad), marginPct: priceCad > 0 ? Math.round((priceCad - costCad) / priceCad * 1000) / 10 : null };
    });
    const totRevenue = r2(locMargin.reduce((a, x) => a + x.revenue, 0) + itemMargin.reduce((a, x) => a + x.priceCad, 0));
    const totCostCad = r2(locMargin.reduce((a, x) => a + x.costCad, 0) + itemMargin.reduce((a, x) => a + x.costCad, 0));
    const totMargin = r2(totRevenue - totCostCad);
    const totMarginPct = totRevenue > 0 ? Math.round(totMargin / totRevenue * 1000) / 10 : null;
    const minPct = n0(cost.minMarginPct);
    if (totMarginPct != null && totMarginPct < minPct) warnings.push(`Monthly margin ${totMarginPct}% is below your ${minPct}% minimum. Lowest monthly price that keeps ${minPct}%: CA$${r2(totCostCad / (1 - minPct / 100)).toFixed(2)} (now CA$${r2(effectiveMonthly).toFixed(2)}).`);
    for (const l of locMargin) if (l.marginPct != null && l.marginPct < minPct) warnings.push(`${l.name}: margin ${l.marginPct}% is below ${minPct}%.`);
    // One-time work: your hours vs what's charged (after credits / waivers).
    const otShare = oneTimeGross > 0 ? oneTimeNet / oneTimeGross : 0;
    const oneTimeWork = [];
    if (setupOn) oneTimeWork.push({ label: "Setup and call flows", hours: n0(cost.setupHours), fee: r2(pb.setup.multiOrCustom * otShare) });
    for (const it of items) if (it.oneTime || it.hours) oneTimeWork.push({ label: it.name || "Custom work", hours: it.hours, fee: r2(it.oneTime * otShare) });
    for (const w of oneTimeWork) { w.costCad = r2(w.hours * n0(cost.hourlyRate)); w.diff = r2(w.fee - w.costCad); }
    const otCost = r2(oneTimeWork.reduce((a, x) => a + x.costCad, 0));
    if (oneTimeNet < otCost) warnings.push(`One-time fees (CA$${oneTimeNet.toFixed(2)}) are below your time on the work (CA$${otCost.toFixed(2)} at CA$${n0(cost.hourlyRate)}/h).`);
    const trialCostCad = trial ? r2(trial.cap * perMinUsd * fx) : 0;
    const termProfit = r2(totMargin * months + oneTimeNet - otCost - trialCostCad);

    // ---- value side ----
    const Vm = (Q.value && Q.value.models) || {};
    const valueLines = [];
    if (Vm.missed && Vm.missed.on) valueLines.push({ kind: "missed", label: "Revenue from calls that would have been missed",
      monthly: r2(n0(Vm.missed.missedCalls) * n0(Vm.missed.bookingRate) / 100 * n0(Vm.missed.avgValue)),
      detail: `${n0(Vm.missed.missedCalls)} missed calls a month x ${n0(Vm.missed.bookingRate)}% booked x ${fm(Vm.missed.avgValue)} average value` });
    if (Vm.replaced && Vm.replaced.on) valueLines.push({ kind: "replaced", label: `Replaces ${Vm.replaced.what || "your current answering service"}`,
      monthly: r2(n0(Vm.replaced.monthlyCost)), detail: `${cap(Vm.replaced.what || "current service")} at ${fm(Vm.replaced.monthlyCost)} a month${n0(Vm.replaced.hours) ? `, ${n0(Vm.replaced.hours)} hours a month` : ""}` });
    if (Vm.time && Vm.time.on) valueLines.push({ kind: "time", label: "Staff time saved on the phone",
      monthly: r2(n0(Vm.time.hours) * n0(Vm.time.hourlyCost)), detail: `${n0(Vm.time.hours)} hours a month x ${fm(Vm.time.hourlyCost)} an hour` });
    const valueMonthly = r2(valueLines.reduce((a, x) => a + x.monthly, 0));
    const annualCost = r2(effectiveMonthly * 12 + oneTimeNet);
    const value = valueLines.length ? {
      lines: valueLines, monthly: valueMonthly, annual: r2(valueMonthly * 12),
      clientMonthly: effectiveMonthly, annualCost,
      roi: annualCost > 0 ? Math.round(valueMonthly * 12 / annualCost * 10) / 10 : null,
      paybackMonths: valueMonthly > 0 ? Math.round(dueAtStart / valueMonthly * 10) / 10 : null,
      netMonthly: r2(valueMonthly - effectiveMonthly)
    } : null;

    return {
      currency: pb.currency, fx, months, term, prepaid, locs, items,
      plansMonthly, addonsMonthly, itemsMonthly, listMonthly, recurringLines, monthlyNet,
      termGross, termDiscount, termLabel, termTotal, freeAddonLines, freeAddonCredit,
      oneTimeLines, oneTimeGross, oneTimeDiscounts, inactiveCredits, oneTimeNet,
      effectiveMonthly, dueAtStart, firstTermTotal, taxPct: tax,
      dueAtStartTax: r2(dueAtStart * tax / 100), dueAtStartWithTax: withTax(dueAtStart),
      monthlyNetWithTax: withTax(monthlyNet), termTotalWithTax: withTax(termTotal),
      trial, warnings,
      internal: { perMinUsd: Math.round(perMinUsd * 10000) / 10000, perMinCad: Math.round(perMinUsd * fx * 10000) / 10000,
        locs: locMargin, items: itemMargin, revenue: totRevenue, costCad: totCostCad, costUsd: r2(totCostCad / fx), margin: totMargin, marginPct: totMarginPct,
        breakEven: totCostCad, minPrice: r2(totCostCad / (1 - minPct / 100)), minPct, belowMin: totMarginPct != null && totMarginPct < minPct,
        oneTimeWork, oneTimeCost: otCost, trialCostCad, termProfit, ratio: Math.round(ratio * 1000) / 1000 },
      value
    };
  }

  /* Never an em or en dash in anything we generate for a client. */
  const noDash = s => String(s == null ? "" : s).replace(/—|–/g, "--");

  const api = { PRICE_BOOK, COST_DEFAULTS, COVERAGE, compute, findPlan, locPlan, blendedUsd, noDash, r2 };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.VCQ = api;
})(typeof window !== "undefined" ? window : globalThis);
