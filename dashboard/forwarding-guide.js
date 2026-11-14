/* The call-forwarding guide: renders dashboard/forwarding-guide.json, the one
 * source of every customer-facing word about forwarding.
 *
 *   VCForwardingGuide.render(el, guide, number, { ua })  the dashboard's guide
 *   VCForwardingGuide.toText(guide, number)              the email's text (both
 *     modes in turn, since an email can't toggle). forwarding-guide.txt is this
 *     with "{number}" left in, for the self-serve repo's email to match.
 *   VCForwardingGuide.deviceOf(ua)                       "iphone" | "android" | null
 *   VCForwardingGuide.codeNumber(raw, format)            the number inside a code
 *
 * The number inside a code is written one way, set once in the JSON
 * (codeNumberFormat: "e164" → +16475550142, "10digit" → 6475550142).
 * TODO(owner): which one; see codeNumberFormatTodo in the JSON.
 *
 * Every string goes in with textContent: nothing from the JSON is parsed as
 * HTML. No network, no storage. Works in a browser (window.VCForwardingGuide)
 * and in Node (module.exports) for the tests.
 */
(function (root) {
  "use strict";
  // +16475550142 → "+1 647 555 0142" for sentences; codes keep the raw number.
  const pretty = n => { const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(String(n || "")); return m ? `+1 ${m[1]} ${m[2]} ${m[3]}` : String(n || ""); };
  const CODE_FORMATS = {
    e164: d => `+1${d}`,
    "10digit": d => d
  };
  function codeNumber(raw, format) {
    const f = CODE_FORMATS[format];
    if (!f) throw new Error(`forwarding guide: unknown codeNumberFormat ${format}`);
    const m = /^\+?1?(\d{10})$/.exec(String(raw || "").replace(/[\s().-]/g, ""));
    return m ? f(m[1]) : String(raw || "");
  }
  const fill = (s, number, extra) => String(s).replace(/\{number\}/g, number).replace(/\{(\w+)\}/g, (m, k) => (extra && k in extra ? extra[k] : m));

  function deviceOf(ua) {
    const s = String(ua || "");
    if (/iPhone|iPod/.test(s)) return "iphone";
    if (/Android/.test(s)) return "android";
    return null;
  }
  // iPhone settings can only forward every call, so an iPhone starts on the code.
  const defaultMode = device => (device === "iphone" ? "code" : "settings");

  // Copy: the code exactly as shown, nothing around it.
  function copyText(doc, text) {
    const nav = doc.defaultView && doc.defaultView.navigator;
    if (nav && nav.clipboard && nav.clipboard.writeText) return nav.clipboard.writeText(text);
    const t = doc.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    doc.body.appendChild(t); t.select();
    try { return doc.execCommand("copy") ? Promise.resolve() : Promise.reject(new Error("copy")); } finally { t.remove(); }
  }

  function render(el, guide, raw, opts) {
    const doc = el.ownerDocument, number = pretty(raw), dial = codeNumber(raw, guide.codeNumberFormat);
    const h = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    const list = (tag, cls, items) => { const l = h(tag, cls); for (const t of items) l.appendChild(h("li", null, fill(t, number))); return l; };
    const device = deviceOf(opts && opts.ua);
    const copyButton = code => {
      const b = h("button", "fg-copy", "Copy"); b.type = "button"; b.dataset.copy = code; b.setAttribute("aria-label", `Copy ${code}`);
      b.addEventListener("click", () => copyText(doc, code).then(() => { b.textContent = "Copied"; }, () => { b.textContent = "Select and copy"; })
        .then(() => setTimeout(() => { b.textContent = "Copy"; }, 2000)));
      return b;
    };
    el.textContent = "";
    el.appendChild(h("p", "fg-intro", fill(guide.intro, number)));

    // The toggle: Phone settings | Dial a code.
    const tabs = h("div", "fg-tabs"); tabs.setAttribute("role", "tablist");
    const panels = {};
    const show = id => {
      for (const b of tabs.children) { const on = b.dataset.mode === id; b.setAttribute("aria-selected", on ? "true" : "false"); b.classList.toggle("on", on); }
      for (const [k, p] of Object.entries(panels)) p.hidden = k !== id;
    };
    for (const m of guide.modes) {
      const b = h("button", "fg-tab", m.label); b.type = "button"; b.dataset.mode = m.id; b.setAttribute("role", "tab");
      b.addEventListener("click", () => show(m.id)); tabs.appendChild(b);
    }
    el.appendChild(tabs);

    // Phone settings, per device.
    const sp = h("div", "fg-panel"); sp.dataset.panel = "settings"; panels.settings = sp;
    const dtabs = h("div", "fg-devices"), dpanels = {};
    const showDevice = id => {
      for (const b of dtabs.children) { const on = b.dataset.device === id; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("on", on); }
      for (const [k, p] of Object.entries(dpanels)) p.hidden = k !== id;
    };
    for (const d of guide.settings.devices) {
      const b = h("button", "fg-device", d.label); b.type = "button"; b.dataset.device = d.id;
      b.addEventListener("click", () => showDevice(d.id)); dtabs.appendChild(b);
      const p = h("div", "fg-device-panel"); p.dataset.device = d.id;
      p.appendChild(list("ol", "fg-steps", d.steps));
      if (d.note) p.appendChild(h("p", "fg-note", fill(d.note, number)));
      if (d.switchTo) { const s = h("button", "btn-ghost fg-switch", d.switchLabel || "Dial a code"); s.type = "button"; s.addEventListener("click", () => show(d.switchTo)); p.appendChild(s); }
      dpanels[d.id] = p; sp.appendChild(p);
    }
    sp.insertBefore(dtabs, sp.firstChild);
    el.appendChild(sp);

    // Dial a code.
    const cp = h("div", "fg-panel"); cp.dataset.panel = "code"; panels.code = cp;
    cp.appendChild(list("ol", "fg-steps", guide.codes.how));
    for (const o of guide.codes.options) {
      const box = h("div", "fg-code" + (o.recommended ? " rec" : "")); box.dataset.code = o.id;
      box.appendChild(h("p", "fg-code-label", o.label));
      box.appendChild(h("p", "fg-note", fill(o.detail, number)));
      const dl = h("dl", "fg-codes");
      for (const [label, code] of [["Turn on:", fill(o.on, dial)], ["Turn off:", fill(o.off, dial)]]) {
        dl.appendChild(h("dt", null, label));
        const dd = h("dd"); dd.appendChild(h("code", null, code)); dd.appendChild(copyButton(code)); dl.appendChild(dd);
      }
      box.appendChild(dl); cp.appendChild(box);
    }
    cp.appendChild(h("p", "fg-check", fill(guide.codes.check.text, number)));
    el.appendChild(cp);

    // Both modes: the voicemail sentence, the test, then the Q&A.
    el.appendChild(h("p", "fg-section fg-voicemail", fill(guide.voicemail.text, number)));

    const ts = h("div", "fg-section fg-test");
    ts.appendChild(h("p", "fg-h", guide.test.heading));
    ts.appendChild(list("ol", "fg-steps", guide.test.steps));
    ts.appendChild(h("p", "fg-note", fill(guide.test.unverified, number)));
    el.appendChild(ts);

    const faq = h("div", "fg-section fg-faq");
    for (const f of guide.faq) {
      const d = h("details", "fg-q"); d.appendChild(h("summary", null, f.q));
      for (const a of f.a) d.appendChild(h("p", null, fill(a, number)));
      faq.appendChild(d);
    }
    el.appendChild(faq);

    // "Stuck?": the address in the text becomes a mailto link.
    const st = h("p", "fg-stuck"), parts = fill(guide.stuck, number).split(/([\w.+-]+@[\w-]+\.[\w.]+)/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2) { const a = h("a", null, parts[i]); a.href = `mailto:${parts[i]}?subject=${encodeURIComponent("Help setting up call forwarding")}`; st.appendChild(a); }
      else if (parts[i]) st.appendChild(doc.createTextNode(parts[i]));
    }
    el.appendChild(st);

    show(defaultMode(device));
    showDevice(device || guide.settings.devices[0].id);
    return { mode: defaultMode(device), device: device || guide.settings.devices[0].id };
  }

  // The email's text: both modes, in turn.
  function toText(guide, raw) {
    const tpl = raw === "{number}", number = tpl ? raw : pretty(raw), dial = tpl ? "{code_number}" : codeNumber(raw, guide.codeNumberFormat);
    const out = [], f = s => fill(s, number);
    const numbered = items => items.map((s, i) => `${i + 1}. ${f(s)}`);
    out.push(f(guide.intro), "");
    out.push(`OPTION 1: ${guide.modes.find(m => m.id === "settings").label.toUpperCase()}`);
    for (const d of guide.settings.devices) { out.push("", d.label, ...numbered(d.steps)); if (d.note) out.push(f(d.note)); }
    out.push("", `OPTION 2: ${guide.modes.find(m => m.id === "code").label.toUpperCase()}`, ...numbered(guide.codes.how));
    for (const o of guide.codes.options) out.push("", o.label, f(o.detail), `Turn on:  ${fill(o.on, dial)}`, `Turn off: ${fill(o.off, dial)}`);
    out.push("", f(guide.codes.check.text));
    out.push("", f(guide.voicemail.text));
    out.push("", guide.test.heading.toUpperCase(), ...numbered(guide.test.steps), f(guide.test.unverified));
    out.push("", "QUESTIONS");
    for (const q of guide.faq) out.push("", q.q, ...q.a.map(f));
    out.push("", f(guide.stuck));
    return out.join("\n") + "\n";
  }

  const api = { render, toText, deviceOf, defaultMode, pretty, codeNumber };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.VCForwardingGuide = api;
})(typeof window !== "undefined" ? window : globalThis);
