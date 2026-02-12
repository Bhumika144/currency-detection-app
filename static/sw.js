const CACHE_NAME = "currency-assistant-v1";

const urlsToCache = [
    "/",                               // Root page
    "/static/css/style.css",
    "/static/js/main.js",
    "/static/js/camera.js",
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png"
];

// Install SW and cache files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate SW
self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

// Fetch handler
self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .then(res => res)
            .catch(() => caches.match(event.request)
                .then(res => res || caches.match("/")))
    );
});
