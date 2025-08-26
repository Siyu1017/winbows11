const appRegistry = {
    apps: {
        'explorer': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
            icon: 'C:/Winbows/icons/folders/explorer.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wrt',
            configurable: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.wrt'
        },
        'edge': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
            icon: 'C:/Winbows/icons/applications/tools/edge.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt'
        },
        'edgebeta': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
            icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt'
        },
        'store': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
            icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wrt'
        },
        'cmd': {
            path: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/',
            icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
            script: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt'
        },
        'notepad': {
            path: 'C:/Program Files/Notepad/',
            icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
            script: 'C:/Program Files/Notepad/app.wrt'
        },
        'calculator': {
            path: 'C:/Program Files/Calculator/',
            icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
            script: 'C:/Program Files/Calculator/app.wrt'
        },
        'paint': {
            path: 'C:/Program Files/Paint/',
            icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
            script: 'C:/Program Files/Paint/app.wrt'
        },
        'info': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
            icon: 'C:/Winbows/icons/emblems/info.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.wrt',
            autoExecute: true
        },
        'code': {
            path: 'C:/Program Files/VSCode/',
            icon: 'C:/Winbows/icons/applications/office/code.ico',
            script: 'C:/Program Files/VSCode/app.wrt'
        },
        'taskmgr': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
            icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.wrt'
        },
        'settings': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
            icon: 'C:/Winbows/icons/applications/tools/settings.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.wrt'
        },
        'fpsmeter': {
            path: 'C:/Program Files/FPS Meter/',
            icon: 'C:/Program Files/FPS Meter/favicon.ico',
            script: 'C:/Program Files/FPS Meter/app.wrt'
        },
        'photos': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
            icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.wrt'
        },
        'network-listener': {
            path: 'C:/Program Files/Network Listener/',
            icon: 'C:/Winbows/icons/files/program.ico',
            script: 'C:/Program Files/Network Listener/app.wrt'
        },
        'json-viewer': {
            path: 'C:/Program Files/JSON Viewer/',
            icon: 'C:/Program Files/JSON Viewer/json-viewer.svg',
            script: 'C:/Program Files/JSON Viewer/app.wrt'
        },
        'notepad': {
            path: 'C:/Program Files/Notepad/',
            icon: 'C:/Program Files/Notepad/favicon.ico',
            script: 'C:/Program Files/Notepad/app.wrt'
        }
    },
    install: () => { },
    uninstall: () => { },
    update: () => { },
    getInfo: (name) => {
        if (!appRegistry.apps[name]) {
            return {};
        }
        return appRegistry.apps[name];
    },
    getIcon: (path) => {
        var icon = 'C:/Winbows/icons/files/program.ico';
        Object.values(appRegistry.apps).forEach(app => {
            // console.log(app.path, app.icon);
            if (path.startsWith(app.path)) {
                icon = app.icon || 'C:/Winbows/icons/files/program.ico';
            }
        })
        return icon;
    },
    getApp: (path) => {
        var app = {};
        Object.values(appRegistry.apps).forEach((current, i) => {
            // console.log(current.path);
            if (path.startsWith(current.path)) {
                app = current;
                app.name = Object.keys(appRegistry.apps)[i];
            }
        })
        return app;
    },
    exists: (name) => {
        return !!appRegistry.apps[name] || appRegistry.getApp(name) != {};
    }
}

export { appRegistry };