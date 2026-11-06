/* Dashboard service worker: the SHELL only.
 *
 * It keeps the page itself (this folder's HTML, the sign-in helper, the logo
 * and icons) so the installed app opens instantly and shows a clear message
 * when the phone is offline. It never touches call data: requests to the API
 * (api.voicecaptures.com), Supabase, the CDN and fonts are not intercepted,
 * cached or stored, so nothing about a caller ever sits on the device here.
 *
 * Network first: a new deploy is seen on the next open; the cached copy is
 * used only when the network fails. Bump VERSION to drop old caches.
 */
const VERSION = "vc-dashboard-shell-v1";
const SHELL = ["/dashboard/", "/vc-auth.js", "/logo-mark.png", "/favicon.ico",
  "/dashboard/manifest.webmanifest", "/dashboard/icon-192.png", "/dashboard/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("vc-dashboard-shell-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Which requests are the shell: same origin, GET, and either a page under
// /dashboard/ or one of the files above. Everything else is left alone.
function shellKey(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return null;
  if (request.mode === "navigate" && url.pathname.startsWith("/dashboard")) return "/dashboard/";
  return SHELL.includes(url.pathname) ? url.pathname : null;
}

self.addEventListener("fetch", event => {
  const key = shellKey(event.request);
  if (!key) return;   // API, Supabase, CDN, fonts, other pages: the browser's normal path
  event.respondWith(
    fetch(event.request).then(res => {
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(key, copy));
      }
      return res;
    }).catch(() => caches.match(key).then(hit => hit || Response.error()))
  );
});
