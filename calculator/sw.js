/*
 * Service worker: keeps the calculator working with no network at all.
 * Bump CACHE_NAME whenever the assets below change, so installed copies update.
 */
var CACHE_NAME = "calculator-v1";

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
        caches.match(request).then(function (cached) {
            if (cached) return cached;

            return fetch(request).then(function (response) {
                if (response && response.status === 200 && response.type === "basic") {
                    var copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                }
                return response;
            }).catch(function () {
                // Offline and unseen: a page request still gets the app shell.
                if (request.mode === "navigate") return caches.match("./index.html");
                return Response.error();
            });
        })
    );
});
