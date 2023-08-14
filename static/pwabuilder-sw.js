// 오프라인 경험을 향상시키기 위한 SOL-Dynamic-Caching이 적용된 Service Worker입니다.
const CACHE = "classboard-pwa";
/*
importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);
*/
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
/*
if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
}
*/
self.addEventListener("fetch", (event) => {
    console.log("fetch!");
    event.respondWith(
        (async () => {
            try {
                const preloadResp = await event.preloadResponse;

                if (preloadResp) {
                    return preloadResp;
                }

                const networkResp = await fetch(event.request);
                console.log("using network...", event.request.url);
                let url = new URL(event.request.url);

                if (url.searchParams.get("nocache")) return networkResp;
                if (
                    [
                        "www.google-analytics.com",
                        "www.googletagmanager.com",
                    ].includes(url.hostname)
                )
                    return networkResp;
                if (url.pathname.startsWith("/login")) return networkResp;

                const cache = await caches.open(CACHE);
                await cache.put(event.request.url, networkResp.clone());
                return networkResp;
            } catch (error) {
                console.log("using cache...", event.request.url);
                const cache = await caches.open(CACHE);
                const cachedResp = await cache.match(event.request.url);
                console.log(cachedResp);
                return cachedResp;
            }
        })()
    );
});
