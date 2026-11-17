/* First-party campaign attribution.
 *
 * No third-party script, no cookie, no network call, no identifier of any
 * kind. It reads the campaign parameters off the landing URL, keeps them in
 * sessionStorage for the length of the visit, and puts them back on the links
 * that leave for signup or booking, so the self-serve side can store them
 * against the account that gets created.
 *
 * Deliberately NOT here: anything that identifies the visitor. No email, no
 * phone, no name, no IP, no click or page-view log, no full referring URL --
 * only the referring site's hostname, because a full URL carries a path and a
 * search query that can name a person. Values travel in plain sight, in link
 * hrefs and in one request body, so they are treated as untrusted text and
 * bounded in both length and character set before they are stored or echoed.
 *
 * With JavaScript off, nothing here runs and every link still works -- just
 * without the parameters. That is the intended degradation, not a gap.
 */
(function () {
  "use strict";

  var KEY = "vc_attr";
  /* The exact parameter names. The self-serve thread stores these on the
     account; the waitlist POST sends them as the `utm` object under the same
     keys. Changing this list changes a contract in two other repos. */
  var FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"];
  /* `referrer` is accepted as a spelling of `ref` on the way in only. It is
     never written, stored or forwarded under that name. */
  var ALIAS = { ref: "referrer" };
  var MAX = 64;

  /* Unreserved URL characters only (RFC 3986). Anything else is dropped
     rather than escaped: a campaign tag has no business carrying an ampersand
     or a percent sign, and dropping means a crafted value cannot smuggle a
     second parameter into a link no matter how it is later assembled. */
  function clean(value) {
    if (value == null) return "";
    return String(value).trim().replace(/[^A-Za-z0-9._~-]/g, "").slice(0, MAX);
  }

  function fromUrl() {
    var found = {}, params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return found;                       // no URLSearchParams: capture nothing
    }
    FIELDS.forEach(function (name) {
      var v = clean(params.get(name));
      if (!v && ALIAS[name]) v = clean(params.get(ALIAS[name]));
      if (v) found[name] = v;
    });
    /* No ref on the URL: fall back to the referring SITE. Hostname only, and
       only when it is somewhere else -- our own pages linking to each other
       are not a referral. */
    if (!found.ref && document.referrer) {
      try {
        var host = new URL(document.referrer).hostname;
        if (host && host !== window.location.hostname) found.ref = clean(host);
      } catch (e) { /* an unparseable referrer is simply not a referral */ }
    }
    return found;
  }

  function count(o) { return o ? Object.keys(o).length : 0; }

  function read() {
    try {
      var raw = window.sessionStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      /* Re-clean on the way out. Storage is per-origin and not a trust
         boundary we control: another script on this origin, or a visitor with
         a console, can put anything in it. */
      var out = {};
      FIELDS.forEach(function (name) {
        var v = clean(parsed[name]);
        if (v) out[name] = v;
      });
      return count(out) ? out : null;
    } catch (e) {
      return null;            // private mode, storage disabled, or junk inside
    }
  }

  function write(attr) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(attr));
    } catch (e) { /* storage unavailable: this visit simply goes unattributed */ }
  }

  /* First touch wins. A visitor who arrives on a campaign link and then
     wanders the site keeps the campaign that brought them, rather than having
     it overwritten by the next page they land on with no parameters -- and a
     second campaign link later in the same visit does not steal the credit.
     Nothing is written when there is nothing to write: an empty object in
     storage is indistinguishable from "we looked and found none", and it
     would be forwarded as a row of empty parameters. */
  var attr = read();
  if (!attr) {
    var found = fromUrl();
    if (count(found)) { attr = found; write(attr); }
  }

  /* Where the parameters are allowed to go: our own signup flow, the app, and
     our booking link. An allow-list rather than every link on the page, so a
     campaign tag cannot be handed to an arbitrary third party by someone
     adding a link later. */
  function carries(href) {
    if (!href) return false;
    return href.indexOf("/demo/") === 0 ||
           href.indexOf("https://demo.voicecaptures.com") === 0 ||
           href.indexOf("https://calendly.com/hello-voicecaptures") === 0;
  }

  function decorate(root) {
    if (!attr) return 0;
    var n = 0;
    var links = (root || document).querySelectorAll("a[href]");
    Array.prototype.forEach.call(links, function (a) {
      if (!carries(a.getAttribute("href"))) return;
      var url;
      try {
        url = new URL(a.href, window.location.href);
      } catch (e) { return; }
      FIELDS.forEach(function (name) {
        /* Never overwrite a parameter already on the link: a hand-built link
           with its own utm_campaign means it on purpose. */
        if (attr[name] && !url.searchParams.has(name)) {
          url.searchParams.set(name, attr[name]);
        }
      });
      /* Same-origin links keep their relative shape, so a staging host or a
         local file:// preview does not get rewritten to the live domain. */
      a.setAttribute("href", url.origin === window.location.origin
        ? url.pathname + url.search + url.hash
        : url.toString());
      n++;
    });
    return n;
  }

  /* The one public surface. The waitlist form reads vcAttr.get() for the
     `utm` object it posts; nothing else needs it. */
  window.vcAttr = {
    fields: FIELDS.slice(),
    get: function () { return attr ? JSON.parse(JSON.stringify(attr)) : null; },
    decorate: decorate
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { decorate(); });
  } else {
    decorate();
  }
})();
