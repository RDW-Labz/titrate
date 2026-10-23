// Offline shell for the static export. Every route is a file in out/, so offline is just: keep each page and
// its hashed chunks, and ask the network first for HTML so a deploy can never be served stale.
const CACHE = "titrate-v2";

// relative to the registration scope, so the same file works at / locally and under /titrate on Pages
const PAGES = [
  "",
  "calc/",
  "food/",
  "library/",
  "library/view/",
  "protocols/",
  "protocols/new/",
  "protocols/view/",
  "photos/",
  "summary/",
  "symptoms/",
  "settings/",
  "start/",
  "assistant/",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", (event) => {
  const root = new URL(self.registration.scope);
  event.waitUntil(
    caches
      .open(CACHE)
      // one page that fails to fetch must not fail the whole install
      .then((cache) => Promise.all(PAGES.map((p) => cache.add(new URL(p, root)).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // hashed build assets never change — serve them from cache first
  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // pages: network first, fall back to the last cached copy when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // never cache a miss, or a typo'd URL would keep 404ing offline forever
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          // ignoreSearch so an offline /protocols/view/?id=x still finds the precached page
          return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match(new URL("", self.registration.scope)));
        }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) return client.focus();
      }
      return self.clients.openWindow(new URL("", self.registration.scope).href);
    }),
  );
});

// shortcut: a bumped CACHE name is the only way to evict an old shell; Pages serves content-hashed chunks,
// so network-first HTML covers the normal deploy case. Bump it if a release must not run from cache at all.
