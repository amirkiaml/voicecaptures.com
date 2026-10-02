/* vc-auth.js — shared sign-in helper for /login/ and /dashboard/.
 *
 * Accounts are Supabase Auth users. The Supabase URL and publishable key come
 * from the API (/api/dashboard/config), so nothing secret lives in this repo —
 * the publishable key is designed to be public anyway.
 */
(function () {
  var API = window.VC_API || "https://torontoleads-production.up.railway.app";
  var clientPromise = null;

  function getConfig() {
    try {
      var cached = JSON.parse(sessionStorage.getItem("vc_auth_cfg") || "null");
      if (cached && cached.supabaseUrl && cached.supabaseKey) return Promise.resolve(cached);
    } catch (e) {}
    return fetch(API + "/api/dashboard/config").then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || "Sign-in is unavailable right now.");
        try { sessionStorage.setItem("vc_auth_cfg", JSON.stringify(d)); } catch (e) {}
        return d;
      });
    });
  }

  window.vcAuth = {
    API: API,
    // Read before the client is created: supabase-js consumes and clears the hash.
    linkType: (function () {
      var h = new URLSearchParams(location.hash.replace(/^#/, ""));
      var q = new URLSearchParams(location.search);
      return {
        type: h.get("type") || q.get("type"),
        error: h.get("error_description") || q.get("error_description")
      };
    })(),
    client: function () {
      if (!clientPromise) {
        clientPromise = getConfig().then(function (cfg) {
          var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
          });
          return { sb: sb, config: cfg };
        });
      }
      return clientPromise;
    }
  };
})();
