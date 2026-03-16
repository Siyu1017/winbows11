import { fsUtils, IDBFS } from "../../../shared/fs.js";
import { Process } from "./process.ts";
import * as utils from "../../../shared/utils.ts";
import Console from "../../../lib/winbows-devtool/dist/index.js";
import crashHandler from "../../core/crashHandler.js";
import SystemInformation from "../../core/sysInfo.js";
import ModuleManager from "../../moduleManager.js";
import minimistJs from "../../../lib/minimist.js/index.js";
import { stat } from "../../core/stat.js";
import Logger from "../../core/log.js";
import { child_process } from "./lib/child_process.ts";
import _process from "./lib/process.js";

const logger = new Logger({
    module: 'WRT'
})
const fs = IDBFS("~KERNEL");
const consoleStyle = 'color:#fff;background:#0067c0;padding:2px 4px;border-radius:4px; font-weight: normal;';
const tasklist = new ((() => {
    const tasks = new Map();
    return class TaskList extends utils.EventEmitter {
        constructor() {
            super();
        }
        add(id, task) {
            tasks.set(id, task);
            this._emit('add', { id, task });
        }
        remove(id) {
            tasks.delete(id);
            this._emit('remove', { id });
        }
        update(id, key, value) {
            const task = tasks.get(id);
            if (!task) return;
            task[key] = value;
            this._emit('update', { id, key, value });
        }
        get(id) {
            return tasks.get(id);
        }
        list() {
            return tasks.keys();
        }
    }
})())();

stat.set('Kernel.WRT.available', true);

const WRTEvtEmitter = new utils.EventEmitter();
// const _token = Symbol('token');

class WinbowsNodejsRuntime extends utils.EventEmitter {
    static on(evt, cb) {
        WRTEvtEmitter.on(evt, cb);
    }
    static off(evt, cb) {
        WRTEvtEmitter.off(evt, cb);
    }

    timeouts = new Map();
    intervals = new Map();
    proxyTimeout = {
        set: (fn, t, ...args) => {
            const id = utils.randomID(12);
            const timeoutId = setTimeout(() => {
                this.timeouts.delete(id);
                if (this.alive) {
                    fn(...args);
                }
            }, t);
            this.timeouts.set(id, timeoutId);
            return id;
        },
        clear: (id) => {
            if (this.timeouts.has(id)) {
                clearTimeout(this.timeouts.get(id));
                this.timeouts.delete(id);
            }
        },
        clearAll: () => {
            for (const id of this.timeouts.keys()) {
                this.proxyTimeout.clear(id);
            }
        }
    };
    proxyInterval = {
        set: (fn, t, ...args) => {
            const id = utils.randomID(12);
            const intervalId = setInterval(() => {
                if (this.alive) {
                    fn(...args);
                } else {
                    this.proxyInterval.clear(id);
                }
            }, t);
            this.intervals.set(id, intervalId);
            return id;
        },
        clear: (id) => {
            if (this.intervals.has(id)) {
                clearInterval(this.intervals.get(id));
                this.intervals.delete(id);
            }
        },
        clearAll: () => {
            for (const id of this.intervals.keys()) {
                this.proxyInterval.clear(id);
            }
        }
    };
    fsManager = {
        objs: new Map(),
        add: (caller, obj) => {
            if (!this.fsManager.objs.has(caller)) {
                this.fsManager.objs.set(caller, obj);
            }
        },
        remove: (caller) => {
            const fs = this.fsManager.objs.get(caller);
            if (fs) {
                try {
                    fs.quit?.();
                    this.fsManager.objs.delete(caller);
                } catch (e) {
                    crashHandler(e);
                }
            }
        },
        removeAll: () => {
            for (const fs of this.fsManager.objs.values()) {
                try {
                    fs.quit?.();
                } catch (e) {
                    crashHandler(e);
                }
            }
            this.fsManager.objs.clear();
        },
    }

    constructor({
        code = '', __filename, __dirname, options = {}, argv = [], type, runInBackground, icon, // token
    }) {
        super();

        if (stat.get('Kernel.WRT.available') !== true) return false;

        this.runtimeID = utils.randomID(12);

        if (__filename && typeof __filename === 'string') {
            this.__filename = __filename;
            if (__dirname && fs.exists(fsUtils.toDirFormat(__dirname))) {
                this.__dirname = __dirname;
            } else {
                this.__dirname = fsUtils.dirname(__filename);
            }
        } else {
            this.__filename = 'wrt://snippets/anonymous_' + this.runtimeID;
            this.__dirname = 'C:/';
        }

        if (icon) {
            this.icon = icon;
        }

        // if (token) {
        //     this[_token] = token;
        // }

        // Object.defineProperty(this, 'isTrusted', {
        //     get: function () {
        //         return !!this[_token];
        //     }
        // });

        // Status
        this.alive = true;

        // External APIs
        this.apis = {};

        // Options
        this.options = {};
        this.options.allowedConsoleOutput = options?.allowedConsoleOutput ?? SystemInformation.mode == 'development' ? true : false;
        this.options.keepAlive = options?.keepAlive ?? false;
        this.options.withConsoleWindow = false;

        // Runtime type
        this.type = 'cli';
        this.runInBackground = true;
        const firstLine = code?.split('\n')?.[0] || '';
        if (firstLine.startsWith('//!')) {
            const headerString = firstLine.slice(3).trim();
            const headers = {};
            headerString.split('&').forEach(header => {
                const i = header.indexOf('=');
                if (i === -1) {
                    headers[header.toUpperCase()] = undefined;
                } else {
                    headers[header.slice(0, i).toUpperCase()] = header.slice(i + 1);
                }
            })

            if (headers['$RTH']) {
                try {
                    const header = JSON.parse(headers['$RTH']);
                    if (header.type) {
                        this.type = header.type === 'gui' ? 'gui' : 'cli';
                    }
                    if (header.runInBackground !== undefined) {
                        this.runInBackground = !header.runInBackground == false;
                    }
                    if (header.withConsoleWindow !== undefined) {
                        this.options.withConsoleWindow = header.withConsoleWindow == true;
                    }
                } catch (e) {
                    throw new Error(e);
                }
            }
        }

        if (type && ['cli', 'gui'].includes(type)) {
            this.type = type;
        }
        if (this.type === 'gui') {
            this.runInBackground = false;
        } else if (runInBackground) {
            this.runInBackground = runInBackground != false;
        }

        this.modules = {};
        this.modules['child_process'] = {
            exports: child_process(this.process)
        }
        this.modules['process'] = {
            exports: _process(this.process)
        }
        // this.modules['ipc'] = {
        //     exports: _ipc(this.ipc)
        // }

        this.debugConsole = new Console();
        this.proxyConsole = this.options.allowedConsoleOutput == true ? new Proxy(this.debugConsole.console, {
            get: (obj, prop) => {
                if (prop in obj) {
                    return (...args) => {
                        console[prop].apply(console, args);
                        return obj[prop].apply(obj, args);
                    };
                } else if (Object.keys(console).includes(prop)) {
                    console.trace();
                    console.log(console[prop], prop);
                    logger.warn(`console.${String(prop)} is not supported in WRT Environment.`);
                    return () => { };
                };
            },
            set: () => { return false; }
        }) : new Proxy({}, {
            get: (obj, prop) => {
                return () => { }
            }
        });

        if (this.options.withConsoleWindow) {
            const WRT = ModuleManager.get('WRT');
            const file = 'C:/Winbows/System32/internal/com.winbows.console/app.wrt';
            if (this.__filename != file) {
                const System = ModuleManager.get('System');
                const pipeName = `kernel://winbows-console/` + utils.randomID(64);
                const ipc = System.processAPIs.IPC.listen(pipeName);

                fs.readFileAsText(file).then(code => {
                    const wrt = new WRT({ code, __filename: file });
                    wrt.process.env.pipe = pipeName;
                    wrt.main();

                    ipc.on('data', (e) => {
                        if (e.data.type === 'ready') {
                            ipc.send({
                                type: 'data',
                                data: {
                                    console: this.debugConsole,
                                    runtimeID: this.runtimeID
                                }
                            })
                            setTimeout(() => {
                                ipc.close();
                            })
                        }
                    })
                })
            }
        }

        // Shared APIs
        const process = new Process(this.__dirname, this.type);
        process.on('change:title', (e) => {
            tasklist.update(this.runtimeID, 'title', e.value);
            this._emit('change:process.title', { value: e.value, runtimeID: this.runtimeID });
        })
        if (this.type === 'cli') {
            process.title = this.__filename;
        }
        this.process = new Proxy(process, {
            set: (target, prop, value) => {
                if (prop === 'title') {
                    if (this.title != value) {
                        this.title = value;
                        tasklist.update(this.runtimeID, 'title', value);
                        this._emit('change:process.title', { value, runtimeID: this.runtimeID });
                    }
                } else {
                    target[prop] = value;
                }
                return true;
            }
        });

        // Title
        this.title = process.title;

        // argv string[]
        process.argv.push(this.__filename);
        if (argv && Array.isArray(argv)) {
            process.argv = process.argv.concat(argv);
        }

        // args {key->value}
        process.args = minimistJs(process.argv);
        for (const [k, v] of Object.entries(process.args)) {
            if (typeof v === 'string' && /(^".*"$)|(^'.*'$)/.test(v)) {
                process.args[k] = v.slice(1, -1);
            }
        }

        process.on('exit', () => {
            if (this.alive == false) return;
            this.alive = false;
            tasklist.remove(this.runtimeID);
            this.proxyTimeout.clearAll();
            this.proxyInterval.clearAll();
            this.fsManager.removeAll();
            WRTEvtEmitter._emit('close', {
                runtimeID: this.runtimeID,
                __filename: this.__filename,
                __dirname: this.__dirname
            });
            /*
            this[fss].forEach(mfs => {
                mfs.quit?.();
            })
            this[fss].clear();
            this.windows.forEach(window => {
                try {
                    window.close();
                } catch { };
            })
            setTimeout(() => {
                Reflect.ownKeys(this).forEach(key => {
                    this[key] = null;
                })
            }, 1000);*/
        })

        tasklist.add(this.runtimeID, this);
        WRTEvtEmitter._emit('create', {
            runtimeID: this.runtimeID,
            __filename: this.__filename,
            __dirname: this.__dirname
        });

        /**
         * @param {*} opts 
         * @param {*} argv 
         * @returns 
         */
        this.main = async () => {
            try {
                /*
                let mC = code;
                if (opts && {}.toString.call(opts) === '[object Object]') {
                    if (opts.__filename && typeof opts.__filename === 'string') {
                        this.__filename = opts.__filename;
                        if (opts.__dirname && fs.exists(fsUtils.toDirFormat(opts.__dirname))) {
                            this.__dirname = opts.__dirname;
                        } else {
                            this.__dirname = fsUtils.dirname(this.__filename);
                        }
                    }
                    if (opts.code) {
                        mC = opts.code;
                    }
                }*/

                const { evaluation } = await this._run({
                    __dirname: this.__dirname,
                    __filename: this.__filename,
                    code
                });
                if (this.options.keepAlive) {
                    return new Promise(resolve => {
                        this.process.on('exit', (code) => {
                            resolve({
                                exitCode: code || 0,
                                evaluation: evaluation ?? null
                            });
                        });
                    })
                } else {
                    this.process.exit(0);
                    return {
                        exitCode: 0,
                        evaluation: evaluation ?? null
                    };
                }
            } catch (e) {
                console.error(e);
                this.process.exit(1);
                return {
                    exitCode: 1,
                    evaluation: null,
                    error: e instanceof Error ? e.message : String(e)
                };
            }
        };
    }
    mountAPI({ name, api }) {
        if (this.apis[name]) {
            throw new Error(`API ${name} already exists`);
        }
        this.apis[name] = api;
    }
    unmountAPI(name) {
        delete this.apis[name];
    }

    /**
     * @typedef {Object} requireAsyncIOptions
     * @property {string} modulePath
     * @property {string} [dirname]
     */

    /**
     * @param {requireAsyncIOptions} param0 
     * @returns 
     */
    async requireAsync({ modulePath, dirname = '' }) {
        if (this.modules[modulePath]) return this.modules[modulePath].exports;

        const resolved = fsUtils.resolve(dirname, modulePath);
        if (this.modules[resolved]) return this.modules[resolved].exports;

        const __dirname = fsUtils.dirname(resolved);
        const code = await fs.readFileAsText(resolved);
        const res = await this._run({
            __dirname: __dirname,
            __filename: resolved,
            code
        });
        this.modules[resolved] = res.ctx.module;
        return this.modules[resolved].exports;
    }
    kill() {
        this.process.exitCode = 0;
    };
    async _run({
        __dirname, __filename, code
    }) {
        // const token = this[_token];
        // const tokenIsTrusted = this.isTrusted;
        const module = { exports: {} };
        const fs = IDBFS(__filename, __dirname);
        const ctx = {
            // Private APIs
            fs: fs,
            __filename: __filename,
            __dirname: __dirname,
            process: this.process,
            requireAsync: (modulePath) => this.requireAsync({ modulePath, dirname: __dirname }),
            module: module,
            exports: module.exports,

            // Shared APIs
            path: fsUtils,
            runtimeID: this.runtimeID,
            console: this.proxyConsole,
            setTimeout: this.proxyTimeout.set,
            clearTimeout: this.proxyTimeout.clear,
            setInterval: this.proxyInterval.set,
            clearInterval: this.proxyInterval.clear,

            // token: {
            //     get isTrusted() {
            //         return tokenIsTrusted;
            //     },
            //     get value() {
            //         return token;
            //     }
            // }
        }

        // System APIs ( e.g. appRegistry, commandRegistry, etc. )
        Object.assign(ctx, this.apis);

        this.fsManager.add(__filename, fs);

        try {
            const fn = new Function(`return (async function() {\nconst {${Object.keys(ctx).join(',')}}=this;\n${code}\n});\n//# sourceURL=${__filename}`)();
            const evaluation = await fn.call(ctx);
            return { evaluation, ctx, error: null };
        } catch (error) {
            console.error(error);
            return { evaluation: null, ctx, error };
        }
    }
}

ModuleManager.register('WRT', WinbowsNodejsRuntime, 'original');

export { WinbowsNodejsRuntime as WRT, tasklist }