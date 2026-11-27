/* Dashboard V2: the side-tab layout. Its own code path.
 *
 * WHO GETS IT. Only a customer whose /api/dashboard answer says layout: "v2"
 * (TorontoLeads: DASHBOARD_V2=on and the id in DASHBOARD_V2_CUSTOMERS). For
 * everyone else this file sets one observer and does nothing else: no class,
 * no style, no DOM change, the query string left alone.
 *
 * HOW IT STAYS OFF THE OLD CODE PATH. Nothing in index.html calls this file and
 * load() is unchanged. load() shows #app and stores the answer in `last` in one
 * synchronous run; a MutationObserver on #app's `hidden` fires right after that
 * run, before the browser paints, so the V2 customer never sees the legacy
 * layout. Then the EXISTING nodes are moved into tab panels: same ids, same
 * event handlers, same render functions, the same data. Layout only.
 *
 * DEEP LINKS. /dashboard/?calendar=connected|failed&reason=... (the Google
 * OAuth callback, TorontoLeads server.js) opens Settings, shows the message
 * (the reason is set with textContent) and removes the query so a refresh
 * doesn't show it again. Tabs are #overview #calls #settings #billing, and
 * #settings/calendar scrolls to the Calendar card; Back works.
 */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var CAL = q.get("calendar"), CAL_REASON = q.get("reason");   // read now, before anything changes the URL
  var TABS = ["overview", "calls", "settings", "billing"];
  var LABEL = { overview: "Overview", calls: "Calls", settings: "Settings", billing: "Billing" };
  var ICON = {
    overview: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    calls: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    billing: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    collapse: '<path d="M15 6l-6 6 6 6"/>',
    sms: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    transfer: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/><path d="M15 3h6v6M21 3l-6 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    sparkle: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M8 14h3M8 17.5h6"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[k] + "</svg>"; };
  var $ = function (id) { return document.getElementById(id); };
  var data = function () { try { return last; } catch (e) { return null; } };   // index.html's `let last`
  var built = false;

  var app = $("app");
  if (!app) return;
  new MutationObserver(function () {
    if (built || app.hidden) return;
    var d = data();
    if (d && d.layout === "v2") build();
  }).observe(app, { attributes: true, attributeFilter: ["hidden"] });

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function move(parent, ids) { ids.forEach(function (n) { if (n) parent.appendChild(n); }); }
  function byId(ids) { return ids.map($); }
  function section(name) { return app.querySelector('[data-section="' + name + '"]'); }

  function build() {
    built = true;
    var root = document.documentElement;
    root.classList.add("dv2");
    var style = el("style", { id: "dv2Style" }); style.textContent = CSS; document.head.appendChild(style);
    // The marketing site's type: Manrope throughout, Instrument Serif italic for one accent.
    document.head.appendChild(el("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap" }));
    try { if (localStorage.getItem("vc_dv2_collapsed") === "1") root.classList.add("dv2-collapsed"); } catch (e) {}

    var wrap = app.parentNode, topbar = wrap.querySelector(".topbar"), brand = topbar && topbar.querySelector(".brandbar");
    var header = app.querySelector("header");

    /* ---- the sidebar (a bottom tab bar on phones) ---- */
    var side = el("aside", { id: "dv2Side", "aria-label": "Dashboard" });
    var sideTop = el("div", { class: "dv2-side-top" });
    if (brand) sideTop.appendChild(brand);
    var collapse = el("button", { type: "button", class: "dv2-collapse", id: "dv2Collapse", "aria-label": "Collapse menu", title: "Collapse menu" }, svg("collapse"));
    sideTop.appendChild(collapse);
    side.appendChild(sideTop);
    var biz = el("div", { class: "dv2-biz", id: "dv2Biz" });
    biz.appendChild(el("div", { class: "dv2-biz-name", id: "dv2BizName" }));
    if ($("bizSelect")) biz.appendChild($("bizSelect"));   // kept, hidden: the switcher below drives it
    side.appendChild(biz);
    var nav = el("nav", { class: "dv2-nav", id: "dv2Nav" });
    TABS.forEach(function (t) {
      nav.appendChild(el("a", { href: "#" + t, "data-tab": t, title: LABEL[t] }, svg(t) + "<span>" + LABEL[t] + "</span>"));
    });
    side.appendChild(nav);
    var usageSlot = el("div", { class: "dv2-usage", id: "dv2UsageSlot" });
    side.appendChild(usageSlot);

    /* ---- the main column: account bar, the page header, then one panel per tab ---- */
    var main = el("div", { id: "dv2Main" });
    wrap.insertBefore(side, wrap.firstChild);
    wrap.insertBefore(main, side.nextSibling);
    move(main, [topbar, $("gate"), app]);

    var notice = el("div", { class: "dv2-notice", id: "dv2Notice", role: "status", "aria-live": "polite", hidden: "" });
    var panels = {};
    header.after(notice);
    notice.after($("pausedCard"));
    TABS.forEach(function (t) {
      panels[t] = el("section", { class: "dv2-panel", id: "dv2-" + t, "data-tab": t, "aria-label": LABEL[t], hidden: "" });
    });
    var footer = app.querySelector("footer");
    TABS.forEach(function (t) { app.insertBefore(panels[t], footer); });

    // Overview: the assistant's number first, then the numbers and charts, in today's order.
    panels.overview.appendChild(el("div", { class: "card dv2-assist", id: "dv2Assist", hidden: "" },
      '<span class="dv2-assist-ico">' + svg("calls") + '</span><div class="dv2-assist-txt"><div class="dv2-assist-k">Your assistant\'s number</div>' +
      '<div class="dv2-assist-v" id="dv2AssistNum"></div></div><button type="button" class="btn-ghost" id="dv2AssistCopy">Copy</button>'));
    move(panels.overview, [$("hero"), $("kpis"), section("daily")]);
    move(panels.overview, Array.prototype.slice.call(app.querySelectorAll(".row2")));
    move(panels.overview, [section("callers")]);
    // Calls: the log with the call-back list beside it, as today.
    move(panels.calls, byId(["retentionNote", "logRow"]));
    // Settings: Calendar first, then the plan's controls, the number, Customize, requests, password.
    var cal = el("div", { class: "card dv2-cal", id: "dv2Cal", hidden: "" },
      '<div class="dv2-cal-head"><span class="dv2-cal-ico"><img src="/dashboard/img/google-calendar.png" alt="" width="26" height="27"></span>' +
      '<p class="panel-title">Google Calendar</p><span class="dv2-soon" id="dv2CalSoon" hidden>Coming soon</span></div>' +
      '<div id="dv2CalBody"></div>');
    panels.settings.appendChild(cal);
    panels.settings.appendChild(el("div", { class: "card dv2-acct", id: "dv2Acct" },
      '<p class="panel-title">Your account</p><dl class="dv2-acct-list" id="dv2AcctList"></dl>'));
    move(panels.settings, byId(["v2Card", "v2Modal"]));
    panels.settings.appendChild(el("div", { class: "card dv2-addons", id: "dv2Addons", hidden: "" },
      '<p class="panel-title">Add-ons</p><div class="dv2-addon-list" id="dv2AddonList"></div>'));
    move(panels.settings, byId(["rnCard", "settings", "crCard", "pwPanel"]));
    // Customize: a heading, like every other card on the tab.
    var set = $("settings");
    if (set && !set.querySelector(".dv2-set-h")) set.insertBefore(el("div", { class: "dv2-set-h" },
      '<p class="panel-title">Customize</p><p class="panel-sub">Your hours, what your dashboard shows, and your own call statuses.</p>'), set.firstChild);
    // Billing: "Manage my plan" opens the same Stripe billing portal as the account menu's
    // Manage billing (the page's own button), shown only when that one is.
    var mb = $("billing");
    if (mb) {
      var bar = el("div", { class: "dv2-bill-bar", id: "dv2BillBar", hidden: "" });
      var mbtn = el("button", { type: "button", class: "btn dv2-manage", id: "dv2Manage" }, "Manage my plan");
      mbtn.addEventListener("click", function () { mb.click(); });
      bar.appendChild(el("div", { class: "dv2-bill-bar-t" }, '<p class="panel-title">Billing</p><p class="panel-sub">Card, invoices and cancellation are in your secure Stripe billing page.</p>'));
      bar.appendChild(mbtn);
      panels.billing.insertBefore(bar, panels.billing.firstChild);
      var syncBar = function () { bar.hidden = mb.hidden; mbtn.disabled = mb.disabled; mbtn.textContent = mb.disabled ? mb.textContent.replace("Opening billing", "Opening") : "Manage my plan"; };
      syncBar();
      new MutationObserver(syncBar).observe(mb, { attributes: true, attributeFilter: ["hidden", "disabled"], childList: true, characterData: true, subtree: true });
    }
    // Request a change: the same words, the last two set in the site's serif italic.
    var crT = $("crCard") && $("crCard").querySelector(".panel-title");
    if (crT && crT.textContent.trim() === "Request a change") { crT.textContent = "Request "; var cem = el("em"); cem.textContent = "a change"; crT.appendChild(cem); }
    // Billing: the minutes meter (when it isn't in the sidebar) and the billing card.
    move(panels.billing, byId(["v2Bill", "v2PlanModal"]));

    /* ---- the minutes meter: bottom of the sidebar on wide screens, top of Billing otherwise ---- */
    var wide = matchMedia("(min-width: 1100px)");
    var placeUsage = function () {
      var u = $("usageCard"); if (!u) return;
      if (wide.matches) usageSlot.appendChild(u); else panels.billing.insertBefore(u, panels.billing.firstChild);
    };
    placeUsage();
    if (wide.addEventListener) wide.addEventListener("change", placeUsage); else wide.addListener(placeUsage);

    /* ---- business switcher (more than one business, or an admin) ---- */
    switcher(main.querySelector(".topbar"));

    /* ---- business name in the sidebar mirrors the header's ---- */
    var name = function () { $("dv2BizName").textContent = $("biz").textContent; account(); };
    name();
    new MutationObserver(function () {
      name();
      var d = data();
      // An admin switched to a business that isn't on V2: give them the page that business gets.
      if (d && d.layout !== "v2") location.reload();
    }).observe($("biz"), { childList: true, characterData: true, subtree: true });

    /* ---- Calendar card, account card, plan card (whenever renderV2 redraws) ---- */
    new MutationObserver(calendar).observe($("v2Body"), { childList: true });
    calendar();
    /* ---- Billing: plan boxes (whenever the billing card redraws) ---- */
    new MutationObserver(billing).observe($("v2BillBody"), { childList: true });
    billing();
    /* ---- the assistant's number on Overview mirrors the receptionist-number card ---- */
    var assist = function () {
      var n = $("rnNum") ? $("rnNum").textContent.trim() : "";
      $("dv2AssistNum").textContent = n;
      $("dv2Assist").hidden = !n || $("rnCard").hidden;
    };
    assist();
    new MutationObserver(assist).observe($("rnNum"), { childList: true, characterData: true, subtree: true });
    new MutationObserver(assist).observe($("rnCard"), { attributes: true, attributeFilter: ["hidden"] });
    $("dv2AssistCopy").addEventListener("click", function () {
      var b = $("rnCopy"); if (b) b.click();   // the page's own Copy (same number, same feedback)
      var me = $("dv2AssistCopy"); me.textContent = "Copied"; setTimeout(function () { me.textContent = "Copy"; }, 1500);
    });

    /* ---- buttons that open something now on another tab ---- */
    var gear = $("gear");
    if (gear) gear.addEventListener("click", function () { if (!$("settings").hidden) go("settings", $("settings")); });
    var toPw = $("toPw");
    if (toPw) toPw.addEventListener("click", function () { go("settings", $("pwPanel")); });
    collapse.addEventListener("click", function () {
      var on = root.classList.toggle("dv2-collapsed");
      try { localStorage.setItem("vc_dv2_collapsed", on ? "1" : "0"); } catch (e) {}
    });

    /* ---- the Google OAuth redirect ---- */
    if (CAL === "connected" || CAL === "failed") {
      notice.textContent = CAL === "connected" ? "Google Calendar connected." : (CAL_REASON || "Google Calendar didn't connect.");
      notice.className = "dv2-notice " + (CAL === "connected" ? "good" : "bad");
      notice.hidden = false;
      q.delete("calendar"); q.delete("reason");
      var rest = q.toString();
      history.replaceState(history.state, "", location.pathname + (rest ? "?" + rest : "") + "#settings/calendar");
    }

    addEventListener("hashchange", function () { show(fromHash()); });
    show(fromHash());
  }

  /* The business switcher. The page's own <select id="bizSelect"> stays the source of truth
   * (renderBusinesses fills it, its change handler switches business); this draws it as a
   * button + list and sets the select's value, then fires its change. Shown only when the
   * select is. Sidebar on wide screens, top bar otherwise (the sidebar is a rail or a tab
   * bar there). */
  function switcher(topbar) {
    var sel = $("bizSelect"); if (!sel) return;
    var wrap = el("div", { class: "dv2-sw", id: "dv2Sw", hidden: "" });
    var btn = el("button", { type: "button", class: "dv2-sw-btn", id: "dv2SwBtn", "aria-haspopup": "listbox", "aria-expanded": "false" });
    var pop = el("div", { class: "dv2-sw-pop", id: "dv2SwPop", hidden: "" });
    var search = el("input", { type: "search", class: "dv2-sw-search", id: "dv2SwSearch", placeholder: "Search businesses", "aria-label": "Search businesses", autocomplete: "off" });
    var list = el("ul", { class: "dv2-sw-list", id: "dv2SwList", role: "listbox", "aria-label": "Choose business" });
    pop.appendChild(search); pop.appendChild(list);
    wrap.appendChild(btn); wrap.appendChild(pop);
    var initials = function (n) { var w = String(n || "?").trim().split(/\s+/); return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase(); };
    var hue = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; };
    var av = function (n) { var a = el("span", { class: "dv2-av", "aria-hidden": "true" }); a.textContent = initials(n); a.style.setProperty("--h", hue(n)); return a; };
    var active = -1;
    var items = function () { return Array.prototype.slice.call(list.querySelectorAll("li:not([hidden])")); };
    var mark = function (i) {
      var it = items(); if (!it.length) return;
      active = (i + it.length) % it.length;
      it.forEach(function (x, j) { x.classList.toggle("act", j === active); });
      it[active].scrollIntoView({ block: "nearest" });
    };
    var close = function (focus) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); if (focus) btn.focus(); };
    var open = function () {
      pop.hidden = false; btn.setAttribute("aria-expanded", "true");
      search.value = ""; filter();
      var it = items(), cur = it.findIndex(function (x) { return x.getAttribute("aria-selected") === "true"; });
      mark(cur < 0 ? 0 : cur);
      if (!search.hidden) search.focus(); else list.focus();
    };
    var pick = function (id) {
      close(true);
      if (!id || id === sel.value) return;
      sel.value = id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));   // the page's own switch
    };
    var filter = function () {
      var q = search.value.trim().toLowerCase();
      Array.prototype.forEach.call(list.children, function (li) { li.hidden = !!q && li.dataset.name.toLowerCase().indexOf(q) < 0; });
      mark(0);
    };
    var draw = function () {
      var opts = Array.prototype.slice.call(sel.options);
      wrap.hidden = sel.hidden || opts.length < 1;
      var cur = sel.options[sel.selectedIndex] || opts[0];
      btn.innerHTML = "";
      if (cur) {
        btn.appendChild(av(cur.text));
        var t = el("span", { class: "dv2-sw-txt" }), n = el("span", { class: "dv2-sw-name" }), c = el("span", { class: "dv2-sw-sub" });
        n.textContent = cur.text; c.textContent = opts.length + (opts.length === 1 ? " business" : " businesses");
        t.appendChild(n); t.appendChild(c); btn.appendChild(t);
        btn.appendChild(el("span", { class: "dv2-sw-chev", "aria-hidden": "true" }, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10l4 4 4-4"/></svg>'));
      }
      list.innerHTML = "";
      opts.forEach(function (o) {
        var li = el("li", { role: "option", "data-id": o.value, "data-name": o.text, "aria-selected": o.selected ? "true" : "false" });
        li.appendChild(av(o.text));
        var nm = el("span", { class: "dv2-sw-iname" }); nm.textContent = o.text; li.appendChild(nm);
        if (o.selected) li.appendChild(el("span", { class: "dv2-sw-check", "aria-hidden": "true" }, "✓"));
        li.addEventListener("click", function () { pick(o.value); });
        li.addEventListener("mousemove", function () { var it = items(), j = it.indexOf(li); if (j !== active) mark(j); });
        list.appendChild(li);
      });
      search.hidden = opts.length < 7;
      $("dv2Biz").classList.toggle("dv2-has-sw", !wrap.hidden);
    };
    btn.addEventListener("click", function () { pop.hidden ? open() : close(false); });
    search.addEventListener("input", filter);
    list.tabIndex = -1;
    pop.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); mark(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); mark(active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); var it = items(); if (it[active]) pick(it[active].dataset.id); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") close(false);
    });
    btn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" && pop.hidden) { e.preventDefault(); open(); } });
    document.addEventListener("click", function (e) { if (!pop.hidden && !wrap.contains(e.target)) close(false); });
    new MutationObserver(draw).observe(sel, { childList: true, attributes: true, attributeFilter: ["hidden"], subtree: true });
    draw();
    var wide = matchMedia("(min-width: 1100px)");
    var place = function () {
      if (wide.matches) $("dv2Biz").insertBefore(wrap, $("dv2Biz").firstChild);
      else if (topbar) topbar.insertBefore(wrap, topbar.firstChild);
      wrap.classList.toggle("in-top", !wide.matches);
    };
    place();
    if (wide.addEventListener) wide.addEventListener("change", place); else wide.addListener(place);
  }

  function fromHash() {
    var h = location.hash.replace(/^#/, "").split("/");
    return { tab: TABS.indexOf(h[0]) >= 0 ? h[0] : "overview", sub: h[1] || "" };
  }
  function go(tab, target) {
    if (fromHash().tab !== tab) location.hash = tab;   // a history entry: Back returns to the last tab
    if (target) requestAnimationFrame(function () { target.scrollIntoView({ block: "start", behavior: "smooth" }); });
  }
  function show(r) {
    var root = document.documentElement;
    TABS.forEach(function (t) { $("dv2-" + t).hidden = t !== r.tab; });
    root.setAttribute("data-dv2-tab", r.tab);
    var links = document.querySelectorAll("#dv2Nav a");
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute("data-tab") === r.tab;
      links[i].classList.toggle("on", on);
      if (on) links[i].setAttribute("aria-current", "page"); else links[i].removeAttribute("aria-current");
    }
    if (r.tab !== "settings") $("dv2Notice").hidden = true;   // the OAuth message is shown once, on Settings
    // Charts measure their width when drawn; drawn while hidden they come out 700px wide.
    // Re-run the page's own render, exactly what its resize handler does.
    if (r.tab === "overview") { var d = data(); if (d && typeof renderAll === "function") renderAll(d); }
    if (r.tab === "settings" && r.sub === "calendar") requestAnimationFrame(function () { $("dv2Cal").scrollIntoView({ block: "start" }); });
    else window.scrollTo(0, 0);
  }

  /* The Calendar card. Its controls are the ones renderV2() draws (same ids, same
   * handlers); this only moves that section into the card. When the catalog says the
   * Google calendar is rolling out or coming soon for this plan, the card says
   * Coming soon with the button off. Not on the plan at all: no card ("Not on your
   * plan" in the plan card already says so). */
  /* Enterprise: the plan's own label from /api/dashboard/v2/settings (`v2.plan`), shown as a
   * badge under the business name, and a more premium look (html.dv2-ent). Styling only. */
  function tier() {
    var p = null;
    try { p = v2 && v2.plan; } catch (e) {}
    var ent = !!(p && p.key === "enterprise");
    document.documentElement.classList.toggle("dv2-ent", ent);
    // Every plan gets its tag, in its own colour: Personal teal, Lite blue, Pro violet, Enterprise gold.
    var b = $("dv2Tier");
    if (p && p.label && !b) { b = el("div", { class: "dv2-tier", id: "dv2Tier" }); $("dv2Biz").appendChild(b); }
    if (b) {
      b.textContent = p && p.label ? p.label : "";
      b.hidden = !(p && p.label);
      b.setAttribute("data-plan", p && p.key ? String(p.key).replace(/[^a-z_]/g, "") : "");
    }
  }
  var SALES = "sales@voicecaptures.com";
  var mailto = function (subject) { return "mailto:" + SALES + "?subject=" + encodeURIComponent(subject); };

  /* Settings: the account card. Every value is one the page already has: /api/dashboard
   * (business, sign-in email, assistant's number, time zone, history, and account.ownerPhone
   * for V2), the hours line the page draws, and the plan from /api/dashboard/v2/settings.
   * A row with no value is left out. */
  function account() {
    var d = data(), list = $("dv2AcctList"); if (!d || !list) return;
    var p = null; try { p = v2 && v2.plan; } catch (e) {}
    var ph = function (v) { try { return v ? fmtPhone(v) : ""; } catch (e) { return v || ""; } };
    var hours = ($("hoursSub") && $("hoursSub").textContent || "").replace(/^Your hours:\s*/, "");
    var rows = [
      ["Business", d.businessName],
      ["Owner's phone", d.account && ph(d.account.ownerPhone)],
      ["Owner's email", d.account && d.account.ownerEmail],
      ["Signed in as", d.signedInAs],
      ["Assistant's number", $("rnNum") && $("rnNum").textContent.trim()],
      ["Plan", p && p.label],
      ["Open hours", hours],
      ["Time zone", d.settings && d.settings.timezone],
      ["Call history", d.retention && d.retention.days ? d.retention.days + " days" : ""]
    ].filter(function (r) { return r[1]; });
    if (d.account && d.account.ownerEmail && d.account.ownerEmail === d.signedInAs) rows = rows.filter(function (r) { return r[0] !== "Signed in as"; });
    list.innerHTML = "";
    rows.forEach(function (r) { var dt = el("dt"), dd = el("dd", { "data-k": r[0] }); dt.textContent = r[0]; dd.textContent = r[1]; list.appendChild(dt); list.appendChild(dd); });
  }

  /* Settings: the plan card, prettier: "On your plan" as ticked tiles; "Not on your plan" is
   * replaced by the Add-ons card. */
  /* The plan card's control sections as feature cards: an icon, the title, an On/Off pill
   * when the section has one switch, and toggles drawn as switches. Same controls, same ids,
   * same handlers (renderV2 draws them; this only decorates). */
  var FEAT = { "Texts to callers": "sms", "Live transfer": "transfer", "Who gets call summaries by email": "mail", "More": "sliders", "Rolling out next": "sparkle" };
  function feature(sec, h, icon) {
    if (sec.dataset.dv2Feat) return;
    sec.dataset.dv2Feat = "1";
    sec.classList.add("dv2-feat");
    var ic = el("span", { class: "dv2-feat-ico", "aria-hidden": "true" }, svg(icon));
    sec.insertBefore(ic, sec.firstChild);
    var pill = el("span", { class: "dv2-state", hidden: "" });
    h.appendChild(pill);
    /* Owner-only live transfer: a switch, like Texts to callers, instead of a Switch on / off
     * button. The switch presses the page's own button (its consent dialog, its save, its
     * redraw); until the redraw it shows the line's real state. */
    var trBtn = sec.querySelector("#v2TrOwn, #v2TrOff");
    if (trBtn && !sec.querySelector("#v2TrSave")) {
      var desc = sec.querySelector(".v2-row:not(.muted)");
      var lab = el("label", { class: "v2-row chk-inline dv2-tr-switch" });
      var cb = el("input", { type: "checkbox", id: "dv2TrSwitch", "aria-label": "Live transfer" });
      cb.checked = trBtn.id === "v2TrOff";
      lab.appendChild(cb);
      var txt = el("span");
      lab.appendChild(txt);
      if (desc && desc !== trBtn.closest(".v2-row")) { while (desc.firstChild) txt.appendChild(desc.firstChild); desc.before(lab); desc.remove(); }
      else trBtn.closest(".v2-row").before(lab);
      trBtn.closest(".v2-row").classList.add("dv2-hide");
      cb.addEventListener("change", function () { var want = cb.checked; cb.checked = !want; trBtn.click(); });
    }
    var state = function () {
      var on = null;
      var cb = sec.querySelector("#v2Sms");
      if (cb) on = cb.checked;
      if (sec.querySelector("#v2TrOff")) on = true; else if (sec.querySelector("#v2TrOwn, #v2TrSave")) on = false;
      pill.hidden = on === null;
      pill.textContent = on ? "On" : "Off";
      pill.classList.toggle("on", !!on);
    };
    state();
    sec.addEventListener("change", state);
    // A raw +1XXXXXXXXXX in the text reads as a phone number.
    var bs = sec.querySelectorAll(".v2-row b");
    for (var i = 0; i < bs.length; i++) if (/^\+1\d{10}$/.test(bs[i].textContent.trim())) { try { bs[i].textContent = fmtPhone(bs[i].textContent.trim()); } catch (e) {} }
  }

  // A plan with no minutes to state (Enterprise before its contract minutes are set) reads
  // "null minutes a month": leave that part out.
  var NO_MIN = /^(null|undefined|contract|NaN) minutes a month( · )?/;
  function planCard() {
    var sub = $("v2Sub");
    if (sub && NO_MIN.test(sub.textContent)) sub.textContent = sub.textContent.replace(NO_MIN, "");
    var secs = $("v2Body").querySelectorAll(".v2-sec");
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector(".v2-h"), t = h ? h.textContent.trim() : "";
      if (t === "On your plan") secs[i].classList.add("dv2-onplan");
      if (FEAT[t]) feature(secs[i], h, FEAT[t]);
      // "Not on your plan" goes: the Add-ons card below says what can be added, and how.
      if (t === "Not on your plan") secs[i].remove();
    }
  }

  /* Settings: Add-ons. Names and prices are the server's (/api/dashboard/v2/plans `addons`,
   * from the catalog), never typed here. Each one not on the plan: "Auto-activation rolling
   * out" and an Email us to sales. Included or active ones say so. The integration add-on is
   * Enterprise-only and quoted, so it carries no price. */
  function addons() {
    var card = $("dv2Addons"), list = $("dv2AddonList"); if (!card) return;
    var p = null; try { p = v2p; } catch (e) {}
    var a = p && p.addons ? p.addons : null;
    if (!a || !Object.keys(a).length) { card.hidden = true; return; }
    var money = function (v) { try { return v2Money(v); } catch (e) { return "$" + v; } };
    list.innerHTML = "";
    var row = function (label, price, state) {
      var r = el("div", { class: "dv2-addon" }), l = el("div", { class: "dv2-addon-l" }), n = el("div", { class: "dv2-addon-n" });
      n.textContent = label; l.appendChild(n);
      var tag = el("span", { class: "dv2-addon-tag" + (state ? " on" : "") }); tag.textContent = state || "Auto-activation rolling out"; l.appendChild(tag);
      r.appendChild(l);
      var right = el("div", { class: "dv2-addon-r" });
      if (price) { var pr = el("span", { class: "dv2-addon-p" }); pr.textContent = price; right.appendChild(pr); }
      if (!state) { var e = el("a", { class: "dv2-email-btn sm", href: mailto("Add " + label) }); e.textContent = "Email us"; right.appendChild(e); }
      r.appendChild(right); list.appendChild(r);
    };
    Object.keys(a).forEach(function (k) {
      var x = a[k]; if (!x || !x.label) return;
      var state = x.status === "included" ? "Included in your plan" : x.active ? "Active" : "";
      row(x.label, x.price_cad != null && x.status !== "quoted" ? money(x.price_cad) + "/mo" : "Quoted on a call", state);
    });
    row("Practice-software, field-service, POS or CRM integration", "Quoted on a call", "");
    card.hidden = false;
  }

  /* Billing: the plan boxes. Each plan that isn't yours gets one Email us button to sales,
   * except a plan the page can switch to by itself (its own Switch button stays: e.g. a
   * Personal line moving up to Business Lite). An Enterprise box in black is added when the
   * customer isn't already on it. Add-ons that need an upgrade say Email us too. */
  function billing() {
    addons();
    var body = $("v2BillBody"); if (!body) return;
    var grid = body.querySelector("#v2Plans .v2-plans");
    if (grid && !grid.dataset.dv2) {
      grid.dataset.dv2 = "1";
      var boxes = grid.querySelectorAll(".v2-plan"), hasEnt = false;
      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i], name = box.querySelector("b") ? box.querySelector("b").textContent.trim() : "";
        var mins = box.children[2];
        if (mins && NO_MIN.test(mins.textContent.trim())) mins.textContent = "";
        if (name === "Enterprise") { hasEnt = true; box.classList.add("dv2-ent-plan"); }
        if (box.classList.contains("cur") || box.querySelector("[data-plan]")) continue;
        var kids = Array.prototype.slice.call(box.children);
        for (var j = 3; j < kids.length; j++) kids[j].remove();   // keep name, price, minutes
        var a = el("a", { class: "btn dv2-email-btn", href: mailto("Move to " + name) }); a.textContent = "Email us";
        box.appendChild(a);
      }
      if (!hasEnt) {
        var ent = el("div", { class: "v2-plan dv2-ent-plan" }, "<b>Enterprise</b><div>Custom pricing</div><div class=\"muted\">Minutes sized to your call volume</div>");
        var ea = el("a", { class: "btn dv2-email-btn", href: mailto("Enterprise") }); ea.textContent = "Email us";
        ent.appendChild(ea); grid.appendChild(ent);
      }
    }
    /* "Start my plan now" sits beside the Free trial line it ends (same button, same note,
     * same message line, moved). Monthly / Annual reads as a two-way switch. */
    var start = body.querySelector(".v2-start-row"), trialSec = null;
    var hs = body.querySelectorAll(".v2-sec > .v2-h");
    for (var hi = 0; hi < hs.length; hi++) if (hs[hi].textContent.trim() === "Free trial") trialSec = hs[hi].parentNode;
    if (start && trialSec && start.parentNode !== trialSec) {
      var sm = $("v2StartMsg");
      trialSec.classList.add("dv2-trial");
      trialSec.appendChild(start);
      if (sm) trialSec.appendChild(sm);
    }
    var iv = body.querySelector('#v2Plans [role="radiogroup"]');
    if (iv) iv.classList.add("dv2-seg");
    var secs = body.querySelectorAll(".v2-sec");
    for (var s2 = 0; s2 < secs.length; s2++) {
      var h = secs[s2].querySelector(".v2-h"); if (!h) continue;
      var t = h.textContent.trim();
      if (t === "Add-ons") {
        var bs = secs[s2].querySelectorAll(".v2-badge");
        for (var q = 0; q < bs.length; q++) if (bs[q].textContent.trim() === "Upgrade") {
          var lbl = bs[q].parentNode.textContent.split("·")[0].trim();
          var al = el("a", { class: "dv2-email", href: mailto("Add " + lbl) }); al.textContent = "Email us"; bs[q].replaceWith(al);
        }
      }
    }
  }

  function calendar() {
    tier();
    account();
    planCard();
    addons();
    var cardEl = $("dv2Cal"), body = $("dv2CalBody"), soon = $("dv2CalSoon");
    var secs = $("v2Body").querySelectorAll(".v2-sec"), found = null;
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector(".v2-h");
      if (h && h.textContent.trim() === "Calendar") { found = secs[i]; break; }
    }
    if (found) { body.innerHTML = ""; body.appendChild(found); soon.hidden = true; cardEl.hidden = false; return; }
    var g = null;
    try { g = v2 && v2.features && v2.features.calendar_google; } catch (e) {}   // index.html's `let v2`
    if (g && (g.status === "rolling_out" || g.status === "coming_soon")) {
      body.innerHTML = '<div class="v2-row"><button type="button" class="btn" disabled>Connect Google Calendar</button></div>';
      soon.hidden = false; cardEl.hidden = false; return;
    }
    if (!body.querySelector("#v2CalOn, #v2CalOff")) cardEl.hidden = true;
  }

  var CSS = [
    /* Scoped under html.dv2: nothing here can touch the legacy page. */
    "html.dv2 .wrap{max-width:none;margin:0;padding:0;display:grid;grid-template-columns:236px minmax(0,1fr);min-height:100vh}",
    "html.dv2.dv2-collapsed .wrap{grid-template-columns:76px minmax(0,1fr)}",
    "html.dv2 #dv2Side{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:14px;padding:18px 14px;border-right:1px solid var(--line);background:var(--card);overflow-y:auto;z-index:5}",
    "html.dv2 .dv2-side-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px}",
    "html.dv2 .dv2-side-top .brandbar{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink);font-weight:700;font-size:17px;white-space:nowrap;overflow:hidden}",
    "html.dv2 .dv2-side-top .brandbar img{width:28px;height:28px}",
    "html.dv2 .dv2-collapse{border:1px solid var(--line);background:var(--card);color:var(--muted);border-radius:8px;width:28px;height:28px;display:grid;place-items:center;cursor:pointer;padding:0;flex:none}",
    "html.dv2 .dv2-collapse svg{width:16px;height:16px}",
    "html.dv2.dv2-collapsed .dv2-collapse svg{transform:rotate(180deg)}",
    "html.dv2 .dv2-biz{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--raise)}",
    "html.dv2 .dv2-biz-name{font-weight:650;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "html.dv2 .dv2-biz .biz-select{margin-top:6px;width:100%}",
    "html.dv2 .dv2-nav{display:flex;flex-direction:column;gap:4px}",
    "html.dv2 .dv2-nav a{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:var(--ink2);text-decoration:none;font-weight:500;white-space:nowrap}",
    "html.dv2 .dv2-nav a:hover{background:var(--hover)}",
    "html.dv2 .dv2-nav a.on{background:var(--accent-soft);color:var(--accent);font-weight:650}",
    "html.dv2 .dv2-nav svg{width:20px;height:20px;flex:none}",
    "html.dv2 .dv2-usage{margin-top:auto}",
    "html.dv2 .dv2-usage #usageCard{margin:0;padding:12px 14px;font-size:13px}",
    "html.dv2 #dv2Main{min-width:0;padding:16px 28px 48px;max-width:1180px;width:100%;margin:0 auto}",
    "html.dv2 #dv2Main .topbar{justify-content:flex-end;margin-bottom:8px}",
    "html.dv2[data-dv2-tab=settings] #range,html.dv2[data-dv2-tab=billing] #range{display:none}",
    "html.dv2 .dv2-panel>*+*{margin-top:12px}",
    "html.dv2 .dv2-panel .row2,html.dv2 .dv2-panel .stack,html.dv2 .dv2-panel .grid{margin-bottom:0}",
    "html.dv2 .dv2-notice{border-radius:12px;padding:12px 16px;margin-bottom:12px;font-weight:550;border:1px solid var(--line)}",
    "html.dv2 .dv2-notice.good{background:var(--good-soft);color:var(--good)}",
    "html.dv2 .dv2-notice.bad{background:var(--bad-soft);color:var(--bad)}",
    /* Calendar card */
    "html.dv2 .dv2-cal{border-radius:16px}",
    "html.dv2 .dv2-cal-head{display:flex;align-items:center;gap:12px;margin-bottom:6px}",
    "html.dv2 .dv2-cal-head .panel-title{margin:0}",
    "html.dv2 .dv2-cal-ico{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);flex:none}",
    "html.dv2 .dv2-cal-ico svg{width:22px;height:22px}",
    "html.dv2 .dv2-soon{margin-left:auto;font-size:12px;font-weight:650;padding:4px 10px;border-radius:999px;background:var(--chip-bg);color:var(--chip-ink)}",
    "html.dv2 .dv2-cal .v2-sec{border:0;padding:0;margin:0}",
    "html.dv2 .dv2-cal .v2-h{display:none}",
    "html.dv2 .dv2-cal .v2-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-left:52px}",
    "html.dv2 .dv2-cal button[disabled]{opacity:.55;cursor:not-allowed}",
    /* ---- Polish: styling only. Light theme gets the site's soft blue / lavender palette;
     * dark keeps the page's own dark tokens with the same shapes. ---- */
    "html.dv2{--dv2-r:18px;--dv2-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px -12px rgba(37,99,235,.14);--dv2-lav:#f1ecfd;--dv2-lav-ink:#6d4fd8;--dv2-mint:#e7f6ee;--dv2-peach:#fdf1e6;--dv2-sky:#e8effc}",
    "html.dv2[data-theme=dark]{--dv2-shadow:0 1px 2px rgba(0,0,0,.3);--dv2-lav:#1f1a3a;--dv2-lav-ink:#b9a6ff;--dv2-mint:#0f2a20;--dv2-peach:#2d2114;--dv2-sky:#15233f}",
    "html.dv2:not([data-theme=dark]) body{background:radial-gradient(1200px 600px at 85% -10%,#efe9fb 0,rgba(239,233,251,0) 60%),radial-gradient(900px 500px at 20% 0,#e8eefb 0,rgba(232,238,251,0) 60%),#f6f8fd}",
    "html.dv2:not([data-theme=dark]) #dv2Side{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(247,245,255,.92));backdrop-filter:blur(8px)}",
    "html.dv2 #dv2Main .card{border-radius:var(--dv2-r);border-color:color-mix(in srgb,var(--line) 70%,transparent);box-shadow:var(--dv2-shadow);padding:20px 22px}",
    "html.dv2 #dv2Main header h1{font-size:32px;letter-spacing:-.02em;line-height:1.15}",
    "html.dv2 #dv2Main header .sub{font-size:14px;margin-top:4px}",
    "html.dv2 #dv2Main .panel-title{font-family:Manrope,'DM Sans',sans-serif;font-size:18px;font-weight:700;letter-spacing:-.01em}",
    "html.dv2 #dv2Main .panel-sub{font-size:13px}",
    "html.dv2 .range{border-radius:12px;box-shadow:var(--dv2-shadow)}",
    "html.dv2 .range button.on{background:var(--accent);color:#fff}",
    "html.dv2 #dv2Main .gear{border-radius:12px}",
    /* hero and KPI cards: soft tints, one per card */
    "html.dv2 #dv2Main .hero{background:linear-gradient(120deg,var(--dv2-sky),var(--dv2-lav) 55%,var(--card));border:0}",
    "html.dv2 #dv2Main .hero .label{color:var(--hero-label);font-weight:600}",
    "html.dv2 #kpis{grid-template-columns:repeat(3,minmax(0,1fr))}",
    "html.dv2 #kpis:has(>:nth-child(4):last-child),html.dv2 #kpis:has(>:nth-child(8):last-child){grid-template-columns:repeat(4,minmax(0,1fr))}",
    "html.dv2 #kpis .kpi{border:0;position:relative;overflow:hidden}",
    "html.dv2 #kpis .kpi:nth-child(4n+1){background:linear-gradient(160deg,var(--dv2-sky),var(--card) 90%)}",
    "html.dv2 #kpis .kpi:nth-child(4n+2){background:linear-gradient(160deg,var(--dv2-lav),var(--card) 90%)}",
    "html.dv2 #kpis .kpi:nth-child(4n+3){background:linear-gradient(160deg,var(--dv2-mint),var(--card) 90%)}",
    "html.dv2 #kpis .kpi:nth-child(4n+4){background:linear-gradient(160deg,var(--dv2-peach),var(--card) 90%)}",
    "html.dv2 #kpis .kpi .label{color:var(--ink2);font-weight:600;font-size:14px}",
    "html.dv2 #kpis .kpi .val{font-size:34px;font-weight:700}",
    "html.dv2 #kpis .delta{font-size:12px;padding:2px 8px;border-radius:999px;background:var(--good-soft)}",
    "html.dv2 #kpis .delta.down{background:var(--bad-soft)}",
    "html.dv2 #kpis .bar{height:8px;border-radius:99px}",
    /* highlights as soft rows */
    "html.dv2 .insights{gap:8px}",
    "html.dv2 .ins{background:var(--raise);border-radius:12px;padding:10px 14px}",
    "html.dv2 .ins .v{font-size:17px}",
    /* call outcomes */
    "html.dv2 .hbars{gap:12px}",
    /* call log */
    "html.dv2 #dv2Main table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em}",
    /* Call log hover: the whole row, not each cell (on narrow logs the cells are grid boxes with gaps). */
    "html.dv2 #log tr.row{border-radius:12px;transition:background .12s}",
    "html.dv2 #log tr.row:hover,html.dv2 #log tr.row.open{background:var(--dv2-sky)}",
    "html.dv2 #log tr.row:hover td,html.dv2 #log tr.row.open td{background:transparent}",
    "html.dv2 #dv2Main .pill{border-radius:999px}",
    /* sidebar details */
    "html.dv2 .dv2-biz{border-radius:14px;box-shadow:var(--dv2-shadow);background:var(--card)}",
    "html.dv2 .dv2-nav a.on{background:linear-gradient(90deg,var(--accent-soft),var(--dv2-lav))}",
    "html.dv2 .dv2-usage #usageCard{border-radius:16px;background:linear-gradient(160deg,var(--dv2-lav),var(--card));border:0;box-shadow:var(--dv2-shadow)}",
    "html.dv2 .dv2-usage #usageCard .u-val{font-size:16px}",
    /* Calendar card */
    "html.dv2 #dv2Main .dv2-cal{background:linear-gradient(120deg,var(--dv2-sky),var(--card) 60%);border:0}",
    "html.dv2 .dv2-cal-ico{background:var(--card);box-shadow:var(--dv2-shadow);width:44px;height:44px}",
    "html.dv2 .dv2-cal .btn{border-radius:12px;padding:10px 16px}",
    "html.dv2 .dv2-notice{border:0;box-shadow:var(--dv2-shadow)}",
    /* bottom tab bar on phones: frosted */
    "@media (max-width:759px){html.dv2:not([data-theme=dark]) #dv2Side{background:rgba(255,255,255,.9)} html.dv2 #dv2Main header h1{font-size:26px} html.dv2 #kpis .kpi .val{font-size:28px} html.dv2 #dv2Main .card{padding:16px}}",
    /* ---- Enterprise (html.dv2-ent): deep navy sidebar, white cards with an indigo edge,
     * a dark hero, gold accents. Same markup and data. ---- */
    /* Plan tag: its own colour, a soft glow that breathes, and a slow shine passing across it. */
    "html.dv2 .dv2-tier{position:relative;overflow:hidden;display:inline-flex;align-items:center;margin-top:7px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;--t1:#dbe7ff;--t2:#9db8ff;--ti:#173c9c;--tg:rgba(37,99,235,.45);background:linear-gradient(90deg,var(--t1),var(--t2));color:var(--ti);animation:dv2Glow 3.2s ease-in-out infinite}",
    "html.dv2 .dv2-tier::after{content:'';position:absolute;top:0;bottom:0;left:-60%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(-20deg);animation:dv2Shine 4.5s ease-in-out infinite}",
    "html.dv2 .dv2-tier::before{content:'✦';margin-right:5px;font-size:10px;animation:dv2Twinkle 2.4s ease-in-out infinite}",
    "html.dv2 .dv2-tier[data-plan=personal]{--t1:#d5f5f0;--t2:#7fdccd;--ti:#0b5f55;--tg:rgba(20,184,166,.45)}",
    "html.dv2 .dv2-tier[data-plan=business_lite]{--t1:#dbe7ff;--t2:#9db8ff;--ti:#173c9c;--tg:rgba(37,99,235,.5)}",
    "html.dv2 .dv2-tier[data-plan=business_pro]{--t1:#ece3ff;--t2:#b9a0ff;--ti:#4a2a9e;--tg:rgba(124,58,237,.5)}",
    "html.dv2 .dv2-tier[data-plan=enterprise]{--t1:#f8ebc4;--t2:#e3b95b;--ti:#5a4210;--tg:rgba(227,185,91,.65)}",
    "@keyframes dv2Glow{0%,100%{box-shadow:0 0 0 0 transparent,0 0 6px 0 var(--tg)}50%{box-shadow:0 0 0 1px var(--tg),0 0 16px 2px var(--tg)}}",
    "@keyframes dv2Shine{0%,55%{left:-60%}85%,100%{left:130%}}",
    "@keyframes dv2Twinkle{0%,100%{opacity:.55;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}",
    "@media (prefers-reduced-motion:reduce){html.dv2 .dv2-tier,html.dv2 .dv2-tier::after,html.dv2 .dv2-tier::before{animation:none}}",
    "html.dv2.dv2-ent{--dv2-gold:#e3b95b;--dv2-navy:#0d1630;--dv2-navy2:#1a2550}",
    "html.dv2.dv2-ent:not([data-theme=dark]) body{background:radial-gradient(1100px 520px at 85% -10%,#e9e6fb 0,rgba(233,230,251,0) 60%),#f4f5fa}",
    "html.dv2.dv2-ent #dv2Side,html.dv2.dv2-ent:not([data-theme=dark]) #dv2Side{background:linear-gradient(180deg,var(--dv2-navy),var(--dv2-navy2));border-right:0;color:#e8edf7}",
    "html.dv2.dv2-ent .dv2-side-top .brandbar{color:#fff}",
    "html.dv2.dv2-ent .dv2-collapse{background:transparent;border-color:rgba(255,255,255,.18);color:#c9d3ea}",
    "html.dv2.dv2-ent .dv2-biz{background:rgba(255,255,255,.06);border:1px solid rgba(227,185,91,.35);box-shadow:none}",
    "html.dv2.dv2-ent .dv2-biz-name{color:#fff}",
    "html.dv2.dv2-ent .dv2-nav a{color:#c9d3ea}",
    "html.dv2.dv2-ent .dv2-nav a:hover{background:rgba(255,255,255,.06)}",
    "html.dv2.dv2-ent .dv2-nav a.on{background:rgba(255,255,255,.1);color:#fff;box-shadow:inset 3px 0 0 var(--dv2-gold)}",
    "html.dv2.dv2-ent .dv2-usage #usageCard{background:rgba(255,255,255,.06);color:#e8edf7;border:1px solid rgba(255,255,255,.1);box-shadow:none}",
    "html.dv2.dv2-ent .dv2-usage #usageCard .muted,html.dv2.dv2-ent .dv2-usage #usageCard *{color:inherit}",
    "html.dv2.dv2-ent .dv2-usage #usageCard .u-track{background:rgba(255,255,255,.15)}",
    "html.dv2.dv2-ent .dv2-usage #usageCard .u-track>span{background:var(--dv2-gold)}",
    "html.dv2.dv2-ent #dv2Main .hero{background:linear-gradient(120deg,var(--dv2-navy),#2b2f7a 70%,#4b3fa8);color:#fff}",
    "html.dv2.dv2-ent #dv2Main .hero .label{color:var(--dv2-gold)}",
    "html.dv2.dv2-ent #dv2Main .hero .note{color:#c9d3ea}",
    "html.dv2.dv2-ent #kpis .kpi,html.dv2.dv2-ent #kpis .kpi:nth-child(n){background:var(--card);border-top:3px solid #4b3fa8}",
    "html.dv2.dv2-ent #kpis .kpi .val{letter-spacing:-.02em}",
    "html.dv2.dv2-ent .range button.on{background:var(--dv2-navy);color:#fff}",
    "html.dv2.dv2-ent[data-theme=dark] .range button.on{background:#4b3fa8}",
    "html.dv2.dv2-ent #dv2Main .dv2-cal{background:var(--card);border-top:3px solid var(--dv2-gold)}",
    "@media (max-width:759px){html.dv2.dv2-ent #dv2Side,html.dv2.dv2-ent:not([data-theme=dark]) #dv2Side{background:var(--dv2-navy)}}",
    /* ---- Round 2: type, logo, assistant number, account card, plan cards, tell-us form ---- */
    "html.dv2 body{font-family:Manrope,'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;letter-spacing:-.005em}",
    "html.dv2 h1,html.dv2 .panel-title,html.dv2 .kpi .val,html.dv2 .hero .val,html.dv2 .ins .v{font-family:Manrope,sans-serif;font-feature-settings:'tnum' 1,'ss01' 1}",
    "html.dv2 #dv2Main header h1{font-weight:800;letter-spacing:-.03em}",
    "html.dv2 #kpis .kpi .val,html.dv2 .hero .val{font-weight:800;letter-spacing:-.03em}",
    "html.dv2 .ins .k{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}",
    "html.dv2 .ins .v{font-size:18px;font-weight:700;letter-spacing:-.01em;margin-top:2px}",
    "html.dv2 .dv2-side-top .brandbar img{width:auto;height:22px;max-width:100%;object-fit:contain;flex:none}",
    "html.dv2 .dv2-side-top .brandbar span{font-size:16px;font-weight:800;letter-spacing:-.02em}",
    "html.dv2 .dv2-side-top .brandbar{gap:7px;min-width:0}",
    "html.dv2 .btn,html.dv2 .btn-ghost{font-family:inherit;font-weight:700;border-radius:12px}",
    /* assistant's number on Overview */
    "html.dv2 .dv2-assist{display:flex;align-items:center;gap:16px;background:linear-gradient(120deg,var(--card),var(--dv2-sky))}",
    "html.dv2 .dv2-assist-ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--accent);color:#fff;flex:none}",
    "html.dv2 .dv2-assist-ico svg{width:24px;height:24px}",
    "html.dv2 .dv2-assist-txt{flex:1;min-width:0}",
    "html.dv2 .dv2-assist-k{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}",
    "html.dv2 .dv2-assist-v{font-size:28px;font-weight:800;letter-spacing:-.02em;font-feature-settings:'tnum' 1}",
    "html.dv2.dv2-ent .dv2-assist-ico{background:var(--dv2-navy);color:var(--dv2-gold)}",
    /* account card */
    "html.dv2 .dv2-acct-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:10px 0 0}",
    "html.dv2 .dv2-acct-list dt{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}",
    "html.dv2 .dv2-acct-list dd{margin:0;background:var(--raise);border-radius:12px;padding:12px 14px;font-weight:700;font-size:15px;overflow-wrap:anywhere}",
    "html.dv2 .dv2-acct-list dd::before{content:attr(data-k);display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}",
    /* plan card on Settings */
    "html.dv2 #v2Card .v2-sec{border-top:0;padding:14px 0 0}",
    "html.dv2 #v2Card .v2-h,html.dv2 #v2Bill .v2-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}",
    "html.dv2 #v2Card .dv2-onplan,html.dv2 #v2Card .dv2-notplan{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}",
    "html.dv2 #v2Card .dv2-onplan .v2-h,html.dv2 #v2Card .dv2-notplan .v2-h{grid-column:1/-1;margin:0}",
    "html.dv2 #v2Card .dv2-onplan .v2-row{margin:0;padding:12px 14px;border-radius:12px;background:linear-gradient(160deg,var(--dv2-mint),var(--card));font-weight:600;gap:10px;flex-wrap:nowrap}",
    "html.dv2 #v2Card .dv2-onplan .v2-row::before{content:'✓';display:grid;place-items:center;width:22px;height:22px;flex:none;border-radius:50%;background:var(--good);color:#fff;font-size:12px;font-weight:800}",
    "html.dv2 #v2Card .dv2-notplan .v2-row{margin:0;padding:12px 14px;border-radius:12px;border:1px dashed var(--line);flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:4px;opacity:1;font-weight:600;color:var(--ink2)}",
    "html.dv2 #v2Card input[type=email],html.dv2 #v2Card input[type=tel],html.dv2 #v2Card input[type=text],html.dv2 #v2Card select{font:inherit;font-size:14px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:220px}",
    "html.dv2 #v2Card input:focus,html.dv2 #v2Card select:focus{outline:2px solid var(--accent);outline-offset:0}",
    "html.dv2 #v2Bill .v2-plan .v2-badge{align-self:flex-start;font-size:12px;padding:4px 10px;background:var(--accent-soft);color:var(--accent)}",
    "html.dv2 .dv2-email{font-size:13px;font-weight:700;color:var(--accent);text-decoration:none;white-space:nowrap}",
    "html.dv2 .dv2-email:hover{text-decoration:underline}",
    "html.dv2 #v2Title{font-size:22px}",
    /* plan boxes on Billing */
    "html.dv2 #v2Bill .v2-plans{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}",
    "html.dv2 #v2Bill .v2-plan{display:flex;flex-direction:column;gap:4px;padding:20px;border-radius:18px;border:1px solid var(--line);background:var(--card);box-shadow:var(--dv2-shadow)}",
    "html.dv2 #v2Bill .v2-plan>b{font-family:Manrope,sans-serif;font-size:18px;font-weight:800;letter-spacing:-.01em}",
    "html.dv2 #v2Bill .v2-plan>b+div{font-size:26px;font-weight:800;letter-spacing:-.02em;margin-top:6px}",
    "html.dv2 #v2Bill .v2-plan .v2-row{margin-top:auto;padding-top:12px}",
    "html.dv2 #v2Bill .v2-plan.cur{border:2px solid var(--accent);background:linear-gradient(160deg,var(--dv2-sky),var(--card) 70%)}",
    "html.dv2 #v2Bill .v2-plan [data-plan],html.dv2 .dv2-email-btn{display:block;width:100%;text-align:center;margin-top:auto;padding:11px 14px;border-radius:12px;text-decoration:none}",
    "html.dv2 .dv2-email-btn{margin-top:auto;background:var(--ink);color:var(--card);font-weight:700}",
    "html.dv2 #v2Bill .v2-plan>.dv2-email-btn{margin-top:auto}",
    "html.dv2 #v2Bill .v2-plan>.muted+.dv2-email-btn,html.dv2 #v2Bill .v2-plan>.muted+.v2-row{margin-top:16px}",
    "html.dv2 #v2Bill .dv2-ent-plan{background:#0b1022;border-color:#0b1022;color:#fff}",
    "html.dv2 #v2Bill .dv2-ent-plan .muted{color:#aab4cc}",
    "html.dv2 #v2Bill .dv2-ent-plan .dv2-email-btn{background:#fff;color:#0b1022}",
    "html.dv2 #v2Bill .dv2-ent-plan.cur{border:2px solid var(--dv2-gold,#e3b95b)}",
    /* Tell us about your business: the site's contact form */
    /* "Tell us about your business" on Billing repeats Request a change (same channel): hidden in V2. */
    "html.dv2 #v2Tell{display:none!important}",
    /* Request a change: the site's contact form */
    "html.dv2 #dv2Main #crCard{padding:30px;border:0;background:linear-gradient(160deg,#e2f1f5,#e8eefb)}",
    "html.dv2[data-theme=dark] #dv2Main #crCard{background:linear-gradient(160deg,#10263a,#15233f)}",
    "html.dv2 #crCard>.panel-title{font-size:32px;font-weight:800;letter-spacing:-.03em;margin:0 0 6px}",
    "html.dv2 #crCard>.panel-title em{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;letter-spacing:0}",
    "html.dv2 #crCard>.panel-sub{font-size:15px;color:var(--ink2);margin:0 0 18px}",
    "html.dv2 #crCard .cr-topics legend,html.dv2 #crCard .cr-label{font-size:14px;font-weight:700;margin-bottom:10px}",
    "html.dv2 #crCard .cr-topics{gap:8px;margin-bottom:18px}",
    "html.dv2 #crCard .cr-topics label{background:var(--card);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:999px;padding:9px 14px;font-weight:600}",
    "html.dv2 #crCard .cr-topics label:has(input:checked){border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}",
    "html.dv2 #crCard textarea{width:100%;font:inherit;font-size:15px;color:var(--ink);background:var(--card);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:14px;padding:14px 16px;min-height:130px}",
    "html.dv2 #crCard textarea:focus{outline:2px solid var(--accent);outline-offset:0}",
    "html.dv2 #crCard .cr-foot{flex-direction:column-reverse;align-items:stretch;gap:10px;margin-top:14px}",
    "html.dv2 #crCard #crSend{width:100%;padding:16px;border-radius:999px;font-size:16px}",
    "html.dv2 #crCard .cr-count{text-align:right}",
    /* Add-ons list */
    "html.dv2 .dv2-addon-list{display:grid;gap:10px;margin-top:12px}",
    "html.dv2 .dv2-addon{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-radius:16px;background:var(--raise);flex-wrap:wrap}",
    "html.dv2 .dv2-addon-n{font-weight:700;font-size:16px}",
    "html.dv2 .dv2-addon-tag{display:inline-block;margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:var(--accent-soft);color:var(--accent)}",
    "html.dv2 .dv2-addon-tag.on{background:var(--good-soft);color:var(--good)}",
    "html.dv2 .dv2-addon-r{display:flex;align-items:center;gap:12px;margin-left:auto}",
    "html.dv2 .dv2-addon-p{font-weight:800;font-size:15px;padding:8px 14px;border-radius:999px;background:var(--card);white-space:nowrap}",
    "html.dv2 .dv2-email-btn.sm{display:inline-block;width:auto;margin:0;padding:9px 16px;border-radius:999px;font-size:14px}",
    /* Google Calendar icon */
    "html.dv2 .dv2-cal-ico img{width:34px;height:auto;display:block}",
    "html.dv2 #dv2Main .dv2-cal-ico{width:52px;height:52px;border-radius:14px}",
    "html.dv2 .dv2-cal-head .panel-title{font-size:20px}",
    /* ---- Business switcher ---- */
    "html.dv2 #bizSelect{display:none!important}",
    "html.dv2 .dv2-biz.dv2-has-sw .dv2-biz-name{display:none}",
    "html.dv2 .dv2-sw{position:relative}",
    "html.dv2 #dv2Side:has(.dv2-sw-pop:not([hidden])){overflow:visible}",
    "html.dv2 #dv2Biz .dv2-sw-pop{left:-8px;width:auto;min-width:calc(100% + 16px);max-width:320px;white-space:nowrap}",
    "html.dv2 .dv2-sw-btn{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:2px;border-radius:10px}",
    "html.dv2 .dv2-sw-btn:hover .dv2-sw-chev{background:var(--hover)}",
    "html.dv2 .dv2-sw-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
    "html.dv2 .dv2-av{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;font-size:12px;font-weight:800;letter-spacing:.02em;color:hsl(var(--h) 55% 32%);background:hsl(var(--h) 80% 92%)}",
    "html.dv2[data-theme=dark] .dv2-av{color:hsl(var(--h) 80% 82%);background:hsl(var(--h) 35% 22%)}",
    "html.dv2 .dv2-sw-txt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}",
    "html.dv2 .dv2-sw-name{font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "html.dv2 .dv2-sw-sub{font-size:11px;color:var(--muted);font-weight:600;margin-top:2px}",
    "html.dv2 .dv2-sw-chev{flex:none;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--muted);transition:transform .15s}",
    "html.dv2 .dv2-sw-chev svg{width:18px;height:18px}",
    "html.dv2 .dv2-sw-btn[aria-expanded=true] .dv2-sw-chev{transform:rotate(180deg)}",
    "html.dv2 .dv2-sw-pop{position:absolute;z-index:40;top:calc(100% + 8px);left:0;width:100%;max-height:min(420px,70vh);display:flex;flex-direction:column;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 40px -12px rgba(15,23,42,.35);padding:8px;animation:dv2Pop .14s ease-out}",
    "@keyframes dv2Pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}",
    "html.dv2 .dv2-sw-search{font:inherit;font-size:14px;color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:0 0 6px}",
    "html.dv2 .dv2-sw-search:focus{outline:2px solid var(--accent);outline-offset:0}",
    "html.dv2 .dv2-sw-list{list-style:none;margin:0;padding:0;overflow-y:auto;outline:0}",
    "html.dv2 .dv2-sw-list li{display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px}",
    "html.dv2 .dv2-sw-list li .dv2-av{width:28px;height:28px;border-radius:8px;font-size:11px}",
    "html.dv2 .dv2-sw-list li.act{background:var(--hover)}",
    "html.dv2 .dv2-sw-list li[aria-selected=true]{color:var(--accent)}",
    "html.dv2 .dv2-sw-iname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "html.dv2 .dv2-sw-check{font-weight:800}",
    "html.dv2.dv2-ent #dv2Side .dv2-sw-btn{color:#fff}",
    "html.dv2.dv2-ent #dv2Side .dv2-sw-sub{color:#aab4cc}",
    /* in the top bar (tablet/phone) */
    "html.dv2 .dv2-sw.in-top{margin-right:auto;max-width:min(320px,60vw)}",
    "html.dv2 .dv2-sw.in-top .dv2-sw-btn{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 10px 4px 4px;box-shadow:var(--dv2-shadow)}",
    "html.dv2 .dv2-sw.in-top .dv2-av{width:28px;height:28px;border-radius:999px}",
    "html.dv2 .dv2-sw.in-top .dv2-sw-sub{display:none}",
    "html.dv2 .dv2-sw.in-top .dv2-sw-pop{left:0;width:max(280px,100%);max-width:calc(100vw - 24px)}",
    "html.dv2 #dv2Main .topbar{display:flex;align-items:center;gap:12px}",
    /* ---- Customize card ---- */
    "html.dv2 #dv2Main #settings{padding:24px 26px}",
    "html.dv2 .dv2-set-h{margin-bottom:16px}",
    "html.dv2 .dv2-set-h .panel-title{margin:0 0 2px}",
    "html.dv2 #settings .set-grid{grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}",
    "html.dv2 #settings .set-grid label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);gap:6px}",
    "html.dv2 #settings .set-grid select,html.dv2 #settings .set-grid input,html.dv2 #settings #nsLabel,html.dv2 #settings #nsCounts{font:inherit;font-size:15px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--ink);background:var(--raise);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:12px;padding:11px 12px}",
    "html.dv2 #settings select:focus,html.dv2 #settings input:focus{outline:2px solid var(--accent);outline-offset:0}",
    "html.dv2 #settings .set-row{display:block;margin-top:20px;padding-top:18px;border-top:1px solid var(--line)}",
    "html.dv2 #settings .set-k{display:block;width:auto;padding:0;margin-bottom:10px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}",
    "html.dv2 #settings .chip{padding:8px 14px;margin:0 8px 8px 0;font-size:14px;font-weight:600;background:var(--card);border-color:color-mix(in srgb,var(--line) 80%,transparent);transition:background .12s,border-color .12s}",
    "html.dv2 #settings .chip input{accent-color:var(--accent)}",
    "html.dv2 #settings .chip:has(input:checked){background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}",
    "html.dv2 #settings .add-status{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}",
    "html.dv2 #settings #nsLabel{flex:1;min-width:200px}",
    "html.dv2 #settings .set-actions{margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}",
    "html.dv2 #settings .set-actions .btn,html.dv2 #settings .set-actions .btn-ghost{padding:10px 20px}",
    /* ---- Billing: Manage my plan; Start my plan now stays red (it charges the card today) ---- */
    "html.dv2 .dv2-bill-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px 22px;border-radius:var(--dv2-r);background:var(--card);box-shadow:var(--dv2-shadow);border:1px solid color-mix(in srgb,var(--line) 70%,transparent)}",
    "html.dv2 .dv2-bill-bar .panel-title{margin:0 0 2px}",
    "html.dv2 .dv2-bill-bar .panel-sub{margin:0}",
    "html.dv2 .dv2-manage{padding:12px 20px;border-radius:12px;background:var(--ink);color:var(--card);border:0}",
    "html.dv2 .dv2-manage:hover{filter:brightness(1.15)}",
    "html.dv2 .btn-danger{border-radius:12px;padding:12px 20px}",
    /* ---- Plan card: feature cards (texts, transfer, email, more) ---- */
    "html.dv2 #v2Card .v2-sec.dv2-feat{display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:16px;align-items:start;margin-top:14px;padding:20px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:16px;background:var(--card)}",
    "html.dv2 #v2Card .v2-sec.dv2-feat>*{grid-column:2}",
    "html.dv2 .dv2-feat-ico{grid-column:1!important;grid-row:1/span 12;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)}",
    "html.dv2 .dv2-feat-ico svg{width:22px;height:22px}",
    "html.dv2 #v2Card .dv2-feat>.v2-h{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800;letter-spacing:-.01em;text-transform:none;color:var(--ink);margin:2px 0 8px}",
    "html.dv2 .dv2-state{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:var(--gray-soft);color:var(--muted)}",
    "html.dv2 .dv2-state.on{background:var(--good-soft);color:var(--good)}",
    "html.dv2 #v2Card .dv2-feat .v2-row{margin:0 0 8px;line-height:1.5}",
    "html.dv2 #v2Card .dv2-feat .v2-row.muted{font-size:13px}",
    "html.dv2 #v2Card .dv2-feat .v2-row b{font-weight:800;white-space:nowrap}",
    "html.dv2 #v2Card .dv2-feat .dv2-hide{display:none}",
    "html.dv2 #v2Card .dv2-feat label.dv2-tr-switch{align-items:flex-start}",
    "html.dv2 #v2Card .dv2-feat label.dv2-tr-switch input{margin-top:1px}",
    "html.dv2 #v2Card .dv2-feat label.chk-inline{display:flex;align-items:center;gap:12px;cursor:pointer;font-weight:600}",
    /* checkboxes in the feature cards as switches */
    "html.dv2 #v2Card .dv2-feat input[type=checkbox]{appearance:none;-webkit-appearance:none;flex:none;width:42px;height:24px;margin:0;border-radius:999px;background:var(--line);position:relative;cursor:pointer;transition:background .15s}",
    "html.dv2 #v2Card .dv2-feat input[type=checkbox]::before{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .15s}",
    "html.dv2 #v2Card .dv2-feat input[type=checkbox]:checked{background:var(--accent)}",
    "html.dv2 #v2Card .dv2-feat input[type=checkbox]:checked::before{transform:translateX(18px)}",
    "html.dv2 #v2Card .dv2-feat input[type=checkbox]:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
    "html.dv2 #v2Card .dv2-feat .btn,html.dv2 #v2Card .dv2-feat .btn-ghost{padding:10px 18px;border-radius:12px}",
    "html.dv2 #v2Card .dv2-feat .v2-row:not(:has(input,button,select,a.btn)){display:block}",
    "html.dv2 #v2Card .dv2-feat .v2-msg:empty{display:none}",
    "html.dv2 #v2Card .dv2-feat>:last-child{margin-bottom:0}",
    "html.dv2 #v2Card .dv2-feat input.v2Em{border-radius:12px;padding:10px 12px}",
    "html.dv2 #v2Card .dv2-feat .v2-msg:not(:empty){margin-top:6px;padding:10px 12px;border-radius:10px;background:var(--raise);font-size:13px;font-weight:600}",
    "html.dv2 #v2Card .dv2-feat .v2-badge.soon{margin-left:6px}",
    /* ---- Billing: trial with Start my plan now beside it; Monthly / Annual switch ---- */
    "html.dv2 #v2Bill .v2-sec.dv2-trial{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:24px;align-items:center}",
    "html.dv2 #v2Bill .dv2-trial>.v2-h,html.dv2 #v2Bill .dv2-trial>.v2-row{grid-column:1}",
    "html.dv2 #v2Bill .dv2-trial>.v2-start-row{grid-column:2;grid-row:1/span 2;display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin:0;max-width:300px;text-align:right}",
    "html.dv2 #v2Bill .dv2-trial .v2-start-note{font-size:12px;color:var(--muted)}",
    "html.dv2 #v2Bill .dv2-trial>.v2-msg{grid-column:1/-1}",
    "@media (max-width:759px){html.dv2 #v2Bill .v2-sec.dv2-trial{display:block} html.dv2 #v2Bill .dv2-trial>.v2-start-row{align-items:flex-start;text-align:left;max-width:none;margin-top:10px}}",
    "html.dv2 #v2Bill .dv2-seg{display:inline-flex;gap:4px;padding:4px;margin:4px 0 14px;border-radius:999px;background:var(--raise);border:1px solid var(--line)}",
    "html.dv2 #v2Bill .dv2-seg label{position:relative;display:inline-flex;align-items:center;padding:9px 18px;border-radius:999px;font-weight:700;font-size:14px;color:var(--muted);cursor:pointer;transition:background .15s,color .15s}",
    "html.dv2 #v2Bill .dv2-seg input{position:absolute;opacity:0;pointer-events:none}",
    "html.dv2 #v2Bill .dv2-seg label:has(input:checked){background:var(--accent);color:#fff;box-shadow:0 2px 8px -2px rgba(37,99,235,.5)}",
    "html.dv2 #v2Bill .dv2-seg label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}",
    /* ---- Phones: the assistant's number in one piece; KPI cards two across ---- */
    "html.dv2 .dv2-assist-v{white-space:nowrap}",
    "@media (max-width:759px){html.dv2 .dv2-assist{display:grid;grid-template-columns:40px minmax(0,1fr);gap:4px 12px;padding:16px} html.dv2 .dv2-assist-ico{width:40px;height:40px;border-radius:12px;grid-row:1/span 2} html.dv2 .dv2-assist-ico svg{width:20px;height:20px} html.dv2 .dv2-assist-k{font-size:11px;white-space:nowrap} html.dv2 .dv2-assist-v{font-size:clamp(20px,6.4vw,26px)} html.dv2 #dv2AssistCopy{grid-column:2;justify-self:start;padding:6px 14px;font-size:14px} html.dv2 #kpis,html.dv2 #kpis:has(>:nth-child(4):last-child),html.dv2 #kpis:has(>:nth-child(8):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}}",
    /* Collapsed rail, and tablets: icons only */
    "html.dv2.dv2-collapsed .dv2-nav span,html.dv2.dv2-collapsed .dv2-biz,html.dv2.dv2-collapsed .dv2-usage,html.dv2.dv2-collapsed .brandbar span{display:none}",
    "html.dv2.dv2-collapsed .dv2-side-top{flex-direction:column}",
    "html.dv2.dv2-collapsed .dv2-nav a{justify-content:center;padding:10px 0}",
    "@media (max-width:1099px){",
    "html.dv2 .wrap,html.dv2.dv2-collapsed .wrap{grid-template-columns:76px minmax(0,1fr)}",
    "html.dv2 .dv2-nav span,html.dv2 .dv2-biz,html.dv2 .dv2-usage,html.dv2 .brandbar span,html.dv2 .dv2-collapse{display:none}",
    "html.dv2 .dv2-side-top{justify-content:center}",
    "html.dv2 .dv2-nav a{justify-content:center;padding:10px 0}",
    "html.dv2 #dv2Main{padding:14px 18px 40px}",
    "}",
    /* Phones: bottom tab bar */
    "@media (max-width:759px){",
    "html.dv2 .wrap,html.dv2.dv2-collapsed .wrap{display:block}",
    "html.dv2 #dv2Side{position:fixed;top:auto;bottom:0;left:0;right:0;height:auto;flex-direction:row;padding:6px 6px calc(6px + env(safe-area-inset-bottom));border-right:0;border-top:1px solid var(--line);overflow:visible}",
    "html.dv2 .dv2-side-top{display:none}",
    "html.dv2 .dv2-nav{flex-direction:row;flex:1;justify-content:space-around}",
    "html.dv2 .dv2-nav a,html.dv2.dv2-collapsed .dv2-nav a{flex:1;flex-direction:column;gap:3px;padding:6px 0;font-size:11px;justify-content:center}",
    "html.dv2 .dv2-nav span,html.dv2.dv2-collapsed .dv2-nav span{display:block}",
    "html.dv2 #dv2Main{padding:12px 12px calc(84px + env(safe-area-inset-bottom))}",
    "html.dv2 .dv2-panel .grid{grid-template-columns:repeat(2,minmax(0,1fr))}",
    "html.dv2 .dv2-panel .row2{grid-template-columns:minmax(0,1fr)}",
    "}"
  ].join("\n");
})();
