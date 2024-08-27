// sw.js
const STATIC_NAME = 'winbows11-cache-' + Date.now();

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_NAME).then((cache) => {
            return cache.addAll([
                './index.html',
                './index.js',
                './index.css',
                './favicon.ico'
            ])
        }).then(() => {
            return self.skipWaiting();
        })
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName != STATIC_NAME).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    )
    clients.claim();
    console.log('Cache updated.')
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            const res = await caches.match(event.request)
            return res ? res : fetch(event.request)
        })()
    )
})