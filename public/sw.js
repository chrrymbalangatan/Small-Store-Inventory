const CACHE = "sari-static-v3";
const PRODUCTS = Array.from(
  { length: 37 },
  (_, i) => `/img/products/product-${String(i + 1).padStart(2, "0")}.webp`,
);
const FONTS = [
  ...[400, 500, 600, 700].map((w) => `/fonts/dm-sans-${w}.ttf`),
  ...[400, 500, 600, 700, 800].map((w) => `/fonts/manrope-${w}.ttf`),
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch("/", { cache: "reload" });
      if (!response.ok) throw new Error("App shell unavailable");
      const html = await response.clone().text();
      await cache.put("/", response);
      const assets = [
        ...html.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g),
      ].map((m) => m[1]);
      await cache.addAll([
        ...new Set([
          "/offline.html",
          "/manifest.webmanifest",
          "/icon.svg",
          "/store-illustration.svg",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/icons/apple-touch-icon.png",
          ...assets,
          ...FONTS,
          ...PRODUCTS,
        ]),
      ]);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith("sari-static-") && name !== CACHE)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET")
    return;
  // Saved inventory and uploaded photos always require the server. No private data is cached.
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response.ok && url.pathname === "/") {
            const cache = await caches.open(CACHE);
            await cache.put("/", response.clone());
          }
          return response;
        } catch {
          return (
            (await caches.match("/")) || (await caches.match("/offline.html"))
          );
        }
      })(),
    );
    return;
  }
  if (
    /^\/(assets\/|fonts\/|img\/products\/|icons\/|icon\.svg|store-illustration\.svg|manifest\.webmanifest)/.test(
      url.pathname,
    )
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      })(),
    );
  }
});
