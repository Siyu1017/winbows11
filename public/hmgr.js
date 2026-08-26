// Winbows hardware manager service worker.
// NIC emulation deliberately applies only to application traffic. Boot,
// navigation, and worker assets must remain reachable so a disabled Wi-Fi
// toggle can never prevent the OS from starting again.

const hardware = { NIC: true };
const SYSTEM_PATHS = new Set([
    '/', '/index.html', '/favicon.ico', '/hmgr.js',
    '/build.json', '/build-fetch.json', '/install.html', 
    '/404.html'
]);

function getPathname(url) {
    const scopePath = new URL(self.registration.scope).pathname;
    const pathname = new URL(url).pathname;
    if (!pathname.startsWith(scopePath)) return pathname;
    return '/' + pathname.slice(scopePath.length).replace(/^\/+/, '');
}

function isSystemRequest(request) {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    if (request.mode === 'navigate') return true;

    const path = getPathname(url);
    return SYSTEM_PATHS.has(path)
        || path.startsWith('/Winbows/System/kernel/')
        || path.startsWith('/Winbows/System/styles/');
}

async function broadcast(type, value) {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type, value }));
}

function requestDetails(request, clientId) {
    return {
        id: crypto.randomUUID(),
        url: request.url,
        method: request.method,
        destination: request.destination,
        clientId
    };
}

async function replyState(port) {
    const state = { ...hardware };
    if (port) port.postMessage({ type: 'HMGR:STATE', value: state });
    await broadcast('HMGR:STATE', state);
}

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    const { request, clientId } = event;
    const details = requestDetails(request, clientId);
    event.waitUntil(broadcast('NIC:REQUEST:SENT', details));

    event.respondWith((async () => {
        // Never emulate an offline NIC for OS boot/navigation resources.
        if (isSystemRequest(request) || hardware.NIC) {
            try {
                const response = await fetch(request);
                void broadcast('NIC:REQUEST:RECEIVED', {
                    ...details,
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                return response;
            } catch (error) {
                void broadcast('NIC:REQUEST:RECEIVED', {
                    ...details,
                    status: 0,
                    statusText: error instanceof Error ? error.message : 'Network error',
                    ok: false
                });
                throw error;
            }
        }

        event.waitUntil(broadcast('NIC:REQUEST:RECEIVED', {
            ...details,
            status: 0,
            statusText: 'NIC is disabled',
            ok: false
        }));
        return Response.error();
    })());
});

self.addEventListener('message', event => {
    const message = event.data;
    if (!message || typeof message.type !== 'string') return;

    if (message.type === 'HMGR:SET_HARDWARE') {
        const { hardware: name, enabled } = message.value || {};
        if (typeof name === 'string' && name.toUpperCase() in hardware && typeof enabled === 'boolean') {
            hardware[name.toUpperCase()] = enabled;
        }
        event.waitUntil(replyState(event.ports[0]));
        return;
    }

    if (message.type === 'HMGR:GET_STATE') {
        event.waitUntil(replyState(event.ports[0]));
        return;
    }

    // Temporary compatibility with pages still using the original protocol.
    if ((message.type === 'ENABLE' || message.type === 'DISABLE') && typeof message.value === 'string') {
        const name = message.value.toUpperCase();
        if (name in hardware) hardware[name] = message.type === 'ENABLE';
        event.waitUntil(replyState(event.ports[0]));
    }
});
