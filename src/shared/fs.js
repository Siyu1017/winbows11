const debugMode = false;
const defaultEnv = {
    APPDATA: 'C:/User/AppData/Roaming',
    LOCALAPPDATA: 'C:/User/AppData/Local',
    PROGRAMFILES: 'C:/Program Files',
    SYSTEMDRIVE: 'C:',
    SYSTEMROOT: 'C:/Winbows',
    TEMP: 'C:/User/AppData/Local/Temp',
    TMP: 'C:/User/AppData/Local/Temp',
    USERPROFILE: 'C:/User',
    WINDIR: 'C:/Winbows',
};

// --------------------------- Utils --------------------------- //
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
function getJsonFromURL(url) {
    if (!url) url = location.search;
    var query = url.substr(1), result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
};
function computePath(path, currentPath) {
    const currentPathDirs = currentPath.split('/').filter(dir => dir !== ''),
        pathDirs = path.split('/').filter(dir => dir !== ''),
        resultPath = [...currentPathDirs];
    for (const dir of pathDirs) {
        if (dir === '..') {
            if (resultPath.length > 0) { resultPath.pop(); }
        } else if (dir !== '.') { resultPath.push(dir); }
    }
    return resultPath.join('/');
};
function removeStringInRange(str, start, end) {
    return str.substring(0, start) + str.substring(end);
};
function randomID(count, chars) {
    var chars = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
};
function isBlob(obj) {
    return Object.prototype.toString.call(obj) === "[object Blob]"
};
const fsUtils = {
    sep: '/',
    normalize(p) {
        const parts = p.split(/[/\\]+/);
        const stack = [];

        for (let part of parts) {
            if (part === '' || part === '.') continue;
            if (part === '..') stack.pop();
            else stack.push(part);
        }

        return (p.startsWith('/') ? '/' : '') + stack.join('/');
    },
    join(...args) {
        return fsUtils.normalize(args.join('/'));
    },
    resolve(...paths) {
        let resolved = '';
        for (let i = paths.length - 1; i >= 0; i--) {
            const p = paths[i];
            if (!p) continue;
            resolved = p + '/' + resolved;
            if (fsUtils.isAbsolute(p)) break;
        }
        return fsUtils.normalize(resolved);
    },
    dirname(p) {
        const normalized = fsUtils.normalize(p);
        const parts = normalized.split('/');
        parts.pop();
        return fsUtils.toDirFormat(parts.length > 1 ? parts.join('/') : '/');
    },
    basename(p) {
        return fsUtils.normalize(p).split('/').pop();
    },
    extname(p) {
        const base = fsUtils.basename(p);
        const dotIndex = base.lastIndexOf('.');
        return dotIndex > 0 ? base.slice(dotIndex) : '';
    },
    isAbsolute(p) {
        return p.startsWith('/') || /^[A-Za-z]:[\\/]/.test(p);
    },
    relative(from, to) {
        const fromParts = fsUtils.resolve(from).split('/');
        const toParts = fsUtils.resolve(to).split('/');

        while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
            fromParts.shift();
            toParts.shift();
        }

        return '../'.repeat(fromParts.length) + toParts.join('/');
    },
    parsePath(v) {
        v = v.replaceAll('\\', '/');
        const match = /^([a-zA-Z]):\//.exec(v);
        const disk = match ? match[1].toUpperCase() : 'C';
        let path = v.replace(/^([a-zA-Z]):/, '');
        path = fsUtils.normalize(path);
        path = !path.endsWith('/') && v.endsWith('/') ? path + '/' : path;;
        return { disk, path };
    },
    toDirFormat(path) {
        return path.endsWith('/') ? path : path + '/';
    },
    isValidAbsolutePath(path) {
        const p = path.replace(/\\/g, '/');

        if (!/^[a-zA-Z]{1}:\//.test(p)) return false;

        const parts = p.split('/');
        let depth = 0;
        for (const part of parts.slice(1)) {    // Ignore disk
            if (part === '' || part === '.') continue;
            else if (part === '..') {
                depth--;
                if (depth < 0) return false;
            } else {
                depth++;
            }
        }

        return true;
    },
    resolveEnvPath(path) {
        return path.replace(/^%([^%]+)%[\\/]?/, (_, key) => {
            const value = defaultEnv[key.toUpperCase()];
            return value ? value + '/' : `%${key}%/`;
        });
    }
};
// --------------------------- Utils --------------------------- //

// UUID
const UUIDManager = (function () {
    const uuids = new Map();
    const priorities = {
        "~BOOT": 10,
        "~KERNEL": 9,
        "~SYSTEM": 9,
        "~EXPLORER": 8
    }

    function UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function setupUUIDPriority(uuid, caller) {
        if (typeof caller === "string") {
            const priority = priorities[caller]
            uuids.set(uuid, priority !== undefined ? priority : 0);
        } else {
            uuids.set(uuid, 0);
        }
    }

    /**
     * 
     * @param {String} uuid 
     * @returns {Number|null} if uuid doesn't exist returns null
     */
    function getPriority(uuid) {
        const priority = uuids.get(uuid);
        return (priority != undefined && priority >= 0) ? priority : null;
    }

    /**
     * 
     * @param {String} caller 
     * @returns 
     */
    function register(caller) {
        const uuid = UUID();
        setupUUIDPriority(uuid, caller);
        return uuid;
    }

    /**
     * 
     * @param {String} uuid 
     */
    function deregister(uuid) {
        if (uuids.has(uuid)) {
            uuids.delete(uuid);
        } else {
            console.error(new Error("Invalid uuid."));
        }
    }

    return { register, getPriority, deregister };
})();

class TransactionQueue {
    constructor(maxConcurrent = 1) {
        this.maxConcurrent = maxConcurrent;
        this.currentCount = 0;
        this.queue = [];
    }

    enqueue(task, uuid) {
        return new Promise((resolve, reject) => {
            const job = { priority: UUIDManager.getPriority(uuid), task, resolve, reject, uuid };
            this.queue.push(job);
            this.queue.sort((a, b) => b.priority - a.priority);
            this.tryNext();
        });
    }
    tryNext() {
        if (this.currentCount >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;

        const job = this.queue.shift();
        this.currentCount++;

        if (UUIDManager.getPriority(job.uuid) == null) {
            this.currentCount--;
            job.reject(new Error("The specified file system uuid cannot be found."));
            this.tryNext();
        }

        Promise.resolve()
            .then(() => job.task())
            .then(result => {
                this.currentCount--;
                job.resolve(result);
                this.tryNext();
            })
            .catch(err => {
                this.currentCount--;
                job.reject(err);
                this.tryNext();
            });
    }
}

const types = {
    dir: 0,
    file: 1
};
const dbName = 'WINBOWS_STORAGE';
const storeName = 'MAIN';
const fileTablePrefix = '$_FILETABLE_';
const localStoragePrefix = dbName + '_' + fileTablePrefix;
const idLength = 24;
const allowedDiskName = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const schemaVersion = 1;
const schemaVersionName = dbName + '_' + 'SCHEMA_VERSION';

const txQueue = new TransactionQueue(5);
let runningTasks = 0;
let tasks = [];
let updateTimer = null;
const maxConcurrent = 10;
const updateDelay = 100;

let listeners = {};
let blobURLCaches = {};

var version = 1;
var isInitializing = false;
var repairing = false;
var now = Date.now();
var fileTables = {
    'C': {
        '/': {
            type: types.dir,
            changeTime: now,
            createdTime: now,
            lastModifiedTime: now,
            length: 0,
            id: null,
            mimeType: null
        }
    }
};
var db;

// Read from localStorage
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // localStorage item name : "<localStoragePrefix><DiskName>:"
    if (key.startsWith(localStoragePrefix) && key.length === localStoragePrefix.length + 2) {
        const disk = key.replace(localStoragePrefix, '').replace(':', '');
        if (allowedDiskName.indexOf(disk) > -1 && disk.length === 1) {
            try {
                fileTables[disk] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
    }
}

// Save the schema version in localStorage
localStorage.setItem(schemaVersionName, schemaVersion);

// ========================== Output ========================== //
function print(...obj) {
    if (debugMode == true) {
        console.log.apply(arguments, ['%cIDBFS', 'color:#ff00ff;'].concat(obj))
    }
}

// ========================== Event ========================== //
function on(event, listener) {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event].push(listener);
}

function emit(event, detail) {
    if (listeners[event]) {
        listeners[event].forEach(listener => listener(detail));
    }
}

// ======================== Validators ======================== //
async function ensureParentFolders(disk, path) {
    const parts = path.split('/').filter(i => i.trim().length > 0);
    parts.pop();

    let currentPath = '/';
    for (const part of parts) {
        currentPath += part + '/';
        if (!fileTables[disk][currentPath]) {
            const now = Date.now();
            fileTables[disk][currentPath] = {
                type: types.dir,
                changeTime: now,
                createdTime: now,
                lastModifiedTime: now,
                length: 0,
                id: null,
                mimeType: null
            };
        }
    }
}

// =========================== Store =========================== //
async function getStore(permission, uuid) {
    return new Promise((resolve, reject) => {
        tasks.push({ permission, resolve, reject, uuid, priority: UUIDManager.getPriority(uuid) });
        tasks.sort((a, b) => b.priority - a.priority);
        doTask();
    })
}

async function doTask() {
    if (runningTasks >= maxConcurrent) return;
    if (tasks.length === 0) {
        if (runningTasks === 0) repairing = false;
        return;
    }

    runningTasks++;
    const task = tasks.shift();

    if (UUIDManager.getPriority(task.uuid) == null) {
        task.reject(`The specified file system uuid cannot be found.`);
        runningTasks--;
        doTask();
        return;
    }

    try {
        const tx = db.transaction(storeName, task.permission);
        const store = tx.objectStore(storeName);
        task.resolve(store);

        tx.oncomplete = () => {
            runningTasks--;
            doTask();
        };
        tx.onerror = () => {
            runningTasks--;
            task.reject(tx.error);
            doTask();
        };

        if (repairing == true) repairing = false;
    } catch (e) {
        runningTasks--;
        if (repairing == false) {
            repairing = true;
            await init();
            print('Trying to repair idbfs...');
            tasks.unshift(task);
            return doTask();
        } else if (e.name === 'InvalidStateError' && repairing == true) {
            print('Failed to repair idbfs.');
        }
    }
}

async function createStore() {
    if (!db) {
        await init();
    }
    return new Promise((resolve) => {
        const request = indexedDB.open(dbName, db.version + 1);
        request.onupgradeneeded = (event) => {
            print('Upgrading database to version', event.oldVersion, 'to', event.newVersion);
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'k' });
                store.createIndex('k', 'k', { unique: true });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(true);
        };
    });
}

function put(store, data) {
    return new Promise((resolve, reject) => {
        const req = store.put(data);
        req.onsuccess = resolve;
        req.onerror = () => reject(req.error);
    });
}

// ========================= File table ========================= //
async function updateFileTable(disk) {
    localStorage.setItem(localStoragePrefix + disk + ':', JSON.stringify(fileTables[disk]));
    scheduleUpdateFileTable(disk);
}

// For idb
function scheduleUpdateFileTable(disk) {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(async () => {
        updateTimer = null;
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.put({
                k: fileTablePrefix + disk + ':',
                v: fileTables[disk]
            })
        } catch (e) {
            console.warn('Failed to update fileTable in IndexedDB:', e);
        }
    }, updateDelay);
}

async function deleteBlobsInBatches(disk, paths, uuid, batchSize = 100) {
    for (let i = 0; i < paths.length; i += batchSize) {
        const batch = paths.slice(i, i + batchSize);
        const store = await getStore('readwrite', uuid);

        await Promise.all(batch.map(path => {
            return new Promise((res, rej) => {
                const entry = fileTables[disk][path];
                if (!entry || entry.type !== types.file) return res();

                const req = store.delete(entry.id);
                req.onsuccess = () => {
                    // Remove cached url
                    if (blobURLCaches[disk + ':' + path]) {
                        delete blobURLCaches[disk + ':' + path];
                    }
                    delete fileTables[disk][path];
                    res();
                };
                req.onerror = () => {
                    console.warn(`Failed to delete blob for ${path}:`, req.error);
                    res();
                }
            });
        }));
        await updateFileTable(disk);
    }
}

async function init() {
    if (isInitializing) return;
    isInitializing = true;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = (event) => {
            print('Upgrading database to version', event.oldVersion, 'to', event.newVersion);
            db = event.target.result;
            const store = db.createObjectStore(storeName, { keyPath: 'k' });
            store.createIndex('k', 'k', { unique: true });
        };
        request.onsuccess = async (event) => {
            isInitializing = false;

            db = event.target.result;
            db.onversionchange = function () {
                db.close();
            };
            if (!event.target.result.objectStoreNames.contains(storeName)) {
                await createStore();
            }

            async function getOrSyncFileTable(disk) {
                const key = fileTablePrefix + disk + ':';
                const localStorageFT = localStorage.getItem(localStoragePrefix + disk + ':');
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite')
                    const store = tx.objectStore(storeName);
                    const request = store.get(key);
                    request.onsuccess = async (event) => {
                        // NOTE: Use the file table in localStorage first
                        const table = event.target.result;
                        if (localStorageFT) {
                            // Sync the file table in localStorage to the file table in idbfs
                            try {
                                await put(store, {
                                    k: key,
                                    v: JSON.parse(localStorageFT)
                                });
                            } catch (e) {
                                print('Error : Failed to Sync the file table in localStorage to the file table in idbfs\nDetails :', e);
                                localStorage.removeItem(localStoragePrefix + disk + ':');
                            }
                        } else if (table && !localStorageFT) {
                            // File table doesn't exist in localStorage
                            fileTables[disk] = table.v;
                            localStorage.setItem(localStoragePrefix + disk + ':', JSON.stringify(fileTables[disk]));
                        } else if (!table && !localStorageFT) {
                            // File table doesn't exist in localStorage or idbfs
                            localStorage.setItem(localStoragePrefix + disk + ':', JSON.stringify(fileTables[disk]));
                            await put(store, {
                                k: key,
                                v: fileTables[disk]
                            });
                        }
                        resolve();
                    }
                    request.onerror = async (event) => {
                        print(`Warning : Failed to get file table [${fileTablePrefix + disk + ':'}] from idbfs\nDetails :`, event.target.error);
                        const localStorageFT = localStorage.getItem(localStoragePrefix + disk + ':');
                        try {
                            await put(store, {
                                k: fileTablePrefix + disk + ':',
                                v: localStorageFT ? JSON.parse(localStorageFT) : fileTables[disk]
                            });
                        } catch (e) {
                            print('Error : Failed to write file table to idbfs\nDetails :', e);
                        }
                        resolve();
                    }
                })
            }

            // Try to read the file table
            for (const disk of Object.keys(fileTables)) {
                await getOrSyncFileTable(disk);
            }
            resolve();
        };
        request.onerror = (event) => {
            isInitializing = false;
            reject(event.target.error);
        };
    })
}

await init();

const IDBFS = function (caller = "<anonymous>", __dirname = "") {
    const uuid = UUIDManager.register(caller);

    function parsePath(v) {
        v = fsUtils.resolveEnvPath(v);
        if (__dirname != "") {
            var isdir = v.endsWith('/');
            v = fsUtils.resolve(__dirname, v);
            if (isdir) v += '/';
        }
        v = v.replaceAll('\\', '/');
        const match = /^([a-zA-Z]):\//.exec(v);
        const disk = match ? match[1].toUpperCase() : 'C';
        let path = v.replace(/^([a-zA-Z]):/, '');
        path = fsUtils.normalize(path);
        path = !path.endsWith('/') && v.endsWith('/') ? path + '/' : path;
        return { disk, path };
    };

    // ================== Basic File System functions ================== //

    /**
     * @typedef {Object} CustomError
     * @property {string} name 
     * @property {string} message
     * @property {number} code
     */

    /**
     * Check if the specified file / directory path exists
     * @param {string} fullPath 
     * @returns {boolean}
     */
    function exists(fullPath) {
        const { disk, path } = parsePath(fullPath);
        if (!fileTables[disk]) {
            return false;
        }
        return !!fileTables[disk][path];
    }

    /**
     * Create a directory
     * @param {string} fullPath 
     * @returns {Promise} If it failed, reject a {@link CustomError}
     */
    async function mkdir(fullPath) {
        // RULE : directory path should end with '/'
        const { disk, path: rawPath } = parsePath(fullPath);
        let path = rawPath.endsWith('/') ? rawPath : rawPath + '/';

        const invalidFolderNamePattern = /[\\\/:\*\?"<>\|]|[\. ]$/;
        if (invalidFolderNamePattern.test(fsUtils.basename(fullPath)) && path != '/') {
            // Check if the directory name contains invalid characters
            throw {
                name: 'InvalidName',
                message: `Illegal directory name : ${fullPath}`
            };
        } else if (!fileTables[disk]) {
            // Check if the target disk exists
            throw {
                name: 'NotFound',
                message: `Invalid path : ${fullPath}`
            };
        } /*else if (!checkParentFoldersExist(disk, path)) {
                // Check if the parent folder exists
                throw {
                    name: 'NotFound',
                    message: `No such file or directory : ${fullPath}`
                };
            } */else if (fileTables[disk][path]) {
            // Check if the directory already exists
            throw {
                name: 'AlreadyExists',
                message: `Directory already exists : ${fullPath}`
            };
        } else {
            ensureParentFolders(disk, path);
            const now = Date.now();
            fileTables[disk][path] = {
                type: types.dir,
                changeTime: now,
                createdTime: now,
                lastModifiedTime: now,
                length: 0,
                id: null,
                mimeType: null
            }
            updateFileTable(disk);
            emit('change', {
                path: fullPath
            })
            return;
        }
    }

    /**
     * Move file or directory
     * @param {string} srcFullPath 
     * @param {string} destFullPath 
     * @param {object} [options]
     * @param {boolean} [options.overwrite=false]
     */
    async function mv(srcFullPath, destFullPath, options = {}) {
        const { overwrite = false } = options;

        const { disk: srcDisk, path: srcPath } = parsePath(srcFullPath);
        const { disk: destDisk, path: destPath } = parsePath(destFullPath);

        if (!fileTables[srcDisk] || !fileTables[srcDisk][srcPath]) {
            throw { name: 'NotFound', message: `Source path not found: ${srcFullPath}` };
        }
        if (!fileTables[destDisk]) {
            throw { name: 'NotFound', message: `Destination disk not found: ${destDisk}` };
        }

        const srcEntry = fileTables[srcDisk][srcPath];
        const destExists = !!fileTables[destDisk][destPath];

        if (destExists && !overwrite) {
            throw { name: 'AlreadyExists', message: `Destination already exists: ${destFullPath}` };
        }

        await ensureParentFolders(destDisk, destPath);

        if (srcEntry.type === types.file) {
            const blob = await readFile(srcFullPath);
            await writeFile(destFullPath, blob);
            await rm(srcFullPath);
        } else if (srcEntry.type === types.dir) {
            const entries = await readdir(srcFullPath, { recursive: true });
            entries.push(srcFullPath);

            for (const entryPath of entries) {
                const relativePath = entryPath.slice(srcFullPath.length);
                const targetPath = destFullPath + relativePath;

                const entry = fileTables[srcDisk][parsePath(entryPath).path];
                if (entry.type === types.file) {
                    const blob = await readFile(entryPath);
                    await writeFile(targetPath, blob);
                } else if (entry.type === types.dir) {
                    await ensureParentFolders(destDisk, parsePath(targetPath).path);
                    fileTables[destDisk][parsePath(targetPath).path] = {
                        ...entry,
                        createdTime: Date.now(),
                        lastModifiedTime: Date.now()
                    };
                }
            }

            await rm(srcFullPath, { recursive: true });
        } else {
            throw { name: 'InvalidEntry', message: `Unknown entry type at ${srcFullPath}` };
        }

        updateFileTable(destDisk);
        updateFileTable(srcDisk);
    }

    /**
     * Read a directory
     * @param {string} fullPath
     * @param {object} [options]
     * @param {boolean} [options.recursive=false] Whether to recursively include files in subdirectories
     * @returns {Promise<string[]>} If it failed, reject a {@link CustomError}
     */
    async function readdir(fullPath, options = {}) {
        const recursive = options.recursive ?? false;
        const { disk, path: rawPath } = parsePath(fullPath);
        let path = rawPath.endsWith('/') ? rawPath : rawPath + '/';
        if (!fileTables[disk]) {
            throw {
                name: 'NotFound',
                message: `The disk ( ${disk} ) could not be found`
            };
        } else if (!fileTables[disk][path]) {
            throw {
                name: 'NotFound',
                message: `The specified directory path ( ${fullPath} ) could not be found`
            };
        } else if (fileTables[disk][path].type !== types.dir) {
            throw {
                name: 'InvalidPath',
                message: `The specified path ( ${fullPath} ) is not a directory`
            };
        }
        const entries = Object.keys(fileTables[disk])
            .filter(key => {
                if (!key.startsWith(path) || key === path) return false;
                if (recursive) return true;
                // Non-recursive mode
                const subPath = key.slice(path.length);
                return subPath.split('/').filter(Boolean).length === 1;
            })
            .map(k => `${disk}:${k}`);
        return entries;
    }

    /**
     * Read blob
     * @param {string} fullPath
     * @returns {Promise<Blob>} If it failed, reject a {@link CustomError}
     */
    async function readFile(fullPath) {
        const { disk, path } = parsePath(fullPath);
        if (path == '' || path.endsWith('/') || fsUtils.basename(path) == '') {
            throw {
                name: '',
                message: `Invalid path : ${fullPath}`
            };
        }
        if (!fileTables[disk]) {
            throw {
                name: '',
                message: `The disk ( ${disk} ) could not be found`
            };
        }
        if (!fileTables[disk][path]) {
            throw {
                name: '',
                message: `File not found: ${fullPath}`
            };
        }
        const store = await getStore('readonly', uuid)

        return new Promise((resolve, reject) => {
            const request = store.get(fileTables[disk][path].id);
            request.onsuccess = async (event) => {
                const file = event.target.result;
                if (file) {
                    resolve(file.v);
                    // Cache blob
                    if (window.modes.dev == false) {
                        blobURLCaches[fullPath] = URL.createObjectURL(file.v);
                    }
                    if (file.v.type && fileTables[disk][path].mimeType != file.v.type) {
                        fileTables[disk][path].mimeType = file.v.type;
                        updateFileTable(disk);
                    }
                } else {
                    reject({
                        name: 'NotFound',
                        message: `File not found: ${fullPath}`
                    });
                }
            }
            request.onerror = async (event) => {
                const err = event.target.error;
                reject({
                    name: err.name,
                    message: err.message
                });
            }
        })
    }

    /**
     * Remove file or directory
     * @param {string} fullPath 
     * @param {object} [options]
     * @param {boolean} [options.recursive=false]
     * @param {boolean} [options.force=false]
     * @returns {Promise} If it failed, reject a {@link CustomError}
     */
    async function rm(fullPath, options = {}) {
        const { recursive = false, force = false } = options;
        const { disk, path } = parsePath(fullPath);
        if (!fileTables[disk]) {
            if (force) return;
            throw {
                name: 'NotFound',
                message: `The disk ( ${disk} ) could not be found`
            };
        }

        const entry = fileTables[disk][path];
        if (!entry) {
            if (force) return;
            throw {
                name: 'NotFound',
                message: `The specified path ( ${fullPath} ) could not be found`
            };
        }
        if (entry.type === types.file) {
            const store = await getStore('readwrite', uuid)
            await new Promise((res, rej) => {
                const req = store.delete(entry.id);
                req.onsuccess = () => {
                    // Remove cached url
                    if (blobURLCaches[disk + ':' + path]) {
                        delete blobURLCaches[disk + ':' + path];
                    }
                    delete fileTables[disk][path];
                    updateFileTable(disk);
                    emit('change', {
                        path: fullPath
                    });
                    res();
                };
                req.onerror = () => rej({
                    name: req.error.name,
                    message: req.error.message
                });
            });
            return;
        } else if (entry.type === types.dir) {
            const entries = await readdir(fullPath, { recursive });
            if (!recursive && entries.length > 0) {
                throw {
                    name: 'DirectoryNotEmpty',
                    message: `Directory ( ${fullPath} ) is not empty`
                };
            }
            const pathToRemove = entries.map(e => parsePath(e).path);
            pathToRemove.push(path);

            await deleteBlobsInBatches(disk, pathToRemove, uuid)
            for (const path of pathToRemove) {
                const entry = fileTables[disk][path];
                if (entry && entry.type === types.dir) {
                    delete fileTables[disk][path];
                }
                updateFileTable(disk);
            }
            updateFileTable(disk);
            emit('change', {
                path: fullPath
            })
            return;
        } else {
            throw {
                name: 'InvalidEntry',
                message: `Unknown entry type at ${fullPath}`
            };
        }
    }

    /**
     * Get the status of the specified path
     * @param {string} fullPath 
     * @returns {Object}
     */
    function stat(fullPath) {
        const { disk, path } = parsePath(fullPath);
        if (!fileTables[disk]) {
            return {
                isFile: () => false,
                isDirectory: () => false,
                length: 0,
                exists: false,
                type: null,
                changeTime: null,
                createdTime: null,
                lastModifiedTime: null,
                mimeType: null
            }
        }
        const entry = fileTables[disk][path];
        if (!entry) {
            return {
                isFile: () => false,
                isDirectory: () => false,
                length: 0,
                exists: false,
                type: null,
                changeTime: null,
                createdTime: null,
                lastModifiedTime: null,
                mimeType: null
            }
        }

        var length = entry.length;
        if (entry.type === types.dir) {
            Object.keys(fileTables[disk]).filter(t => t.startsWith(path)).forEach(p => {
                length += fileTables[disk][p].length;
            })
        }

        return {
            isFile: () => entry.type === types.file,
            isDirectory: () => entry.type === types.dir,
            length,
            exists: true,
            type: entry.type === types.file ? 'file' : 'directory',
            changeTime: entry.changeTime,
            createdTime: entry.createdTime,
            lastModifiedTime: entry.lastModifiedTime,
            mimeType: entry.mimeType || ''
        }
    }

    /**
     * Write a blob to the specified path
     * @param {string} fullPath
     * @param {Blob} blob 
     * @returns {Promise} If it failed, reject a {@link CustomError}
     */
    async function writeFile(fullPath, blob) {
        const { disk, path } = parsePath(fullPath);
        if (!fileTables[disk]) throw {
            name: 'NotFound',
            message: `The disk ( ${disk} ) could not be found`
        };
        if (fsUtils.basename(path) == '' || path.endsWith('/') || path == '') throw {
            name: 'InvalidPath',
            message: `Invalid path : ${fullPath}`
        };
        if (!isBlob(blob)) throw {
            name: 'TypeError',
            message: `The type of the second parameter provided ( ${Object.prototype.toString.call(blob)} ) is not [object Blob]`
        };
        /*if (!checkParentFoldersExist(disk, path)) throw {
            name: '',
            message: `No such file or directory : ${fullPath}`
        };*/
        ensureParentFolders(disk, path);
        const id = fileTables[disk][path] ? fileTables[disk][path].id : randomID(idLength);
        const now = Date.now();
        const store = await getStore('readwrite', uuid);
        return new Promise((resolve, reject) => {
            const request = store.put({
                k: id,
                v: blob
            })
            request.onsuccess = async () => {
                if (!fileTables[disk][path]) {
                    fileTables[disk][path] = {
                        type: types.file,
                        changeTime: now,
                        createdTime: now,
                        lastModifiedTime: now,
                        length: blob.size,
                        id,
                        mimeType: blob.type || ''
                    };
                } else {
                    if (fileTables[disk][path].type == types.file) {
                        fileTables[disk][path].changeTime = now;
                        fileTables[disk][path].lastModifiedTime = now;
                        fileTables[disk][path].length = blob.size;
                        fileTables[disk][path].mimeType = blob.type || '';
                    }
                }
                updateFileTable(disk);
                emit('change', {
                    path: fullPath
                })
                // Cache blob
                if (window.modes.dev == false) {
                    blobURLCaches[fullPath] = URL.createObjectURL(blob);
                }
                resolve();
            }
            request.onerror = async (event) => {
                const err = event.target.error;
                reject({
                    name: err.name,
                    message: err.message
                });
            }
        })
    }

    // =================== Proxy for Web Workers =================== //

    /**
     * Proxy
     * @param {string} method 
     * @param {*} param 
     * @returns 
     */
    async function proxy(method, param) {
        const availableAPIs = { exists, mkdir, mv, on, readdir, readFile, rm, stat, writeFile };
        if (Object.keys(availableAPIs).includes(method)) {
            return availableAPIs[method](...param);
        }
    }

    // =================== Convenient functions ==================== //

    /**
     * Download file to idbfs and returns file content
     * @param {string} fullPath 
     * @param {string} [responseType=blob]
     * @returns {(Blob|string)}
     */
    async function downloadFile(fullPath, responseType = 'blob') {
        if (__dirname != "") {
            fullPath = fsUtils.resolve(__dirname, fullPath);
        }
        if (!fullPath || typeof fullPath !== 'string' || fullPath.trim().length == 0) return;
        if (debugMode == true) {
            // Debugger
            print(getStackTrace(), fullPath);
        }
        if (
            navigator.onLine != true                            // Offline
            || window.needsUpdate == false && window.modes.dev == false  // Installed
            || fullPath.startsWith('C:/User/Desktop/')   // Desktop folder
        ) {
            return await readFile(fullPath);
        }
        const { disk, path } = parsePath(fullPath);
        if (disk != 'C') throw {
            name: 'InvalidPath',
            message: ''
        };
        return fetch((path.startsWith('/') ? '.' : './') + path).then(response => {
            if (response.ok) {
                return response.blob();
            } else {
                print(`Failed to fetch file: ${fullPath}`);
                throw new Error('Fetch failed');
            }
        }).then(async blob => {
            writeFile(fullPath, blob);
            if (responseType == 'text') {
                return await blob.text();
            } else {
                return blob;
            }
        }).catch(async err => {
            print(`Failed to fetch file: ${fullPath}`, err);
            const blob = await readFile(fullPath);
            if (responseType == 'text') {
                return await blob.text();
            }
            return blob;
        })
    }

    /**
     * Get the blob URL of the file
     * @param {string} fullPath
     * @returns {Promise<string>}
     */
    async function getFileURL(fullPath) {
        if (__dirname != "") {
            fullPath = fsUtils.resolve(__dirname, fullPath);
        }
        if (blobURLCaches[fullPath] && window.modes.dev == false) return blobURLCaches[fullPath];

        const blob = await downloadFile(fullPath);
        if (!blob) return '';
        const blobURL = URL.createObjectURL(blob);
        if (window.modes.dev == false) blobURLCaches[fullPath] = blobURL;
        return blobURL;
    }

    /**
     * Get file content
     * @param {string} fullPath 
     * @returns {Promise<string>}
     */
    async function readFileAsText(fullPath) {
        if (__dirname != "") {
            fullPath = fsUtils.resolve(__dirname, fullPath);
        }
        if (
            navigator.onLine != true                                     // Offline
            || window.needsUpdate == false && window.modes.dev == false  // Installed
            || fullPath.startsWith('C:/User/Desktop/')                   // Desktop folder
        ) {
            return await (await readFile(fullPath)).text();
        }
        const { disk, path } = parsePath(fullPath);
        if (disk != 'C') throw {
            name: 'InvalidPath',
            message: ''
        };
        return fetch((path.startsWith('/') ? '.' : './') + path).then(response => {
            if (response.ok) {
                return response.blob();
            } else {
                print(`Failed to fetch file: ${fullPath}`);
            }
        }).then(async blob => {
            writeFile(fullPath, blob);
            return await blob.text();
        }).catch(async err => {
            print(`Failed to fetch file: ${fullPath}`, err);
            return await (await readFile(fullPath)).text();
        })
    }

    // ==================== Deprecated functions ==================== //

    /**
     * Get file extension
     * @param {string} file 
     * @returns {string}
     */
    function getFileExtension(file = '') {
        console.warn('%cfs.getFileExtension()%c has been deprecated.\nPlease use %cutils.getFileExtension()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '');
        return fsUtils.extname(file);
    }

    function resolvePath(path) {
        if (__dirname != "") {
            var isdir = path.endsWith('/');
            path = fsUtils.resolve(__dirname, path);
            if (isdir) path += '/';
        }
        return path;
    }

    return {
        get disks() {
            return Object.keys(fileTables);
        },
        quit: function () {
            UUIDManager.deregister(uuid);
        },
        // =================== For main window =================== //
        exists, mkdir, mv, on, readdir, readFile, rm, stat, writeFile,
        // =================== For Web Workers =================== //
        proxy,
        // ================= Convenient functions ================ //
        downloadFile, getFileURL, readFileAsText,
        // ================= Deprecated functions ================ //
        getFileExtension, resolvePath
    };
}

window.IDBFS = IDBFS;
window.fsUtils = fsUtils;

Object.freeze(window.IDBFS);
Object.freeze(window.fsUtils);

export { IDBFS, fsUtils };