Object.defineProperty(window.Compilers, 'Window', {
    /**
     * Add current file datas to the file.
     * @param {Object} path 
     * @param {String} token 
     * @returns {Blob} 
     */
    value: async function (path, token, pid, config) {
        // path.caller => Worker file ( background )
        // path.callee => Window file ( front )
        var file = await window.fs.downloadFile(path.callee);
        var content = await file.text();
        var directories = path.callee.trim().split('/').filter(dir => dir.length > 0);
        directories.splice(-1);

        var windowObject = await window.workerModules.browserWindow(path, config, pid);
        var browserWindow = windowObject.shadowRoot;

        var proxyDocument = new Proxy(document, {
            get: (target, prop) => {
                switch (prop) {
                    case 'damn':
                        return 'Damn man!';
                    case 'head':
                        return browserWindow;
                    case 'documentElement':
                        return browserWindow.querySelector('.window');
                    case 'body':
                        return browserWindow.querySelector('.window-content');
                    case 'write':
                        return () => {
                            console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                        };
                    case 'addEventListener':
                        return (event, callback) => { browserWindow.addEventListener(event, callback) };
                    case 'removeEventListener':
                        return (event, callback) => { browserWindow.removeEventListener(event, callback) };
                    case 'querySelector':
                        return selector => { return browserWindow.querySelector(selector) };
                    case 'querySelectorAll':
                        return selector => { return browserWindow.querySelectorAll(selector) };
                    default:
                        if (target[prop]) {
                            return Reflect.get(target, prop).bind(document);
                        } else {
                            return undefined;
                        }
                }
            },
            set: (target, prop, value) => {

            }
        })
        var proxyWindow = new Proxy(window, {
            get: (target, prop) => {
                if (prop in target) {
                    return Reflect.get(target, prop);
                } else {
                    return undefined;
                }
            },
            set: (target, prop, value) => {
                console.log(prop)
                return undefined;
            }
        })

        const __dirname = directories.join('/');
        const __filename = path.callee;

        function parseURL(url = '') {
            url = url.replaceAll('\\', '/');
            var disk = ((/([A-Z]{1})(\:\/)/gi).exec(url) || [])[1];
            var path = url.replace(`${disk}:`, '');
            return { disk, path };
        }

        function resolvePath(path) {
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

        var utils = {};

        Object.defineProperty(utils, 'resolvePath', {
            value: resolvePath,
            writable: false,
            configurable: false
        })

        var currentProcess = window.System.processes[pid]

        currentProcess.windows.push({
            close: windowObject.close
        });

        content = `/**\n * Compiled by Winbows11 (c) 2024\n * All rights reserved.\n */const __dirname="${__dirname}",__filename="${__filename}",getStackTrace=()=>{var a;try{throw new Error('');}catch(e){a=e.stack||'';}a=a.split('\\n').map(function(t){return t.trim();});return a.splice(a[0]=='Error'?2:1);};(()=>{const TOKEN="${token}";})();(async()=>{\n${content}\n})();`;

        return Function(
            'document', 
            'window', 
            'self', 
            'globalThis', 
            'process', 
            'System', 
            'utils', 
            'browserWindow', 
            'datas',
        content).bind({})(
            proxyDocument,      // document
            window,             // window
            proxyWindow,        // self
            proxyWindow,        // globalThis
            currentProcess,     // process
            {},                 // System
            utils,              // utils
            windowObject,       // browserWindow
            config.datas || {}  // datas
        );
    },
    configurable: false,
    writable: false
})