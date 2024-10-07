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
