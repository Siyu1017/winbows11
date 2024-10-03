!(async () => {
    function newProcessID(type) {
        var range = [];
        if (type == 'system') {
            range = [0, 999];
        } else if (type == 'user') {
            range = [1000, 4999];
        } else {
            range = [5000, 65535];
        }
        var id = range[0] + ~~(Math.random() * (range[1] - range[0] + 1));
        Object.keys(window.System.processes).forEach(pid => {
            if (pid == id) {
                newProcessID(type);
            }
        })
        return id;
    }

    function isValidJavaScript(code) {
        try {
            eval(code);
            return true;
        } catch (e) {
            return false;
        }
    }

    var messengerTokens = [];
    var listeners = [];

    function getToken() {
        var patterns = '0123456789abcdef';
        var id = '_1x';
        for (var i = 0; i < 6; i++) {
            id += patterns.charAt(Math.floor(Math.random() * patterns.length));
        }
        if (messengerTokens[id]) {
            return getToken();
        }
        return id;
    }

    function triggerEvent(event, details) {
        if (listeners[event]) {
            listeners[event].forEach(listener => {
                listener(details);
            })
        }
    }

    async function handleError(err, traces) {
        var traceHTML = '';
        traces.forEach(trace => {
            traceHTML += `<div style="text-indent:1rem">${trace.replaceAll("'", "\\'").replaceAll('"', '\\"')}</div>`
        })
        var warningWindow = `document.body.innerHTML='<div style="color: red;padding: .5rem .75rem;user-select: none;-webkit-user-select: none;-webkit-user-drag: none;width: -webkit-fill-available;height: -webkit-fill-available;overflow: auto;background: rgb(255 0 0 / 18%);"><div style="font-weight:600">ERROR: ${err.message}</div><details><summary>${traces[0].replaceAll("'", "\\'").replaceAll('"', '\\"')}</summary>${traceHTML}</details></div>';document.querySelector('.window-toolbar').style="background: rgb(255 0 0 / 18%);color: red;";document.documentElement.style="display: flex;align-items: center;justify-content: center;width: 450px;height: 240px;background: #fff;";`;
        var warningWindowURL = `C:/Winbows/System/Temp/${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        await fs.writeFile(warningWindowURL, new Blob([warningWindow], {
            type: 'text/javascript'
        })).catch(err => {
            window.Crash(err);
        })
        var warningProcess = `;(async()=>{System.requestAccessWindow('${warningWindowURL}',{title:'ERROR',width:300,height:150,resizable:false,snappable:false,fullscreenable:false});})();`;
        var tempFileName = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        fs.writeFile(`C:/Winbows/System/Temp/${tempFileName}`, new Blob([warningProcess], {
            type: 'text/javascript'
        })).then(res => {
            new Process(`C:/Winbows/System/Temp/${tempFileName}`, 'system').start();
        })
    }

    class Process {
        constructor(path, type) {
            this.path = path;
            this.type = type;
            this.id = newProcessID(this.type);
            this.token = getToken();
            this.temp = {};
            this.windows = [];
        }
        async start(extra) {
            window.Winbows.Screen.style.cursor = 'progress';
            try {
                this.url = URL.createObjectURL(await window.Compilers.Worker(this.path, this.token, extra));
            } catch (e) {
                window.Winbows.Screen.style.cursor = 'auto';
                throw new Error('Can not run file.\n' + e.message);
            }
            console.log(this.url)
            this.worker = new Worker(this.url);
            this.worker.onerror = (e) => {
                this.exit();
                var trace = debuggers.getStackTrace(e);
                handleError(e, trace);
                console.error(e);
            };
            this.worker.addEventListener('error', (e) => {
                this.exit();
                var trace = debuggers.getStackTrace(e);
                handleError(e, trace);
                console.error(e);
            })
            this.listenWorker();
            window.System.processes[this.id] = this;
            window.System.processes[this.id].url = this.url;
            window.System.processes[this.id].worker = this.worker;
            window.Winbows.Screen.style.cursor = 'auto';
            triggerEvent('start', {
                pid: this.id,
                path: this.path,
                type: this.type
            })
            return this;
        }
        exit() {
            if (!this.worker) {
                window.Winbows.Screen.style.cursor = 'auto';
                throw new Error('Can not exit process before running.');
            }
            this.worker.terminate();
            this.windows.forEach(windowObject => {
                try {
                    windowObject.close();
                } catch (e) { console.log(e) }
            })
            Object.values(this.temp).forEach(temp => {
                try {
                    temp.remove()
                } catch (e) { }
            })
            triggerEvent('exit', {
                pid: this.id,
                path: this.path,
                type: this.type
            })
            delete window.System.processes[this.id];
        }
        _exit_Window() {
            if (!this.worker) {
                window.Winbows.Screen.style.cursor = 'auto';
                throw new Error('Can not exit process before running.');
            }
            this.worker.terminate();
            Object.values(this.temp).forEach(temp => {
                try {
                    temp.remove()
                } catch (e) { }
            })
            triggerEvent('exit', {
                pid: this.id,
                path: this.path,
                type: this.type
            })
            delete window.System.processes[this.id];
        }
        listenWorker() {
            var worker = this.worker;
            function getID() {
                var patterns = '0123456789abcdef';
                var id = '_0x';
                for (var i = 0; i < 6; i++) {
                    id += patterns.charAt(Math.floor(Math.random() * patterns.length));
                }
                if (this.temp[id]) {
                    return getID();
                }
                return id;
            }
            getID = getID.bind(this);
            worker.addEventListener('message', async function (e) {
                function send(payload) {
                    payload.messageID = e.data.messageID;
                    payload.token = e.data.token;
                    worker.postMessage(payload)
                }
                if (e.data.type == 'error') {
                    this.exit();
                    var err = e.data.error;
                    var trace = debuggers.getStackTrace(err);
                    handleError(err, trace);
                    console.error(err);
                }
                if (e.data.type == 'close') {
                    this.exit();
                }
                if (e.data.type == 'function') {
                    if (e.data.name == 'HTML') {
                        console.log(e.data.target)
                        this.temp[e.data.target].innerHTML = e.data.html;
                    }
                    if (e.data.name == 'requestAccessWindow') {
                        var id = getID();
                        var path = e.data.path;
                        var config = e.data.config || {};
                        await window.Compilers.Window(path, this.token, this.id, this.worker, config);
                        send({
                            response: id
                        })
                    }
                    if (e.data.name.startsWith('ToolbarComponents')) {

                    }
                    if (e.data.name == 'browserWindow') {
                        var id = getID();
                        this.temp[id] = window.workerModules.browserWindow(e.data.arguments);
                        send({
                            response: id
                        })
                    } else if (e.data.name == 'fs') {
                        var id = getID();
                        var method = e.data.method;
                        var param = e.data.param;
                        var current = e.data.current;
                        this.temp[id] = await fs.proxy(method, param, current);
                        send({
                            response: this.temp[id]
                        })
                    }
                }
            }.bind(this))
        }
    }

    Process.prototype.addEventListener = (event, listener) => {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(listener);
    }

    /*
    await (() => {
        return new Promise(resolve => setTimeout(() => {resolve()}, 2000))
    })()
        */

    window.Process = Process;

    window.loadedKernel();
})();