

const putInCache = async (request, response) => {
    const cache = await caches.open("audio visualizer");
    await cache.put(request, response);
};

const getFromCache = async (request) => {
    const cache = await caches.open("v1");
    return await cache.match(request);
};

const fetchFirst = async (request) => {
    let abortController = new AbortController();
    let signal = abortController.signal;
    setTimeout(() => { abortController.abort(); }, 100);

    try {
        let response = await fetch(request, { signal });
        if (response.ok) {
            putInCache(request, response.clone());
            return response;
        }
    } catch (error) {
        const responseFromCache = await getFromCache(request);
        if (responseFromCache) {
            return responseFromCache;
        }
    }
};

self.addEventListener("fetch", (event) => {
    event.respondWith(fetchFirst(event.request));
});

self.addEventListener("install", () => {
    e.waitUntil(
        caches.open("mediaPlayerCache").then((cache) => {
            return cache.addAll(
                [
                    "/",
                    "/index.html",
                    "/index.css",
                    "/index.js",
                    "/fileSystemAccessAPI.js",
                    "/filewrite.js",
                    "/manifest.json",
                    "/mediaSessionAPI.js",
                ]
            )
                .then(() => self.skipWaiting())
                .catch((error) => {
                    console.log("Error during install : ", error);
                });
        })
    );
});