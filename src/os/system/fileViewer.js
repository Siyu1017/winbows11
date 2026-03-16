import { fsUtils } from "../../shared/fs.js";

const fileViewers = {
    // Deprecated Method : fileViewers.viewers
    viewers: {
        '*': '',
        '.css': ['code'],
        '.js': ['code'],
        '.html': ['code', 'edge'],
        '.txt': ['code'],
        '.jpg': ['mediaplayer', 'edge', 'photos'],
        '.jpeg': ['mediaplayer', 'edge', 'photos'],
        '.png': ['mediaplayer', 'edge', 'photos'],
        '.gif': ['mediaplayer', 'edge', 'photos'],
        '.webp': ['mediaplayer', 'edge', 'photos'],
        '.bmp': ['mediaplayer', 'edge', 'photos'],
        '.svg': ['mediaplayer', 'edge', 'photos'],
        '.ico': ['mediaplayer', 'edge', 'photos'],
        '.pdf': [],
        '.json': ['code'],
        '.xml': ['code'],
        '.zip': [],
        '.tar': [],
        '.gz': [],
        '.mp3': ['mediaplayer'],
        '.wav': ['mediaplayer'],
        '.ogg': ['mediaplayer'],
        '.mp4': ['mediaplayer'],
        '.webm': ['mediaplayer'],
        '.avi': ['mediaplayer'],
        '.mov': ['mediaplayer'],
        '.link': ['edge']
    },
    defaultViewers: {
        '.css': 'code',
        '.js': 'code',
        '.html': 'edge',
        '.link': 'edge',
        '.json': 'json-viewewr'
    },
    registeredViewers: {
        'code': {
            name: 'Visual Studio Code',
            script: 'C:/Program Files/VSCode/app.wrt',
            accepts: [/*'css', 'js', 'jsx', 'ts', 'ejs', 'html', 'txt', 'json', 'xml', 'py', 'java', 'c', 'h', */'*']
        },
        'edge': {
            name: 'Microhard Edge',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt',
            accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
        },
        'edgebeta': {
            name: 'Microhard Edge BETA',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt',
            accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
        },
        'photos': {
            name: 'Photos',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.wrt',
            accepts: ['*']
        },
        'mediaplayer': {
            name: 'MediaPlayer',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.MediaPlayer/app.wrt',
            accepts: ['.mp3', '.wav', '.ogg', '.mp4', '.webm', '.avi', '.mov']
        },
        'json-viewer': {
            name: 'JSON Viewer',
            script: 'C:/Program Files/JSON Viewer/app.wrt',
            accepts: ['.json']
        },
        'notepad': {
            name: 'Notepad',
            script: 'C:/Program Files/Notepad/app.wrt',
            accepts: ['*']
        }
    },
    isRegisterd: (name) => {
        return fileViewers.registeredViewers.hasOwnProperty(name);
    },
    updateViewer: (viewer, prop, value) => {
        if (fileViewers.isRegisterd(viewer)) {
            fileViewers.registeredViewers[viewer][prop] = value;
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(fileViewers.registeredViewers));
        }
    },
    registerViewer: (viewer, name, script, accepts) => {
        if (!fileViewers.isRegisterd(viewer)) {
            fileViewers.registeredViewers[viewer] = {
                name: name,
                script: script,
                accepts: accepts
            };
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(fileViewers.registeredViewers));
    },
    deregisterViewer: (viewer) => {
        if (fileViewers.isRegisterd(viewer)) {
            delete fileViewers.registeredViewers[viewer];
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(fileViewers.registeredViewers));
    },
    // Deprecated Method
    setViewer: (extension, app) => {
        if (!fileViewers.viewers[extension]) {
            fileViewers.viewers[extension] = [];
        }
        fileViewers.viewers[extension].push(app);
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(fileViewers.viewers));
        console.warn('%cfileViewers.setViewer()%c has been deprecated.\nPlease use %cfileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    // Deprecated Method
    unsetViewer: (extension, app) => {
        var index = fileViewers.viewers[extension].indexOf(app);
        if (index != -1) {
            fileViewers.viewers[extension].splice(index, 1);
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(fileViewers.viewers));
        console.warn('%cfileViewers.unsetViewer()%c has been deprecated.\nPlease use %cfileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    setDefaultViewer: (extension, app) => {
        var exists = false;
        Object.keys(fileViewers.registeredViewers).forEach(viewer => {
            if (viewer == app || fileViewers.registeredViewers[viewer] == app) {
                exists = viewer;
            }
        })
        if (exists != false) {
            fileViewers.defaultViewers[extension] = exists;
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(fileViewers.defaultViewers));
    },
    unsetDefaultViewer: (extension, app) => {
        if (fileViewers.defaultViewers[extension]) {
            fileViewers.defaultViewers.splice(fileViewers.defaultViewers.indexOf(app), 1)
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(fileViewers.defaultViewers));
    },
    getDefaultViewer: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var viewer = fileViewers.defaultViewers[extension];
        if (!viewer) {
            return null;
        } else {
            return fileViewers.registeredViewers[viewer];
        }
    },
    getViewers: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var accepted = ['*', extension];
        if (extension == '') {
            accepted = ['*'];
        }
        var viewers = {};
        Object.keys(fileViewers.registeredViewers).forEach(viewer => {
            if (window.modes.debug == true) {
                console.log(fileViewers.registeredViewers[viewer])
            }
            if (fileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                viewers[viewer] = fileViewers.registeredViewers[viewer];
            }
        })
        if (window.modes.debug == true) {
            console.log(file, extension, viewers)
        }
        return viewers;
    }
}

if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS') && window.modes.dev == false) {
    fileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(fileViewers.viewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS') && window.modes.dev == false) {
    fileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(fileViewers.defaultViewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS') && window.modes.dev == false) {
    fileViewers.registeredViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(fileViewers.registeredViewers));
}

export default fileViewers;