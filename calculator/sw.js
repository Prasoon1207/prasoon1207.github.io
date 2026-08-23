/*
 * Service worker: keeps the calculator working with no network at all.
 *
 * Requests are served from the cache first so launching is instant, then
 * refreshed from the network in the background. A deploy therefore reaches
 * installed copies on their next launch without anyone having to remember to
 * bump a version. CACHE_NAME only needs changing to evict files that have been
 * renamed or removed.
 */
var CACHE_NAME = "calculator-v2";

var ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./engine.js",
    "./app.js",
    "./manifest.webmanifest",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(names.map(function (name) {
                return name === CACHE_NAME ? null : caches.delete(name);
            }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (event) {
    var request = event.request;
    if (request.method !== "GET") return;
    if (new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(request).then(function (cached) {
                var fresh = fetch(request).then(function (response) {
                    if (response && response.status === 200 && response.type === "basic") {
                        cache.put(request, response.clone());
                    }
                    return response;
                }).catch(function () {
                    if (cached) return cached;
                    // Offline and never seen: a page request still gets the shell.
                    if (request.mode === "navigate") return cache.match("./index.html");
                    return Response.error();
                });

                if (!cached) return fresh;

                // Answer from the cache now, but let the refresh finish so the
                // next launch picks up whatever changed.
                event.waitUntil(fresh);
                return cached;
            });
        })
    );
});
