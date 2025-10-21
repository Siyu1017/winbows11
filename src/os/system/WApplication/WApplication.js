import ModuleManager from "../../moduleManager.js";
import { BrowserWindow } from "./browserWindow.js";
import { EventEmitter } from "../../../shared/utils.js";
import { IDBFS } from "../../../shared/fs.js";
import appRegistry from "../appRegistry.js";

const fs = IDBFS('~SYSTEM');

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
        constructor(config = {}) {
            super();

            this.config = config;
        }

        async load(path) {
            const filePath = fsUtils.resolve(ctx.__dirname, path);
            const code = await fs.readFileAsText(filePath);

            const WRT = ModuleManager.get('WRT');
            this.browserWindowObj = new BrowserWindow(this.config);
            this.wrt = new WRT({
                code,
                __filename: filePath,
                options: {
                    keepAlive: true,
                    subProcess: true
                },
                argv: ctx.process.argv.slice(2) || []
            })
            this.wrt.on('change:process.title', (e) => {
                this.browserWindowObj.changeTitle(e.value);
            })

            // Add the window object to the parent WRT
            ctx.__Module_WApplication_Windows__.push(this.browserWindowObj);

            const WindowManager = ModuleManager.get('WindowManager');
            const IconManager = ModuleManager.get('IconManager');
            const appName = this.config.appName || appRegistry.getInfoByPath(ctx.__filename)?.appName;
            const appData = appRegistry.generateProfile(appName || '', ctx.__dirname, ctx.__filename);
            const icon = await IconManager.getIcon(appData);
            icon.open(WindowManager.get(this.browserWindowObj.id));

            //this.browserWindowObj.taskbarIconElement = taskbar.getIcon(appRegistry.generateProfile('', ctx.__dirname, ctx.__filename));

            if (mainWindow == null) {
                mainWindow = this.browserWindowObj;
                this.wrt.process.on('exit', () => {
                    resolve?.();
                    mainWindow.close();
                })
            }

            this.browserWindowObj.on('close', () => {
                icon.close(this.browserWindowObj.id);
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
                                return this.browserWindowObj.shadowRoot;
                            case 'documentElement':
                                return this.browserWindowObj.window;
                            case 'body':
                                return this.browserWindowObj.content;
                            case 'write':
                                return () => {
                                    console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                                };
                            case 'addEventListener':
                                return (event, callback) => { this.browserWindowObj.shadowRoot.addEventListener(event, callback) };
                            case 'removeEventListener':
                                return (event, callback) => { this.browserWindowObj.shadowRoot.removeEventListener(event, callback) };
                            case 'querySelector':
                                return (selector) => { return this.browserWindowObj.shadowRoot.querySelector(selector) };
                            case 'querySelectorAll':
                                return (selector) => { return this.browserWindowObj.shadowRoot.querySelectorAll(selector) };
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
                api: this.browserWindowObj
            })

            this.wrt.main();
        }
    }

    return { app, BrowserWindow: ProxyBrowserWindow };
}

export default { register }