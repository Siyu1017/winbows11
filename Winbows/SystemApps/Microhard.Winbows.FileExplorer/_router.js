module.exports = function init() {
    const listeners = {};
    const routerHistory = [];
    let currentIndex = -1;

    function emit(event, details) {
        if (listeners[event]) {
            listeners[event].forEach((callback) => {
                callback(details);
            })
        }
    }

    const router = {
        push: (path) => {
            if (path != routerHistory[currentIndex]) {
                routerHistory.splice(currentIndex + 1)
                routerHistory.push(path);
                console.log(routerHistory);
                currentIndex = routerHistory.length - 1;
                emit('change', {
                    path,
                    type: 'push'
                })
            } else {
                // router.reload();
                // emit('reload', {
                //     path: path,
                //     type: 'reload'
                // })
            }
        },
        reload: () => {
            emit('reload', {
                path: routerHistory[currentIndex],
                type: 'reload'
            })
        },
        replace: (path) => {
            if (routerHistory.length === 0) {
                routerHistory.push(path);
                currentIndex = 0;
            } else {
                routerHistory[currentIndex] = path;
            }
        },
        back: () => {
            if (routerHistory.length > 0 && currentIndex > 0) {
                currentIndex--;
                emit('change', {
                    path: routerHistory[currentIndex],
                    type: 'back'
                })
            }
        },
        forward: () => {
            if (currentIndex < routerHistory.length - 1) {
                currentIndex++;
                emit('change', {
                    path: routerHistory[currentIndex],
                    type: 'forward'
                });
            }
        },
        on: (event, callback) => {
            if (!listeners[event]) {
                listeners[event] = [callback];
            } else {
                listeners[event].push(callback);
            }
        },
        getCurrentRoute: () => {
            return routerHistory[currentIndex];
        },
        get history() {
            return routerHistory;
        },
        get historyIndex() {
            return currentIndex;
        }
    }

    return router;
}; 