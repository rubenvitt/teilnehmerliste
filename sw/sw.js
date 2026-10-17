// Service Worker: hält die App offline verfügbar. Die Platzhalter füllt der Build (vite.config.ts).
// Daten (Namen, Häkchen) liegen nur in localStorage und laufen nie über diesen Worker.
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE = `teilnehmerliste-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((p) => new Request(p, { cache: "reload" })))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("teilnehmerliste-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

// Cache zuerst: vor Ort ist das Netz oft schlecht, die Dateien ändern sich nur mit einem neuen Deploy.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(caches.match("./", { cacheName: CACHE }).then((res) => res || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((res) => res || fetch(req)));
});
