'use strict';

async function Main() {
    if (!window.fs) {
        // Check if the file system has been initialized
        console.warn('Wait for file system initialization...');
        await (() => {
            return new Promise((resolve, reject) => {
                window.__fscf.c(resolve);
            })
        })();
        console.warn('File system initialized.');
    }

    async function shouldMigrateFromOldDatabase() {
        if (!indexedDB.databases) return false;
        const dbs = await indexedDB.databases();
        return dbs.some(db => db.name === 'winbows11');
    }
    const needsToMigrate = await shouldMigrateFromOldDatabase();

    if (needsToMigrate) {
        console.warn('Needs to migrate from old database...');

        var warning = document.createElement('div');
        var warningWindow = document.createElement('div');
        var warningHeader = document.createElement('div');
        var warningContent = document.createElement('div');
        var warningFooter = document.createElement('div');
        var warningMigrateButton = document.createElement('button');

        warningHeader.innerHTML = 'Data migration required';
        warningContent.innerHTML = `<div>We have recently updated the IDBFS schema and detected that you previously saved files in Winbows. As the previous schema has been deprecated, we need to migrate your files to the new version to prevent potential data loss or unexpected errors.</div>
        <div>This update replaces the original file path–based storage with a new structure that uses a file table and record IDs, improving access performance and ensuring data consistency.</div>`;
        warningMigrateButton.innerHTML = 'Continue';

        warning.style = 'position: fixed;top: 0px;left: 0px;width: 100vw;height: var(--winbows-screen-height);display: flex;align-items: center;justify-content: center;background-color: rgba(0, 0, 0, 0.5);z-index: 99999;font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;';
        warningWindow.style = 'display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem 4rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px, -2rem + 100vw);width: 100%;max-height: min(calc(var(--winbows-screen-height) * 80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;';
        warningHeader.style = 'font-size: 175%;font-weight: 600;margin: .5rem 0 1.5rem;';
        warningMigrateButton.style = 'color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1.5rem;font-family: inherit;font-weight: 600;';

        warning.appendChild(warningWindow);
        warningWindow.appendChild(warningHeader);
        warningWindow.appendChild(warningContent);
        warningWindow.appendChild(warningFooter);
        warningFooter.appendChild(warningMigrateButton);
        document.body.appendChild(warning);

        await (function () {
            return new Promise(resolve => {
                function evtfn() {
                    warningWindow.innerHTML = '';
                    resolve();
                    warningMigrateButton.removeEventListener('click', evtfn);
                }
                warningMigrateButton.addEventListener('click', evtfn);
            })
        })();

        await (function () {
            return new Promise(resolve => {
                warningWindow.style.padding = '2rem';

                var taskOrder = ['open', 'read', 'migrate', 'delete'];
                var taskFinished = [];
                var tasks = {
                    open: {
                        text: 'Open old idbfs'
                    },
                    read: {
                        text: 'Read old idbfs'
                    },
                    migrate: {
                        text: 'Migrate files to new idbfs'
                    },
                    delete: {
                        text: 'Delete old idbfs'
                    }
                }

                var called = false;
                function checkIfAllFinished() {
                    if (taskFinished.every(x => x == true) && called == false) {
                        called = true;
                        var button = document.createElement('button');
                        button.innerHTML = 'Continue';
                        button.style = 'color: rgb(255, 255, 255);/* margin-bottom: 0.5rem; */padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1rem;font-family: inherit;font-weight: 600;';
                        warningWindow.appendChild(button);
                        button.addEventListener('click', () => {
                            warning.remove();
                            location.href='./install.html';
                            
                        
                        })
                    }
                }

                var progress = document.createElement('div');
                var task = document.createElement('div');

                progress.className = 'migrate-progress';
                task.className = 'migrate-task';

                warningWindow.appendChild(progress);
                warningWindow.appendChild(task);

                for (const i in taskOrder) {
                    !(i => {
                        const key = taskOrder[i];

                        // Progress bar
                        var progressBar = document.createElement('div');
                        progressBar.className = 'migrate-progress-bar';
                        progress.appendChild(progressBar);
                        tasks[key].progressBar = progressBar;

                        // Task name
                        var el = document.createElement('div');
                        el.className = 'migrate-task-item';
                        el.innerHTML = `<div class="migrate-task-icon"><svg class="migrate-loading-spinner" width="16" height="16" viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="7px"></circle></svg></div><div class="migrate-task-item-text">${tasks[key].text}</div>`;
                        task.appendChild(el);

                        taskFinished.push(false);

                        tasks[key].taskItem = el;
                        tasks[key].finished = false;
                        tasks[key].finish = function () {
                            if (taskFinished.slice(0, i).every(x => x == true)) {
                                tasks[key].finished = true;
                                taskFinished[i] = true;
                                progressBar.classList.add('fulfilled');
                                el.classList.add('fulfilled');
                                checkIfAllFinished();
                            }
                        }
                        tasks[key].update = function (content) {
                            el.querySelector('.migrate-task-item-text').innerHTML = content;
                        }
                    })(i);
                }

                // Try to open the old database
                const oldDbRequest = indexedDB.open('winbows11', 1);
                oldDbRequest.onsuccess = async (event) => {
                    const db = event.target.result;

                    tasks.open.finish();

                    async function readFromOldDatabase(path) {
                        return new Promise((resolve, reject) => {
                            const store = db.transaction('C', 'readonly').objectStore('C');
                            const req = store.get(path);

                            req.onsuccess = () => {
                                const entry = req.result;
                                if (entry) {
                                    resolve({
                                        path: `C:/${entry.path}`,
                                        content: entry.content,
                                        type: entry.type
                                    });
                                } else {
                                    reject(new Error(`File not found: ${path}`));
                                }
                            };
                            req.onerror = (event) => {
                                reject(event.target.error);
                            };
                        });
                    }

                    function deleteIDB(name) {
                        return new Promise((resolve, reject) => {
                            const request = indexedDB.deleteDatabase(name);

                            request.onsuccess = () => {
                                console.log(`Database '${name}' deleted successfully.`);
                                resolve();
                            };

                            request.onerror = (event) => {
                                console.warn(`Failed to delete database '${name}':`, event.target.error);
                                reject(event.target.error);
                            };

                            request.onblocked = () => {
                                console.warn(`Deletion of database '${name}' is blocked (likely due to an open tab).`);
                            };
                        });
                    }

                    try {
                        const store = db.transaction('C', 'readonly').objectStore('C');
                        const req = store.index('path').getAllKeys();

                        req.onsuccess = async () => {
                            tasks.read.finish();

                            const keys = req.result;
                            const all = keys.length;
                            let completed = 0;

                            // Migrate each key to the new database
                            for (const key of keys) {
                                try {
                                    const entry = await readFromOldDatabase(key);
                                    if (entry.type === 'directory') {
                                        if (!fs.exists(entry.path.endsWith('/') ? entry.path : entry.path + '/')) {
                                            await fs.mkdir(entry.path).catch();
                                        }
                                    } else {
                                        await fs.writeFile(entry.path, entry.content);
                                    }
                                    completed++;
                                    tasks.migrate.update(`Migrated ${completed}/${all}: ${entry.path}`);
                                } catch (err) {
                                    console.error(`Failed to migrate ${key}:`, err);
                                }
                            }
                            tasks.migrate.update(`Migrate files to new idbfs ( ${completed}/${all} completed )`);
                            tasks.migrate.finish();
                            db.close();
                            deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                            tasks.delete.finish();
                        };
                        req.onerror = (event) => {
                            db.close();
                            tasks.read.finish();
                            tasks.migrate.finish();
                            deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                            console.error('Error reading old database:', event.target.error);
                        };
                    } catch (e) {
                        db.close();
                        tasks.open.finish();
                        tasks.read.finish();
                        tasks.migrate.finish();
                        deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                    }
                };
                oldDbRequest.onerror = async (event) => {
                    tasks.open.finish();
                    tasks.read.finish();
                    tasks.migrate.finish();
                    deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                }
            })
        })();
    }

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

    const URLParams = getJsonFromURL();
    const debuggerMode = false;
    const devMode = (URLParams['dev'] || URLParams['develop'] || URLParams['embed']) ? true : false;

    fs.writeFile('C:/Winbows/System/.env/location/param.json', new Blob([JSON.stringify(URLParams)], {
        type: 'application/json'
    }))

    Object.defineProperty(window, 'debuggerMode', {
        value: (URLParams['dev'] || URLParams['develop'] || URLParams['logs'] || URLParams['output']) ? true : false,
        writable: false,
        configurable: false
    })

    Object.defineProperty(window, 'fetchMode', {
        value: (URLParams['dev'] || URLParams['develop'] || URLParams['embed']) ? 'server' : 'local',
        writable: false,
        configurable: false
    })

    if (URLParams['logs'] || URLParams['output']) {
        var devContainer = document.createElement('div');
        var devDragBar = document.createElement('div');
        var devLogs = document.createElement('div');
        var devResizer = document.createElement('div');
        var devResizerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var dragging = false;
        var x = 8, y = 8, width = window.innerWidth / 2, height = window.innerHeight / 2;
        devContainer.className = 'winbows-dev-container winui-dark winui-no-background';
        devContainer.style.width = width + 'px';
        devContainer.style.height = height + 'px';
        devContainer.style.transform = `translate(${x}px, ${y}px)`;
        devDragBar.className = 'winbows-dev-dragbar';
        devLogs.style.maxHeight = height + 'px';
        devLogs.className = 'winbows-dev-logs';
        devResizer.className = 'winbows-dev-resizer';
        devResizerSvg.innerHTML = '<path d="M10 1C10 5 7 10 1 10 1 10 0 10 0 9 0 9 0 8 1 8 5 8 8 5 8 1 8 1 8 0 9 0 9 0 10 0 10 1"></path>';
        devResizerSvg.setAttribute('viewBox', '-1 -1 12 12');
        devResizerSvg.setAttribute('width', 11);
        devResizerSvg.setAttribute('height', 11);
        devResizerSvg.style = 'stroke: #fff;fill: #fff;width:1rem;height:1rem';

        devDragBar.addEventListener('pointerdown', (e) => {
            dragging = true;
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            var position = getPosition(devContainer);
            x = pageX - position.x;
            y = pageY - position.y;
        })
        window.addEventListener('pointermove', (e) => {
            if (dragging != true) return;
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            var dx = pageX - x;
            var dy = pageY - y;
            devContainer.style.transform = `translate(${dx}px, ${dy}px)`;
        })
        window.addEventListener('pointerup', () => {
            dragging = false;
        })
        window.addEventListener('blur', () => {
            dragging = false;
        })



        function setupDevOutput() {
            function initializeJSONViewer() {
                // JSON Viewer
                'use strict';

                function isJSON(item) {
                    let value = typeof item !== "string" ? JSON.stringify(item) : item;
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        return false;
                    }

                    return typeof value === "object" && value !== null;
                }

                function isObject(obj) {
                    var type = typeof obj;
                    return type === 'function' || type === 'object' && !!obj;
                };

                function expandable(obj) {
                    if (Array.isArray(obj)) {
                        if (obj.length > 0) {
                            return true;
                        }
                        return false;
                    } else if (isObject(obj)) {
                        if (Object.values(obj).length > 0) {
                            return true;
                        }
                        return false;
                    } else {
                        return false;
                    }
                }

                function setAttribute(element, value) {
                    if (expandable(value)) {
                        element.setAttribute('data-expandable', true);
                    } else {
                        element.setAttribute('data-expandable', false);
                    }
                }

                function parseJSON(json, self = false) {
                    try {
                        if (self == false) {
                            json = JSON.parse(json);
                        }
                        var result = json;
                        if (Array.isArray(json)) {
                            result = [];
                            json.forEach(obj => {
                                result.push(parseJSON(obj, true))
                            })
                            return result;
                        } else if (isObject(json)) {
                            result = {};
                            Object.keys(json).forEach(key => {
                                result[key] = parseJSON(json[key], true);
                            })
                            return result;
                        } else {
                            return result;
                        }
                    } catch (e) { }
                }

                function isLargeArray(array) {
                    if (array.length > 100) {
                        return true;
                    }
                    return false;
                }

                function getClassName(value) {
                    var type = typeof value;
                    switch (type) {
                        case 'string':
                            return 'json-viewer-value-string';
                        case 'number':
                            return 'json-viewer-value-number';
                        case 'boolean':
                            return 'json-viewer-value-symbol';
                        case 'object':
                            if (value === null) {
                                return 'json-viewer-value-empty';
                            } else if (Array.isArray(value)) {
                                return 'json-viewer-value-generic';
                            } else {
                                return 'json-viewer-value-generic';
                            }
                        case 'undefined':
                            return 'json-viewer-value-empty';
                        default:
                            return 'json-viewer-value-generic';
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

                function getType(value) {
                    var type = typeof value;
                    switch (type) {
                        case 'string':
                            return 'string';
                        case 'number':
                            return 'number';
                        case 'boolean':
                            return 'boolean';
                        case 'object':
                            if (value === null) {
                                return 'null';
                            } else if (Array.isArray(value)) {
                                return 'array';
                            } else if (isObject(value)) {
                                return 'object';
                            } else {
                                return 'object?';
                            }
                        case 'undefined':
                            return 'undefined';
                        default:
                            return 'unknown';
                    }
                }

                function getBracket(value, type) {
                    if (type == 'array') {
                        return `[${value}]`;
                    } else if (type == 'object') {
                        return `{${value}}`;
                    } else {
                        return value;
                    }
                }

                var listeners = {};

                class Viewer {
                    constructor(json) {
                        this.container = document.createElement('div');
                        this.path = document.createElement('div');
                        this.overview = document.createElement('div');
                        this.overviewExpand = document.createElement('div');
                        this.overviewContent = document.createElement('div');
                        this.content = document.createElement('div');

                        this.container.className = 'json-viewer-container';
                        this.path.className = 'json-viewer-path';
                        this.overview.className = 'json-viewer-overview';
                        this.overviewExpand.className = 'json-viewer-expand';
                        this.overviewContent.className = 'json-viewer-overview-content';
                        this.content.className = 'json-viewer-content';

                        this.container.appendChild(this.path);
                        this.container.appendChild(this.overview);
                        this.container.appendChild(this.content);
                        this.overview.appendChild(this.overviewExpand);
                        this.overview.appendChild(this.overviewContent);

                        if (typeof json != 'string') {
                            try {
                                json = JSON.stringify(json);
                            } catch (e) { }
                        }

                        if (isJSON(json) == false || !json || json == null) {
                            try {
                                this.container.innerHTML = json.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
                            } catch (e) {
                                this.container.innerHTML = json;
                            }
                            return this;
                        }

                        this.json = typeof json != 'string' ? parseJSON(JSON.stringify(json)) : parseJSON(json);

                        setAttribute(this.overview, this.json);

                        var expanded = false;
                        var appended = false;
                        /*
                        Object.keys(parsed).forEach(key1 => {
                            if (isObject(parsed[key1])) {
                                parsed[key1].forEach(key2 => {
                                    if (isObject(parsed[key1][key2])) {
                                        parsed[key1][key2].forEach(key3 => {
                                            overviewText += parsed[key1][key2][key3];
                                        })
                                    }
                                })
                            }
                        })
                            */

                        this.overviewContent.innerHTML = expandable(this.json) == true ? this._getOverview(this.json).replaceAll("<", "&lt;").replaceAll(">", "&gt;") : this._formatValue(this.json).replaceAll("<", "&lt;").replaceAll(">", "&gt;");

                        this.overview.addEventListener('click', () => {
                            expanded = !expanded;
                            this.overview.setAttribute('data-expand', expanded);
                            if (appended == false) {
                                this._getLevel(this.json, this.content);
                                appended = true;
                            }
                        })
                        this.overview.addEventListener('pointerenter', () => {
                            this._triggerEvent('pointerChange', {
                                type: getType(this.json),
                                levels: [{
                                    type: getType(this.json),
                                    key: '…',
                                    item: this.overview
                                }],
                                value: this.json
                            })
                        })
                        return this;
                    }
                    on(event, listener) {
                        if (!listeners[event]) {
                            listeners[event] = [];
                        }
                        listeners[event].push(listener);
                    }
                    _triggerEvent(event, details) {
                        if (listeners[event]) {
                            listeners[event].forEach(listener => {
                                listener(details);
                            })
                        }
                    }
                    _getLevel(level, parent, parentData = {
                        levels: [],
                        type: level.type
                    }) {
                        const parentLevels = [...parentData.levels];

                        if (getType(level) == 'array') {
                            if (isLargeArray(level)) {
                                var groups = level.length % 100 == 0 ? Math.floor(level.length / 100) : Math.floor(level.length / 100) + 1
                                for (let i = 0; i < groups; i++) {
                                    (() => {
                                        var item = document.createElement('div');
                                        var line = document.createElement('div');
                                        var next = document.createElement('div');
                                        var expanded = false;
                                        var append = false;
                                        var value = level.slice(i * 100, (i + 1) * 100);
                                        var type = getClassName(value);
                                        item.className = 'json-viewer-item';
                                        line.className = 'json-viewer-line';
                                        next.className = 'json-viewer-next';
                                        line.innerHTML = `<div class="json-viewer-expand"></div><div class="json-viewer-key" data-type="large-array"></div><div class="json-viewer-value ${type}">[${i * 100} … ${99 > value.length ? i * 100 + value.length - 1 : i * 100 + 99}]</div>`;

                                        var temp = {};
                                        Object.keys(value).forEach(key => {
                                            temp[i * 100 + +key] = value[key];
                                        })
                                        value = temp;

                                        line.setAttribute('data-expandable', expandable(value));
                                        line.setAttribute('data-expand', expanded);
                                        line.addEventListener('click', () => {
                                            if (expandable(value) == true) {
                                                expanded = !expanded;
                                                line.setAttribute('data-expand', expanded);
                                                if (append == false) {
                                                    this._getLevel(value, next, {
                                                        type: 'array',
                                                        levels: parentLevels,
                                                        item: line
                                                    });
                                                    append = true;
                                                }
                                            }
                                        })
                                        line.addEventListener('pointerenter', () => {
                                            this._triggerEvent('pointerChange', {
                                                type: 'array',
                                                levels: parentLevels,
                                                value: value,
                                                item: line
                                            })
                                        })
                                        item.appendChild(line);
                                        item.appendChild(next);
                                        parent.appendChild(item);
                                    })();
                                }
                                return;
                            }
                        }
                        var temp = level;
                        level = Object.keys(temp).sort().reduce(
                            (obj, key) => {
                                obj[key] = temp[key];
                                return obj;
                            },
                            {}
                        );
                        Object.keys(level).forEach(key => {
                            var item = document.createElement('div');
                            var line = document.createElement('div');
                            var next = document.createElement('div');
                            var expanded = false;
                            var append = false;
                            var type = getClassName(level[key]);
                            item.className = 'json-viewer-item';
                            line.className = 'json-viewer-line';
                            next.className = 'json-viewer-next';
                            line.innerHTML = `<div class="json-viewer-expand"></div><div class="json-viewer-key">${key}</div><div class="json-viewer-value ${type}">${getType(this._formatValue(level[key])) == 'string' ? this._formatValue(level[key]).replaceAll("<", "&lt;").replaceAll(">", "&gt;") : this._formatValue(level[key])}</div>`;

                            line.setAttribute('data-expandable', expandable(level[key]));
                            line.setAttribute('data-expand', expanded);
                            line.addEventListener('click', () => {
                                if (expandable(level[key]) == true) {
                                    expanded = !expanded;
                                    line.setAttribute('data-expand', expanded);
                                    if (append == false) {
                                        this._getLevel(level[key], next, {
                                            type: getType(level),
                                            levels: parentLevels.concat([{
                                                type: getType(level[key]),
                                                key: key,
                                                item: line
                                            }])
                                        });
                                        append = true;
                                    }
                                }
                            })
                            line.addEventListener('pointerenter', () => {
                                this._triggerEvent('pointerChange', {
                                    type: getType(level[key]),
                                    levels: parentLevels.concat([{
                                        type: getType(level[key]),
                                        key: key,
                                        item: line
                                    }]),
                                    value: level[key]
                                })
                            })
                            item.appendChild(line);
                            item.appendChild(next);
                            parent.appendChild(item);
                        })
                    }
                    _getOverview(level, current = 0, type) {
                        if (current > 3) {
                            return '…';
                        }
                        if (!type) {
                            type = getType(level);
                        }
                        var overview = '';
                        var allow = true;
                        Object.keys(level).forEach((key, i) => {
                            if (allow == false) {
                                return;
                            }
                            var itemType = getType(level[key]);
                            if (itemType == 'array') {
                                var next = getBracket(this._getOverview(level[key], current + 1, itemType));
                                if (type == 'array') {
                                    overview += next;
                                } else {
                                    overview += `${key}: ${next}`;
                                }
                            } else if (itemType == 'object') {
                                var next = getBracket(this._getOverview(level[key], current + 1, itemType));
                                if (type == 'array') {
                                    overview += next;
                                } else {
                                    overview += `${key}: ${next}`;
                                }
                            } else {
                                if (type == 'array') {
                                    overview += `${this._formatValue(level[key])}`;
                                } else {
                                    overview += `${key}: ${this._formatValue(level[key])}`;
                                }
                            }
                            if (Object.keys(level)[i + 1]) {
                                if (overview.length > 50) {
                                    overview += ',';
                                    allow = false;
                                } else {
                                    overview += ', ';
                                }
                            }
                            if (overview.length > 50) {
                                allow = false;
                            }
                        })
                        if (allow == false) {
                            overview += '…';
                        }
                        return getBracket(overview, getType(level));
                    }
                    _formatValue(value) {
                        if (expandable(value)) {
                            return this._getOverview(value);
                        }
                        if (getType(value) === 'string') {
                            return `\"${value}\"`;
                        } else if (getType(value) === 'array') {
                            return '[]';
                        } else if (getType(value) === 'object') {
                            return '{}';
                        } else {
                            return value;
                        }
                    }
                }

                Viewer.utils = {
                    isJSON, isObject, isElement, isFinite, isNaN, getType, getClassName
                }

                window.JSONViewer = Viewer;
            }

            initializeJSONViewer();

            var x = 0, y = 0, dx = 0, dy = 0, dragging = false;
            devResizer.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                dragging = true;
                let pageX = e.pageX;
                let pageY = e.pageY;
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    pageX = touch.pageX;
                    pageY = touch.pageY;
                }
                x = pageX;
                y = pageY;
            })
            window.addEventListener('pointermove', (e) => {
                if (dragging != true) return;
                devContainer.style.userSelect = 'none';
                e.stopPropagation();
                let pageX = e.pageX;
                let pageY = e.pageY;
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    pageX = touch.pageX;
                    pageY = touch.pageY;
                }
                dx = pageX - x;
                dy = pageY - y;
                devContainer.style.width = `${width + dx}px`;
                devContainer.style.height = `${height + dy}px`;
                devContainer.style.maxWidth = `${width + dx}px`;
                devContainer.style.maxHeight = `${height + dy}px`;
                devLogs.style.maxHeight = `${height + dy}px`;
            })
            window.addEventListener('pointerup', () => {
                if (dragging == false) return;
                devContainer.style.userSelect = 'unset';
                dragging = false;
                width = width + dx;
                height = height + dy;
                devContainer.style.width = `${width}px`;
                devContainer.style.height = `${height}px`;
                devContainer.style.maxWidth = `${width}px`;
                devContainer.style.maxHeight = `${height}px`;
                devLogs.style.maxHeight = `${height}px`;
                dx = 0;
                dy = 0;
            })
            window.addEventListener('blur', () => {
                if (dragging == false) return;
                devContainer.style.userSelect = 'unset';
                dragging = false;
                width = width + dx;
                height = height + dy;
                devContainer.style.width = `${width}px`;
                devContainer.style.height = `${height}px`;
                devContainer.style.maxWidth = `${width}px`;
                devContainer.style.maxHeight = `${height}px`;
                devLogs.style.maxHeight = `${height}px`;
                dx = 0;
                dy = 0;
            })
        }

        setupDevOutput();

        document.body.appendChild(devContainer);
        devContainer.appendChild(devDragBar);
        devContainer.appendChild(devLogs);
        devContainer.appendChild(devResizer);
        devResizer.appendChild(devResizerSvg);

        if (window.HMGR) {
            window.HMGR.on('NIC:REQUEST:RECEIVED', (e) => {
                var el = document.createElement('div');
                el.className = `winbows-dev-log ${e.isThisTab != true ? 'other' : ''}`;
                el.innerHTML = `${e.isThisTab != true ? `<div>From client [${e.fromClientId || 'UNKNOWN'}]</div>` : ''}<span style='color:#ff00ff'>[HMGR]</span> ${e.method} <a style='color:#86b7ff' href='${e.url}' target='_blank'>${e.url}</a> <span style='${e.ok ? 'color:#58ff31' : 'color:red'}'>${e.status}</span>`;
                devLogs.appendChild(el);
            })
        }

        const original = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        function formatArgs(container, args) {
            let i = 0;
            while (i < args.length) {
                const arg = args[i];

                if (typeof arg === 'string' && arg.includes('%c')) {
                    const parts = arg.split('%c');
                    for (let j = 0; j < parts.length; j++) {
                        if (parts[j]) {
                            const span = document.createElement("span");
                            span.textContent = parts[j];
                            span.style.cssText = args[i + j] || "";
                            container.appendChild(span);
                        }
                    }
                    i += parts.length;
                } else {
                    // 普通的參數（非 %c）

                    if (JSONViewer.utils.isJSON(arg)) {
                        container.appendChild(new JSONViewer(arg).container);
                    } else {
                        const span = document.createElement("span");
                        span.className = JSONViewer.utils.getClassName(arg);
                        span.textContent = String(arg);
                        span.style.marginRight = '.25rem';
                        container.appendChild(span);
                    }
                    i++;
                }
            }

            return container;
        }

        console.log = function (...args) {
            const container = document.createElement("div");
            container.className = `winbows-dev-log`;
            container.style.display = "block";
            formatArgs(container, args);
            devLogs.appendChild(container);
            if (window.debuggerMode == true) {
                original.log.apply(console, args);
            }
        }
        console.info = function (...args) {
            const container = document.createElement("div");
            container.className = `winbows-dev-log info`;
            container.style = "background: rgb(126 174 255 / 21%);color: rgb(160 203 255);font-weight: bold;padding: 4px 6px;border-radius: 4px;";
            container.style.display = "block";
            container.style.fontStyle = 'italic';
            formatArgs(container, args);
            devLogs.appendChild(container);
            original.info.apply(console, args);
        };
        console.warn = function (...args) {
            const container = document.createElement("div");
            const stackTrace = document.createElement("div");
            container.className = `winbows-dev-log warn`;
            container.style = "background: rgb(221 190 64 / 21%); color: rgb(255 236 158); font-weight: bold; padding: 4px 6px; border-radius: 4px;";
            container.style.display = "block";
            stackTrace.style = "padding-left:2rem";
            stackTrace.innerHTML = getStackTrace().join('<br>');
            formatArgs(container, args);
            devLogs.appendChild(container);
            container.appendChild(stackTrace);
            original.warn.apply(console, args);
        };
        console.error = function (...args) {
            const container = document.createElement("div");
            const stackTrace = document.createElement("div");
            container.className = `winbows-dev-log error`;
            container.style = "background: rgb(255 106 86 / 21%); color: rgb(255 168 160); font-weight: bold; padding: 4px 6px; border-radius: 4px;";
            container.style.display = "block";
            stackTrace.style = "padding-left:2rem";
            stackTrace.innerHTML = getStackTrace().join('<br>');
            formatArgs(container, args);
            devLogs.appendChild(container);
            container.appendChild(stackTrace);
            original.error.apply(console, args);
        };
    }

    var startLoadingTime = Date.now();

    // Loading
    var loadingContainer = document.createElement('div');
    var loadingImage = document.createElement('div');
    var loadingSpinner = devMode == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var loadingTextContainer = document.createElement('div');
    var loadingTextShadowTop = document.createElement('div');
    var loadingTextShadowBottom = document.createElement('div');
    var loadingTextStrip = document.createElement('div');
    var loadingProgress = document.createElement('div');
    var loadingProgressBar = document.createElement('div');

    loadingContainer.className = 'winbows-loading active';
    loadingImage.className = 'winbows-loading-image';
    loadingTextContainer.className = 'winbows-loading-text-container';
    loadingTextShadowTop.className = 'winbows-loading-text-shadow-top';
    loadingTextShadowBottom.className = 'winbows-loading-text-shadow-bottom';
    loadingTextStrip.className = 'winbows-loading-text-strip';
    loadingContainer.appendChild(loadingImage);
    document.body.appendChild(loadingContainer);

    function loadingText(content) {
        var loadingText = document.createElement('div');
        loadingText.textContent = content;
        loadingText.className = 'winbows-loading-text';
        loadingTextStrip.appendChild(loadingText);
        loadingTextStrip.scrollTo({
            top: loadingTextStrip.scrollHeight,
            behavior: "smooth"
        })
        return loadingText;
    }

    if (devMode == false && window.needsUpdate == false) {
        loadingSpinner.setAttribute('class', 'winbows-loading-spinner');
        loadingSpinner.setAttribute('width', 48);
        loadingSpinner.setAttribute('height', 48);
        loadingSpinner.setAttribute('viewBox', "0 0 16 16");
        loadingSpinner.innerHTML = '<circle cx="8px" cy="8px" r="7px"></circle>';
        loadingContainer.appendChild(loadingSpinner);
    } else {
        loadingProgress.classList.add('winbows-loading-progress');
        loadingProgressBar.classList.add('winbows-loading-progress-bar');
        loadingContainer.appendChild(loadingTextContainer);
        loadingTextContainer.appendChild(loadingTextShadowTop);
        loadingTextContainer.appendChild(loadingTextShadowBottom);
        loadingTextContainer.appendChild(loadingTextStrip);
        loadingContainer.appendChild(loadingProgress);
        loadingProgress.appendChild(loadingProgressBar);
    }

    loadingText('Starting Winbows11...');

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

    // Desktop 
    var desktop = document.createElement('div');
    var desktopItems = document.createElement('div');

    desktop.className = 'desktop winui-no-background';
    desktopItems.className = 'desktop-items';

    appWrapper.appendChild(desktop);
    desktop.appendChild(desktopItems);

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

    // Theme 
    !(function ThemeManager() {
        var theme = localStorage.getItem('WINBOWS_THEME') || 'light';
        var listeners = [];
        window.System.theme = {
            set: (value) => {
                theme = value != 'dark' ? 'light' : 'dark';
                localStorage.setItem('WINBOWS_THEME', theme);
                if (theme == 'dark') {
                    document.body.setAttribute('data-theme', 'dark');
                } else {
                    document.body.removeAttribute('data-theme');
                }
                listeners.forEach(fn => fn(theme));
            },
            get: () => {
                return theme;
            },
            onChange: (listener) => {
                listeners.push(listener);
            }
        }
        if (theme == 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        }
    })();

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

    /**
     * Find the distance of an element from the upper left corner of the document
     * @param {Element} element 
     * @returns {Object}
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

    function isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch (e) {
            return (typeof obj === "object") &&
                (obj.nodeType === 1) && (typeof obj.style === "object") &&
                (typeof obj.ownerDocument === "object");
        }
    }

    // Equivalent to pageX/Y
    function getPointerPosition(e) {
        let x = e.clientX;
        let y = e.clientY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        }
        return { x: x + window.scrollX, y: y + window.scrollY };
    }

    window.utils.getPosition = getPosition;
    window.utils.getJsonFromURL = getJsonFromURL;
    window.utils.isElement = isElement;
    window.utils.getPointerPosition = getPointerPosition;

    window.fileIcons = {
        getIcon: (path = '') => {
            var ext = utils.getFileExtension(path);
            if (window.fileIcons.registerd[ext]) {
                return window.fileIcons.registerd[ext];
            } else {
                return window.fileIcons.registerd['*'];
            }
        },
        registerd: {
            // Default
            '*': 'C:/Winbows/icons/files/generic.ico',
            '.jpg': 'C:/Winbows/icons/files/image.ico',
            '.png': 'C:/Winbows/icons/files/image.ico',
            '.gif': 'C:/Winbows/icons/files/image.ico',
            '.svg': 'C:/Winbows/icons/files/image.ico',
            '.webp': 'C:/Winbows/icons/files/image.ico',
            '.jpeg': 'C:/Winbows/icons/files/image.ico',
            '.ico': 'C:/Winbows/icons/files/image.ico',
            '.bmp': 'C:/Winbows/icons/files/image.ico',
            '.mp3': 'C:/Winbows/icons/files/audio.ico',
            '.wav': 'C:/Winbows/icons/files/audio.ico',
            '.ogg': 'C:/Winbows/icons/files/audio.ico',
            '.mp4': 'C:/Winbows/icons/files/video.ico',
            '.webm': 'C:/Winbows/icons/files/video.ico',
            '.avi': 'C:/Winbows/icons/files/video.ico',
            '.mov': 'C:/Winbows/icons/files/video.ico',
            '.txt': 'C:/Winbows/icons/files/text.ico',
            '.exe': 'C:/Winbows/icons/files/program.ico',
            '.zip': 'C:/Winbows/icons/folders/zip.ico',
            '.ttf': 'C:/Winbows/icons/files/font.ico',
            '.otf': 'C:/Winbows/icons/files/font.ico',
            '.woff': 'C:/Winbows/icons/files/font.ico',
            '.woff2': 'C:/Winbows/icons/files/font.ico',
            '.eot': 'C:/Winbows/icons/files/font.ico',
            '.doc': 'C:/Winbows/icons/files/office/worddocument.ico',
            '.docx': 'C:/Winbows/icons/files/office/worddocument.ico',
            '.xls': 'C:/Winbows/icons/files/office/excelsheet.ico',
            '.xlsx': 'C:/Winbows/icons/files/office/excelsheet.ico',
            '.ppt': 'C:/Winbows/icons/files/office/powerpointopen.ico',
            '.pptx': 'C:/Winbows/icons/files/office/powerpointopen.ico',
            // Edge
            '.html': 'C:/Winbows/icons/applications/tools/edge.ico',
            // VSCode
            '.css': 'C:/Program Files/VSCode/File Icons/css.ico',
            '.js': 'C:/Program Files/VSCode/File Icons/javascript.ico',
            '.json': 'C:/Program Files/VSCode/File Icons/json.ico',
            // Winbows script files
            '.wbsf': 'C:/Winbows/icons/files/executable.ico',
            '.wexe': 'C:/Winbows/icons/files/program.ico',
        },
        register: (ext, icon) => {
            if (ext == '*') return;
            window.fileIcons.registerd[ext] = icon;
        }
    }

    window.appRegistry = {
        apps: {
            'explorer': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
                icon: 'C:/Winbows/icons/folders/explorer.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wexe',
                configurable: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.wexe'
            },
            'edge': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
                icon: 'C:/Winbows/icons/applications/tools/edge.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wexe'
            },
            'edgebeta': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
                icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wexe'
            },
            'store': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
                icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wexe'
            },
            'cmd': {
                path: 'C:/Program Files/Command/',
                icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
                script: 'C:/Program Files/Command/app.wexe'
            },
            'notepad': {
                path: 'C:/Program Files/Notepad/',
                icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
                script: 'C:/Program Files/Notepad/app.wexe'
            },
            'calculator': {
                path: 'C:/Program Files/Calculator/',
                icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
                script: 'C:/Program Files/Calculator/app.wexe'
            },
            'paint': {
                path: 'C:/Program Files/Paint/',
                icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
                script: 'C:/Program Files/Paint/app.wexe'
            },
            'info': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
                icon: 'C:/Winbows/icons/emblems/info.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.wexe',
                autoExecute: true
            },
            'code': {
                path: 'C:/Program Files/VSCode/',
                icon: 'C:/Winbows/icons/applications/office/code.ico',
                script: 'C:/Program Files/VSCode/app.wexe'
            },
            'taskmgr': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
                icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.wexe'
            },
            'settings': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
                icon: 'C:/Winbows/icons/applications/tools/settings.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.wexe'
            },
            'fpsmeter': {
                path: 'C:/Program Files/FPS Meter/',
                icon: 'C:/Program Files/FPS Meter/favicon.ico',
                script: 'C:/Program Files/FPS Meter/app.wexe'
            },
            'photos': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
                icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.wexe'
            },
            'network-listener': {
                path: 'C:/Program Files/Network Listener/',
                icon: 'C:/Winbows/icons/files/program.ico',
                script: 'C:/Program Files/Network Listener/app.wexe'
            },
            'json-viewer': {
                path: 'C:/Program Files/JSON Viewer/',
                icon: 'C:/Program Files/JSON Viewer/json-viewer.svg',
                script: 'C:/Program Files/JSON Viewer/app.wexe'
            },
            'notepad': {
                path: 'C:/Program Files/Notepad/',
                icon: 'C:/Program Files/Notepad/favicon.ico',
                script: 'C:/Program Files/Notepad/app.wexe'
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
    window.Winbows.ShowLockScreen = () => {
        screenLock.classList.remove('signin');
        screenLockContainer.classList.add('active');
    }

    window.Components = {};
    window.Compilers = {};

    window.utils.replaceHTMLTags = (content = '') => {
        return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }
    window.utils.getFileName = (path = '') => {
        return path.split('/').slice(-1)[0];
    }
    window.utils.getFileExtension = function (file = '') {
        file = window.utils.getFileName(file);
        if (file.indexOf('.') > -1) {
            return '.' + file.split('.').pop();
        } else {
            return '';
        }
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime'
    };

    function getMimeType(extension) {
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    window.utils.getMimeType = getMimeType;

    window.loadImage = loadImage;

    // Loading images
    try {
        loadingImage.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico')})`;
        screenLockSigninAvatar.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/user.png')})`;
        screenLockBackground.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/bg/img100.jpg')})`;
    } catch (e) {
        console.error('Error loading image:', e);
    }

    window.utils.getImageTheme = function getImageTheme(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        let totalBrightness = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            totalBrightness += brightness;
        }

        const averageBrightness = totalBrightness / (img.width * img.height);

        const threshold = 128;
        if (averageBrightness > threshold) {
            return 'light';
        } else {
            return 'dark';
        }
    }

    window.utils.canvasClarifier = function canvasClarifier(canvas, ctx, width, height) {
        const originalSize = {
            width: (width ? width : canvas.offsetWidth),
            height: (height ? height : canvas.offsetHeight)
        }
        var ratio = window.devicePixelRatio || 1;
        canvas.width = originalSize.width * ratio;
        canvas.height = originalSize.height * ratio;
        ctx.scale(ratio, ratio);
        if (originalSize.width != canvas.offsetWidth || originalSize.height != canvas.offsetHeight) {
            canvas.style.width = originalSize.width + 'px';
            canvas.style.height = originalSize.height + 'px';
        }
    }

    var currentBackgroundImage;

    window.getBackgroundImage = () => {
        return currentBackgroundImage;
    }
    window.setBackgroundImage = async (image = '') => {
        if (!image || image == currentBackgroundImage) return;
        var stats = fs.stat(image);
        if (stats.exists != true) {
            await fs.downloadFile(image).catch(err => {
                image = 'C:/Winbows/bg/img0.jpg';
                console.warn(err);
            });
        }
        currentBackgroundImage = image;
        localStorage.setItem('WINBOWS_BACKGROUND_IMAGE', currentBackgroundImage);
        var url = await getFileURL(currentBackgroundImage);
        document.querySelector(':root').style.setProperty('--winbows-mica', `url(${url})`);
        var img = new Image();
        img.src = url;
        img.onload = () => {
            var theme = utils.getImageTheme(img);
            desktop.classList.remove('winui-light', 'winui-dark');
            desktop.classList.add(`winui-${theme}`);
            System.theme.set(theme);
            backgroundImage.style.backgroundImage = `url(${url})`;
            if (window.debuggerMode == true) {
                console.log(theme)
            }
        }
    }
    window.WinbowsUpdate = () => {
        location.href = './install.html';
    }

    await window.setBackgroundImage(localStorage.getItem('WINBOWS_BACKGROUND_IMAGE') || 'C:/Winbows/bg/img0.jpg');

    if (!fs.exists('C:/Users/')) {
        await fs.mkdir('C:/Users/');
    }
    if (!fs.exists('C:/Users/Admin/')) {
        await fs.mkdir('C:/Users/Admin/');
    }
    if (!fs.exists('C:/Users/Admin/Desktop/')) {
        await fs.mkdir('C:/Users/Admin/Desktop/');
    }
    if (!fs.exists('C:/Users/Admin/Documents/')) {
        await fs.mkdir('C:/Users/Admin/Documents/');
    }
    if (!fs.exists('C:/Users/Admin/Downloads/')) {
        await fs.mkdir('C:/Users/Admin/Downloads/');
    }
    if (!fs.exists('C:/Users/Admin/Music/')) {
        await fs.mkdir('C:/Users/Admin/Music/');
    }
    if (!fs.exists('C:/Users/Admin/Pictures/')) {
        await fs.mkdir('C:/Users/Admin/Pictures/');
    }
    if (!fs.exists('C:/Users/Admin/Videos/')) {
        await fs.mkdir('C:/Users/Admin/Videos/');
    }

    screenLockSigninUsername.innerHTML = window.utils.replaceHTMLTags('Admin');
    screenLockSigninButton.innerHTML = window.utils.replaceHTMLTags('Sign In');

    // Init kernel files 
    async function loadKernel() {
        async function runKernel() {
            var files = {
                kernel: ['Winbows/System/process.js'],
                animation: ['Winbows/System/animation.js'],
                ui: ['Winbows/System/ui/build/winui.min.js'],
                module: ['Winbows/System/modules/main/domtool.js', 'Winbows/System/modules/main/toolbarComponents.js', 'Winbows/System/modules/main/browserWindow.js'],
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
                var kernelLoading = loadingText(`Loading kernels ( ${loadedKernels} / ${kernelFiles.length} )`);
                window.loadedKernel = () => {
                    loadedKernels++;
                    kernelLoading.innerHTML = `Loading kernels ( ${loadedKernels} / ${kernelFiles.length} )`;
                    loadingProgressBar.style.width = loadedKernels / kernelFiles.length * 100 + '%';
                    if (window.debuggerMode == true) {
                        console.log(loadedKernels)
                    }
                    if (loadedKernels == kernelFiles.length) {
                        loadingProgressBar.style.width = '100%';
                        loadingText(`Loading assets...`);
                        resolve();
                    }
                }
                function errorHandler(msg, func = () => { location.reload(); }) {
                    var warning = document.createElement('div');
                    var warningContainer = document.createElement('div');
                    var warningText = document.createElement('span');
                    var warningRestart = document.createElement('div');

                    warning.className = 'winbows-loading-warning';
                    warningContainer.className = 'winbows-loading-warning-container';
                    warningRestart.className = 'winbows-loading-warning-restart';
                    warningText.className = 'winbows-loading-warning-text';

                    warningText.innerHTML = msg;
                    warningRestart.innerHTML = `Restart`;
                    document.body.appendChild(warning);
                    warning.appendChild(warningContainer);
                    warningContainer.appendChild(warningText);
                    warningContainer.appendChild(warningRestart);
                    loadingText(msg);
                    // window.Crash(msg);
                    warningRestart.addEventListener('click', func);
                }
                try {
                    for (let i in kernelFiles) {
                        const path = await fs.getFileURL(mainDisk + ':/' + kernelFiles[i]);
                        fetch(path).then(res => res.text()).then((kernel) => {
                            try {
                                new Function(kernel)();
                            } catch (e) {
                                errorHandler(`Failed to execute kernel : ${kernelFiles[i]}`, async () => {
                                    try {
                                        fs.rm(mainDisk + ':/' + kernelFiles[i]).then((status) => {
                                            console.log(status);
                                            location.reload();
                                        });
                                    } catch (e) {
                                        window.Crash(e);
                                    }
                                });
                            }
                        }).catch(e => {
                            console.log(e)
                            errorHandler("Failed to execute kernels, details:" + e);
                        })
                        /*
                        kernel.src = path;
                        kernel.onload = () => {
                            kernel.remove();
                        }
                        document.head.appendChild(kernel);
                        */
                    }
                } catch (e) {
                    console.log(e)
                    errorHandler("Failed to execute kernels, details:" + e);
                }
            })
        }

        await runKernel();
    }

    await loadKernel();

    window.Taskbar.pinApp('C:/Program Files/Command/app.wexe');
    //window.Taskbar.pinApp('C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wexe');
    await window.Taskbar.preloadImage();

    window.System.CommandParsers = {
        run: (params) => {
            var file = params[0];
            var pathInApp = file ? file.split(':').length > 1 ? file.slice(file.split(':')[0].length + 1) : '' : '';
            var config = [...params].slice(1).join(' ') || '';
            if (config != '') {
                try {
                    config = `const ${config.replace('--config=', '')};`;
                } catch (e) {
                    config = '';
                };
            }
            if (file == 'all') {
                var message = [];
                Object.values(window.appRegistry.apps).forEach(app => {
                    var process = new Process(app.script);
                    process.start();
                    message.push(process.id);
                })
                return {
                    status: 'ok',
                    message: message.join('\n')
                }
            }
            file = file.split(':')[0];
            if (window.appRegistry.exists(file)) {
                if (config != '' && window.appRegistry.getInfo(file).configurable) {
                    file = window.appRegistry.getInfo(file).configurable;
                } else {
                    file = window.appRegistry.getInfo(file).script;
                }
            }
            var process = new Process(file);
            process.start(config, pathInApp);
            return {
                status: 'ok',
                message: process.id
            }
        },
        open: async (params) => {
            var path = params[0];
            path = path.replaceAll('"', '');
            if (fs.exists(path) == true) {
                window.System.Shell(`run explorer --config=PAGE=\"${path}\"`);
            } else {
                window.open(path, '_blank');
            }
            return {
                status: 'ok',
                message: `Successfully open ${path}.`
            }
        },
        kill: async (params) => {
            var selector = params[0];
            if (window.System.processes[selector]) {
                window.System.processes[selector].exit();
                return {
                    status: 'ok',
                    message: `Successfully killed process with ID ${pid}.`
                }
            } else {
                return {
                    status: 'error',
                    message: `[ERROR] Process with ID ${pid} does not exist.`
                }
            }
        }
    };

    window.System.Shell = function (command = '') {
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

    // For desktop
    await (async function Desktop() {
        window.System.desktop = {};
        window.System.desktop.update = updateDesktop;

        // TODO: complete widget api
        // Widget API
        var gridWidth = 96;
        var gridHeight = 96;
        var gridGap = 8;
        var widgetIdCounter = 0;
        const maxRows = ~~((desktopItems.offsetWidth - gridGap * 2) / gridWidth);
        const maxCols = ~~((desktopItems.offsetHeight - gridGap * 2) / gridHeight);
        const cellMap = new Map();
        const widgetCells = new Map();

        function canPlace(widget) {
            for (let dy = 0; dy < widget.h; dy++) {
                for (let dx = 0; dx < widget.w; dx++) {
                    const key = `${widget.x + dx},${widget.y + dy}`;
                    if (cellMap.has(key)) return false;
                }
            }
            return true;
        }

        function occupyWidget(widget) {
            const keys = new Set();
            for (let dy = 0; dy < widget.h; dy++) {
                for (let dx = 0; dx < widget.w; dx++) {
                    const key = `${widget.x + dx},${widget.y + dy}`;
                    cellMap.set(key, widget.id);
                    keys.add(key);
                }
            }
            widgetCells.set(widget.id, keys);
        }

        function clearGrid() {
            cellMap.clear();
            widgetCells.clear();
        }

        function highlightFirstFit(w, h) {
            for (let y = 0; y <= rows - h; y++) {
                for (let x = 0; x <= cols - w; x++) {
                    const widget = { x, y, w, h };
                    if (canPlace(widget)) {
                        highlightArea(x, y, w, h);
                        return;
                    }
                }
            }
            console.warn('No available space for widget');
        }

        window.winbowsWidget = function (x, y, w, h) {
            const id = 'W' + widgetIdCounter++;
            const widget = { id, x, y, w, h };

            if (!canPlace(widget)) {
                console.warn('Cannot place widget here. Try again.');
                return;
            }

            const container = document.createElement('div');
            container.className = 'desktop-widget';
            container.style.transform = `translate(${gridGap * (x + 1) + gridWidth * x}px,${gridGap * (y + 1) + gridHeight * y}px)`;
            container.style.width = `${gridGap * (w - 1) + gridWidth * w}px`;
            container.style.height = `${gridGap * (h - 1) + gridHeight * h}px`;
            desktop.appendChild(container);

            occupyWidget(widget);

            return container;
        }

        // Test
        !(() => {
            return;
            for (let i = 0; i < 100; i++) {
                const container = window.winbowsWidget(~~(Math.random() * maxRows), ~~(Math.random() * maxCols), ~~(Math.random() * 3) + 1, ~~(Math.random() * 3) + 1);
                if (container) {
                    container.style.background = '#fff';
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                    container.style.justifyContent = 'center';
                    container.style.fontSize = '200%';
                    container.style.fontWeight = 'bold';
                    container.innerHTML = 'Test Widget';
                } else {
                    console.warn('Failed to create widget')
                }
            }
        })();

        var createdItems = [];
        var originalContent = [];
        var updating = false;
        var fileTransfer = 0;

        var startXInCanvas = 0;
        var startYInCanvas = 0;
        var startX = 0;
        var startY = 0;
        var pointerXInCanvas = 0;
        var pointerYInCanvas = 0;
        var pointerX = 0;
        var pointerY = 0;
        var selected = [];
        var selecting = false;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        })

        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        desktop.appendChild(canvas);

        function selectionStart(e) {
            if (e.button == 2) {
                // Right click
                return;
            }
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            selecting = true;

            // For items
            startX = pageX + desktopItems.scrollLeft;
            startY = pageY;
            pointerX = pageX + desktopItems.scrollLeft;
            pointerY = pageY;

            // For canvas
            startXInCanvas = pageX + desktopItems.scrollLeft;
            startYInCanvas = pageY;
            pointerXInCanvas = pageX + desktopItems.scrollLeft;
            pointerYInCanvas = pageY;

            selected = [];
            createdItems.forEach(item => {
                item.item.classList.remove('active');
            })
        }

        function selectionMove(e) {
            if (selecting == false) return;
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            pointerX = pageX + desktopItems.scrollLeft;
            pointerY = pageY;
            pointerXInCanvas = pageX;
            pointerYInCanvas = pageY;

            render();

            var rectX = startX;
            var rectY = startY;
            var rectWidth = Math.abs(pointerX - startX);
            var rectHeight = Math.abs(pointerY - startY);

            if (pointerX < startX) {
                rectX = pointerX;
            }
            if (pointerY < startY) {
                rectY = pointerY;
            }

            selected = [];
            createdItems.forEach(item => {
                var position = utils.getPosition(item.item);
                var itemWidth = item.item.offsetWidth;
                var itemHeight = item.item.offsetHeight;

                position.x += desktopItems.scrollLeft;

                if (position.x <= rectX && rectX <= position.x + itemWidth && position.y <= rectY && rectY <= position.y + itemHeight) {
                    // Start point in item
                    item.item.classList.add('active');
                    selected.push({
                        path: item.getPath(),
                        command: item.getCommand(),
                        action: item.getAction(),
                        remove: item.remove
                    });
                } else if (position.x >= rectX && position.y >= rectY && position.x + itemWidth <= pointerX && position.y + itemHeight <= pointerY) {
                    // Rect in Selection
                    item.item.classList.add('active');
                    selected.push({
                        path: item.getPath(),
                        command: item.getCommand(),
                        action: item.getAction(),
                        remove: item.remove
                    });
                } else if (!(position.x + itemWidth < rectX ||
                    position.x > rectX + rectWidth ||
                    position.y + itemHeight < rectY ||
                    position.y > rectY + rectHeight)) {
                    // Overlap
                    item.item.classList.add('active');
                    selected.push({
                        path: item.getPath(),
                        command: item.getCommand(),
                        action: item.getAction(),
                        remove: item.remove
                    });
                } else {
                    item.item.classList.remove('active');
                }
            })
        }

        function selectionEnd(e) {
            selecting = false;
            utils.canvasClarifier(canvas, ctx);
        }

        function render() {
            utils.canvasClarifier(canvas, ctx);

            if (selecting == false) return;

            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#298de547';
            ctx.strokeStyle = '#298de5';
            ctx.lineWidth = .75;
            ctx.fillRect(startXInCanvas - desktopItems.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItems.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
            ctx.strokeRect(startXInCanvas - desktopItems.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItems.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
            ctx.closePath();
            ctx.restore();
        }

        const events = {
            "start": ["mousedown", "touchstart", "pointerdown"],
            "move": ["mousemove", "touchmove", "pointermove"],
            "end": ["mouseup", "touchend", "pointerup", "blur"]
        }

        events.start.forEach(event => {
            desktop.addEventListener(event, e => selectionStart(e))
        })
        events.move.forEach(event => {
            window.addEventListener(event, e => selectionMove(e))
        })
        events.end.forEach(event => {
            window.addEventListener(event, e => selectionEnd(e))
        })
        desktopItems.addEventListener('scroll', render);

        function generateItem() {
            var item = document.createElement('div');
            var itemIcon = document.createElement('div');
            var itemName = document.createElement('div');
            var action = function () { };
            var name = '';
            var icon = '';
            var file = new Blob([]);
            var command = '';
            var type = 'unknown';
            var path = '';
            var id = [...Array(18)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

            var properties = {
                id, item,
                action, name, icon, file, command, type, path,
                setAction, setName, setIcon, setCommand, setFile, setType, setPath,
                getPath, getCommand, getAction,
                update, remove
            };

            item.className = 'desktop-item';
            itemIcon.className = 'desktop-item-icon';
            itemName.className = 'desktop-item-name';

            desktopItems.appendChild(item);
            item.appendChild(itemIcon);
            item.appendChild(itemName);

            createdItems.push(properties);

            function isFunction(functionToCheck) {
                return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
            }

            function getPath() {
                return path;
            }
            function getCommand() {
                return command;
            }
            function getAction() {
                return action;
            }

            function setName(value) {
                if (name == value) return true;
                itemName.textContent = value;
                name = value;
                return false;
            }
            function setIcon(value) {
                if (icon == value) return true;
                itemIcon.style.backgroundImage = `url('${value}')`;
                icon = value;
                return false;
            }
            function setAction(value) {
                if (action == value || !isFunction(value)) return true;
                action = value;
                return false;
            }
            function setCommand(value) {
                if (command == value) return true;
                command = value;
                return false;
            }
            function setType(value) {
                if (type == value) return true;
                type = value;
                return false;
            }
            function setPath(value) {
                if (path == value) return true;
                path = value;
                return false;
            }
            function setFile(value) {
                if (path == value) return true;
                file = value;
                return false;
            }

            function update(item) {
                itemIcon.style.removeProperty('--item-icon');

                const updateType = item.type;
                const updateIcon = item.icon;
                const updateFile = item.file;
                const updatePath = item.path;
                const updateName = item.name;
                const updateAction = item.action;
                const updateCommand = item.command;

                var sameName = setName(updateName);
                var sameIcon = setIcon(updateIcon);
                var sameAction = setAction(updateAction);
                var sameType = setType(updateType);
                var sameCommand = setCommand(updateCommand);
                var samePath = setPath(updatePath);
                var sameFile = setFile(updateFile);

                if (type == 'shortcut') {
                    fs.getFileURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                        itemIcon.style.setProperty('--item-icon', `url(${url})`);
                    })
                } else if (type == 'directory') {
                    fs.getFileURL('C:/Winbows/icons/folders/folder.ico').then(url => {
                        setIcon(url);
                    })
                } else {
                    var isImage = file.type.startsWith('image/');
                    fs.getFileURL(window.fileIcons.getIcon(path)).then(url => {
                        setIcon(url);
                        if (isImage) {
                            try {
                                fs.getFileURL(path).then(url => {
                                    setIcon(url);
                                })
                            } catch (e) { console.log('Failed to load image.'); }
                        }
                    })
                }
            }

            function remove() {
                item.remove();
                createdItems = createdItems.filter(item => item.id != id);
            }

            item.addEventListener('click', (e) => {
                if (command) {
                    window.System.Shell(command);
                } else if (action) {
                    action();
                }
            })

            item.addEventListener('contextmenu', (e) => {
                var items = [
                    {
                        className: "refresh",
                        icon: "refresh",
                        text: "Refresh",
                        action: () => {
                            window.System.desktop.update();
                        }
                    }, {
                        className: 'sort',
                        icon: "sort",
                        text: "Sort by",
                        submenu: [{
                            className: "name",
                            /*icon: "sort_by_name",*/
                            text: "Name",
                            action: () => {
                                window.System.desktop.update(true, 'name');
                            }
                        },/* {
                            className: "size",
                            icon: "sort_by_size",
                            text: "Size",
                            action: () => { }
                        }, {
                            className: "type",
                            icon: "sort_by_type",
                            text: "Type",
                            action: () => { }
                        }*/]
                    }, {
                        type: 'separator'
                    }
                ];
                if (selected.length <= 1) {
                    items.push({
                        className: "open",
                        text: "Open",
                        action: () => {
                            if (command) {
                                window.System.Shell(command);
                            } else if (action) {
                                action();
                            }
                        }
                    })
                    if (type == 'file') {
                        items.push({
                            className: "open-with",
                            icon: 'open-with',
                            text: "Open with...",
                            action: () => {
                                new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wexe').start(`const FILE_PATH="${path}";`);
                            }
                        });
                    }
                    if (type != 'directory') {
                        items.push({
                            text: 'Open file location',
                            icon: 'folder-open',
                            action: () => {
                                window.System.Shell('run explorer --config=PAGE=\"C:/Users/Admin/Desktop\"')
                            }
                        })
                    }
                    items.push({
                        className: 'delete',
                        icon: "delete",
                        text: "Delete",
                        action: () => {
                            fs.rm(path, { recursive: true }).then(res => {
                                window.System.desktop.update();
                            });
                        }
                    })
                } else {
                    items = items.concat([{
                        lassName: "open",
                        text: "Open",
                        action: () => {
                            selected.forEach(item => {
                                if (item.command) {
                                    window.System.Shell(item.command);
                                } else if (item.action) {
                                    item.action();
                                }
                            })
                            selected = [];
                            createdItems.forEach(item => {
                                item.item.classList.remove('active');
                            })
                        }
                    }, {
                        className: 'delete',
                        icon: "delete",
                        text: "Delete",
                        action: async () => {
                            var temp = selected;
                            for (let i = 0; i < temp.length; i++) {
                                var item = temp[i];
                                await fs.rm(item.path, { recursive: true }).then(res => {
                                    item.remove();
                                });
                            }
                            window.System.desktop.update();
                            selected = [];
                            createdItems.forEach(item => {
                                item.item.classList.remove('active');
                            })
                        }
                    }])
                }

                if (file instanceof Blob && selected.length <= 1) {
                    if (file.type.startsWith('image/')) {
                        // Alternative : item.splice(<position>,0,<item>)
                        items.push({
                            type: 'separator'
                        })
                        items.push({
                            className: "set-as-bacckground",
                            text: "Set as background",
                            action: async () => {
                                await window.setBackgroundImage(path);
                            }
                        })
                    } else if (file.type.search('javascript') > -1) {
                        items.push({
                            type: 'separator'
                        })
                        items.push({
                            className: "run-as-an-app",
                            icon: 'window-snipping',
                            text: "Run as an application",
                            action: async () => {
                                new Process(path).start();
                            }
                        })
                    } else if (window.utils.getFileExtension(path) == '.wbsf') {
                        items.push({
                            icon: 'window-snipping',
                            text: 'Run file',
                            action: async () => {
                                const file = await fs.readFile(path);
                                const script = await file.text();
                                script.split('\n').filter(t => t.trim().length > 0).forEach(line => {
                                    window.System.Shell(line.trim());
                                })
                            }
                        })
                    } else if (['.ttf', '.otf', '.woff', '.woff2', '.eot'].includes(window.utils.getFileExtension(path))) {
                        items.push({
                            type: 'separator'
                        })
                        items.push({
                            className: "set-as-default-font",
                            icon: 'font',
                            text: "Set as default font",
                            action: async () => {
                                try {
                                    const fontName = 'WINBOWS_FONT_' + [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                                    const fontURL = await fs.getFileURL(path);
                                    const myFont = new FontFace(fontName, `url(${fontURL})`);
                                    await myFont.load();

                                    window.document.fonts.add(myFont);
                                    window.document.body.style.setProperty('--winbows-font-default', fontName);

                                } catch (error) {
                                    console.error('Failed to load font', error);
                                }
                                return;
                            }
                        })
                    }
                }
                const menu = WinUI.contextMenu(items, {
                    // showIcon: false
                })
                e.preventDefault();
                e.stopPropagation();
                let pageX = e.pageX;
                let pageY = e.pageY;
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    pageX = touch.pageX;
                    pageY = touch.pageY;
                }
                menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
                menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
                menu.open(pageX, pageY, 'left-top');
                if (utils.getPosition(menu.container).x + menu.container.offsetWidth > window.innerWidth) {
                    menu.container.style.left = 'unset';
                    menu.container.style.right = '4px';
                }
                if (utils.getPosition(menu.container).y + menu.container.offsetHeight > window.innerHeight - 48) {
                    menu.container.style.top = 'unset';
                    menu.container.style.bottom = 'calc(var(--taskbar-height) + 4px)';
                }
                new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                    window.addEventListener(event, (e) => {
                        if (menu.container.contains(e.target)) return;
                        menu.close();
                    })
                })
            }, false);

            return;
        }

        async function updateDesktop(force = true, sort = 'default') {
            if (window.debuggerMode == true) {
                console.log('Updating Desktop', '\nForce : ' + force);
            }
            fs.readdir('C:/Users/Admin/Desktop').then(async items => {
                if (items == originalContent && force == false || updating == true) return;
                originalContent = items;
                updating = true;
                var results = [];
                var count = Math.abs(items.length - createdItems.length);
                if (createdItems.length < items.length) {
                    for (let i = 0; i < count; i++) {
                        generateItem();
                    }
                } else if (createdItems.length > items.length) {
                    for (let i = 0; i < count; i++) {
                        if (createdItems[i]) {
                            createdItems[i].remove();
                        }
                    }
                }
                for (let i = 0; i < items.length; i++) {
                    const stat = fs.stat(items[i]);
                    results.push({
                        stat,
                        path: items[i],
                        name: fsUtils.basename(items[i]),
                        content: stat.isFile() ? await fs.readFile(items[i]).catch(err => console.error(err)) : new Blob([])
                    });
                }
                if (sort == 'name') {
                    // TODO
                }
                for (let i = 0; i < results.length; i++) {
                    ; await (async (i) => {
                        var { stat, path, name, content } = results[i];
                        var type = utils.getFileExtension(path) == '.link' ? 'shortcut' : stat.isFile() ? 'file' : 'directory';
                        var detail = {};
                        try {
                            if (type == 'shortcut') {
                                detail = JSON.parse(await content.text());
                            } else if (type == 'directory') {
                                detail = {
                                    name: name,
                                    command: `run explorer --config=PAGE=\"${path}\"`
                                };
                            } else {
                                detail = {
                                    name: name,
                                    action: () => {
                                        var defaultViewer = window.System.FileViewers.getDefaultViewer(path);
                                        if (defaultViewer != null) {
                                            new Process(defaultViewer.script).start(`const FILE_PATH="${path}";`);
                                        } else {
                                            if (window.debuggerMode == true) {
                                                console.log('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wexe')
                                            }
                                            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wexe').start(`const FILE_PATH="${path}";`);
                                        }
                                    }
                                };
                            }
                        } catch (e) { console.error(e) };
                        detail.path = path;
                        detail.type = type;
                        detail.file = content;
                        function update() {
                            createdItems[i].update(detail);
                            clearTimeout(update);
                        }
                        setTimeout(update, i);
                        return;
                    })(i);
                }
                updating = false;
            })
        }

        const target = 'C:/Users/Admin/Desktop/';
        const dropZone = desktop;

        var checked = false;
        var allowed = false;

        function checkType(event) {
            const items = event.dataTransfer.items;
            let isFileOrFolder = false;
            allowed = false;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    isFileOrFolder = true;
                    allowed = true;
                }
            }

            if (isFileOrFolder) {
                dropZone.classList.add('dragover');
            } else {
                dropZone.classList.remove('dragover');
            }
        }

        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();

            if (checked == false) {
                checkType(event);
                checked = true;
            }
        });

        dropZone.addEventListener('dragenter', (event) => {
            event.preventDefault();

            if (checked == false) {
                checkType(event);
                checked = true;
            }
        });

        dropZone.addEventListener('dragleave', (event) => {
            event.preventDefault();
            checked = false;
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            checked = false;
            dropZone.classList.remove('dragover');

            if (allowed == false) return;
            allowed == false;

            function hashURL(url) {
                return crypto.subtle.digest('SHA-256', new TextEncoder().encode(url)).then(buf =>
                    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
                );
            }

            const items = e.dataTransfer.items;
            var processed = 0;
            var current = 'Unknown';
            var title = 'Uploading File to Desktop...';
            var worker;
            var promises = [];

            for (const item of items) {
                const entry = item.webkitGetAsEntry?.();
                if (entry) {
                    promises.push(readEntryRecursively(entry, ''));
                } else if (item.kind === 'string' && item.type === 'text/uri-list') {
                    // URL
                    promises.push(new Promise((resolve, reject) => {
                        item.getAsString(async url => {
                            try {
                                const res = await fetch(url);
                                // Try to get the file name from the header
                                const disposition = res.headers.get('Content-Disposition');
                                let filename = null;

                                if (disposition && disposition.includes('filename=')) {
                                    const matches = disposition.match(/filename\*=UTF-8''(.+)$|filename="?([^"]+)"?/);
                                    if (matches) {
                                        filename = decodeURIComponent(matches[1] || matches[2]);
                                    }
                                }

                                // Get it from url
                                if (!filename) {
                                    filename = await hashURL(url);
                                }

                                const blob = await res.blob();

                                return resolve({
                                    path: '',
                                    file: new File([blob], filename, {
                                        type: blob.type,
                                        lastModified: Date.now()
                                    })
                                });
                            } catch (e) {
                                return reject(e);
                            }
                        })
                    }));
                } else {
                    // Not a file, directory, or URL
                }
            }

            const results = (await Promise.all(promises)).flat();
            const total = results.length;
            console.log(results, total);


            async function readEntryRecursively(entry, path = '') {
                return new Promise(async (resolve, reject) => {
                    if (entry.isFile) {
                        entry.file(file => {
                            resolve({ path: path, file });
                        });
                    } else if (entry.isDirectory) {
                        const reader = entry.createReader();
                        reader.readEntries(async entries => {
                            const promises = entries.map(e =>
                                readEntryRecursively(e, path + entry.name + '/')
                            );
                            const results = await Promise.all(promises);
                            resolve(results.flat());
                        });
                    }
                })
            }

            if (window.debuggerMode == true) {
                console.log('run', total, results);
            }
            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js').start().then(async process => {
                fileTransfer++;
                worker = process.worker;

                if (window.debuggerMode == true) {
                    console.log(results)
                }

                worker.postMessage({
                    type: 'init',
                    token: process.token
                })

                worker.postMessage({
                    type: 'transfer',
                    token: process.token,
                    files: results, title,
                    target: 'C:/Users/Admin/Desktop/'
                })

                worker.addEventListener('message', async (e) => {
                    if (!e.data.token == process.token) return;
                    // console.log('MAIN', e.data.type)
                    if (e.data.type == 'start') {
                        worker.postMessage({
                            type: 'init',
                            token: process.token
                        })
                    }
                    if (e.data.type == 'init') {
                        // console.log('init')
                        worker.postMessage({
                            type: 'transfer',
                            token: process.token,
                            files: results, title,
                            target: 'C:/Users/Admin/Desktop/'
                        })
                    }
                    if (e.data.type == 'completed') {
                        fileTransfer--;
                        updateDesktop();
                    }
                });

                // process.exit();
            });
        });

        /*
        document.addEventListener('paste', function (event) {
            const clipboardItems = event.clipboardData.items;

            console.log('paste', clipboardItems);

            var files = [];

            for (let i = 0; i < clipboardItems.length; i++) {
                const item = clipboardItems[i];

                if (item.kind === 'file') {
                    console.log(item.webkitGetAsEntry())
                    const file = item.getAsFile();
                    files.push(file);
                }
            }

            if (files.length == 0) return;

            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js').start().then(async process => {
                fileTransfer++;
                var worker = process.worker;
                var title = 'Pasting Files to Desktop...';

                console.log(files)

                worker.postMessage({
                    type: 'init',
                    token: process.token
                })

                worker.postMessage({
                    type: 'transfer',
                    token: process.token,
                    files, title,
                    target: 'C:/Users/Admin/Desktop/'
                })

                worker.addEventListener('message', async (e) => {
                    if (!e.data.token == process.token) return;
                    // console.log('MAIN', e.data.type)
                    if (e.data.type == 'start') {
                        worker.postMessage({
                            type: 'init',
                            token: process.token
                        })
                    }
                    if (e.data.type == 'init') {
                        // console.log('init')
                        worker.postMessage({
                            type: 'transfer',
                            token: process.token,
                            files, title,
                            target: 'C:/Users/Admin/Desktop/'
                        })
                    }
                    if (e.data.type == 'completed') {
                        fileTransfer--;
                        updateDesktop();
                    }
                });
            });
        });
        */

        desktop.addEventListener('contextmenu', (e) => {
            const menu = WinUI.contextMenu([
                {
                    className: "refresh",
                    icon: "refresh",
                    text: "Refresh",
                    action: () => {
                        window.System.desktop.update();
                    }
                }, {
                    className: 'sort',
                    icon: "sort",
                    text: "Sort by",
                    submenu: [{
                        className: "name",
                        /*icon: "sort_by_name",*/
                        text: "Name",
                        action: () => {
                            window.System.desktop.update(true, 'name');
                        }
                    },/* {
                        className: "size",
                        icon: "sort_by_size",
                        text: "Size",
                        action: () => { }
                    }, {
                        className: "type",
                        icon: "sort_by_type",
                        text: "Type",
                        action: () => { }
                    }*/]
                }
            ])
            e.preventDefault();
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
            menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
            menu.open(pageX, pageY, 'left-top');
            if (utils.getPosition(menu.container).x + menu.container.offsetWidth > window.innerWidth) {
                menu.container.style.left = 'unset';
                menu.container.style.right = '4px';
            }
            if (utils.getPosition(menu.container).y + menu.container.offsetHeight > window.innerHeight - 48) {
                menu.container.style.top = 'unset';
                menu.container.style.bottom = 'calc(var(--taskbar-height) + 4px)';
            }
            new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                window.addEventListener(event, (e) => {
                    if (menu.container.contains(e.target)) return;
                    menu.close();
                })
            })
        })

        var defaultShortcuts = [{
            path: 'C:/Users/Admin/Desktop/desktop.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico'),
                name: 'Desktop',
                command: 'run explorer --config=PAGE=\"C:/Users/Admin/Desktop\"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/github.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/github.png'),
                name: 'Github',
                command: 'open "https://github.com/Siyu1017/winbows11/"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/code.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/applications/office/code.ico'),
                name: 'VSCode',
                command: 'run code'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/author.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/author.ico'),
                name: 'Siyu',
                command: 'open "https://siyu1017.github.io/"'
            }
        }]

        for (let i = 0; i < defaultShortcuts.length; i++) {
            var content = JSON.stringify(defaultShortcuts[i].content);
            fs.writeFile(defaultShortcuts[i].path, new Blob([content], {
                type: 'application/winbows-link'
            }));
        }

        var lastTime = Date.now();

        fs.on('change', (e) => {
            if (e.path.search('C:/Users/Admin/Desktop') > -1 && fileTransfer == 0) {
                var timeout = () => {
                    var now = Date.now();
                    if (lastTime - now > 1000) {
                        lastTime = now;
                        updateDesktop(false);
                    }
                    clearTimeout(timeout);
                };
                setTimeout(timeout, 1000);
            }
        });

        desktopItems.addEventListener('wheel', function (event) {
            var delta = event.deltaY || event.detail || event.wheelDelta;
            if (delta < 0) {
                desktopItems.scrollTo({
                    behavior: "smooth",
                    left: desktopItems.scrollLeft - 300
                })
            } else {
                desktopItems.scrollTo({
                    behavior: "smooth",
                    left: desktopItems.scrollLeft + 300
                })
            }
            event.preventDefault();
        });
    })();

    window.System.FileViewers = {
        // Deprecated Method : System.FileViewers.viewers
        viewers: {
            '*': '',
            '.css': ['code'],
            '.js': ['code'],
            '.html': ['code', 'edge'],
            '.txt': ['code'],
            '.jpg': ['mediaplayer', 'edge', 'photos'],
            '.jpeg': ['mediaplayer', 'edge', 'photos'],
            '.png': ['mediaplayer', 'edge', 'photos'],
            '.gif': ['mediaplayer', 'edge', 'photos'],
            '.webp': ['mediaplayer', 'edge', 'photos'],
            '.bmp': ['mediaplayer', 'edge', 'photos'],
            '.svg': ['mediaplayer', 'edge', 'photos'],
            '.ico': ['mediaplayer', 'edge', 'photos'],
            '.pdf': [],
            '.json': ['code'],
            '.xml': ['code'],
            '.zip': [],
            '.tar': [],
            '.gz': [],
            '.mp3': ['mediaplayer'],
            '.wav': ['mediaplayer'],
            '.ogg': ['mediaplayer'],
            '.mp4': ['mediaplayer'],
            '.webm': ['mediaplayer'],
            '.avi': ['mediaplayer'],
            '.mov': ['mediaplayer'],
            '.li.nk': ['edge']
        },
        defaultViewers: {
            '.css': 'code',
            '.js': 'code',
            '.html': 'edge',
            '.link': 'edge',
            '.json': 'json-viewewr'
        },
        registeredViewers: {
            'code': {
                name: 'Visual Studio Code',
                script: 'C:/Program Files/VSCode/viewer.js',
                accepts: [/*'css', 'js', 'jsx', 'ts', 'ejs', 'html', 'txt', 'json', 'xml', 'py', 'java', 'c', 'h', */'*']
            },
            'edge': {
                name: 'Microhard Edge',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/viewer.js',
                accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
            },
            'edgebeta': {
                name: 'Microhard Edge BETA',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/viewer.js',
                accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
            },
            'photos': {
                name: 'Photos',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/viewer.js',
                accepts: ['*']
            },
            'mediaplayer': {
                name: 'MediaPlayer',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MediaPlayer/window.js',
                accepts: ['.mp3', '.wav', '.ogg', '.mp4', '.webm', '.avi', '.mov']
            },
            'json-viewer': {
                name: 'JSON Viewer',
                script: 'C:/Program Files/JSON Viewer/viewer.js',
                accepts: ['.json']
            },
            'notepad': {
                name: 'Notepad',
                script: 'C:/Program Files/Notepad/viewer.js',
                accepts: ['*']
            }
        },
        isRegisterd: (name) => {
            return window.System.FileViewers.registeredViewers.hasOwnProperty(name);
        },
        updateViewer: (viewer, prop, value) => {
            if (window.System.FileViewers.isRegisterd(viewer)) {
                window.System.FileViewers.registeredViewers[viewer][prop] = value;
                localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
            }
        },
        registerViewer: (viewer, name, script, accepts) => {
            if (!window.System.FileViewers.isRegisterd(viewer)) {
                window.System.FileViewers.registeredViewers[viewer] = {
                    name: name,
                    script: script,
                    accepts: accepts
                };
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
        },
        unregisterViewer: (viewer) => {
            if (window.System.FileViewers.isRegisterd(viewer)) {
                delete window.System.FileViewers.registeredViewers[viewer];
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
        },
        // Deprecated Method
        setViewer: (extension, app) => {
            if (!window.System.FileViewers.viewers[extension]) {
                window.System.FileViewers.viewers[extension] = [];
            }
            window.System.FileViewers.viewers[extension].push(app);
            localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
            console.warn('%cSystem.FileViewers.setViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        },
        // Deprecated Method
        unsetViewer: (extension, app) => {
            var index = window.System.FileViewers.viewers[extension].indexOf(app);
            if (index != -1) {
                window.System.FileViewers.viewers[extension].splice(index, 1);
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
            console.warn('%cSystem.FileViewers.unsetViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        },
        setDefaultViewer: (extension, app) => {
            var exists = false;
            Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
                if (viewer == app || window.System.FileViewers.registeredViewers[viewer] == app) {
                    exists = viewer;
                }
            })
            if (exists != false) {
                window.System.FileViewers.defaultViewers[extension] = exists;
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
        },
        unsetDefaultViewer: (extension, app) => {
            if (window.System.FileViewers.defaultViewers[extension]) {
                window.System.FileViewers.defaultViewers.splice(window.System.FileViewers.defaultViewers.indexOf(app), 1)
            }
            localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
        },
        getDefaultViewer: (file = '') => {
            var extension = window.utils.getFileExtension(file).toLowerCase();
            var viewer = window.System.FileViewers.defaultViewers[extension];
            if (!viewer) {
                return null;
            } else {
                return window.System.FileViewers.registeredViewers[viewer];
            }
        },
        getViewers: (file = '') => {
            var extension = window.utils.getFileExtension(file).toLowerCase();
            var accepted = ['*', extension];
            if (extension == '') {
                accepted = ['*'];
            }
            var viewers = {};
            Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
                if (window.debuggerMode == true) {
                    console.log(window.System.FileViewers.registeredViewers[viewer])
                }
                if (window.System.FileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                    viewers[viewer] = window.System.FileViewers.registeredViewers[viewer];
                }
            })
            if (window.debuggerMode == true) {
                console.log(file, extension, viewers)
            }
            return viewers;
        }
    }

    if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS') && devMode == false) {
        window.System.FileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS') && devMode == false) {
        window.System.FileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS') && devMode == false) {
        window.System.FileViewers.registeredViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
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

        if (window.debuggerMode == true) {
            console.log('Next update of time :', new Date(Date.now() + leftToUpdateTime))
            console.log('Next update of date :', new Date(Date.now() + leftToUpdateDate))
        }

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
                var command = getJsonFromURL()['command'];
                if (command) {
                    window.System.Shell(command);
                }
            }
        })

        if (now - startLoadingTime < 1000) {
            await delay(1000 - (now - startLoadingTime));
        }

        window.System.desktop.update();

        // await delay(1000);

        // Remove loading 
        loadingContainer.classList.remove('active');

        async function initTaskbar() {
            await delay(200);

            // Initialize Taskbar
            window.Taskbar.init();

            // For Debugging
            // Test App For iPhone
            // new Process("C:/dev/app.iPhoneOS.18.5/app.wexe").start();
            // new Process("C:/dev/windowThemeTest/app.wexe").start();
        }
    })

    loadingText(`Almost done!`);

    await (async () => {
        try {
            const fontName = 'WINBOWS_FONT_' + [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            const fontURL = await fs.getFileURL('C:/Winbows/fonts/Segoe Fluent Icons.ttf');
            const myFont = new FontFace(fontName, `url(${fontURL})`);
            await myFont.load();

            document.fonts.add(myFont);
            document.querySelector(':root').style.setProperty('--winbows-font-icon', fontName);

        } catch (error) {
            console.error('Failed to load font', error);
        }
        return;
    })();

    window.System.triggerEvent('load');

    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'system').start();
    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.Test/app.js', 'system').start();

    window.utils.formatBytes = formatBytes;

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
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
        if (debuggerMode == true || window.debuggerMode == true) {
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
            if (window.debuggerMode == true) {
                console.log(`Failed to fetch file: ${path}`, err);
            }
            if (responseType == 'text') {
                return await (await fs.readFile(path)).text();
            } else {
                return await fs.readFile(path);
            }
        })
    }
}

Main();