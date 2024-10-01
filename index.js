'use strict';

!(async () => {
    Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; }

    const path = {
        compilers: 'Winbows/System/compilers',
        components: 'Winbows/System/components',
        fonts: 'Winbows/fonts',
        icons: 'Winbows/icons',
        logs: 'Winbows/System/Logs',
        themes: 'Winbows/themes',
        ui: 'Winbows/System/ui'
    }
    const debuggerMode = false;
    const devMode = (getJsonFromURL()['dev'] || getJsonFromURL()['develop']) ? true : false;

    // Loading
    var loadingContainer = document.createElement('div');
    var loadingImage = document.createElement('div');
    var loadingSpinner = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    loadingContainer.className = 'winbows-loading active';
    loadingImage.className = 'winbows-loading-image';
    loadingSpinner.setAttribute('class', 'winbows-loading-spinner');
    loadingSpinner.setAttribute('width', 48);
    loadingSpinner.setAttribute('height', 48);
    loadingSpinner.setAttribute('viewBox', "0 0 16 16");
    loadingSpinner.innerHTML = '<circle cx="8px" cy="8px" r="7px"></circle>';

    loadingContainer.appendChild(loadingImage);
    loadingContainer.appendChild(loadingSpinner);
    document.body.appendChild(loadingContainer);

    // Lock panel
    var screenLockContainer = document.createElement('div');
    var screenLock = document.createElement('div');
    var screenLockBackground = document.createElement('div');
    var screenLockMain = document.createElement('div');
    var screenLockSignin = document.createElement('div');

    screenLockContainer.className = 'screen-lock-container active';
    screenLock.className = 'screen-lock';
    screenLockBackground.className = 'screen-lock-background';
    screenLockMain.className = 'screen-lock-main';
    screenLockSignin.className = 'screen-lock-signin';

    document.body.appendChild(screenLockContainer);
    screenLockContainer.appendChild(screenLock);
    screenLock.appendChild(screenLockBackground);
    screenLock.appendChild(screenLockMain);
    screenLock.appendChild(screenLockSignin);

    // Clock on lock panel
    var screenLockTime = document.createElement('div');
    var screenLockDate = document.createElement('div');

    screenLockTime.className = 'screen-lock-time';
    screenLockDate.className = 'screen-lock-date';

    screenLockMain.appendChild(screenLockTime);
    screenLockMain.appendChild(screenLockDate);

    // Signin panel
    var screenLockSigninAvatar = document.createElement('div');
    var screenLockSigninUsername = document.createElement('div');
    var screenLockSigninButton = document.createElement('button');

    screenLockSigninAvatar.className = 'screen-lock-signin-avatar';
    screenLockSigninUsername.className = 'screen-lock-signin-username';
    screenLockSigninButton.className = 'screen-lock-signin-button';

    screenLockSignin.appendChild(screenLockSigninAvatar);
    screenLockSignin.appendChild(screenLockSigninUsername);
    screenLockSignin.appendChild(screenLockSigninButton);

    // Screen of winbows
    var screen = document.createElement('div');
    var background = document.createElement('div');
    var backgroundImage = document.createElement('div');
    var appWrapper = document.createElement('div');

    screen.className = 'screen';
    background.className = 'background';
    backgroundImage.className = 'background-image';
    appWrapper.className = 'app-wrapper';

    document.body.appendChild(screen);
    screen.appendChild(background);
    screen.appendChild(appWrapper);
    background.appendChild(backgroundImage);

    // Desktop 
    var desktop = document.createElement('div');
    var desktopItems = document.createElement('div');

    desktop.className = 'desktop';
    desktopItems.className = 'desktop-items';

    appWrapper.appendChild(desktop);
    desktop.appendChild(desktopItems);

    // Functions
    window.mainDisk = 'C';
    window.System = {};
    window.System.build = localStorage.getItem('WINBOWS_BUILD_ID') || 'UNKNOWN';
    window.System.listeners = {};
    window.System.processes = {};
    window.System.addEventListener = (event, listener) => {
        if (!window.System.listeners[event]) {
            window.System.listeners[event] = [];
        }
        window.System.listeners[event].push(listener);
    }
    window.System.removeEventListener = (event, listener) => {
        if (!window.System.listeners[event]) {
            return;
        }
        window.System.listeners[event].forEach((item, i) => {
            if (item == listener) {
                window.System.listeners[event].splice(i, 1);
            }
        })
    }
    window.System.triggerEvent = (event, details) => {
        if (window.System.listeners[event]) {
            window.System.listeners[event].forEach(listener => {
                listener(details);
            })
        }
    }
    window.workerModules = {};
    window.utils = {};
    window.debuggers = {
        getStackTrace
    }

    // Check updates
    /*
    try {
        await fetch('https://api.github.com/repos/Siyu1017/winbows11/commits').then(json => {
            return json.json();
        }).then((res) => {
            var latest = res[0].sha;
            if (latest == window.System.build) {
                // Not to update
            } else {
                console.log('New version available: ', latest);
            }
            window.System.build = res[0].sha;
            localStorage.setItem('WINBOWS_BUILD_ID', window.System.build);
        })
    } catch (e) {
        // Not to update
    }
    */

    function getPosition(element) {
        function offset(el) {
            var rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
        }
        return { x: offset(element).left, y: offset(element).top };
    }

    function getJsonFromURL(url) {
        if (!url) url = location.search;
        var query = url.substr(1);
        var result = {};
        query.split("&").forEach(function (part) {
            var item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    }

    window.utils.getPosition = getPosition;
    window.utils.getJsonFromURL = getJsonFromURL;

    window.fileIcons = {
        getIcon: (path = '') => {
            var ext = utils.getFileExtension(path);
            if (window.fileIcons.registerd[ext]) {
                return window.fileIcons.registerd[ext];
            } else {
                return window.fileIcons.registerd['*'];
            }
        },
        registerd: {
            // Default
            '*': 'C:/Winbows/icons/files/generic.ico',
            'jpg': 'C:/Winbows/icons/files/image.ico',
            'png': 'C:/Winbows/icons/files/image.ico',
            'gif': 'C:/Winbows/icons/files/image.ico',
            'svg': 'C:/Winbows/icons/files/image.ico',
            'webp': 'C:/Winbows/icons/files/image.ico',
            'jpeg': 'C:/Winbows/icons/files/image.ico',
            'ico': 'C:/Winbows/icons/files/image.ico',
            'bmp': 'C:/Winbows/icons/files/image.ico',
            'mp3': 'C:/Winbows/icons/files/audio.ico',
            'wav': 'C:/Winbows/icons/files/audio.ico',
            'ogg': 'C:/Winbows/icons/files/audio.ico',
            'mp4': 'C:/Winbows/icons/files/video.ico',
            'webm': 'C:/Winbows/icons/files/video.ico',
            'avi': 'C:/Winbows/icons/files/video.ico',
            'mov': 'C:/Winbows/icons/files/video.ico',
            'txt': 'C:/Winbows/icons/files/text.ico',
            'exe': 'C:/Winbows/icons/files/program.ico',
            'zip': 'C:/Winbows/icons/folders/zip.ico',
            // Edge
            'html': 'C:/Winbows/icons/applications/tools/edge.ico',
            // VSCode
            'css': 'C:/Program Files/VSCode/File Icons/css.ico',
            'js': 'C:/Program Files/VSCode/File Icons/javascript.ico',
            'json': 'C:/Program Files/VSCode/File Icons/json.ico'
        },
        register: (ext, icon) => {
            if (ext == '*') return;
            window.fileIcons.registerd[ext] = icon;
        }
    }

    window.appRegistry = {
        apps: {
            'explorer': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
                icon: 'C:/Winbows/icons/folders/explorer.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js',
                configurable: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.js'
            },
            'edge': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
                icon: 'C:/Winbows/icons/applications/tools/edge.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.js'
            },
            'edgebeta': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
                icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.js'
            },
            'store': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
                icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.js'
            },
            'cmd': {
                path: 'C:/Program Files/Command/',
                icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
                script: 'C:/Program Files/Command/app.js'
            },
            'notepad': {
                path: 'C:/Program Files/Notepad/',
                icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
                script: 'C:/Program Files/Notepad/app.js'
            },
            'calculator': {
                path: 'C:/Program Files/Calculator/',
                icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
                script: 'C:/Program Files/Calculator/app.js'
            },
            'paint': {
                path: 'C:/Program Files/Paint/',
                icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
                script: 'C:/Program Files/Paint/app.js'
            },
            'info': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
                icon: 'C:/Winbows/icons/emblems/info.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.js',
                autoExecute: true
            },
            'code': {
                path: 'C:/Program Files/VSCode/',
                icon: 'C:/Winbows/icons/applications/office/code.ico',
                script: 'C:/Program Files/VSCode/app.js'
            },
            'taskmgr': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
                icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.js'
            },
            'settings': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
                icon: 'C:/Winbows/icons/applications/tools/settings.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.js'
            },
            'fpsmeter': {
                path: 'C:/Program Files/FPS Meter/',
                icon: 'C:/Program Files/FPS Meter/favicon.ico',
                script: 'C:/Program Files/FPS Meter/app.js'
            },
            'photos': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
                icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.js'
            },
            'network-listener': {
                path: 'C:/Program Files/Network Listener/',
                icon: 'C:/Winbows/icons/files/program.ico',
                script: 'C:/Program Files/Network Listener/app.js'
            },
            'json-viewer': {
                path: 'C:/Program Files/JSON Viewer/',
                icon: 'C:/Winbows/icons/files/program.ico',
                script: 'C:/Program Files/JSON Viewer/app.js'
            }
        },
        install: () => { },
        uninstall: () => { },
        update: () => { },
        getInfo: (name) => {
            if (!window.appRegistry.apps[name]) {
                return {};
            }
            return window.appRegistry.apps[name];
        },
        getIcon: (path) => {
            var icon = 'C:/Winbows/icons/files/program.ico';
            Object.values(window.appRegistry.apps).forEach(app => {
                // console.log(app.path, app.icon);
                if (path.startsWith(app.path)) {
                    icon = app.icon || 'C:/Winbows/icons/files/program.ico';
                }
            })
            return icon;
        },
        getApp: (path) => {
            var app = {};
            Object.values(window.appRegistry.apps).forEach((current, i) => {
                // console.log(current.path);
                if (path.startsWith(current.path)) {
                    app = current;
                    app.name = Object.keys(window.appRegistry.apps)[i];
                }
            })
            return app;
        },
        exists: (name) => {
            return !!window.appRegistry.apps[name] || window.appRegistry.getApp(name) != {};
        }
    }

    window.Winbows = {};
    window.Winbows.Screen = screen;
    window.Winbows.AppWrapper = appWrapper;

    window.Components = {};
    window.Compilers = {};
    window.Crash = (err) => {
        console.log(err)
        try {
            document.body.innerHTML = `<div class="bsod"><div class="bsod-container"><h1 style="font-size: 6rem;margin: 0 0 2rem;font-weight: 300;">:(</h1><div style="font-size:1.375rem">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</div></div>`;
        } catch (e) {
            console.error(e);
        }
        throw new Error('Winbows has been crashed...');
    }

    window.utils.replaceHTMLTags = (content = '') => {
        return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }
    window.utils.getFileName = (path = '') => {
        return path.split('/').slice(-1)[0];
    }
    window.utils.getFileExtension = function (file = '') {
        file = window.utils.getFileName(file);
        if (file.indexOf('.') > -1) {
            return file.split('.').pop();
        } else {
            return '';
        }
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime'
    };

    function getMimeType(extension) {
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    window.utils.getMimeType = getMimeType;

    // File System Class
    !(() => {
        class IDBFS {
            constructor(dbName, mainDisk = 'C') {
                this.dbName = dbName;
                this.db = null;
                this.mainDisk = mainDisk;
                this.disks = [];
                this.debuggerMode = debuggerMode;
            }

            async init() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName);
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        const store = db.createObjectStore(this.mainDisk, { keyPath: 'path' });
                        store.createIndex('path', 'path', { unique: true });
                    };
                    request.onsuccess = async (event) => {
                        this.db = event.target.result;
                        var mainDiskExist = false;
                        Array.from(event.target.result.objectStoreNames).forEach(async name => {
                            if (name === this.mainDisk) {
                                mainDiskExist = true;
                            }
                            this.disks.push(name);
                        });
                        if (mainDiskExist == false) {
                            await this.createDisk(mainDiskExist)
                        }
                        const db = event.target.result;
                        db.onversionchange = function () {
                            db.close();
                        };

                        resolve();
                    };
                    request.onerror = (event) => {
                        reject(event.target.error);
                    };
                })
            }

            async createDisk(diskName, config) {
                if (!this.db) {
                    await this.init();
                }
                if (!this.db.objectStoreNames.contains(diskName)) {
                    return new Promise((resolve) => {
                        const request = indexedDB.open(this.dbName, this.db.version + 1);
                        request.onupgradeneeded = (event) => {
                            this.console.log('Upgrading database to version', event.oldVersion, 'to', event.newVersion);
                            const db = event.target.result;
                            if (!db.objectStoreNames.contains(diskName)) {
                                const store = db.createObjectStore(diskName, { keyPath: 'path' });
                                store.createIndex('path', 'path', { unique: true });
                            }
                        };
                        request.onsuccess = (event) => {
                            this.db = event.target.result;
                            this.disks.push(diskName)
                            Array.from(event.target.result.objectStoreNames).forEach(async name => {

                            });
                            resolve(true);
                        };
                    });
                }
            }

            computePath(path, currentPath) {
                const currentPathDirs = currentPath.split('/').filter(dir => dir !== '');
                const pathDirs = path.split('/').filter(dir => dir !== '');

                const resultPath = [...currentPathDirs];

                for (const dir of pathDirs) {
                    if (dir === '..') {
                        if (resultPath.length > 0) {
                            resultPath.pop();
                        }
                    } else if (dir !== '.') {
                        resultPath.push(dir);
                    }
                }

                const outputPath = resultPath.join('/');

                return outputPath;
            }

            parseURL(url = '') {
                url = url.replaceAll('\\', '/');
                var disk = ((/([A-Z]{1})(\:\/)/gi).exec(url) || [])[1] || this.mainDisk;
                var path = url.replace(`${disk}:/`, '');
                return { disk, path };
            }

            debugger(method, message) {
                if (this.debuggerMode == true) {
                    console.log('%c[IDBFS DEBUGGER]', 'color: #f670ff', `${method} - ${message}`);
                }
            }

            async reportError(method, message) {
                var detectList = ['list', 'open', 'readFile', 'readdir'];
                if (detectList.includes(method)) {
                    var incomplete = false;
                    await fetch(`./build.json?timestamp=${new Date().getTime()}`).then(res => {
                        return res.json();
                    }).then(async data => {
                        const table = data.table;
                        for (let i = 0; i < table.length; i++) {
                            await this.exists(table[i]).then(status => {
                                if (status.exists == false) {
                                    // Not exist
                                    localStorage.removeItem('WINBOWS_BUILD_ID');
                                    localStorage.removeItem('WINBOWS_DIRECTORIES');
                                    localStorage.setItem('WINBOWS_REQUIRED', 'REPAIR');
                                    console.log('%cWARNING: THERE MAY BE AN ISSUE WITH INCOMPLETE RESOURCES.', 'background:red;color:#fff;padding:4px 8px;border-radius:4px;');
                                    incomplete = true;
                                    // location.href = `./install.html?timestamp=${new Date().getTime()}`;
                                }
                            })
                        }
                    }).catch(err => {
                        if (window.needsUpdate == false) {
                            localStorage.removeItem('WINBOWS_BUILD_ID');
                            localStorage.removeItem('WINBOWS_DIRECTORIES');
                            localStorage.setItem('WINBOWS_REQUIRED', 'REPAIR');
                            console.log('%cWARNING: THERE MAY BE AN ISSUE WITH INCOMPLETE RESOURCES.', 'background:red;color:#fff;padding:4px 8px;border-radius:4px;');
                            incomplete = true;
                            // location.href = `./install.html?timestamp=${new Date().getTime()}`;
                        }
                    }).finally(async () => {
                        if (incomplete == false) return;
                        localStorage.setItem('WINBOWS_REQUIRED', 'REPAIR');

                        var warningWindow = `document.documentElement.innerHTML='<div style="background:red;color:#fff;padding:4px 8px;border-radius:4px;user-select: none;-webkit-user-select: none;-webkit-user-drag: none;">THERE MAY BE AN ISSUE WITH INCOMPLETE RESOURCES.</div>';document.documentElement.style="display: flex;align-items: center;justify-content: center;width: fit-content;height: fit-content;";browserWindow.setMovable(document.documentElement)`;
                        var warningWindowURL = `C:/Winbows/System/Temp/${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
                        await fs.writeFile(warningWindowURL, new Blob([warningWindow], {
                            type: 'text/javascript'
                        })).catch(err => {
                            window.Crash(err);
                        })
                        var warningProcess = `;(async()=>{System.requestAccessWindow('${warningWindowURL}',{title:'WARNING',width:300,height:150,resizable:false,showOnTop:true});})();`;
                        var tempFileName = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                        fs.writeFile(`C:/Winbows/System/Temp/${tempFileName}`, new Blob([warningProcess], {
                            type: 'text/javascript'
                        })).then(res => {
                            new Process(`C:/Winbows/System/Temp/${tempFileName}`, 'system').start();
                        }).catch(err => {
                            window.Crash(err);
                        })
                    })
                }
            }

            // OK
            async list(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readonly');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.index('path').getAllKeys() // getAll(IDBKeyRange.only(path));
                    request.onsuccess = (event) => {
                        const files = event.target.result;
                        // console.log(files)
                        // const dirFiles = files.filter((file) => file.startsWith(`${path}/`));
                        this.debugger('list', `List the contents of disk successfully!`);
                        resolve(files);
                        // resolve(dirFiles.map((file) => file.path));
                    };
                    request.onerror = (event) => {
                        this.debugger('list', `Failed to list the contents of ${url}.`);
                        this.reportError('list', `Failed to list the contents of ${url}.`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async open(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.get(parsed.path);
                    request.onsuccess = (event) => {
                        const file = event.target.result;
                        if (file) {
                            this.debugger('open', `File "${url}" has been opened successfully!`);
                            resolve(file);
                        } else {
                            this.debugger('open', `Failed to open file "${url}".`);
                            this.reportError('open', `Failed to open file "${url}".`);
                            reject(new Error(`File not found: ${url}`));
                        }
                    };
                    request.onerror = (event) => {
                        this.reportError('open', `Failed to open file "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async writeFile(url, content) {
                const parsed = this.parseURL(url);
                if (!parsed.path) return;
                if (!await this.exists(url).exists) {
                    var splitted = parsed.path.split('/');
                    for (let i = 0; i < splitted.length; i++) {
                        var dir = `${parsed.disk}:/${splitted.slice(0, i + 1).join('/')}`;
                        if (!await this.exists(dir).exists) {
                            await this.mkdir(dir)
                        }
                    }
                }
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.put({ path: parsed.path, content, type: 'file' });
                    request.onsuccess = (event) => {
                        this.debugger('writeFile', `File "${url}" has been writen successfully!`);
                        resolve(content);
                    };
                    request.onerror = (event) => {
                        this.debugger('writeFile', `Failed to write file "${url}".`);
                        this.reportError('writeFile', `Failed to write file "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async readFile(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readonly');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.get(parsed.path);
                    request.onsuccess = (event) => {
                        const file = event.target.result;
                        if (file) {
                            this.debugger('readFile', `Read file "${url}" successfully!`);
                            resolve(file.content);
                        } else {
                            this.debugger('readFile', `Failed to read file "${url}".`);
                            this.reportError('readFile', `Failed to read file "${url}".`);
                            reject(`File not found: ${url}`);
                        }
                    };
                    request.onerror = (event) => {
                        this.reportError('readFile', `Failed to read file "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async mkdir(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.put({ path: parsed.path, type: 'directory' });
                    request.onsuccess = (event) => {
                        this.debugger('mkdir', `Directory "${url}" made successfully!`);
                        resolve();
                    };
                    request.onerror = (event) => {
                        this.debugger('mkdir', `Failed to make directory "${url}".`);
                        this.reportError('mkdir', `Failed to make directory "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async rm(url) {
                const parsed = this.parseURL(url);
                return new Promise(async (resolve, reject) => {
                    const status = await this.exists(url);
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    if (status.type == 'file') {
                        const request = store.delete(parsed.path);
                        request.onsuccess = async (event) => {
                            this.debugger('rm', `Removed "${url}" successfully!`);
                        };
                        request.onerror = (event) => {
                            this.debugger('rm', `Failed to remove "${url}".`);
                            this.reportError('rm', `Failed to remove "${url}".`);
                            reject(event.target.error);
                        };
                        return;
                    }
                    const request = store.index('path').openCursor();
                    request.onsuccess = async (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            const item = cursor.value;
                            if (item.path.startsWith(`${parsed.path}`)) {
                                await store.delete(item.path);
                            }
                            cursor.continue();
                        } else {
                            this.debugger('rm', `Removed "${url}" successfully!`);
                            resolve();
                        }
                    };
                    request.onerror = (event) => {
                        this.debugger('rm', `Failed to remove "${url}".`);
                        this.reportError('rm', `Failed to remove "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            async clear(url) {
                const parsed = this.parseURL(url);
                return new Promise(async (resolve, reject) => {
                    const status = await this.exists(url);
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    if (status.type == 'directory') {
                        const request = store.index('path').openCursor();
                        request.onsuccess = async (event) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                const item = cursor.value;
                                if (item.path.startsWith(`${parsed.path}/`)) {
                                    await store.delete(item.path);
                                }
                                cursor.continue();
                            } else {
                                this.debugger('clear', `Cleared "${url}" successfully!`);
                                resolve();
                            }
                        };
                        request.onerror = (event) => {
                            this.debugger('clear', `Failed to clear "${url}".`);
                            this.reportError('clear', `Failed to clear "${url}".`);
                            reject(event.target.error);
                        };
                        return;
                    } else {
                        resolve();
                    }
                });
            }

            // OK
            async mv(from, to) {
                const parsedFrom = this.parseURL(from);
                const parsedTo = this.parseURL(to);
                return new Promise((resolve, reject) => {
                    // Read original file
                    const readTransaction = this.db.transaction(parsedFrom.disk, 'readwrite');
                    const readStore = readTransaction.objectStore(parsedFrom.disk);
                    const readRequest = readStore.get(parsedFrom.path);

                    readRequest.onsuccess = (event) => {
                        const file = event.target.result;
                        if (file) {
                            // Delete the original file
                            const deleteTransaction = this.db.transaction(parsedFrom.disk, 'readwrite');
                            const deleteStore = deleteTransaction.objectStore(parsedFrom.disk);
                            const deleteRequest = deleteStore.delete(parsedFrom.path);

                            deleteRequest.onsuccess = (event) => {
                                file.path = parsedTo.path;
                                // Put the file to the destination
                                const putTransaction = this.db.transaction(parsedTo.disk, 'readwrite');
                                const putStore = putTransaction.objectStore(parsedTo.disk);
                                putStore.put(file);
                                this.debugger('mv', `Moved "${from}" to "${to}" successfully!`);
                                resolve();
                            }

                            deleteRequest.onerror = (event) => {
                                this.debugger('mv', `Failed to delete "${from}".`);
                                this.reportError('mv', `Failed to delete "${from}".`);
                                reject(event.target.error);
                            };
                        } else {
                            this.debugger('mv', `Failed to move "${from}" to "${to}".`);
                            this.reportError('mv', `Failed to move "${from}" to "${to}".`);
                            reject(new Error(`File not found: ${from}`));
                        }
                    };

                    readRequest.onerror = (event) => {
                        this.reportError('mv', `Failed to move "${from}" to "${to}".`);
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async readdir(url, deep = false) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readonly');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.index('path').openCursor() // getAll(IDBKeyRange.only(path));
                    var dirItems = [];
                    var isRoot = parsed.path == '' || !parsed.path;
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            var file = cursor.value;
                            if (!file.content) {
                                file.content = new Blob();
                            }
                            if (deep == true) {
                                if (isRoot || file.path.startsWith(`${parsed.path}/`)) {
                                    dirItems.push({
                                        path: parsed.disk + ':/' + file.path,
                                        type: file.type,
                                        mimeType: file.content.type
                                    });
                                }
                            } else {
                                if (isRoot && file.path.split('/').length == 1) {
                                    dirItems.push({
                                        path: parsed.disk + ':/' + file.path,
                                        type: file.type,
                                        mimeType: file.content.type
                                    });
                                } else if (file.path.startsWith(`${parsed.path}/`) && file.path.replace(`${parsed.path}/`, '').indexOf('/') == -1) {
                                    dirItems.push({
                                        path: parsed.disk + ':/' + file.path,
                                        type: file.type,
                                        mimeType: file.content.type
                                    });
                                }
                            }
                            cursor.continue();
                        } else {
                            this.debugger('readdir', `Read directory "${url}" successfully!`);
                            resolve(dirItems);
                        }
                        /*
                        const dirFiles = files.filter((file) => {
                            if (deep == true) {
                                if (parsed.path == '' || !parsed.path) {
                                    return file;
                                }
                                return file.startsWith(`${parsed.path}/`);
                            } else {
                                if (parsed.path == '' || !parsed.path) {
                                    return file.split('/').length == 1;
                                }
                                return file.replace(`${parsed.path}/`, '').split('/').length == 0;
                            }
                        });
                        this.debugger('readdir', `Read directory "${url}" successfully!`);
                        resolve(dirFiles);
                        */
                        // resolve(dirFiles.map((file) => file.path));
                    };
                    request.onerror = (event) => {
                        this.debugger('readdir', `Failed to read directory "${url}".`);
                        this.reportError('readdir', `Failed to read directory "${url}".`);
                        reject(event.target.error);
                    };
                });
            }

            async stat(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readonly');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.get(parsed.path);
                    request.onsuccess = (event) => {
                        const response = event.target.result;
                        if (response) {
                            this.debugger('stat', `ok`);
                            resolve({
                                isFile: () => response.type == 'file',
                                isDirectory: () => response.type == 'directory',
                                size: response.content.size,
                                content: response.content,
                                exists: true
                            });
                        } else {
                            this.debugger('stat', `not found`);
                            resolve({
                                isFile: () => false,
                                isDirectory: () => false,
                                size: 0,
                                content: new Blob(),
                                exists: false
                            });
                        }
                    };
                    request.onerror = (event) => {
                        this.debugger('stat', `Failed to check if "${url}" exists.`);
                        this.reportError('stat', `Failed to check if "${url}" exists.`);
                        reject({
                            isFile: () => false,
                            isDirectory: () => false,
                            size: 0,
                            content: new Blob(),
                            exists: false
                        });
                    };
                });
            }

            async exists(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    if (parsed.path == '' || !parsed.path) {
                        if (this.disks.includes(parsed.disk)) {
                            resolve({
                                exists: true,
                                type: 'directory',
                                content: new Blob()
                            });
                        } else {
                            resolve({
                                exists: false,
                                type: 'undefined',
                                content: new Blob()
                            });
                        }
                    }
                    const transaction = this.db.transaction(parsed.disk, 'readonly');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.get(parsed.path);
                    request.onsuccess = (event) => {
                        const response = event.target.result;
                        if (response) {
                            this.debugger('exists', `"${url}" exists!`);
                            resolve({
                                exists: true,
                                type: response.type,
                                content: response.content
                            });
                        } else {
                            this.debugger('exists', `"${url}" does not exist.`);
                            resolve({
                                exists: false,
                                type: 'undefined',
                                content: new Blob()
                            });
                        }
                    };
                    request.onerror = (event) => {
                        this.debugger('exists', `Failed to check if "${url}" exists.`);
                        this.reportError('exists', `Failed to check if "${url}" exists.`);
                        reject({
                            exists: event.target.error,
                            type: 'error',
                            content: new Blob()
                        });
                    };
                });
            }
            async proxy(method, param, current) {
                return new Promise((resolve, reject) => {
                    this[method].apply(this, param).then(response => {
                        resolve(response);
                    }).catch(error => {
                        this.reportError('proxy', {
                            method, param, error
                        });
                    })
                });
            }
            console = {
                log(message) {
                    console.log('%c[IDBFS]', 'color: #f670ff', message);
                }
            }
        }

        window.fs = new IDBFS('winbows11', mainDisk)
    })();

    await window.fs.init();
    window.fs.downloadFile = downloadFile;
    window.fs.getFileURL = getFileURL;
    window.fs.Cache = {};
    window.fs.getFileExtension = function (file = '') {
        console.warn('%cfs.getFileExtension()%c has been deprecated.\nPlease use %cutils.getFileExtension()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        return window.utils.getFileExtension(file);
    }

    Object.freeze(window.fs);

    window.loadImage = loadImage;

    // Loading images
    loadingImage.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico')})`;
    screenLockSigninAvatar.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/user.png')})`;
    screenLockBackground.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/bg/img100.jpg')})`;

    var currentBackgroundImage;

    window.getBackgroundImage = () => {
        return currentBackgroundImage;
    }
    window.setBackgroundImage = async (image) => {
        if (!image || image == currentBackgroundImage) return;
        currentBackgroundImage = image;
        var url = await getFileURL(currentBackgroundImage);
        await loadImage(url)
        backgroundImage.style.backgroundImage = `url(${url})`;
    }
    window.WinbowsUpdate = () => {
        location.href = './install.html';
    }

    await window.setBackgroundImage('C:/Winbows/bg/img0.jpg');

    await fs.mkdir('C:/Users');
    await fs.mkdir('C:/Users/Admin');
    await fs.mkdir('C:/Users/Admin/Desktop');
    await fs.mkdir('C:/Users/Admin/Documents');
    await fs.mkdir('C:/Users/Admin/Downloads');
    await fs.mkdir('C:/Users/Admin/Music');
    await fs.mkdir('C:/Users/Admin/Pictures');
    await fs.mkdir('C:/Users/Admin/Videos');

    screenLockSigninUsername.innerHTML = window.utils.replaceHTMLTags('Admin');
    screenLockSigninButton.innerHTML = window.utils.replaceHTMLTags('Sign In');

    // Init kernel files 
    await (async () => {
        async function runKernel() {
            var files = {
                kernel: ['Winbows/System/process.js'],
                ui: ['Winbows/System/ui/build/winui.min.js'],
                module: ['Winbows/System/modules/main/toolbarComponents.js', 'Winbows/System/modules/main/browserWindow.js'],
                component: [],
                taskbar: ['Winbows/SystemApps/Microhard.Winbows.Taskbar/app.js'],
                compiler: ['Winbows/System/compilers/worker/compiler.js', 'Winbows/System/compilers/window/compiler.js']
            }
            return new Promise(async (resolve, reject) => {
                var kernelFiles = [];
                Object.values(files).forEach(category => {
                    kernelFiles = kernelFiles.concat(category);
                })
                var loadedKernels = 0;
                window.loadedKernel = () => {
                    loadedKernels++;
                    console.log(loadedKernels)
                    if (loadedKernels == kernelFiles.length) {
                        resolve();
                    }
                }
                try {
                    for (let i in kernelFiles) {
                        const path = await fs.getFileURL(mainDisk + ':/' + kernelFiles[i]);
                        const kernel = document.createElement('script');
                        kernel.src = path;
                        kernel.onload = () => {
                            kernel.remove();
                        }
                        document.head.appendChild(kernel);
                    }
                } catch (e) {
                    window.Crash(e);
                }
            })
        }

        await runKernel();
    })();

    window.Taskbar.pinApp('C:/Program Files/Command/app.js');
    window.Taskbar.pinApp('C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.js');
    await window.Taskbar.preloadImage();

    window.System.CommandParsers = {
        run: (params) => {
            var file = params[0];
            var config = [...params].slice(1).join(' ') || '';
            if (config != '') {
                try {
                    config = `const ${config.replace('--config=', '')};`;
                } catch (e) {
                    config = '';
                };
            }
            if (file == 'all') {
                Object.values(window.appRegistry.apps).forEach(app => {
                    new Process(app.script).start();
                })
                return {
                    status: 'ok',
                    message: `Successfully run all apps.`
                }
            }
            if (window.appRegistry.exists(file)) {
                if (config != '' && window.appRegistry.getInfo(file).configurable) {
                    file = window.appRegistry.getInfo(file).configurable;
                } else {
                    file = window.appRegistry.getInfo(file).script;
                }
            }
            new Process(file).start(config);
            return {
                status: 'ok',
                message: `Successfully run ${file}.`
            }
        },
        open: async (params) => {
            var path = params[0];
            path = path.replaceAll('"', '');
            if (await (fs.exists(path)).exists == true) {
                window.System.Shell(`run explorer --config=PAGE=\"${path}\"`);
            } else {
                window.open(path, '_blank');
            }
            return {
                status: 'ok',
                message: `Successfully open ${path}.`
            }
        }
    };

    window.System.Shell = function (command = '') {
        var parsed = command.split(' ').filter(cmd => cmd.length != 0);
        var parser = parsed[0];
        if (!window.System.CommandParsers[parser]) {
            return {
                status: 'error',
                message: `[ERROR] Parser ( ${parser} ) can not be founded.`
            }
        }
        return window.System.CommandParsers[parser](parsed.slice(1));
    }

    // For desktop
    await (async () => {
        window.System.updateDesktop = updateDesktop;
        window.System.createDesktopItem = createDesktopItem;

        async function updateDesktop() {
            fs.readdir('C:/Users/Admin/Desktop').then(items => {
                desktopItems.innerHTML = '';
                items.forEach(item => {
                    fs.stat(item.path).then(async result => {
                        var type = utils.getFileExtension(item.path) == 'link' ? 'shortcut' : result.type == 'directory' ? 'directory' : 'file';
                        var detail;
                        if (type == 'shortcut') {
                            var file = await result.content.text();
                            detail = JSON.parse(file);
                        } else if (type == 'directory') {
                            detail = {
                                name: utils.getFileName(item.path),
                                command: `run explorer --config=PAGE=\"${item.path}\"`
                            };
                        } else {
                            detail = {
                                name: utils.getFileName(item.path),
                                action: () => {
                                    new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js').start(`const FILE_PATH="${item.path}";`);
                                }
                            };
                        }
                        detail.path = item.path;
                        detail.type = type;
                        detail.file = result.content;
                        createDesktopItem(detail);
                    })
                })
            })
        }

        function createDesktopItem(detail) {
            const { icon, name, command, path, type, file, action } = detail;

            var item = document.createElement('div');
            var itemIcon = document.createElement('div');
            var itemName = document.createElement('div');

            item.className = 'desktop-item';
            itemIcon.className = 'desktop-item-icon';
            itemName.className = 'desktop-item-name';

            itemName.textContent = name;

            desktopItems.appendChild(item);
            item.appendChild(itemIcon);
            item.appendChild(itemName);

            if (type == 'shortcut') {
                fs.getFileURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                    itemIcon.style.setProperty('--item-icon', `url(${url})`);
                    itemIcon.style.backgroundImage = `url('${icon}')`;
                })
            } else if (type == 'directory') {
                fs.getFileURL('C:/Winbows/icons/folders/folder.ico').then(url => {
                    itemIcon.style.backgroundImage = `url('${url}')`;
                })
            } else {
                var isImage = file.type.startsWith('image/');
                fs.getFileURL(window.fileIcons.getIcon(path)).then(url => {
                    itemIcon.style.backgroundImage = `url('${url}')`;
                    if (isImage) {
                        try {
                            fs.getFileURL(path).then(url => {
                                itemIcon.style.backgroundImage = `url(${url})`;
                            })
                        } catch (e) {
                            console.log('Failed to load image.');
                        }
                    }
                })
            }

            item.addEventListener('click', (e) => {
                if (command) {
                    window.System.Shell(command);
                } else if (action) {
                    action();
                }
            })

            item.addEventListener('contextmenu', (e) => {
                const menu = WinUI.contextMenu([
                    {
                        className: "open",
                        text: "Open",
                        action: () => {
                            if (command) {
                                window.System.Shell(command);
                            } else if (action) {
                                action();
                            }
                        }
                    }, {
                        className: "open-with",
                        text: "Open with...",
                        action: () => {
                            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js').start(`const FILE_PATH="${path}";`);
                        }
                    }
                ])
                e.preventDefault();
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    e.pageX = touch.pageX;
                    e.pageY = touch.pageY;
                }
                menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
                menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
                menu.open(e.pageX, e.pageY, 'left-top');
                new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                    window.addEventListener(event, (e) => {
                        if (menu.container.contains(e.target)) return;
                        menu.close();
                    })
                })
            })
        }

        const dropZone = desktop;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false)
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false)
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false)
        });

        dropZone.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            handleFiles(files);
        }

        function handleFiles(files) {
            [...files].forEach(file => {
                const reader = new FileReader();
                reader.onload = async function (event) {
                    const arrayBuffer = event.target.result;
                    const blob = new Blob([arrayBuffer], { type: file.type });
                    await fs.writeFile(`C:/Users/Admin/Desktop/${file.name}`, blob).then(() => {
                        window.System.updateDesktop();
                    });
                };
                reader.readAsArrayBuffer(file);

                console.log(`File: ${file.name} (Type: ${file.type}, Size: ${file.size} bytes)`);
            });
        }

        var defaultShortcuts = [{
            path: 'C:/Users/Admin/Desktop/desktop.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico'),
                name: 'Desktop',
                command: 'run explorer --config=PAGE=\"C:/Users/Admin/Desktop\"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/github.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/github.png'),
                name: 'Github',
                command: 'open "https://github.com/Siyu1017/winbows11/"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/code.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/applications/office/code.ico'),
                name: 'VSCode',
                command: 'run code'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/author.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/author.ico'),
                name: 'Siyu',
                command: 'open "https://siyu1017.github.io/"'
            }
        }]

        for (let i = 0; i < defaultShortcuts.length; i++) {
            var content = JSON.stringify(defaultShortcuts[i].content);
            await fs.writeFile(defaultShortcuts[i].path, new Blob([content], {
                type: 'application/winbows-link'
            }));
        }

        return window.System.updateDesktop();
    })();

    window.System.FileViewers = {
        viewers: {
            '*': '',
            'css': ['code'],
            'js': ['code'],
            'html': ['code', 'edge'],
            'txt': ['code'],
            'jpg': ['mediaplayer', 'edge', 'photos'],
            'jpeg': ['mediaplayer', 'edge', 'photos'],
            'png': ['mediaplayer', 'edge', 'photos'],
            'gif': ['mediaplayer', 'edge', 'photos'],
            'webp': ['mediaplayer', 'edge', 'photos'],
            'bmp': ['mediaplayer', 'edge', 'photos'],
            'svg': ['mediaplayer', 'edge', 'photos'],
            'ico': ['mediaplayer', 'edge', 'photos'],
            'pdf': [],
            'json': ['code'],
            'xml': ['code'],
            'zip': [],
            'tar': [],
            'gz': [],
            'mp3': ['mediaplayer'],
            'wav': ['mediaplayer'],
            'ogg': ['mediaplayer'],
            'mp4': ['mediaplayer'],
            'webm': ['mediaplayer'],
            'avi': ['mediaplayer'],
            'mov': ['mediaplayer']
        },
        defaultViewers: {},
        registeredViewers: {
            'code': {
                name: 'Visual Studio Code',
                script: 'C:/Program Files/VSCode/viewer.js',
                accepts: [/*'css', 'js', 'jsx', 'ts', 'ejs', 'html', 'txt', 'json', 'xml', 'py', 'java', 'c', 'h', */'*']
            },
            'edge': {
                name: 'Microhard Edge',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/viewer.js',
                accepts: ['html', 'pdf', 'txt', 'js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'ico', 'webp', 'gif']
            },
            'edgebeta': {
                name: 'Microhard Edge BETA',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/viewer.js',
                accepts: ['html', 'pdf', 'txt', 'js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'ico', 'webp', 'gif']
            },
            'photos': {
                name: 'Photos',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/viewer.js',
                accepts: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'svg', 'ico', 'webp']
            },
            'mediaplayer': {
                name: 'MediaPlayer',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MediaPlayer/window.js',
                accepts: ['mp3', 'wav', 'ogg', 'mp4', 'webm', 'avi', 'mov']
            },
            'json-viewer': {
                name: 'JSON Viewer',
                script: 'C:/Program Files/JSON Viewer/viewer.js',
                accepts: ['json']
            }
        },
        isRegisterd: (name) => {
            return window.System.FileViewers.registeredViewers.hasOwnProperty(name);
        },
        updateViewer: (viewer, prop, value) => {
            if (window.System.FileViewers.isRegisterd(viewer)) {
                window.System.FileViewers.registeredViewers[viewer][prop] = value;
                localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
            }
        },
        registerViewer: (viewer, name, script, accepts) => {
            if (!window.System.FileViewers.isRegisterd(viewer)) {
                window.System.FileViewers.registeredViewers[viewer] = {
                    name: name,
                    script: script,
                    accepts: accepts
                };
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
        },
        unregisterViewer: (viewer) => {
            if (window.System.FileViewers.isRegisterd(viewer)) {
                delete window.System.FileViewers.registeredViewers[viewer];
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
        },
        // Deprecated Method
        setViewer: (extension, app) => {
            if (!window.System.FileViewers.viewers[extension]) {
                window.System.FileViewers.viewers[extension] = [];
            }
            window.System.FileViewers.viewers[extension].push(app);
            localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
            console.warn('%cSystem.FileViewers.setViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        },
        // Deprecated Method
        unsetViewer: (extension, app) => {
            var index = window.System.FileViewers.viewers[extension].indexOf(app);
            if (index != -1) {
                window.System.FileViewers.viewers[extension].splice(index, 1);
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
            console.warn('%cSystem.FileViewers.unsetViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        },
        setDefaultViewer: (extension, app) => {
            var exists = false;
            Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
                if (viewer == app || window.System.FileViewers.registeredViewers[viewer] == app) {
                    exists = viewer;
                }
            })
            if (exists != false) {
                window.System.FileViewers.defaultViewers[extension] = exists;
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
        },
        unsetDefaultViewer: (extension, app) => {
            if (window.System.FileViewers.defaultViewers[extension]) {
                window.System.FileViewers.defaultViewers.splice(window.System.FileViewers.defaultViewers.indexOf(app), 1)
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
        },
        getDefaultViewer: (file = '') => {
            var extension = window.utils.getFileExtension(file).toLowerCase();
            var viewer = window.System.FileViewers.defaultViewers[extension];
            if (!viewer) {
                return null;
            } else {
                return window.System.FileViewers.registeredViewers[viewer];
            }
        },
        getViewers: (file = '') => {
            var extension = window.utils.getFileExtension(file).toLowerCase();
            var accepted = ['*', extension];
            if (extension == '') {
                accepted = ['*'];
            }
            var viewers = {};
            Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
                console.log(window.System.FileViewers.registeredViewers[viewer])
                if (window.System.FileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                    viewers[viewer] = window.System.FileViewers.registeredViewers[viewer];
                }
            })
            console.log(file, extension, viewers)
            return viewers;
        }
    }

    if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS')) {
        window.System.FileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS')) {
        window.System.FileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS')) {
        window.System.FileViewers.registeredViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    window.delay = delay;

    function loadImage(url) {
        return new Promise(async (resolve, reject) => {
            var img = new Image();
            img.onload = async () => {
                return resolve();
            }
            img.onerror = async (err) => {
                return reject(err);
            }
            img.src = url;
        })
    }

    window.System.addEventListener('load', async (e) => {
        // Initialize screen lock 
        var init = true;
        var now = new Date();
        var leftToUpdateTime = (60 - now.getSeconds()) * 1000;
        var leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - (now.getMinutes() * 60) - now.getSeconds()) * 1000;

        screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
        screenLockDate.innerHTML = now.toLocaleDateString(void 0, {
            weekday: "long",
            month: "long",
            day: "numeric"
        })

        function updateTime() {
            var now = new Date();
            var leftToUpdateTime = (60 - now.getSeconds()) * 1000;
            screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
            setTimeout(updateTime, leftToUpdateTime);
        }

        function updateDate() {
            var now = new Date();
            var leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - ((60 - now.getMinutes()) * 60) - now.getSeconds()) * 1000;
            screenLockDate.innerHTML = now.toLocaleDateString(void 0, {
                weekday: "long",
                month: "long",
                day: "numeric"
            })
            setTimeout(updateDate, leftToUpdateDate);
        }

        console.log('Next update of time :', new Date(Date.now() + leftToUpdateTime))
        console.log('Next update of date :', new Date(Date.now() + leftToUpdateDate))

        setTimeout(updateTime, leftToUpdateTime);
        setTimeout(updateDate, leftToUpdateDate);

        screenLockMain.addEventListener('click', () => {
            screenLock.classList.add('signin');
        })

        screenLockSigninButton.addEventListener('click', () => {
            screenLockContainer.classList.remove('active');
            screenLock.classList.remove('signin');
            if (init == true) {
                initTaskbar();
                init = false;
            }
        })

        await delay(1000);

        // Remove loading 
        loadingContainer.classList.remove('active');

        async function initTaskbar() {
            await delay(200);

            // Initialize Taskbar
            window.Taskbar.init();
        }
    })

    await (async () => {
        try {
            const fontName = 'WINBOWS_FONT_' + [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            const fontURL = await fs.getFileURL('C:/Winbows/fonts/Segoe Fluent Icons.ttf');
            const myFont = new FontFace(fontName, `url(${fontURL})`);
            await myFont.load();

            document.fonts.add(myFont);
            document.querySelector(':root').style.setProperty('--winbows-font-icon', fontName);

        } catch (error) {
            console.error('Failed to load font', error);
        }
        return;
    })();

    window.System.triggerEvent('load');

    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'system').start();
    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.Test/app.js', 'system').start();

    window.utils.formatBytes = formatBytes;

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    function getStackTrace() {
        var stack;

        try {
            throw new Error('');
        } catch (error) {
            stack = error.stack || '';
        }

        stack = stack.split('\n').map(function (line) { return line.trim(); });
        return stack.splice(stack[0] == 'Error' ? 2 : 1);
    }

    // Cache the url
    async function getFileURL(url) {
        var blob = await downloadFile(url);
        return URL.createObjectURL(blob);
    }

    function removeStringInRange(str, start, end) {
        return str.substring(0, start) + str.substring(end);
    }

    async function downloadFile(path, responseType = 'blob') {
        if (!path || path.trim().length == 0) return;
        if (debuggerMode == true) {
            // Debugger
            console.log('%c[DOWNLOAD FILE]', 'color: #f670ff', getStackTrace(), path);
        }
        if (navigator.onLine != true || window.needsUpdate == false && devMode == false) {
            return await fs.readFile(path);
        }
        var extension = path.split('.').pop();
        var mimeType = getMimeType(extension);
        // var method = mimeType.startsWith('image') ? 'blob' : 'text';
        return fetch(`./${removeStringInRange(path, 0, path.split(':/').length > 1 ? (path.split(':/')[0].length + 2) : 0)}`).then(response => {
            // console.log(response)
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error(`Failed to fetch file: ${path}`);
            }
        }).then(content => {
            if (!extension) {
                fs.mkdir(url);
                return '';
            }
            var blob = content;
            // blob = new Blob([content], { type: mimeType });
            fs.writeFile(path, blob);
            // console.log(getSizeString(blob.size));
            if (responseType == 'text') {
                return content;
            } else {
                return blob;
            }
        }).catch(async err => {
            console.log(`Failed to fetch file: ${path}`, err);
            if (responseType == 'text') {
                return await (await fs.readFile(path)).text();
            } else {
                return await fs.readFile(path);
            }
        })
    }
})();