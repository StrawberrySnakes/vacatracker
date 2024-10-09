const VERSION = "v2";
// offline resource list
const APP_STATIC_RESOURCES = [
    "index.html",
    "style.css",
    "app.js",
    "vacationtracker.json",
    "assets/icons/icon-512x512.png"
];

const CACHE_NAME = `vacation-tracker-${VERSION}`;

// Save cache on installation
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            // Open the cache
            const cache = await caches.open(CACHE_NAME);
            // Add all resources to cache
            await cache.addAll(APP_STATIC_RESOURCES);
        })()
    );
});

// Delete old caches on activation
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
            await self.clients.claim();
        })()
    );
});

// Intercept requests and serve cached responses
self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME); // Open the cache

            // Try to get the resource from the cache
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // If not in cache, try to fetch from network
            try {
                const networkResponse = await fetch(event.request);
                // Cache the new response
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (error) {
                console.log("Fetch failed; returning offline page instead.", error);
                // If the request is for navigation, return the cached index.html
                if (event.request.mode === "navigate") {
                    return cache.match("/index.html");
                }
                throw error; // Re-throw the error for other types of requests
            }
        })()
    );
});

//send a message to the client -- we will use to update data later 
function sendMessageToPWD(message) {
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage(message);
        });
    });
}

//send message every 10 seconds
setInterval(() => {
    sendMessageToPWD({type: "update", data: "New data available"});
}, 10000);

self.addEventListener("message", (event) => {
    console.log("Service worker received message", event.data);

    event.source.postMessage({
        type: "reponse",
        data : "Message received by sw",
    });
});
