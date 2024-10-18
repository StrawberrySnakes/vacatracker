const VERSION = "v4";
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
// function sendMessageToPWD(message) {
//     self.clients.matchAll().then((clients) => {
//         clients.forEach((client) => {
//             client.postMessage(message);
//         });
//     });
// }

// //send message every 10 seconds
// setInterval(() => {
//     sendMessageToPWD({type: "update", data: "New data available"});
// }, 10000);

// self.addEventListener("message", (event) => {
//     console.log("Service worker received message", event.data);

//     event.source.postMessage({
//         type: "reponse",
//         data : "Message received by sw",
//     });
// });

//create a broadcast channel - name here needs to match the name in the sw
const channel = new BroadcastChannel("pwa_channel");

//listen for messages
channel.onmessage = (event) => {
    console.log("Received a massage in Service worker:",event.data);
};

//echo message to PWA
channel.postMessage("Service worker received:" + event.data);

let db;
const dbName = "SyncDatabase";
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("Database error"+event.target.error)
    
}

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Database opened successfully in SW")
};

self.addEventListener("sync", function(event) {
    if(event.teg === "send=data") {
        event.waitUntil(sendDataToServer());
    }
})

function sendDataToServer() {
    return getAllPendingData().then(function(dataList){
        return Promise.all(
            dataList.map(function(item) {
                //simulate sending the data to the 
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if(Math.random() > 0.1) { //90% success rate
                            console.log("Data sent successfully", item.data);
                            resolve(item.id);
                        } else {
                            console.log("Failed to send data", item.data);
                            reject(new Error("failed to send data"))
                        }
                    }, 1000);
                })
                .then(function(){
                    //if successful, remove the item from the db
                    return removeDataFromIndexDB(item.id);
                });
            }) 
        );
    })
}//send data to server

function getAllPendingData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["pendingData"], "readonly");
        const objectStore = transaction.objectStore("pendingData");
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject("Error fetching data: " + event.target.error);
        };
    });
} //promise


function removeDataFromIndexedDB(id) {
    return new Promise((resolve, reject) => {
          const transaction = db.transaction(["pendingData"], "readwrite");
          const objectStore = transaction.objectStore("pendingData");
          const request = objectStore.delete(id);

           request.onsuccess = function (event) {
                 resolve();
           };

           request.onerror = function (event) {
               reject("Error removing data: " + event.target.error);
          };
      });
}
