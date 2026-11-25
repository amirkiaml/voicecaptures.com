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
    if ($("bizSelect")) biz.appendChild($("bizSelect"));
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

    // Overview: the numbers and charts, in today's order.
    move(panels.overview, [$("hero"), $("kpis"), section("daily")]);
    move(panels.overview, Array.prototype.slice.call(app.querySelectorAll(".row2")));
    move(panels.overview, [section("callers")]);
    // Calls: the log with the call-back list beside it, as today.
    move(panels.calls, byId(["retentionNote", "logRow"]));
    // Settings: Calendar first, then the plan's controls, the number, Customize, requests, password.
    var cal = el("div", { class: "card dv2-cal", id: "dv2Cal", hidden: "" },
      '<div class="dv2-cal-head"><span class="dv2-cal-ico">' + svg("calendar") + '</span>' +
      '<p class="panel-title">Google Calendar</p><span class="dv2-soon" id="dv2CalSoon" hidden>Coming soon</span></div>' +
      '<div id="dv2CalBody"></div>');
    panels.settings.appendChild(cal);
    move(panels.settings, byId(["v2Card", "v2Modal", "rnCard", "settings", "crCard", "pwPanel"]));
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

    /* ---- business name in the sidebar mirrors the header's ---- */
    var name = function () { $("dv2BizName").textContent = $("biz").textContent; };
    name();
    new MutationObserver(function () {
      name();
      var d = data();
      // An admin switched to a business that isn't on V2: give them the page that business gets.
      if (d && d.layout !== "v2") location.reload();
    }).observe($("biz"), { childList: true, characterData: true, subtree: true });

    /* ---- Calendar card ---- */
    new MutationObserver(calendar).observe($("v2Body"), { childList: true });
    calendar();

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
  function calendar() {
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
    "html.dv2 #dv2Main tr.row:hover td{background:var(--dv2-sky)}",
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
    /* Collapsed rail, and tablets: icons only */
    "html.dv2.dv2-collapsed .dv2-nav span,html.dv2.dv2-collapsed .dv2-biz,html.dv2.dv2-collapsed .dv2-usage,html.dv2.dv2-collapsed .brandbar span{display:none}",
    "html.dv2.dv2-collapsed .dv2-side-top{flex-direction:column}",
    "html.dv2.dv2-collapsed .dv2-nav a{justify-content:center;padding:10px 0}",
    "@media (max-width:1099px){",
    "html.dv2 .wrap,html.dv2.dv2-collapsed .wrap{grid-template-columns:76px minmax(0,1fr)}",
    "html.dv2 .dv2-nav span,html.dv2 .dv2-biz,html.dv2 .dv2-usage,html.dv2 .brandbar span,html.dv2 .dv2-collapse{display:none}",
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
