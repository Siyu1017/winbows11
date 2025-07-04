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
        constructor() {
            this.version = 1;
            this.isInitializing = false
        }
        async init() {
            if (this.isInitializing) return;
            this.isInitializing = true;
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('WINBOWS_STORAGE');
                request.onupgradeneeded = (event) => {
                    console.log('Upgrading database to version', event.oldVersion, 'to', event.newVersion);
                    const db = event.target.result;
                    const store = db.createObjectStore('files', { keyPath: 'key' });
                    store.createIndex('key', 'key', { unique: true });
                };
                request.onsuccess = async (event) => {
                    this.isInitializing = false;

                    db = event.target.result;
                    db.onversionchange = function () {
                        db.close();
                    };
                    resolve();
                };
                request.onerror = (event) => {
                    this.isInitializing = false;
                    reject(event.target.error);
                };
            })
        }
        async getTransaction(store, permission) {

        }
    }

    Object.freeze(window.fs);
})();