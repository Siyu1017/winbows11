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

export const router = {
    push: (path) => {
        if (path != routerHistory[currentIndex]) {
            routerHistory.splice(currentIndex + 1)
            routerHistory.push(path);
            console.log(routerHistory);
            currentIndex = routerHistory.length - 1;
            emit('change', {
                path: path,
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
        // 
    },
    replace: (path) => {
        // router.route = path;

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
    on: (event, callback) => {
        if (!listeners[event]) {
            listeners[event] = [callback];
        } else {
            listeners[event].push(callback);
        }
    },
    getCurrentRoute: () => {
        return routerHistory[currentIndex];
    }
}
