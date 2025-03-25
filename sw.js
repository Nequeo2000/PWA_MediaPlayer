const putInCache = async (request, response) => {
    const cache = await caches.open("v1");
    await cache.put(request, response);
};

const fetchFirst = async (request) => {
    let abortController = new AbortController();
    let signal = abortController.signal;
    setTimeout(()=>{abortController.abort();},100);

    try {
        let response = await fetch(request, {signal});
        if(response.ok){
            putInCache(request, response.clone());
            return response;
        }     
    } catch (error) {
        const responseFromCache = await caches.match(request);
        if (responseFromCache) {
            return responseFromCache;
        }
    }
};

self.addEventListener("fetch", (event) => {
    event.respondWith(fetchFirst(event.request));
});