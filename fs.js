// File System
!(async () => {
    const mainDisk = 'C';
    const debuggerMode = false;
    const devMode = (getJsonFromURL()['dev'] || getJsonFromURL()['develop']) ? true : false;

    window.crashed = false;
    window.Crash = (err) => {
        if (window.crashed == true) return;
        window.crashed = true;
        console.log(err);
        try {
            document.body.innerHTML = `<div class="bsod"><div class="bsod-container"><h1 style="font-size: 6rem;margin: 0 0 2rem;font-weight: 300;">:(</h1><div style="font-size:1.375rem">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</div></div>`;
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => { location.reload() }, 5000);
        console.log(window.debuggers.getStackTrace());
        throw new Error('Winbows has been crashed...');
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

    var listeners = {};
    var triggerEvent = function (event, detail) {
        if (listeners[event]) {
            listeners[event].forEach(listener => listener(detail));
        }
    }

    var db = null;
    var repairWaitingList = [];
    var repairing = false;

    class IDBFS {
        constructor(dbName, mainDisk = 'C') {
            this.dbName = dbName;
            this.mainDisk = mainDisk;
            this.disks = [];
            this.debuggerMode = debuggerMode;
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName);
                request.onupgradeneeded = (event) => {
                    var db = event.target.result;
                    var store = db.createObjectStore(this.mainDisk, { keyPath: 'path' });
                    store.createIndex('path', 'path', { unique: true });
                };
                request.onsuccess = async (event) => {
                    db = event.target.result;
                    var mainDiskExist = false;
                    this.disks.length = 0;
                    Array.from(event.target.result.objectStoreNames).forEach(async name => {
                        if (name === this.mainDisk) {
                            mainDiskExist = true;
                        }
                        this.disks.push(name);
                    });
                    if (mainDiskExist == false) {
                        await this.createDisk(mainDiskExist)
                    }
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
            if (!db) {
                await this.init();
            }
            if (!db.objectStoreNames.contains(diskName)) {
                return new Promise((resolve) => {
                    const request = indexedDB.open(this.dbName, db.version + 1);
                    request.onupgradeneeded = (event) => {
                        this.console.log('Upgrading database to version', event.oldVersion, 'to', event.newVersion);
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(diskName)) {
                            const store = db.createObjectStore(diskName, { keyPath: 'path' });
                            store.createIndex('path', 'path', { unique: true });
                        }
                    };
                    request.onsuccess = (event) => {
                        db = event.target.result;
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

        async getTransaction(n, m, p = false) {
            try {
                if (p == true) {
                    repairWaitingList.forEach(fn => fn());
                    this.console.log('Successfully repaired idbfs!');
                    repairing = false;
                    repairWaitingList = [];
                }
                return db.transaction(n, m);
            } catch (e) {
                if (p == false) {
                    if (repairing == false) {
                        repairing = true;
                        await this.init();
                        this.console.log('Trying to repair idbfs...');
                        return this.getTransaction(n, m, true);
                    } else {
                        return new Promise((resolve, reject) => {
                            repairWaitingList.push(() => { resolve(db.transaction(n, m)); });
                        })
                    }
                } else {
                    this.console.log('Failed to repair idbfs.');
                    window.Crash();
                }
            }
        }

        async reportError(method, message) {
            var detectList = ['list', 'open', 'readFile', 'readdir'];
            if (detectList.includes(method) && window.crashed == false) {
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readonly');
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readwrite');
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readwrite');
                const store = transaction.objectStore(parsed.disk);
                const request = store.put({ path: parsed.path, content, type: 'file' });
                request.onsuccess = (event) => {
                    this.debugger('writeFile', `File "${url}" has been writen successfully!`);
                    triggerEvent('change', {
                        path: url
                    })
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readonly');
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readwrite');
                const store = transaction.objectStore(parsed.disk);
                const request = store.put({ path: parsed.path, type: 'directory' });
                request.onsuccess = (event) => {
                    this.debugger('mkdir', `Directory "${url}" made successfully!`);
                    triggerEvent('change', {
                        path: url
                    })
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
                const transaction = await this.getTransaction(parsed.disk, 'readwrite');
                const store = transaction.objectStore(parsed.disk);
                if (status.type == 'file') {
                    const request = store.delete(parsed.path);
                    request.onsuccess = async (event) => {
                        this.debugger('rm', `Removed "${url}" successfully!`);
                        triggerEvent('change', {
                            path: url
                        })
                        resolve();
                    };
                    request.onerror = (event) => {
                        this.debugger('rm', `Failed to remove "${url}".`);
                        this.reportError('rm', `Failed to remove "${url}".`);
                        reject(event.target.error);
                    };
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
                        triggerEvent('change', {
                            path: url
                        })
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
                const transaction = await this.getTransaction(parsed.disk, 'readwrite');
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
                            triggerEvent('change', {
                                path: url
                            })
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
            return new Promise(async (resolve, reject) => {
                // Read original file
                const readTransaction = await this.getTransaction(parsedFrom.disk, 'readwrite');
                const readStore = readTransaction.objectStore(parsedFrom.disk);
                const readRequest = readStore.get(parsedFrom.path);

                readRequest.onsuccess = async (event) => {
                    const file = event.target.result;
                    if (file) {
                        // Delete the original file
                        const deleteTransaction = await this.getTransaction(parsedFrom.disk, 'readwrite');
                        const deleteStore = deleteTransaction.objectStore(parsedFrom.disk);
                        const deleteRequest = deleteStore.delete(parsedFrom.path);

                        deleteRequest.onsuccess = async (event) => {
                            file.path = parsedTo.path;
                            // Put the file to the destination
                            const putTransaction = await this.getTransaction(parsedTo.disk, 'readwrite');
                            const putStore = putTransaction.objectStore(parsedTo.disk);
                            putStore.put(file);
                            this.debugger('mv', `Moved "${from}" to "${to}" successfully!`);
                            triggerEvent('change', {
                                path: url
                            })
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readonly');
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
                                    mimeType: file.content.type,
                                    size: file.content.size
                                });
                            }
                        } else {
                            if (isRoot && file.path.split('/').length == 1) {
                                // Root
                                dirItems.push({
                                    path: parsed.disk + ':/' + file.path,
                                    type: file.type,
                                    mimeType: file.content.type,
                                    size: file.content.size
                                });
                            } else if (file.path.startsWith(`${parsed.path}/`) && file.path.replace(`${parsed.path}/`, '').indexOf('/') == -1) {
                                dirItems.push({
                                    path: parsed.disk + ':/' + file.path,
                                    type: file.type,
                                    mimeType: file.content.type,
                                    size: file.content.size
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
            return new Promise(async (resolve, reject) => {
                const transaction = await this.getTransaction(parsed.disk, 'readonly');
                const store = transaction.objectStore(parsed.disk);
                const request = store.get(parsed.path);
                request.onsuccess = (event) => {
                    const response = event.target.result;
                    if (response) {
                        this.debugger('stat', `ok`);
                        resolve({
                            isFile: () => response.type == 'file',
                            isDirectory: () => response.type == 'directory',
                            size: response.content instanceof Blob ? response.content.size : 0,
                            content: response.content,
                            exists: true,
                            type: response.type
                        });
                    } else {
                        this.debugger('stat', `not found`);
                        resolve({
                            isFile: () => false,
                            isDirectory: () => false,
                            size: 0,
                            content: new Blob(),
                            exists: false,
                            type: 'unknown'
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
                        exists: false,
                        type: 'unknown'
                    });
                };
            });
        }

        async exists(url) {
            const parsed = this.parseURL(url);
            return new Promise(async (resolve, reject) => {
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
                const transaction = await this.getTransaction(parsed.disk, 'readonly');
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

        on(event, listener) {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
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

    await window.fs.init();
    window.fs.Cache = {};
    window.fs.getFileExtension = function (file = '') {
        console.warn('%cfs.getFileExtension()%c has been deprecated.\nPlease use %cutils.getFileExtension()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        return window.utils.getFileExtension(file);
    }

    window.fs.getFileURL = async function getFileURL(url) {
        var blob = await fs.downloadFile(url);
        return URL.createObjectURL(blob);
    }

    function removeStringInRange(str, start, end) {
        return str.substring(0, start) + str.substring(end);
    }

    window.fs.downloadFile = async function downloadFile(path, responseType = 'blob') {
        if (!path || path.trim().length == 0) return;
        if (debuggerMode == true) {
            // Debugger
            console.log('%c[DOWNLOAD FILE]', 'color: #f670ff', getStackTrace(), path);
        }
        if (navigator.onLine != true || window.needsUpdate == false && devMode == false || path.startsWith('C:/Users/Admin/Desktop/')) {
            return await fs.readFile(path);
        }
        // var method = mimeType.startsWith('image') ? 'blob' : 'text';
        return fetch(`./${removeStringInRange(path, 0, path.split(':/').length > 1 ? (path.split(':/')[0].length + 2) : 0)}`).then(response => {
            // console.log(response)
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error(`Failed to fetch file: ${path}`);
            }
        }).then(content => {
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

    Object.freeze(window.fs);
})();