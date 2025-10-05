import { getScheme } from "./shell/shellUtils.js";
import { fsUtils } from "../../shared/fs.js";

function generateAppSeed({ appName, basePath, contentPath }) {
    let seed = null;

    const nAppName = getScheme(appName);
    const nBasePath = fsUtils.normalize(basePath || '');
    const nContentPath = fsUtils.normalize(contentPath || '');

    if (nAppName) {
        seed = nAppName;
        if (nBasePath) seed += '|' + nBasePath;
    } else if (nBasePath) {
        seed = nBasePath;
    } else if (nContentPath) {
        seed = nContentPath;
    } else {
        seed = 'tmp-' + Math.random().toString(36).slice(2, 10);
    }

    return seed;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return 'app-' + Math.abs(hash).toString(36);
}

function generateAppId({ appName, basePath, contentPath }) {
    const seed = generateAppSeed({ appName, basePath, contentPath });
    return simpleHash(seed);
}

const defaultData = {

}
const appRegistry = {};
const apps = {
    'explorer': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
        icon: 'C:/Winbows/icons/folders/explorer.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wrt',
        configScript: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.wrt'
    },
    'edge': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
        icon: 'C:/Winbows/icons/applications/tools/edge.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt'
    },
    'edgebeta': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
        icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt'
    },
    'store': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
        icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wrt'
    },
    'cmd': {
        basePath: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/',
        icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
        entryScript: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt'
    },
    'notepad': {
        basePath: 'C:/Program Files/Notepad/',
        icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
        entryScript: 'C:/Program Files/Notepad/app.wrt'
    },
    'calculator': {
        basePath: 'C:/Program Files/Calculator/',
        icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
        entryScript: 'C:/Program Files/Calculator/app.wrt'
    },
    'paint': {
        basePath: 'C:/Program Files/Paint/',
        icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
        entryScript: 'C:/Program Files/Paint/app.wrt'
    },
    'info': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
        icon: 'C:/Winbows/icons/emblems/info.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.wrt',
        autoExecute: true
    },
    'code': {
        basePath: 'C:/Program Files/VSCode/',
        icon: 'C:/Winbows/icons/applications/office/code.ico',
        entryScript: 'C:/Program Files/VSCode/app.wrt'
    },
    'taskmgr': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
        icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.wrt'
    },
    'settings': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
        icon: 'C:/Winbows/icons/applications/tools/settings.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.wrt'
    },
    'fpsmeter': {
        basePath: 'C:/Program Files/FPS Meter/',
        icon: 'C:/Program Files/FPS Meter/favicon.ico',
        entryScript: 'C:/Program Files/FPS Meter/app.wrt'
    },
    'photos': {
        basePath: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
        icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
        entryScript: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.wrt'
    },
    'network-listener': {
        basePath: 'C:/Program Files/Network Listener/',
        icon: 'C:/Winbows/icons/files/program.ico',
        entryScript: 'C:/Program Files/Network Listener/app.wrt'
    },
    'json-viewer': {
        basePath: 'C:/Program Files/JSON Viewer/',
        icon: 'C:/Program Files/JSON Viewer/json-viewer.svg',
        entryScript: 'C:/Program Files/JSON Viewer/app.wrt'
    },
    'debuglog-parser': {
        basePath: 'C:/User/Documents/sdk-v1/examples/winbows-debuglog-parser-demo/',
        icon: 'C:/Winbows/icons/files/program.ico',
        entryScript: 'C:/User/Documents/sdk-v1/examples/winbows-debuglog-parser-demo/app.wrt'
    },
};

// Initialize
Object.keys(apps).forEach(appName => {
    const app = apps[appName];
    if (!app.appId) app.appId = generateAppId(appName, app.basePath, app.entryScript);
    if (!app.appName) app.appName = appName;
})

appRegistry.install = () => { };
appRegistry.uninstall = () => { };
appRegistry.update = () => { };

appRegistry.getInfo = (name) => {
    if (!apps[name]) {
        return {};
    }
    return apps[name];
}

appRegistry.getIcon = (path) => {
    const app = Object.values(apps).find(a => path.startsWith(a.basePath));
    return app?.icon || 'C:/Winbows/icons/files/program.ico';
}

appRegistry.getApp = (path) => {
    if (!path || typeof path !== 'string') return {};
    const keys = Object.keys(apps);
    const app = Object.values(apps).find(a => path.startsWith(a.basePath));
    if (!app) return {};
    return { ...app, name: keys.find(k => apps[k] === app) };
}

/**
 * @typedef {Object} TaskbarIconData
 * @property {string} appId
 * @property {'system'|'app'} type
 */
/**
 * @param {string} appName 
 * @param {string} basePath 
 * @param {string} entryScript 
 * @returns {TaskbarIconData}
 */
appRegistry.generateProfile = (appName, basePath, entryScript) => {
    const app = appRegistry.getApp(entryScript)
    return {
        appId: app.appId ?? generateAppId(appName, basePath, entryScript),
        type: 'app'
    }
}

appRegistry.getData = (appId) => {
    return Object.values(apps).find(app => app.appId == appId);
}

appRegistry.exists = (name) => !!apps[name] || Object.keys(apps).some(k => apps[k].path === name);

export default appRegistry;