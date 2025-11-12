import ModuleManager from "../../moduleManager.js";
import { BrowserWindow } from "./browserWindow.js";
import { EventEmitter } from "../../../shared/utils.ts";
import { IDBFS } from "../../../shared/fs.js";
import appRegistry from "../appRegistry.js";

const fs = IDBFS('~SYSTEM');
const IS_BROWSER_WINDOW = 'SM.WAPPLICATION.IS_BROWSER_WINDOW';
const _WINDOW_CONFIG = Symbol("WINDOW_CONFIG");
const _OPTIONS = Symbol('OPTIONS');
const _TYPE_SELECTED = Symbol("TYPE_SELECTED");
const _BROWSER_WINDOW_OBJ = Symbol("BROWSER_WINDOW_OBJ");

/**
 * @param {WRT} ctx 
 * @returns 
 */
function register(ctx) {
    let resolve, reject, mainWindow = null;

    ctx.__Module_WApplication_Windows__ = [];
    ctx.process.on('exit', () => {
        ctx.__Module_WApplication_Windows__.forEach(win => {
            win.close();
        })
    })

    const processData = appRegistry.getInfoByPath(ctx.__filename);

    const app = {
        _cbs: {},
        on: (evt, cb) => {
            if (!app._cbs[evt]) app._cbs[evt] = [];
            app._cbs[evt].push(cb);
        },
        executeAsync: async () => {
            app._cbs['ready']?.forEach((cb) => cb())
            return new Promise((rs, rj) => {
                resolve = rs;
                reject = rj;
                //browserWindow.setPromise(rs, rj);
            });
        }
    }

    class ProxyBrowserWindow extends EventEmitter {
        constructor(windowConfig = {}, options = {}) {
            super();

            this[_WINDOW_CONFIG] = windowConfig;
            this[_OPTIONS] = options;
            this[_TYPE_SELECTED] = false;

            this.wrt = null;
            this.browserWindow = null;
        }

        async expose() {
            if (this[_TYPE_SELECTED] !== false) return;
            this[_TYPE_SELECTED] = true;

            this[_WINDOW_CONFIG].type = 'sub-window';
            this.browserWindow = new BrowserWindow(this[_WINDOW_CONFIG]);
            ctx.__Module_WApplication_Windows__.push(this.browserWindow);

            return {
                browserWindow: this.browserWindow,
                document: new Proxy(document, {
                    get: (target, prop) => {
                        switch (prop) {
                            case 'damn':
                                return 'Damn!';
                            case 'head':
                                return this.browserWindow.shadowRoot;
                            case 'documentElement':
                                return this.browserWindow.window;
                            case 'body':
                                return this.browserWindow.content;
                            case 'write':
                                return () => {
                                    console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                                };
                            case 'addEventListener':
                                return (event, callback) => { this.browserWindow.shadowRoot.addEventListener(event, callback) };
                            case 'removeEventListener':
                                return (event, callback) => { this.browserWindow.shadowRoot.removeEventListener(event, callback) };
                            case 'querySelector':
                                return (selector) => { return this.browserWindow.shadowRoot.querySelector(selector) };
                            case 'querySelectorAll':
                                return (selector) => { return this.browserWindow.shadowRoot.querySelectorAll(selector) };
                            default:
                                if (target[prop]) {
                                    const value = Reflect.get(target, prop);
                                    return typeof value === 'function' ? value.bind(document) : value;
                                } else {
                                    return undefined;
                                }
                        }
                    }
                })
            };
        }

        async load(path) {
            if (this[_TYPE_SELECTED] !== false) return;
            this[_TYPE_SELECTED] = true;

            const filePath = fsUtils.resolve(ctx.__dirname, path);
            const code = await fs.readFileAsText(filePath);
            const WRT = ModuleManager.get('WRT');
            const WindowManager = ModuleManager.get('WindowManager');
            const IconManager = ModuleManager.get('IconManager');
            const appName = this[_WINDOW_CONFIG].appName || appRegistry.getInfoByPath(ctx.__filename)?.appName;
            const appData = appRegistry.generateProfile(appName || '', ctx.__dirname, ctx.__filename);
            const icon = await IconManager.getIcon(appData);

            this[_WINDOW_CONFIG].__filename = ctx.__filename;
            if (mainWindow !== null || ctx.process.env[IS_BROWSER_WINDOW] === 'true') {
                this[_WINDOW_CONFIG].type = 'sub-window';
            }

            // Browser Window
            this.browserWindow = new BrowserWindow(this[_WINDOW_CONFIG]);
            icon.open(WindowManager.get(this.browserWindow.id));

            // Runtime
            this.wrt = new WRT({
                code,
                __filename: filePath,
                options: {
                    keepAlive: true,
                    subProcess: true
                },
                type: 'gui',
                argv: ctx.process.argv.slice(2) || [],
                caller: ctx.runtimeID
            })

            try {
                if (Object.keys(this[_OPTIONS]?.env || {}).length > 0) {
                    this.wrt.process.env = {
                        ...this[_OPTIONS].env,
                        ...this.wrt.process.env
                    }
                }
            } catch (e) { }

            this.wrt.process.env[IS_BROWSER_WINDOW] = 'true';

            let self = false;
            this.wrt.on('change:process.title', (e) => {
                if (self == true) return self = false;
                this.browserWindow.changeTitle(e.value);
                self = true;
            })
            this.browserWindow.on('change:title', (e) => {
                this.wrt.process.title = e.value;
                self = true;
            })

            if (processData?.icon) {
                fs.getFileURL(processData.icon).then(url => {
                    this.browserWindow.changeIcon(url);
                })
            }

            // Add the window object to the parent WRT
            ctx.__Module_WApplication_Windows__.push(this.browserWindow);

            //this.browserWindow.taskbarIconElement = taskbar.getIcon(appRegistry.generateProfile('', ctx.__dirname, ctx.__filename));

            if (mainWindow == null && this[_WINDOW_CONFIG].type !== 'sub-window') {
                mainWindow = this.browserWindow;
            }

            this.wrt.process.on('exit', () => {
                this.browserWindow.close();
                resolve?.();
            })

            this.browserWindow.on('close', () => {
                icon.close(this.browserWindow.id);
                if (this.wrt.alive) {
                    this.wrt.process.exit();
                }
            })

            // Proxy document
            this.wrt.mountAPI({
                name: 'document',
                api: new Proxy(document, {
                    get: (target, prop) => {
                        switch (prop) {
                            case 'damn':
                                return 'Damn!';
                            case 'head':
                                return this.browserWindow.shadowRoot;
                            case 'documentElement':
                                return this.browserWindow.window;
                            case 'body':
                                return this.browserWindow.content;
                            case 'write':
                                return () => {
                                    console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                                };
                            case 'addEventListener':
                                return (event, callback) => { this.browserWindow.shadowRoot.addEventListener(event, callback) };
                            case 'removeEventListener':
                                return (event, callback) => { this.browserWindow.shadowRoot.removeEventListener(event, callback) };
                            case 'querySelector':
                                return (selector) => { return this.browserWindow.shadowRoot.querySelector(selector) };
                            case 'querySelectorAll':
                                return (selector) => { return this.browserWindow.shadowRoot.querySelectorAll(selector) };
                            default:
                                if (target[prop]) {
                                    const value = Reflect.get(target, prop);
                                    return typeof value === 'function' ? value.bind(document) : value;
                                } else {
                                    return undefined;
                                }
                        }
                    }
                })
            })

            // browserWindow obj
            this.wrt.mountAPI({
                name: 'browserWindow',
                api: this.browserWindow
            })

            this.wrt.main();
        }
    }

    return { app, BrowserWindow: ProxyBrowserWindow };
}

export default { register }