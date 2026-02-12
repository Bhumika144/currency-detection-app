const CACHE_NAME = "currency-assistant-v1";

const urlsToCache = [
    "/",
    "/static/css/style.css",
    "/static/js/main.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
