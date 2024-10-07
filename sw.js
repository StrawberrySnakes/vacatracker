const VERSION  = "v1";
//offline resource list

// put in things you want cashed
const APP_STATIC_RESOURCES = [
    "index.html",
    "style.css",
    "app.js",
    "vacationtracker.json",
    "assets/icons/icon-512x512.png"
];

//this way you can delete old caches and other things
const CACHE_NAME = `vacation-tracker-${VERSION}`;

//save cache on installation 
// handle the install event and retrieve and store the file listed for the cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            //try to open a cache wait till it's done
            const cache = await cashes.open(CACHE_NAME);
            cache.addAll(APP_STATIC_RESOURCES);
        })()
    );
});

// use the activated event to delete any old caches so we dont run out of space. 
// We're going to delete all but the current one. 
// Then set the service worker as the controller for our app (pwa). 
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async ()=>{
            //get names of existing caches
            const names = await caches.keys();
            //iterate through list and check each to see it is the current cache
            //and delete it if it is not
            await Promise.all(
                names.map((name) => {
                    if(name !== CACHE_NAME) {
                        return cashes.delete(name);
                    }
                })
            ); //promise all

            //use the claim() method of the client's interface to 
            //enable our service worker as the controller 
            await clients.claim();
        })()
    ); //waitUntil
});

// use the fethch event to intercept requests to the server so we can serve up our cached pages or respond with an error for 404
self.addEventListener("fetch", (event) => {
    event.respondWith( (async () => {
            //try to get the resource from the cache
            const cashedResponse = await cache.match(event.request);
            if (cashedResponse) {
                return cashedResponse;
            }

            try {
                const networkResponse = await fetch(event.request);
                //cache the new response for future use
                cache.put(event.request, networkResponse.clone());

                return networkResponse;

            } catch (error) {

                console.log("Fetch failed; returning offline page instead.", error);

                //if the request is for a page, return index.html as a fallback
                if (event.request.mode === "navigate") {
                    return cache.match("/index.html");
                }

                // for everything else, we're just going to throw and error 
                //you might want to return a default offline asset instead
                throw error; 
            }
        })()
    ); //respond with
}); //fetch