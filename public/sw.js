// GDG NCTU Management Platform - Service Worker
const CACHE_NAME = "gdg-nctu-v2.5";
const STATIC_ASSETS = [
  "/favicon.ico",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests, bypass for Supabase API and Next server actions
  if (event.request.method !== "GET" || event.request.url.includes("/rest/v1/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // Fallback to cache if available
          return caches.match(event.request);
        })
      );
    })
  );
});
