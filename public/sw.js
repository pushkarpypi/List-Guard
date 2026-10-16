self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
});

self.addEventListener("fetch", (event) => {
  // A minimal pass-through service worker to qualify for PWA installability.
  // In a robust scenario, we would use Workbox to cache the /app/dashboard static assets.
  event.respondWith(fetch(event.request));
});
