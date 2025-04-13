// sw.js
const STATIC_NAME = 'winbows11-cache-' + Date.now();
const requiredFiles = [
    '/fs.js',
    '/index.html',
    '/index.js',
    '/index.css',
    '/favicon.ico',
    '/install.css',
    '/install.js',
    '/install.html',
    '/repair.css',
    '/repair.js',
    '/repair.html',
    '/build.json',
    '/build-fetch.json',
    '/'
]

var hardwares = {
    'NIC': {
        enabled: true
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_NAME).then((cache) => {
            return cache.addAll([
                './fs.js',
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
            const requestID = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NIC:REQUEST:SENT', value: {
                            url: event.request.url,
                            method: event.request.method,
                            headers: [...event.request.headers],
                            body: event.request.body,
                            destination: event.request.destination,
                            id: requestID
                        }
                    });
                });
            });
            const start = self.location.protocol + '//' + self.location.hostname + (self.location.port ? ':' + self.location.port : '');
            const request = fetch(event.request);
            request.then(res => {
                var url = event.request.url;
                if (url.startsWith(start)) {
                    url = url.replace(start, '')
                }
                /*
                if (res.ok) {
                    console.log(`%c[HMGR] %c${event.request.method} %c${url} %c${res.status}`, 'color:#ff00ff', 'all:initial', 'color:#86b7ff', 'color:#58ff31;');
                } else {
                    console.log(`%c[HMGR] %c${event.request.method} %c${url} %c${res.status}`, 'color:#ff00ff', 'all:initial', 'color:#86b7ff', 'color:red;');
                }
                    */

                res.clone().arrayBuffer().then(data => {
                    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
                        clients.forEach((client) => {
                            client.postMessage({
                                type: 'NIC:REQUEST:RECEIVED', value: {
                                    url: event.request.url,
                                    method: event.request.method,
                                    status: res.status,
                                    statusText: res.statusText,
                                    headers: [...res.headers],
                                    body: event.request.body,
                                    response: data,
                                    ok: res.ok,
                                    id: requestID
                                }
                            });
                        });
                    })
                })
            })
            if (hardwares['NIC'].enabled == true || requiredFiles.includes(event.url.replace(start, ''))) {
                return request;
            } else {
                self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'NIC:REQUEST:RECEIVED', value: {
                                url: event.request.url,
                                method: event.request.method,
                                status: 0,
                                statusText: 0,
                                headers: [],
                                body: event.request.body,
                                response: null,
                                ok: false,
                                id: requestID
                            }
                        });
                    });
                })
                return Response.error();
            }
        })()
    )
})

self.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type) {
        switch (data.type) {
            case 'ENABLE':
                if (hardwares[data.value]) {
                    hardwares[data.value].enabled = true;
                }
                break;
            case 'DISABLE':
                if (hardwares[data.value]) {
                    hardwares[data.value].enabled = false;
                }
                break;
            default:
                console.log(`Unhandled message type: ${data.type}`);
        }
    }
    // console.log(event);
})