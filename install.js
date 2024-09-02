const mainDisk = 'C';
const debuggerMode = false;

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

window.fs.init();
window.fs.downloadFile = downloadFile;

var index = 0;
var name = '';

async function downloadFile(path) {
    function removeStringInRange(str, start, end) {
        return str.substring(0, start) + str.substring(end);
    }

    return new Promise((resolve, reject) => {
        fetch(`./${removeStringInRange(path, 0, path.split(':/').length > 1 ? (path.split(':/')[0].length + 2) : 0)}`).then(response => {
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error(`Failed to fetch file: ${path}`);
            }
        }).then(async content => {
            var blob = content;
            await fs.writeFile(path, blob);
            return resolve();
        }).catch(async err => {
            console.log(`Failed to fetch file: ${path}`, err);
            document.querySelector('.install-window').style.alignItems = 'center';
            document.querySelector('.install-window').style.justifyContent = 'center';
            document.querySelector('.install-window').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="width:5rem;height:5rem;" viewBox="0 0 24 24" fill="none" stroke="#E69264" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div style="max-width: 60%;word-break: break-all;font-weight: 600;font-size: 1.25rem;margin-top: 1rem;">發生錯誤，無法下載 ${name}</div><div style="font-size: .875rem;color: #454545;margin: .375rem;">建議您在網絡連線穩定的場所進行下載</div><br><a href="./" style="color: #fff;margin-bottom: .5rem;padding: .75rem 1.25rem;background: #0067c0;border-radius: .5rem;text-decoration: none;cursor: pointer;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;">重新執行 Winbows11?</a>`;
            return reject(err);
        })
    })
}

try {
    fetch('./tree.json').then(res => {
        return res.json();
    }).then(async files => {
        var lastTime = Date.now();
        var startTime = lastTime;

        var nameElement = document.createElement('div');
        var timeElement = document.createElement('div');
        var lastElement = document.createElement('div');

        nameElement.innerHTML = '名稱：未知';
        timeElement.innerHTML = '剩餘時間：未知';
        lastElement.innerHTML = '剩餘項目：未知';

        document.querySelector('.install-info').appendChild(nameElement);
        document.querySelector('.install-info').appendChild(timeElement);
        document.querySelector('.install-info').appendChild(lastElement);

        function predictTime() {
            var avarageTime = (Date.now() - lastTime) / 2 / 1000;
            var lastItems = files.length - index;
            var seconds = ~~(avarageTime * lastItems);
            if (lastTime == startTime) {
                return '計算中...';
            } else if (seconds < 60) {
                return `${seconds} 秒鐘`;
            } else if (seconds < 60 * 60) {
                return `${~~(seconds / 60)} 分鐘 ${seconds % 60} 秒鐘`;
            } else if (seconds < 60 * 60 * 24) {
                return `${~~(seconds / (60 * 60))} 小時 ${~~((seconds % (60 * 60)) / 60)} 分鐘 ${seconds % 60} 秒鐘`;
            } else {
                return '超過一天';
            }
        }

        function updateItem() {
            document.querySelector('.install-percent').innerHTML = ~~((index / (files.length - 1)) * 100) + '% 已完成';
            document.querySelector('.install-progress-bar').style.width = (index / (files.length - 1)) * 100 + '%';
            nameElement.innerHTML = `名稱：${name}`;
            lastElement.innerHTML = `剩餘項目：${files.length - index - 1}`;
        }
        function updateTime() {
            updateItem();
            timeElement.innerHTML = `剩餘時間：${predictTime()}`;
        }
        function update() {
            updateTime();
        }
        setInterval(update, 1000);
        update();
        var installed = [];
        for (let i in files) {
            index = i;
            try {
                name = files[i].split('/').slice(-1)
            } catch (e) {
                name = files[i]
            }
            updateItem();
            await fs.downloadFile(files[i]).then(() => {
                var file = document.createElement('div');
                file.className = 'install-detail-installed';
                file.innerHTML = `<span>${files[i].replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`;
                document.querySelector('.install-detail-installeds').appendChild(file);
                document.querySelector('.install-details').scrollTop = document.querySelector('.install-detail-installeds').scrollHeight;
                duration = Date.now() - startTime;
                lastTime = startTime;
                startTime = Date.now();
                installed.push(files[i]);
                localStorage.setItem('WINBOWS_DIRECTORIES', JSON.stringify(installed));
                if (installed.length == files.length) {
                    update();
                    location.href = './';
                }
            });
        }
    })
} catch (e) { resolve(); }