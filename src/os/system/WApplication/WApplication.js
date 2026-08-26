import ModuleManager from "../../moduleManager.js";
import { BrowserWindow } from "./browserWindow.js";
import { EventEmitter } from "../../../shared/utils.ts";
import pathUtils from "../../fs/path.ts";
import { getFileURL } from "../../fs/fileUrl.ts";
import { createSystemFS } from "../../fs/systemFs.ts";
import appRegistry from "../appRegistry.js";

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
    let fs = ctx.fs;
    const getFs = async () => fs ??= await createSystemFS(ctx.process?.cwd?.() ?? ctx.__dirname ?? 'C:/');

    const assertProcessAlive = () => {
        if (ctx.alive !== true || ctx.process?.alive !== true) {
            throw new Error('Cannot create a BrowserWindow after its process has exited');
        }
    };

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

            assertProcessAlive();

            this[_WINDOW_CONFIG] = windowConfig;
            this[_OPTIONS] = options;
            this[_TYPE_SELECTED] = false;

            this.wrt = null;
            this.browserWindow = null;
        }

        async expose() {
            assertProcessAlive();
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
                            case 'getElementById':
                                return (id) => this.browserWindow.shadowRoot.getElementById(id);
                            case 'getElementsByClassName':
                                return (className) => this.browserWindow.shadowRoot.getElementsByClassName(className);
                            case 'getElementsByTagName':
                                return (tagName) => this.browserWindow.shadowRoot.getElementsByTagName(tagName);
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
            assertProcessAlive();
            if (this[_TYPE_SELECTED] !== false) return;
            this[_TYPE_SELECTED] = true;

            const fs = await getFs();
            const filePath = pathUtils.resolve(ctx.__dirname, path);
            const isHTML = /\.html?$/i.test(filePath);
            const source = await fs.readFile(filePath, 'utf-8');
            assertProcessAlive();

            let code = source;
            let htmlContent = null;
            let htmlStyles = [];
            let externalScripts = [];
            if (isHTML) {
                const isVFSPath = (value) => value.startsWith('/');
                const isExternalURL = (value) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) && !isVFSPath(value);
                const resolveResourcePath = (value) => isVFSPath(value)
                    ? value
                    : pathUtils.resolve(pathUtils.dirname(filePath), value);
                const rewriteCSSURLs = async (css) => {
                    const urls = [...css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)];
                    let rewritten = '';
                    let cursor = 0;
                    for (const match of urls) {
                        const resource = match[2].trim();
                        let replacement = match[0];
                        if (resource && !/^(?:data:|#)/i.test(resource) && !isExternalURL(resource)) {
                            const resourcePath = resolveResourcePath(resource);
                            try { replacement = `url("${await getFileURL(fs, resourcePath)}")`; } catch { }
                        }
                        rewritten += css.slice(cursor, match.index) + replacement;
                        cursor = match.index + match[0].length;
                    }
                    return rewritten + css.slice(cursor);
                };
                const template = document.createElement('template');
                template.innerHTML = source;
                const scripts = [...template.content.querySelectorAll('script')];
                const scriptSources = [];
                const rendererExternalScripts = [];

                for (const script of scripts) {
                    const src = script.getAttribute('src');
                    if (src) {
                        if (isExternalURL(src)) {
                            rendererExternalScripts.push(src);
                        } else {
                            const scriptPath = resolveResourcePath(src);
                            scriptSources.push(await fs.readFile(scriptPath, 'utf-8'));
                        }
                    } else {
                        scriptSources.push(script.textContent || '');
                    }
                    script.remove();
                }

                for (const style of template.content.querySelectorAll('style')) {
                    style.textContent = await rewriteCSSURLs(style.textContent || '');
                }

                for (const element of template.content.querySelectorAll('[style]')) {
                    element.setAttribute('style', await rewriteCSSURLs(element.getAttribute('style') || ''));
                }

                for (const stylesheet of [...template.content.querySelectorAll('link[rel~="stylesheet"][href]')]) {
                    const href = stylesheet.getAttribute('href');
                    if (!href || isExternalURL(href)) continue;
                    const stylesheetPath = resolveResourcePath(href);
                    try {
                        const style = document.createElement('style');
                        style.textContent = await rewriteCSSURLs(await fs.readFile(stylesheetPath, 'utf-8'));
                        stylesheet.replaceWith(style);
                    } catch { /* retain an intentionally external/missing stylesheet */ }
                }

                // Stylesheets must live in the BrowserWindow Shadow Root. Styles
                // attached to the host page cannot cross that boundary, and styles
                // left inside an HTML document's head are not consistently applied
                // after the document is rendered as a fragment.
                htmlStyles = [...template.content.querySelectorAll('style, link[rel~="stylesheet"]')];
                htmlStyles.forEach(style => style.remove());

                const resourceElements = [...template.content.querySelectorAll('[src], link[href]')];
                for (const element of resourceElements) {
                    const attribute = element.hasAttribute('src') ? 'src' : 'href';
                    const resource = element.getAttribute(attribute);
                    if (!resource || isExternalURL(resource) || resource.startsWith('#')) continue;

                    const resourcePath = resolveResourcePath(resource);
                    try { element.setAttribute(attribute, await getFileURL(fs, resourcePath)); } catch { }
                }

                code = scriptSources.join('\n');
                htmlContent = template.content;
                externalScripts = rendererExternalScripts;
                assertProcessAlive();
            }
            const WRT = ModuleManager.get('WRT');
            const WindowManager = ModuleManager.get('WindowManager');
            const IconManager = ModuleManager.get('IconManager');
            const appName = this[_WINDOW_CONFIG].appName || appRegistry.getInfoByPath(ctx.__filename)?.appName;
            const appData = appRegistry.generateProfile(appName || '', ctx.__dirname, ctx.__filename);
            const icon = await IconManager.getIcon(appData);
            assertProcessAlive();

            this[_WINDOW_CONFIG].__filename = ctx.__filename;
            if (this[_WINDOW_CONFIG].type === 'popup') {
                this[_WINDOW_CONFIG].modal ??= true;
                this[_WINDOW_CONFIG].parentWindow ??= mainWindow;
            } else if (mainWindow !== null || ctx.process.env[IS_BROWSER_WINDOW] === 'true') {
                this[_WINDOW_CONFIG].type = 'sub-window';
            } else {
                this[_WINDOW_CONFIG].type = 'main-window';
            }

            // Browser Window
            assertProcessAlive();
            this.browserWindow = new BrowserWindow(this[_WINDOW_CONFIG]);
            ctx.__Module_WApplication_Windows__.push(this.browserWindow);
            icon.open(WindowManager.get(this.browserWindow.id));

            if (htmlContent) {
                htmlStyles.forEach(style => this.browserWindow.shadowRoot.appendChild(style));
                this.browserWindow.content.replaceChildren(htmlContent);
                for (const src of externalScripts) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = src;
                        script.onload = resolve;
                        script.onerror = () => reject(new Error(`Failed to load external script: ${src}`));
                        this.browserWindow.content.appendChild(script);
                    });
                }
                assertProcessAlive();
            }

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
                getFileURL(fs, processData.icon).then(url => {
                    this.browserWindow.changeIcon(url);
                })
            }

            //this.browserWindow.taskbarIconElement = taskbar.getIcon(appRegistry.generateProfile('', ctx.__dirname, ctx.__filename));

            if (mainWindow == null && this[_WINDOW_CONFIG].type === 'main-window') {
                mainWindow = this.browserWindow;
            }

            Object.defineProperty(this.browserWindow, 'type', {
                value: this[_WINDOW_CONFIG].type,
                writable: false,
                configurable: false
            })

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
                            case 'getElementById':
                                return (id) => this.browserWindow.shadowRoot.getElementById(id);
                            case 'getElementsByClassName':
                                return (className) => this.browserWindow.shadowRoot.getElementsByClassName(className);
                            case 'getElementsByTagName':
                                return (tagName) => this.browserWindow.shadowRoot.getElementsByTagName(tagName);
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

        loadFile(path) {
            return this.load(path);
        }

        close() {
            this.wrt.kill();
        }
    }

    return { app, BrowserWindow: ProxyBrowserWindow };
}

export default { register }
