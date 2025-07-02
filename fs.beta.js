// File System
!(async () => {
    const debugMode = false;
    const devMode = (getJsonFromURL()['dev'] || getJsonFromURL()['develop']) ? true : false;

    // --------------------------- Utils --------------------------- //
    function getJsonFromURL(url) { if (!url) url = location.search; var query = url.substr(1), result = {}; query.split("&").forEach(function (part) { var item = part.split("="); result[item[0]] = decodeURIComponent(item[1]); }); return result; };
    function computePath(path, currentPath) { const currentPathDirs = currentPath.split('/').filter(dir => dir !== ''), pathDirs = path.split('/').filter(dir => dir !== ''), resultPath = [...currentPathDirs]; for (const dir of pathDirs) { if (dir === '..') { if (resultPath.length > 0) { resultPath.pop(); } } else if (dir !== '.') { resultPath.push(dir); } } const outputPath = resultPath.join('/'); return outputPath; };
    function parseURL(url = '') { url = url.replaceAll('\\', '/'); var disk = ((/([A-Z]{1})(\:\/)/gi).exec(url) || [])[1] || mainDisk, path = url.replace(`${disk}:/`, ''); return { disk, path }; };
    // --------------------------- Utils --------------------------- //

    var queue = [];

    class IDBFS {
        constructor(dbName='C') {
            this.dbName = dbName;
            this.version = 1;
        }
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName);
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    const store = db.createObjectStore('files', { keyPath: 'key' });
                    store.createIndex('key', 'key', { unique: true });
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
    }

    Object.freeze(window.fs);
})();