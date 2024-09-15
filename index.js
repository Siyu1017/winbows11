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

    window.appRegistry = {
        apps: {
            'explorer': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
                icon: 'C:/Winbows/icons/folders/explorer.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js'
            },
            'edge': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
                icon: 'C:/Winbows/icons/applications/tools/edge.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.js'
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

    window.utils.replaceHTMLTags = (content) => {
        return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }

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
                        this.debugger('list', `Failed to list the contents of disk.`);
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
                            reject(new Error(`File not found: ${url}`));
                        }
                    };
                    request.onerror = (event) => {
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
                            reject(`File not found: ${url}`);
                        }
                    };
                    request.onerror = (event) => {
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
                        reject(event.target.error);
                    };
                });
            }

            // OK
            async rm(url) {
                const parsed = this.parseURL(url);
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(parsed.disk, 'readwrite');
                    const store = transaction.objectStore(parsed.disk);
                    const request = store.delete(parsed.path);
                    request.onsuccess = (event) => {
                        this.debugger('rm', `Removed "${url}" successfully!`);
                        resolve();
                    };
                    request.onerror = (event) => {
                        this.debugger('rm', `Failed to remove "${url}".`);
                        reject(event.target.error);
                    };
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
                                reject(event.target.error);
                            };
                        } else {
                            this.debugger('mv', `Failed to move "${from}" to "${to}".`);
                            reject(new Error(`File not found: ${from}`));
                        }
                    };

                    readRequest.onerror = (event) => {
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
                        reject(event.target.error);
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
                        var file = await downloadFile(mainDisk + ':/' + kernelFiles[i]);
                        const kernel = new Function(await file.text());
                        await kernel();
                    }
                } catch (e) {
                    window.Crash(e);
                }
            })
        }

        await runKernel();
    })();

    window.Taskbar.pinApp('C:/Program Files/Command/app.js');
    await window.Taskbar.preloadImage();

    window.System.CommandParsers = {
        run: (file, ...options) => {
            var script = file;
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
                script = window.appRegistry.getInfo(file).script;
            }
            new Process(script).start();
            return {
                status: 'ok',
                message: `Successfully run ${file}.`
            }
        }
    };

    window.System.Shell = function (command) {
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

    window.System.FileViewers = {
        viewers: {
            'css': ['code'],
            'js': ['code'],
            'html': ['code', 'edge'],
            'txt': ['code'],
            'jpg': ['mediaplayer', 'edge'],
            'jpeg': ['mediaplayer', 'edge'],
            'png': ['mediaplayer', 'edge'],
            'gif': ['mediaplayer', 'edge'],
            'webp': ['mediaplayer', 'edge'],
            'bmp': ['mediaplayer', 'edge'],
            'svg': ['mediaplayer', 'edge'],
            'ico': ['mediaplayer', 'edge'],
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
        defaultViewers: {
            'css': 'code',
            'js': 'code',
            'html': 'code',
            'txt': 'code'
        },
        registeredViewers: {
            'code': 'C:/Program Files/VSCode/viewer.js',
            'edge': '',
            'mediaplayer': ''
        },
        register: (extension, app) => {
            if (!window.System.FileViewers.viewers[extension]) {
                window.System.FileViewers.viewers[extension] = [];
            }
            window.System.FileViewers.viewers[extension].push(app);
        },
        unregister: (extension, app) => {
            var index = window.System.FileViewers.viewers[extension].indexOf(app);
            if (index != -1) {
                window.System.FileViewers.viewers[extension].splice(index, 1);
            }
        },
        getDefaultViewer: (file = '') => {
            var extension = file.split('.').pop().toLowerCase();
            var viewer = window.System.FileViewers.defaultViewers[extension];
            if (!viewer) {
                return null;
            } else {
                return window.System.FileViewers.registeredViewers[viewer];
            }
        },
        getViewers: (file = '') => {
            var extension = file.split('.').pop().toLowerCase();
            var viewers = window.System.FileViewers.viewers[extension];
            var result = [];
            console.log(file, extension, viewers)
            if (!viewers) {
                return result;
            }
            viewers.forEach((viewer, i) => {
                var app = window.System.FileViewers.registeredViewers[viewer];
                if (app) {
                    result.push(window.System.FileViewers.registeredViewers[viewer]);
                }
            })
            return result;
        }
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

    window.System.triggerEvent('load');

    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'system').start();
    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.Test/app.js', 'system').start();

    function getSizeString(size) {
        if (size < 1024) {
            return `${size} B`;
        } else if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(2)} KB`;
        } else if (size < 1024 * 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
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