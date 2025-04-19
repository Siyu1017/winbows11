Object.defineProperty(window.Compilers, 'Window', {
    /**
     * Add current file datas to the file.
     * @param {Object} path 
     * @param {String} token 
     * @returns {Blob} 
     */
    value: async function (path, token, pid, worker, config) {
        // path.caller => Worker file ( background )
        // path.callee => Window file ( front )
        var file = await window.fs.downloadFile(path.callee);
        var content = await file.text();

        var windowObject = await window.workerModules.browserWindow(path, config, pid);
        windowObject.worker = worker;
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

        function getDirName(path) {
            var directories = path.trim().split('/').filter(dir => dir.length > 0);
            directories.splice(-1);
            return directories.join('/');
        }

        const __dirname = getDirName(path.callee);
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

        const blobURLs = {};
        const modules = {
            'winbows/fs': {
                script: 'C:/Winbows/System/modules/sdk/fs.js',
                requires: []
            },
            'winbows/utils': {
                script: 'C:/Winbows/System/modules/sdk/utils.js',
                requires: []
            }
        }

        async function processModule(module, path) {
            if (!modules[module]) return;
            const { script, requires } = modules[module];
            if (!blobURLs[script]) {
                let content = await fs.getFileAsText(script);
                content = `const __dirname="${getDirName(path)}",__filename="${path}";${content}`;
                const blob = new Blob([content], { type: 'application/javascript' });
                const blobURL = URL.createObjectURL(blob);
                blobURLs[script] = blobURL;
                return blobURL;
            } else {
                return blobURLs[script];
            }
        }
        async function createModuleURL(path, code) {
            if (blobURLs[path]) return blobURLs[path];
            const transformed = await asyncReplaceImports(code, path);
            const blob = new Blob([transformed], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            blobURLs[path] = url;
            return url;
        }
        async function asyncReplaceImports(code, currentPath) {
            // const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
            const importRegex = /import\s+(?:(.*?)\s+from\s+)?["'](.+?)["'];?/g;
            let result = '';
            let lastIndex = 0;
            let match;
            let importStmts = [];

            function resolvePath(basePath, relPath) {
                if (!relPath.startsWith('.')) return relPath;
                const base = basePath.split('/').slice(0, -1);
                const parts = relPath.split('/');
                const resolved = [];

                for (const part of [...base, ...parts]) {
                    if (part === '.' || part === '') continue;
                    if (part === '..') resolved.pop();
                    else resolved.push(part);
                }

                return resolved.join('/');
            }

            while ((match = importRegex.exec(code)) !== null) {
                const [fullMatch, bindings, importPath] = match;
                const start = match.index;
                const end = importRegex.lastIndex;

                result += code.slice(lastIndex, start);
                lastIndex = end;

                if (modules[importPath]) {
                    const blobURL = await processModule(importPath, currentPath);
                    importStmts.push(bindings ? `import ${bindings} from '${blobURL}';` : `import '${blobURL}';`);
                } else {
                    const resolvedPath = resolvePath(currentPath, importPath);
                    const resolvedCode = await fs.getFileAsText(resolvedPath);
                    if (!resolvedCode) {
                        console.warn(`No modules were exported from the file '${resolvedPath}'`);
                        continue;
                    }
                    const blobURL = await createModuleURL(resolvedPath, resolvedCode);
                    importStmts.push(bindings ? `import ${bindings} from '${blobURL}';` : `import '${blobURL}';`);
                }
            }

            result += code.slice(lastIndex);
            console.log(currentPath, '\n', importStmts)
            return importStmts.join('') + result;
        }

        async function transformImports(code, currentPath) {
            code = code.replace(/import\s+(.*?)\s+from\s+['"](.*?)['"]/g, async (_, bindings, importPath) => {
                //console.log(importPath)
                const resolvedPath = resolvePath(currentPath, importPath);

                //console.log(resolvedPath);
                const resolvedCode = await (await fs.readFile(resolvedPath)).text();
                if (!resolvedCode) throw new Error(`Module not found: ${resolvedPath}`);
                const blobURL = await createModuleURL(resolvedPath, resolvedCode);
                return `import ${bindings} from '${blobURL}';`;
            });
            return code;
        }

        var utils = {};

        Object.defineProperty(utils, 'resolvePath', {
            value: resolvePath,
            writable: false,
            configurable: false
        })

        var currentProcess = window.System.processes[pid];
        if (!currentProcess) {
            windowObject.close();
            return;
        }

        currentProcess.windows.push({
            close: windowObject.close
        });

        content = `export default async function(document, window, self, globalThis, process, System, utils, browserWindow, datas) {const __dirname="${__dirname}",__filename="${__filename}";/*getStackTrace=()=>{var a;try{throw new Error('');}catch(e){a=e.stack||'';}a=a.split('\\n').map(function(t){return t.trim();});return a.splice(a[0]=='Error'?2:1);};*/const TOKEN="${token}";\n${content}\n};`
        content = await asyncReplaceImports(content, path.callee);
        content = `/**\n * Compiled by Winbows11 (c) 2024\n * All rights reserved.\n */` + content;

        windowObject.import = async (url) => {
            url = resolvePath(url);
            const content = await asyncReplaceImports(await fs.getFileAsText(url), url);
            const blob = new Blob([content], { type: 'application/javascript' });
            const blobURL = URL.createObjectURL(blob);
            const module = await import(blobURL);
            //URL.revokeObjectURL(blobURL);
            return module;
        }

        async function runContentAsModule(content, context) {
            const blob = new Blob([content], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            try {
                const mod = await import(url);
                if (typeof mod.default === 'function') {
                    return mod.default(
                        context.document,
                        context.window,
                        context.self,
                        context.globalThis,
                        context.process,
                        context.System,
                        context.utils,
                        context.browserWindow,
                        context.datas
                    );
                } else {
                    window.System.processes[pid].exit(1);
                    throw new Error(`Module did not export a default function`);
                }
            } catch (e) {
                throw e;
            } finally {
                URL.revokeObjectURL(url);
            }
        }

        return runContentAsModule(content, {
            document: proxyDocument,
            window,
            self: proxyWindow,
            globalThis: proxyWindow,
            process: currentProcess,
            System: {},
            utils,
            browserWindow: windowObject,
            datas: config.datas || {}
        });

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

window.loadedKernel();