const listeners = [];
const routerHistory = [];

export function useRouter() {
    const router = {
        push: (path) => {
            if (path != router.route) {
                routerHistory.push(path);
                listeners.forEach((callback) => {
                    callback(path)
                })
            } else {
                router.reload();
            }
        },
        replace: (path) => {
            router.route = path;

        },
        on: (event, callback) => {
            if (!listeners[event]) {
                listeners[event] = [callback];
            } else {
                listeners[event].push(callback);
            }
        },
        route: '/'
    };
    return router;
}

export function onRouteChange(callback) {
    listeners.push(callback)
}
