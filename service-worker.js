const CACHE_NAME = "taiwan-after-dark-offline-v1";
const SITE_ROOT = new URL("./", self.registration.scope).toString();
const HOME_PAGE = new URL("./index.html", self.registration.scope).toString();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([SITE_ROOT, HOME_PAGE]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestURL = new URL(request.url);

  if (request.method !== "GET" ||
      requestURL.origin !== self.location.origin ||
      !requestURL.href.startsWith(self.registration.scope)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
                 (await caches.match(SITE_ROOT)) ||
                 (await caches.match(HOME_PAGE));
        })
    );
  }
});
