(() => {
    class Messenger {
        constructor() {
            this.types = {};

            onmessage = (event) => {
                if (Object.keys(this.types).contains(event.data.type)) {
                    this.types[event.data.type](event.data);
                }
            }
        }
        send(type, content) {
            postMessage({ type: type, content: content, token: TOKEN });
        }
        on(type, callback) {
            this.types[type] = callback;
        }
    }

    function randomString(length) {
        if (!length) return console.warn('Option Invalid');
        var characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'Q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '2', '3', '4', '5', '6', '7', '8', '9'],
            str = '';
        for (let i = 0; i < length; i++) {
            str += characters[Math.floor(Math.random() * characters.length)];
        }
        return str;
    }

    function randomID(target) {
        var id = randomString(10);
        while (target.hasOwnProperty(id)) {
            id = randomString(10);
        }
        return id;
    }

    function parseURL(url = '') {
        url = url.replaceAll('\\', '/');
        var disk = ((/([A-Z]{1})(\:\/)/gi).exec(url) || [])[1];
        var path = url.replace(`${disk}:`, '');
        return { disk, path };
    }

    function computePath(path) {
        var parsedCurrent = parseURL(__dirname);
        var parsedPath = parseURL(path);
        if (parsedPath.disk) {
            return path;
        }
        const currentPathDirs = parsedCurrent.path.split('/').filter(dir => dir !== '');
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

        return parsedCurrent.disk + ':/' + outputPath;
    }

    Object.defineProperty(self, 'close', {
        value: function () {
            self.postMessage({ type: 'close' });
            self.close();
        },
        configurable: false,
        writable: false
    })

    var listeners = {};

    function triggerEvent(event, details) {
        if (listeners[event]) {
            listeners[event].forEach(listener => {
                listener(details);
            })
        }
    }

    const process = {
        platform: 'Winbows',
        exit: (code) => {
            self.close();
        },
        error: (err) => {
            var payload = {
                token: TOKEN,
                type: 'error',
                error: err
            }
            postMessage(payload);
        },
        on: (event, listener) => {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
        },
        off: (event, listener) => {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(listenerToRemove => listener !== listenerToRemove);
            }
        },
        send: (message) => {
            return System.request(message);
        }
    }

    self.process = process;

    self.utils = {};
    self.utils.replaceHTMLTags = (content = '') => {
        return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }
    self.utils.getFileName = (path = '') => {
        return path.split('/').slice(-1)[0];
    }
    self.utils.getFileExtension = function (file = '') {
        file = self.utils.getFileName(file);
        if (file.indexOf('.') > -1) {
            return file.split('.').pop();
        } else {
            return '';
        }
    }
    self.utils.getMimeType = getMimeType;
    self.utils.getJsonFromURL = getJsonFromURL;

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
    function getMimeType(extension) {
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    self.fs = async (method, ...args) => {
        args[0] = computePath(args[0]);
        if (method == 'resolve') {
            return args[0];
        }
        return await System.request({
            type: 'function',
            name: 'fs',
            method: method,
            param: [...args],
            current: __dirname
        })
    }

    var System = {};
    System.ToolbarComponents = {};
    System.messageIDs = {};
    System.request = (payload) => {
        return new Promise((resolve, reject) => {
            var messageID = randomID(System.messageIDs);
            payload.messageID = messageID;
            payload.token = TOKEN;
            postMessage(payload);
            System.messageIDs[messageID] = (e) => {
                resolve(e);
                delete System.messageIDs[messageID];
            }
        })
    }
    System.requestAccessWindow = async (script, config) => {
        var path = {
            caller: __filename,
            callee: computePath(script)
        }
        return await System.request({
            type: 'function',
            name: 'requestAccessWindow',
            path: path,
            config: config
        })
    }
    System.browserWindow = class {
        constructor(config) {
            this.id = null;
            return new Promise(async (resolve, reject) => {
                await this.init(config)
                resolve(this);
            })
        }
        async init(config) {
            config.icon = await fs('resolve', './app.ico');
            return await System.request({
                type: 'function',
                name: 'browserWindow',
                arguments: config
            }).then(e => {
                this.id = e;
            })
        }
        async close() {
            return await System.request({
                type: 'function',
                name: 'browserWindow',
                arguments: [{
                    width: 500,
                    height: 500,
                    title: 'Window',
                    x: 0,
                    y: 0
                }]
            }).then(e => {
                this.id = e;
            })
        }
        async update() {

        }
        async getStatus() {
            return await this.self.getStatus();
        }
    }
    System.customToolbar = class {
        constructor(content) {

        }
    }

    onmessage = (e) => {
        if (e.data.token == TOKEN) {
            triggerEvent('message', e);
            if (Object.keys(System.messageIDs).includes(e.data.messageID)) {
                System.messageIDs[e.data.messageID](e.data.response);
                delete System.messageIDs[e.data.messageID];
            }
        }
    }

    self.System = System;
})();