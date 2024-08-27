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

    const process = {
        platform: 'Winbows',
        exit: (code) => {
            self.close();
        }
    }

    self.process = process;

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
    System.fs = async (method, ...args) => {
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
            config.icon = await System.fs('resolve', './app.ico');
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
            return await this.window.getStatus();
        }
    }
    System.customToolbar = class {
        constructor(content) {

        }
    }

    onmessage = (e) => {
        if (e.data.token == TOKEN) {
            if (Object.keys(System.messageIDs).includes(e.data.messageID)) {
                System.messageIDs[e.data.messageID](e.data.response);
                delete System.messageIDs[e.data.messageID];
            }
        }
    }

    self.System = System;
})();