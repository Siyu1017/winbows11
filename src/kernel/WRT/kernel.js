import { fsUtils, IDBFS } from "../../lib/fs.js";
import { Process } from "./process.js";
import * as utils from "../../utils.js";
import { ShellInstance } from "./shell/shell.js";
import WinUI from "../../ui/winui.js";
import builtinPackageData from "../../../User/AppData/Roaming/wrt/wrt_modules/packages.json";
import * as WApplication from "./WApplication.v2.js";
import Devtool from "../../lib/external/winbows-devtool/dist/index.js";

const fs = IDBFS("~WRT");
const consoleStyle = 'color:#fff;background:#0067c0;padding:2px 4px;border-radius:4px; font-weight: normal;';
const definitionCodes = `/*!\n * Winbows Node.js Runtime (c) Siyu1017 ${new Date().getFullYear()}\n * Learn more in the Winbows Developer app in the start menu\n */\nconst {fs,path,process,__dirname,__filename,requireAsync,module,exports,runtimeID,ShellInstance,WinUI,WApplication,\nconsole,setInterval,clearInterval,setTimeout,clearTimeout // Proxy APIs\n}=this;\n`;

let builtinPackages = builtinPackageData.packages;
if (!fs.exists('%appdata%/wrt/wrt_modules/')) {
    await fs.mkdir('%appdata%/wrt/wrt_modules/');
}
for (const mod of Object.values(builtinPackages)) {
    if (mod.main) {
        try {
            await fs.downloadFile('%appdata%/wrt/wrt_modules/' + mod.pd + '/package.json');
            await fs.downloadFile(fsUtils.resolve('%appdata%/wrt/wrt_modules/' + mod.pd + '/', mod.main));
            await fs.downloadFile('%appdata%/wrt/wrt_modules/' + mod.pd + '/README.md');
        } catch (e) {
            console.error(e);
        }
        mod.main = fsUtils.resolve('%appdata%/wrt/wrt_modules/' + mod.pd + '/', mod.main);
    }
}

function codeWrapper(code, filename = "<anonymous>") {
    const fn = new Function(`return (async function() {\n${definitionCodes}\n${code}\n});\n//# sourceURL=${filename}`)();
    Object.defineProperty(fn, 'name', { value: 'main' });
    return fn;
}

const process = Symbol('process');
const timeouts = Symbol('timeouts');
const intervals = Symbol('intervals');
const modules = Symbol('modules');
const hasRun = Symbol('hasRun');
const runtimeID = Symbol('runtimeID');
const fss = Symbol('fss');
const alive = Symbol('alive');
const devtool = Symbol('devtool');
const WApplicationPath = Symbol('wap');
const WApplicationAPI = Symbol('waapi');

const tasklist = {};

class WinbowsNodejsRuntime {
    constructor(cwd, options = {}) {
        this.keepAlive = options?.keepAlive ?? false;
        this.subProcess = options?.subProcess ?? false;

        this.cwd = cwd ? fsUtils.toDirFormat(cwd) : this.defaultCwd;
        this[process] = new Process(this.cwd);
        this[timeouts] = new Map();
        this[intervals] = new Map();
        this[modules] = {};
        this[hasRun] = false;
        this.allowConsoleOutput = window.modes.debug == true;
        this[runtimeID] = utils.randomID(12);
        this[fss] = new Set();
        this[alive] = true;
        this[WApplicationPath] = "anonymous_" + utils.randomID(32);
        this[WApplicationAPI] = null;

        if (!fs.exists(this.cwd)) {
            this.close(1);
        }

        // For GUI
        this.mainWindow = null;
        this.windows = [];

        this.title = "Winbows Node.js Runtime";
        this[process].title = this.title;

        this.process = new Proxy(this[process], {
            set: (target, prop, value) => {
                if (prop === 'title') {
                    this.title = value;
                    this[process].title = value;

                    if (tasklist[this[runtimeID]]) {
                        tasklist[this[runtimeID]].title = value;
                    }

                    return true;
                } else {
                    return false;
                }
            }
        });

        //const proxyBrowserWindow = browserWindow.bind(this);
        //this.proxyBrowserWindow = proxyBrowserWindow;

        this[process].on('exit', () => {
            this[alive] = false;
            delete tasklist[this[runtimeID]];
            this.proxyTimeout.clearAll();
            this.proxyInterval.clearAll();
            this.proxyShellInstances.forEach(instance => {
                if (instance.active == true) {
                    instance.dispose?.();
                }
            })
            this[fss].forEach(mfs => {
                mfs.quit?.();
            })
            this[fss].clear();
            setTimeout(() => {
                Reflect.ownKeys(this).forEach(key => {
                    this[key] = null;
                })
            }, 1000);
        })

        this[devtool] = new Devtool();
    }

    // Node.js require function
    async requireAsync(name, basedir = this.cwd) {
        const mod = builtinPackages[name];
        if (!mod) {
            name = fsUtils.resolve(basedir, name);
        } else {
            name = mod.main;
        }
        if (!this[modules][name]) {
            const code = await fs.getFileAsText(name);
            const module = { exports: {} };

            const moduleDir = fsUtils.dirname(name);
            const builtins = {
                ...this.getDefaultBuiltins(moduleDir),
                exports: module.exports,
                module,
                fs: IDBFS(name, moduleDir),
                __filename: name,
                __dirname: moduleDir
            };
            const proxyAPIs = this.getProxyAPIs();
            const limitedAPIs = this.getLimitedAPIs();

            this[fss].add(builtins.fs);

            await codeWrapper(code, name).call({
                ...builtins,
                ...proxyAPIs,
                ...limitedAPIs
            });
            this[modules][name] = module;
        }
        return this[modules][name].exports;
    }

    // Proxy Timeouts
    proxyTimeout = {
        set: (fn, t, ...args) => {
            const id = utils.randomID(12);
            const timeoutId = setTimeout(() => {
                this[timeouts].delete(id);
                if (this[alive]) {
                    fn(...args);
                }
            }, t);
            this[timeouts].set(id, timeoutId);
            return id;
        },
        clear: (id) => {
            if (this[timeouts].has(id)) {
                clearTimeout(this[timeouts].get(id));
                this[timeouts].delete(id);
            }
        },
        clearAll: () => {
            for (const id of this[timeouts].keys()) {
                this.proxyTimeout.clear(id);
            }
        }
    };

    // Proxy Shell Instances
    proxyShellInstances = [];

    // Proxy Intervals
    proxyInterval = {
        set: (fn, t, ...args) => {
            const id = utils.randomID(12);
            const intervalId = setInterval(() => {
                if (this[alive]) {
                    fn(...args);
                } else {
                    this.proxyInterval.clear(id);
                }
            }, t);
            this[intervals].set(id, intervalId);
            return id;
        },
        clear: (id) => {
            if (this[intervals].has(id)) {
                clearInterval(this[intervals].get(id));
                this[intervals].delete(id);
            }
        },
        clearAll: () => {
            for (const id of this[intervals].keys()) {
                this.proxyInterval.clear(id);
            }
        }
    };

    // Proxy Console
    proxyConsole = new Proxy(console, {
        get: (obj, prop) => {
            if (!this.allowConsoleOutput) return () => { };
            if (!['log', 'warn', 'error', 'info', 'debug'].includes(prop)) return () => {
                console.warn.apply(obj, [`%cWRT%c > %c${this[runtimeID]}`, consoleStyle, 'color:inherit;', consoleStyle, `console.${prop} is not supported in WRT Environment.`])
            }
            return prop in obj ? (...args) => {
                return obj[prop].apply(obj, [`%cWRT%c > %c${this[runtimeID]}`, consoleStyle, 'color:inherit;', consoleStyle, ...args]);
            } : undefined;
        },
        set: () => {
            return false;
        }
    })

    createLocalRequireAsync(currentDir) {
        return (name) => this.requireAsync(name, currentDir);
    }

    getDefaultBuiltins(currentDir) {
        currentDir = currentDir || this.cwd;
        return {
            requireAsync: this.createLocalRequireAsync(currentDir),
            __dirname: currentDir,
            __filename: '<anonymous>',
            path: fsUtils,
            console,
            runtimeID: this[runtimeID],
            ShellInstance: new Proxy(ShellInstance, {
                construct: function (target, args) {
                    const instance = new target(...args);
                    this.proxyShellInstances.push(instance);
                    return instance;
                }.bind(this)
            }),
            WApplication: this[WApplicationAPI],
            WinUI
        }
    }

    getProxyAPIs() {
        return {
            process: this.process,
            setTimeout: this.proxyTimeout.set,
            clearTimeout: this.proxyTimeout.clear,
            setInterval: this.proxyInterval.set,
            clearInterval: this.proxyInterval.clear,
            console: this.proxyConsole
        }
    }

    getLimitedAPIs() {
        return {

        }
    }

    async runCode(code, envParams = {}) {
        if (!this[alive]) return;
        if (typeof code !== 'string') throw new Error('code must be a string');
        if (typeof envParams !== 'object' || Object.prototype.toString.call(envParams) !== '[object Object]') throw new Error('envParams must be an object');

        if (!this[WApplicationAPI] && !this.subProcess) {
            this[WApplicationAPI] = await WApplication.register(this[WApplicationPath], {
                ...envParams,
                process: this[process],
                runtimeID: this[runtimeID],
                runCode: this.runCode
            });
        }

        const module = { exports: {} };
        const currentDir = envParams.__dirname || envParams.__filename ? fsUtils.dirname(envParams.__filename) : this.cwd;
        const filePath = envParams.__filename ? fsUtils.resolve(this.cwd, envParams.__filename) : '<anonymous>';

        tasklist[this[runtimeID]] = {
            __filename: filePath,
            __dirname: currentDir,
            ...this
        };

        const builtins = {
            ...this.getDefaultBuiltins(currentDir), // Default variables
            exports: module.exports,
            module,
            fs: IDBFS(filePath, currentDir),
            __filename: filePath,
            __dirname: currentDir
        };
        const proxyAPIs = this.getProxyAPIs();
        const limitedAPIs = this.getLimitedAPIs();

        this[fss].add(builtins.fs);

        try {
            const result = await codeWrapper(code, filePath).call({
                ...envParams,
                ...builtins,
                ...proxyAPIs,
                ...limitedAPIs
            });
            if (this.keepAlive != true) {
                this.close(0);
                return {
                    exitCode: 0,
                    evaluation: result ?? null
                };
            } else {
                return new Promise(resolve => this.kill = () => {
                    this.close(0);
                    resolve({
                        exitCode: 0,
                        evaluation: result ?? null
                    });
                });
            }
        } catch (e) {
            this.proxyConsole.error(e);
            this.close(1);
            return {
                exitCode: 1,
                evaluation: null,
                error: e instanceof Error ? e.message : String(e)
            }
        }
    }

    async runFile(file, envParams = {}) {
        if (!this[alive]) return;
        if (!/^[A-Za-z]:\//gi.test(file)) throw new Error(`Invalid path : ${file}`);
        if (typeof envParams !== 'object' || Object.prototype.toString.call(envParams) !== '[object Object]') throw new Error('envParams must be an object');
        if (this[hasRun] == true) throw new Error('The runFile function can only be called once.');

        this[hasRun] = true;
        this[WApplicationPath] = file;

        try {
            const code = await fs.getFileAsText(file);
            const result = await this.runCode(code, {
                ...envParams,
                __dirname: fsUtils.dirname(file),
                __filename: file
            });
            this.close(0);
            return result;
        } catch (e) {
            this.proxyConsole.error(e);
            this.close(1);
            return {
                exitCode: 1,
                evaluation: null,
                error: e instanceof Error ? e.message : String(e)
            }
        }
    }

    exposeAPIs(envParams = {}) {
        const module = { exports: {} };
        const currentDir = envParams.__dirname || this.cwd;
        const filePath = envParams.__filename || '<anonymous>';

        const builtins = {
            ...this.getDefaultBuiltins(currentDir), // Default variables
            exports: module.exports,
            module,
            fs: IDBFS(filePath, currentDir),
            __filename: filePath,
            __dirname: currentDir
        };
        const proxyAPIs = this.getProxyAPIs();
        const limitedAPIs = this.getLimitedAPIs();

        this[fss].add(builtins.fs);

        return {
            ...envParams,
            ...builtins,
            ...proxyAPIs,
            ...limitedAPIs
        }
    }

    close(code) {
        this[alive] = false;
        this[process].exit(code);
    }

    defaultCwd = 'C:/'
}

export { WinbowsNodejsRuntime as WRT, tasklist };