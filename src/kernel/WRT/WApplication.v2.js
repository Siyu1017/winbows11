import WinUI from "../../ui/winui.js";
import { WRT } from "./kernel.js";
import * as utils from "../../utils.js";
import { IDBFS, fsUtils } from "../../lib/fs.js";
import { EventEmitter } from "./utils/eventEmitter.js";
import viewport from "../viewport.js";
import { appRegistry } from "../appRegistry.js";
import { System } from "../system.js";
import WindowManager from "../windowManager.js";

const fs = IDBFS("~WRT");
const { appWrapper, screenElement } = viewport;
const snapMargin = 12;

let browserWindowPosition = {};
export let maxZIndex = 0;

const snapPreview = document.createElement('div');
snapPreview.className = 'browser-window-snap-preview';
appWrapper.appendChild(snapPreview);

function cubicBezier(p1x, p1y, p2x, p2y) {
    return function (t) {
        const cx = 3 * p1x;
        const bx = 3 * (p2x - p1x) - cx;
        const ax = 1 - cx - bx;

        const cy = 3 * p1y;
        const by = 3 * (p2y - p1y) - cy;
        const ay = 1 - cy - by;

        const x = ((ax * t + bx) * t + cx) * t;
        const y = ((ay * t + by) * t + cy) * t;

        return y;
    };
}

function getMaxZIndex() {
    return String(0);
}

const events = {
    "start": ["mousedown", "touchstart", "pointerdown"],
    "move": ["mousemove", "touchmove", "pointermove"],
    "end": ["mouseup", "touchend", "pointerup", "blur"]
}
const animateProfiles = {
    'window-show': {
        func: cubicBezier(.04, .73, .16, 1),
        duration: 150
    },
    'window-hide': {
        func: cubicBezier(.77, -0.02, .98, .59),
        duration: 150
    },
    'window-open': {
        func: cubicBezier(.42, 0, .58, 1),
        duration: 100
    },
    'window-close': {
        func: cubicBezier(.42, 0, .58, 1),
        duration: 100
    }
};
const icons = {
    close: await fs.getFileURL('C:/Winbows/icons/controls/close.png'),
    minimize: await fs.getFileURL('C:/Winbows/icons/controls/minimize.png'),
    maxmin: await fs.getFileURL('C:/Winbows/icons/controls/maxmin.png'),
    maximize: await fs.getFileURL('C:/Winbows/icons/controls/maximize.png')
}
const defaultStyle = await fs.getFileURL('C:/Winbows/System/styles/app.css');
const resizerConfig = {
    'browser-window-resizer-top': 'vertical',
    'browser-window-resizer-bottom': 'vertical',
    'browser-window-resizer-left': 'horizontal',
    'browser-window-resizer-right': 'horizontal',
    'browser-window-resizer-right-top': 'both',
    'browser-window-resizer-right-bottom': 'both',
    'browser-window-resizer-left-bottom': 'both',
    'browser-window-resizer-left-top': 'both'
}

function decompose2DMatrix(matrixStr) {
    const match = matrixStr.match(/matrix\(([^)]+)\)/);
    if (!match) throw new Error("Not a valid 2D matrix");

    const [a, b, c, d, e, f] = match[1].split(',').map(parseFloat);

    const scaleX = Math.sqrt(a * a + b * b);
    const scaleY = Math.sqrt(c * c + d * d);

    const rotation = Math.atan2(b, a) * (180 / Math.PI);

    const skewX = Math.atan2(a * c + b * d, scaleX * scaleX) * (180 / Math.PI);

    return {
        translateX: e,
        translateY: f,
        scaleX,
        scaleY,
        rotation,
        skewX
    };
}

function getSnapSide(x, y) {
    let side = '';
    if (y >= appWrapper.offsetHeight - snapMargin) {
        side += 'b';
    } else if (y <= snapMargin) {
        side += 't';
    }
    if (x >= appWrapper.offsetWidth - snapMargin) {
        side += 'r';
    } else if (x <= snapMargin) {
        side += 'l';
    }
    if (side.length == 1) {
        side += 'f';
    }
    if (side.includes('b') && side.includes('f')) {
        return '';
    }
    return side;
}

function getSnapSize(side) {
    var width = 'var(--viewport-width)';
    var height = 'calc(var(--viewport-height) - var(--taskbar-height))';
    if (side.includes('l') || side.includes('r')) {
        width = 'calc(var(--viewport-width) / 2)';
    }
    if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
        height = 'calc((var(--viewport-height) - var(--taskbar-height)) / 2)';
    }
    return {
        width: width,
        height: height
    }
}

function getSnapPosition(side) {
    var left = '0';
    var top = '0';
    if (side.includes('r')) {
        left = 'calc(var(--viewport-width) / 2)';
    }
    if (side.includes('b')) {
        top = 'calc((var(--viewport-height) - var(--taskbar-height)) / 2)';
    }
    return {
        left: left,
        top: top
    }
}

function getSnapPreviewSize(side) {
    var width = appWrapper.offsetWidth - snapMargin * 2;
    var height = appWrapper.offsetHeight - snapMargin * 2;
    if (side.includes('l') || side.includes('r')) {
        width = appWrapper.offsetWidth / 2 - snapMargin * 2;
    }
    if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
        height = appWrapper.offsetHeight / 2 - snapMargin * 2;
    }
    return {
        width: width,
        height: height
    }
}

function getSnapPreviewPosition(side) {
    var left = snapMargin;
    var top = snapMargin;
    if (side.includes('r')) {
        left = appWrapper.offsetWidth / 2 + snapMargin;
    }
    if (side.includes('b')) {
        top = appWrapper.offsetHeight / 2 + snapMargin;
    }
    return {
        left: left,
        top: top
    }
}

/**
 * 
 * @param {*} path 
 * @param {WRT} ctx 
 * @returns 
 */
export async function register(path, ctx) {
    let resolve, reject, mainWindow = null;

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

            this.browserWindowObj = new BrowserWindow(config);
            this.wrt = new WRT(WRT.defaultCwd, {
                keepAlive: true,
                subProcess: true
            })
            ctx.windows.push(this.browserWindowObj);

            if (mainWindow == null) {
                mainWindow = this.browserWindowObj;
                this.wrt.process.on('exit', () => {
                    resolve?.();
                })
            }
        }

        async load(path) {
            const filePath = fsUtils.resolve(ctx.__dirname, path);
            let code = await fs.getFileAsText(filePath);
            code = `const {document,browserWindow}=this;\n${code}`;
            this.browserWindowObj.on('close', () => {
                this.wrt.close();
            })
            this.wrt.runCode(code, {
                __filename: filePath,
                // Proxy document
                document: new Proxy(document, {
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
                }),
                // browserWindow
                browserWindow: this.browserWindowObj
            });
        }
    }

    return { app, BrowserWindow: ProxyBrowserWindow };
}

export class BrowserWindow extends EventEmitter {
    constructor(config = {}) {
        super();

        // Status
        this.isMaximized = false;
        this.isMinimized = false;
        this.immovableElements = [];
        this.originalSnapSide = '';
        this.originalPosition = {};
        this.pointerDown = false;
        this.pointerMoved = false;
        this.pointerPosition = [];
        this.snapSide = '';
        this.showSnapPreview = false;

        // Elements
        this.container = document.createElement('div');
        this.micaElement = document.createElement('div');
        this.windowElement = document.createElement('div');
        this.resizerContainer = document.createElement('div');
        this.windowContent = document.createElement('div');
        this.shadowRoot = this.windowContent.attachShadow({ mode: 'open' });

        // Toolbar
        this.toolbarInfo = document.createElement('div');
        this.toolbarIcon = document.createElement('div');
        this.toolbarTitle = document.createElement('div');
        this.toolbarButtons = document.createElement('div');
        this.minimizeButton = document.createElement('div');
        this.minimizeImage = document.createElement('div');
        this.maximizeButton = document.createElement('div');
        this.maximizeImage = document.createElement('div');
        this.closeButton = document.createElement('div');
        this.closeImage = document.createElement('div');

        // Browser Window
        this.browserWindow = {
            window: document.createElement('div'),
            toolbar: document.createElement('div'),
            content: document.createElement('div')
        }
        this.taskbarIconElement = document.createElement('div');    // TODO: 

        // Options
        this.resizable = config.resizable ?? true;
        this.minimizable = config.minimizable ?? true;
        this.maximizable = config.maximizable ?? true;
        this.closable = config.closable ?? true;
        this.snappable = config.snappable ?? true;
        this.fullscreenable = config.fullscreenable ?? true;
        this.mica = config.mica ?? false;
        this.showOnTop = config.showOnTop ?? false;
        this.theme = config.theme ?? 'light';

        this.minWidth = config.minWidth ?? 300;
        this.minHeight = config.minHeight ?? 180;
        this.width = config.width ?? 800;
        this.height = config.height ?? 600;
        this.realWidth = this.width;
        this.realHeight = this.height;

        if (this.realWidth < this.minWidth) {
            this.realWidth = this.minWidth;
        }
        if (this.realHeight < this.minHeight) {
            this.realHeight = this.minHeight;
        }

        this.x = (config.x == 'center' || !config.x) ? viewport.width / 2 - this.realWidth / 2 : config.x;
        this.y = (config.y == 'center' || !config.y) ? viewport.height / 2 - this.realHeight / 2 : config.y;
        this.icon = config.icon ?? '';
        this.title = config.title ?? 'App';

        if (!config.x && !config.y && browserWindowPosition['caller']) {
            // Restore previous position
            this.x = browserWindowPosition['caller'][0];
            this.y = browserWindowPosition['caller'][1];
        }

        // Container
        this.container.className = 'browser-window-container';
        this.micaElement.className = 'browser-window-mica';
        this.windowElement.className = 'broser-window';
        this.resizerContainer.className = 'browser-window-resizers';
        this.windowContent.className = 'browser-window-content';

        maxZIndex++;
        this.container.style.zIndex = maxZIndex;
        this.container.style.transition = 'none';
        this.container.style.transform = `translate(${this.x}px,${this.y}px)`;

        this.container.appendChild(this.micaElement);
        this.container.appendChild(this.windowElement);
        this.windowElement.appendChild(this.resizerContainer);
        this.windowElement.appendChild(this.windowContent);

        // Inside Shadow Root
        this.browserWindow.window.className = 'window';
        this.browserWindow.toolbar.className = 'window-toolbar';
        this.browserWindow.content.className = 'window-content';

        this.shadowRoot.appendChild(this.browserWindow.window);
        this.browserWindow.window.appendChild(this.browserWindow.toolbar);
        this.browserWindow.window.appendChild(this.browserWindow.content);

        if (this.showOnTop == true) {
            screenElement.appendChild(this.container);
        } else {
            appWrapper.appendChild(this.container);
        }

        // Animation Data
        this.animationData = {
            from: {
                x: this.x,
                y: this.y,
                scaleX: .9,
                scaleY: .9,
                opacity: 0,
                ts: Date.now()
            },
            to: {
                x: this.x,
                y: this.y,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                ts: Date.now() + 100
            },
            isRunning: false,
            profile: {
                func: cubicBezier(.42, 0, .58, 1),
                duration: 100
            }
        };

        // Load style 
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = defaultStyle;
        this.shadowRoot.appendChild(style);

        // Mica Effect
        if (this.mica == true) {
            const observer = new ResizeObserver(this.updateMica);
            observer.observe(this.container);
            window.addEventListener('resize', this.updateMica);

            this.container.classList.add('mica');
        }

        // Resizers
        if (this.resizable == true) {
            // Resizers
            Object.keys(resizerConfig).forEach(key => {
                const allowed = resizerConfig[key];
                const resizer = document.createElement('div');
                resizer.className = key;

                let pointerDown = false;
                let pointerPosition = {};
                let originalPosition = {};
                let originalSize = {};

                const updateSizeAndData = (e) => {
                    const width = originalSize.width;
                    const height = originalSize.height;
                    const boundary = 6;
                    let position = utils.getPointerPosition(e);

                    if (position.x + boundary > viewport.width) position.x = viewport.width - boundary;
                    if (position.x < boundary) position.x = boundary;
                    if (position.y + boundary > viewport.height) position.y = viewport.height - boundary;
                    if (position.y < boundary) position.y = boundary;

                    let diffX = position.x - pointerPosition.x;
                    let diffY = position.y - pointerPosition.y;

                    if (allowed == 'vertical') {
                        diffX = 0;
                    } else if (allowed == 'horizontal') {
                        diffY = 0;
                    }

                    let translateX = originalPosition.x;
                    let translateY = originalPosition.y;

                    if (key.search('top') > -1) {
                        this.height = height - diffY;
                    } else if (key.search('bottom') > -1) {
                        this.height = height + diffY;
                    }

                    if (key.search('left') > -1) {
                        this.width = width - diffX;
                    } else if (key.search('right') > -1) {
                        this.width = width + diffX;
                    }

                    this.realWidth = this.width;
                    this.realHeight = this.height;
                    if (this.realWidth < this.minWidth) {
                        diffX = originalPosition.x + (width - this.minWidth);
                        this.realWidth = this.minWidth;
                    }
                    if (this.realHeight < this.minHeight) {
                        diffY = originalPosition.y + (height - this.minHeight);
                        this.realHeight = this.minHeight;
                    }
                    this.browserWindow.window.style.width = this.realWidth + 'px';
                    this.browserWindow.window.style.height = this.realHeight + 'px';

                    if (key.search('top') > -1) {
                        if (this.height >= this.minHeight) {
                            translateY += diffY;
                        } else {
                            translateY = diffY;
                        }
                    }
                    if (key.search('left') > -1) {
                        if (this.width >= this.minWidth) {
                            translateX += diffX;
                        } else {
                            translateX = diffX;
                        }
                    }

                    /*
                    // For vertical resize
                    if (key.search('top') > -1) {
                        // Fixate bottom
                        translateY += diffY;
                        this.browserWindow.window.style.height = height - diffY + 'px';
                        this.height = height - diffY;
                    } else if (key.search('bottom') > -1) {
                        // Fixate top
                        this.browserWindow.window.style.height = height + diffY + 'px';
                        this.height = height + diffY;
                    }

                    // For horizontal resize
                    if (key.search('left') > -1) {
                        // Fixate right
                        translateX += diffX;
                        this.browserWindow.window.style.width = width - diffX + 'px';
                        this.width = width - diffX;
                    } else {
                        // Fixate left
                        this.browserWindow.window.style.width = width + diffX + 'px';
                        this.width = width + diffX;
                    }*/

                    this.x = translateX;
                    this.y = translateY;

                    this.container.style.transition = 'none';
                    this.container.style.transform = `translate(${this.x}px,${this.y}px)`;
                }

                const handleStartResizing = (e) => {
                    if (this.isMaximized == true) return;
                    pointerPosition = utils.getPointerPosition(e);
                    originalPosition = {
                        x: this.x,
                        y: this.y
                    }
                    originalSize = {
                        width: this.realWidth,
                        height: this.realHeight
                    }
                    appWrapper.classList.add('moving');
                    pointerDown = true;
                    if (this.mica == true) {
                        this.updateMica();
                    }
                }

                const handleMoveResizing = (e) => {
                    if (pointerDown == true) {
                        try {
                            document.getSelection().removeAllRanges();
                        } catch (e) { };
                        updateSizeAndData(e);
                        if (this.mica == true) {
                            this.updateMica();
                        }
                    }
                }

                const handleEndResizing = (e) => {
                    if (pointerDown == false) return;
                    updateSizeAndData(e);
                    pointerDown = false;
                    appWrapper.classList.remove('moving');
                    if (this.mica == true) {
                        this.updateMica();
                    }
                }

                events.start.forEach(event => {
                    resizer.addEventListener(event, handleStartResizing);
                })
                events.move.forEach(event => {
                    window.addEventListener(event, handleMoveResizing);
                })
                events.end.forEach(event => {
                    window.addEventListener(event, handleEndResizing);
                })

                this.resizerContainer.appendChild(resizer);
            })
        } else {
            this.resizerContainer.remove();
        }

        // Open window with animation
        this.container.style.transition = 'none';
        this.animate({
            from: {
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            },
            to: {
                x: this.x,
                y: this.y,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
            },
            profile: 'window-open'
        });
        this.updateMica();

        // Default toolbar
        this.toolbarInfo.className = 'window-toolbar-info';
        this.toolbarIcon.className = 'window-toolbar-icon';
        this.toolbarTitle.className = 'window-toolbar-title';
        this.toolbarButtons.className = 'window-toolbar-buttons';
        this.minimizeButton.className = 'window-toolbar-button';
        this.maximizeButton.className = 'window-toolbar-button';
        this.closeButton.className = 'window-toolbar-button close';
        this.minimizeImage.className = 'window-toolbar-button-icon';
        this.maximizeImage.className = 'window-toolbar-button-icon';
        this.closeImage.className = 'window-toolbar-button-icon';

        // Load icon image
        fs.getFileURL(this.icon || appRegistry.getIcon(''))
            .then(url => {
                this.toolbarIcon.style.backgroundImage = `url(${url})`;
            });

        this.toolbarTitle.innerHTML = utils.replaceHTMLTags(this.title);
        this.minimizeImage.style.backgroundImage = `url(${icons.minimize})`;
        this.maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
        this.closeImage.style.backgroundImage = `url(${icons.close})`;

        this.minimizeButton.addEventListener('click', () => {
            this.minimize();
        });
        this.closeButton.addEventListener('click', () => {
            this.close();
        });
        this.maximizeButton.addEventListener('click', () => {
            if (this.isMaximized == false) {
                this.maximizeWindow();
            } else {
                this.unmaximizeWindow();
            }
        });

        this.minimizeButton.appendChild(this.minimizeImage);
        this.maximizeButton.appendChild(this.maximizeImage);
        this.closeButton.appendChild(this.closeImage);
        this.toolbarButtons.appendChild(this.minimizeButton);
        this.toolbarButtons.appendChild(this.maximizeButton);
        this.toolbarButtons.appendChild(this.closeButton);
        this.toolbarInfo.appendChild(this.toolbarIcon);
        this.toolbarInfo.appendChild(this.toolbarTitle);
        this.browserWindow.toolbar.appendChild(this.toolbarInfo);
        this.browserWindow.toolbar.appendChild(this.toolbarButtons);

        // Toolbar menu
        const toolbarMenu = WinUI.contextMenu([]);
        toolbarMenu.container.style.setProperty('--contextmenu-icon-size', '.58rem');
        toolbarMenu.container.style.setProperty('--contextmenu-expand-size', '.58rem');
        this.browserWindow.toolbar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = utils.getPointerPosition(e);
            toolbarMenu.setItems([
                {
                    className: "restore",
                    icon: "chrome-restore",
                    text: "Restore",
                    disabled: !this.isMaximized == true,
                    action: () => {
                        this.unmaximizeWindow();
                    }
                }, {
                    className: "minimize",
                    icon: "chrome-minimize",
                    text: "Minimize",
                    disabled: this.minimizable == false,
                    action: () => {
                        this.minimize();
                        // update icon status
                    },
                }, {
                    className: "maximize",
                    icon: "chrome-maximize",
                    text: "Maximize",
                    disabled: !(this.isMaximized == false && !this.maximizable == false),
                    action: () => {
                        this.maximizeWindow();
                    },
                }, {
                    type: "separator"
                }, {
                    className: "close",
                    icon: "chrome-close",
                    text: "Close",
                    action: () => {
                        this.close();
                    },
                }
            ]);
            toolbarMenu.open(x, y, 'left-top');
        })
        events.start.forEach(event => {
            window.addEventListener(event, (e) => {
                if (toolbarMenu.container.contains(e.target)) return;
                toolbarMenu.close();
            })
        })

        if (this.minimizable == false) {
            this.minimizeButton.remove();
        }
        if (this.fullscreenable == false || this.maximizable == false) {
            this.maximizeButton.remove();
        }
        if (this.closable == false) {
            this.closeButton.remove();
        }

        this.windowTheme = this.theme == 'system' ? System.theme.get() : this.theme == 'dark' ? 'dark' : 'light';
        this.browserWindow.window.setAttribute('data-theme', this.windowTheme);

        events.start.forEach(event => {
            this.browserWindow.toolbar.addEventListener(event, this.handleStartMoving);
        })
        events.move.forEach(event => {
            window.addEventListener(event, this.handleMoveMoving);
        })
        events.end.forEach(event => {
            window.addEventListener(event, this.handleEndMoving);
        })

        this.container.addEventListener('pointerdown', (e) => {
            this._emit('focus');
        })

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);

        WindowManager.emit('create', this);

        return {
            shadowRoot: this.shadowRoot,
            container: this.container,
            window: this.browserWindow.window,
            toolbar: this.browserWindow.toolbar,
            content: this.browserWindow.content,

            // Methods
            minimize: this.minimize.bind(this),
            maximize: this.maximizeWindow.bind(this),
            unmaximize: this.unmaximizeWindow.bind(this),
            close: this.close.bind(this),
            addEventListener: this.addEventListener.bind(this),
            setTheme: this.setTheme.bind(this),
            getTheme: this.getTheme.bind(this),
            setMovable: this.setMovable.bind(this),
            unsetMovable: this.unsetMovable.bind(this),
            setImmovable: this.setImmovable.bind(this),
            unsetImmovable: this.unsetImmovable.bind(this),
            changeTitle: this.changeTitle.bind(this),
            changeIcon: this.changeIcon.bind(this),
            setSnappable: this.setSnappable.bind(this),
            useTabview: this.useTabview.bind(this),
            on: this.on.bind(this)
        }
    }

    onFocus = () => {
        maxZIndex++;
        this.container.style.zIndex = maxZIndex;
        this.container.style.pointerEvents = 'all';
        this.container.style.visibility = 'visible';
        this.windowContent.style.pointerEvents = 'unset';
    }

    onBlur = () => {

    }

    animate = ({
        from,
        to,
        profile
    }) => {
        if (profile) {
            this.animationData.profile = animateProfiles[profile];
        }
        Object.keys(to).forEach(CSSKey => {
            if (/[A-z]/gi.test(CSSKey[0])) {
                this.animationData.to[CSSKey] = to[CSSKey];
            }
        })
        var cT = getComputedStyle(this.container).transform;
        var cO = getComputedStyle(this.container).opacity;
        var opacity = Number(cO);

        var x = 0, y = 0, scaleX = 1, scaleY = 1;
        if (cT.startsWith("matrix(")) {
            var transform = decompose2DMatrix(cT);
            x = transform.translateX;
            y = transform.translateY;
            scaleX = transform.scaleX;
            scaleY = transform.scaleY;
        }

        if (from) {
            x = from.x || x;
            y = from.y || y;
            scaleX = from.scaleX || scaleX;
            scaleY = from.scaleY || scaleY;
            opacity = from.opacity || opacity;
        }

        const now = Date.now();

        this.animationData.from.x = x;
        this.animationData.from.y = y;
        this.animationData.from.scaleX = scaleX;
        this.animationData.from.scaleY = scaleY;
        this.animationData.from.opacity = opacity;
        this.animationData.from.ts = now;
        this.animationData.to.ts = now + this.animationData.profile.duration;

        if (this.animationData.isRunning == false) {
            this.animateRunner();
        }
    }

    animateRunner = () => {
        this.animationData.isRunning = true;
        const now = Date.now();
        const d = now - this.animationData.from.ts;
        const t = d / this.animationData.profile.duration;
        const p = this.animationData.profile.func(t > 1 ? 1 : t < 0 ? 0 : t);

        this.container.style.transform = `translate(
${this.animationData.from.x + (this.animationData.to.x - this.animationData.from.x) * p}px,
${this.animationData.from.y + (this.animationData.to.y - this.animationData.from.y) * p}px
) scale(
${this.animationData.from.scaleX + (this.animationData.to.scaleX - this.animationData.from.scaleX) * p},
${this.animationData.from.scaleY + (this.animationData.to.scaleY - this.animationData.from.scaleY) * p}
)`;
        this.container.style.opacity = (this.animationData.from.opacity + (this.animationData.to.opacity - this.animationData.from.opacity) * p).toString();

        if (now < this.animationData.to.ts) {
            requestAnimationFrame(this.animateRunner);
        } else {
            this.animationData.isRunning = false;
        }
    }

    handleStartMoving = (e) => {
        if (this.toolbarButtons.contains(e.target)) return;
        for (const element of this.immovableElements) {
            if (element == e.target || element.contains(e.target)) {
                return;
            }
        }
        const pointer = utils.getPointerPosition(e);
        var pageX = pointer.x, pageY = pointer.y;
        if (pageX < 0) {
            pageX = 0;
        } else if (pageX > viewport.width) {
            pageX = viewport.width;
        }
        if (pageY < 0) {
            pageY = 0;
        } else if (pageY > viewport.height) {
            pageY = viewport.height;
        }
        this.pointerDown = true;
        this.pointerMoved = false;

        const position = utils.getPosition(this.container);
        this.pointerPosition = [pageX, pageY];
        this.originalPosition = {
            x: position.x,
            y: position.y
        }
        this._emit('dragstart', {
            preventDefault: () => {
                handleEndMoving({}, 'preventDefault');
            },
            type: e.type,
            target: e.target
        })
        this.updateMica()
    }

    handleMoveMoving = (e) => {
        if (this.pointerDown) {
            try {
                document.getSelection().removeAllRanges();
            } catch (e) { };
            if (this.originalSnapSide != '' || this.isMaximized == true || this.browserWindow.window.offsetWidth != this.realWidth) {
                this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                this.browserWindow.window.style.transition = 'none';
                this.container.removeAttribute('data-maximized');
                this.browserWindow.window.style.width = this.realWidth + 'px';
                this.browserWindow.window.style.height = this.realHeight + 'px';
                this.browserWindow.window.style.borderRadius = 'revert-layer';
                this.maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
                this.isMaximized = false;
                this.originalSnapSide = '';
            }
            const pointer = utils.getPointerPosition(e);
            var pageX = pointer.x, pageY = pointer.y;
            if (pageX != this.pointerPosition[0] || pageY != this.pointerPosition[1]) {
                this.pointerMoved = true;
            }
            if (pageX < 0) {
                pageX = 0;
            } else if (pageX > viewport.width) {
                pageX = viewport.width;
            }
            if (pageY < 0) {
                pageY = 0;
            } else if (pageY > viewport.height) {
                pageY = viewport.height;
            }
            const side = getSnapSide(pageX, pageY);
            appWrapper.classList.add('moving');

            this.container.style.transition = 'none';
            this.container.style.transform = `translate(${this.originalPosition.x + pageX - this.pointerPosition[0]}px,${this.originalPosition.y + pageY - this.pointerPosition[1]}px)`;

            if (this.snappable == false) {
                this.snapSide = '';
            } else {
                if (side != '') {
                    snapPreview.style.position = 'fixed';
                    if (!this.showSnapPreview == true) {
                        snapPreview.style.width = this.container.offsetWidth + 'px';
                        snapPreview.style.height = this.container.offsetHeight + 'px';
                        snapPreview.style.left = utils.getPosition(this.container).x + 'px';
                        snapPreview.style.top = utils.getPosition(this.container).y + 'px';
                        snapPreview.classList.add('active');
                    }
                    const size = getSnapPreviewSize(side);
                    const position = getSnapPreviewPosition(side);
                    snapPreview.style.transition = 'all .15s ease-in-out';
                    snapPreview.style.zIndex = this.container.style.zIndex || maxZIndex;
                    snapPreview.style.left = position.left + 'px';
                    snapPreview.style.top = position.top + 'px';
                    snapPreview.style.width = size.width + 'px';
                    snapPreview.style.height = size.height + 'px';
                    this.showSnapPreview = true;
                } else {
                    if (this.showSnapPreview == true) {
                        snapPreview.style.width = this.container.offsetWidth + 'px';
                        snapPreview.style.height = this.container.offsetHeight + 'px';
                        snapPreview.style.left = utils.getPosition(this.container).x + 'px';
                        snapPreview.style.top = utils.getPosition(this.container).y + 'px';
                        setTimeout(() => {
                            if (this.showSnapPreview == true) return;
                            snapPreview.style.transition = 'none';
                            snapPreview.classList.remove('active');
                        }, 150)
                    }
                    this.showSnapPreview = false;
                }
                this.snapSide = side;
            }
            this._emit('dragging', {
                preventDefault: () => {
                    handleEndMoving({}, 'preventDefault');
                },
                type: e.type,
                target: e.target
            })
            this.updateMica()
        }
    }

    handleEndMoving = (e, type = 'user') => {
        if (this.pointerDown == false) return;
        if (this.pointerMoved == false) {
            return this.pointerDown = false;
        }
        this.pointerDown = false;
        this.showSnapPreview = false;
        snapPreview.style.width = this.container.offsetWidth + 'px';
        snapPreview.style.height = this.container.offsetHeight + 'px';
        snapPreview.style.left = utils.getPosition(this.container).x + 'px';
        snapPreview.style.top = utils.getPosition(this.container).y + 'px';
        setTimeout(() => {
            snapPreview.style.transition = 'none';
            snapPreview.classList.remove('active');
        }, 150)
        appWrapper.classList.remove('moving');
        if (this.snapSide != '') {
            if (this.snapSide.includes('t') && this.snapSide.includes('f')) {
                this.maximizeWindow();
            }
            const position = getSnapPosition(this.snapSide);
            const size = getSnapSize(this.snapSide);

            this.container.style.transform = `translate(${position.left},${position.top})`;
            this.container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            this.browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                this.browserWindow.window.style.transition = 'none';
            }, 200)

            this.browserWindow.window.style.width = size.width;
            this.browserWindow.window.style.height = size.height;
            this.browserWindow.window.style.borderRadius = '0';
        } else if (type == 'user') {
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            if (pageX < 0) {
                pageX = 0;
            } else if (pageX > viewport.width) {
                pageX = viewport.width;
            }
            if (pageY < 0) {
                pageY = 0;
            } else if (pageY > viewport.height) {
                pageY = viewport.height;
            }
            this.x = this.originalPosition.x + pageX - this.pointerPosition[0];
            this.y = this.originalPosition.y + pageY - this.pointerPosition[1];
            this.container.style.transition = 'none';
            this.container.style.transform = `translate(${this.x}px,${this.y}px)`;
        }
        this.originalSnapSide = this.snapSide;
        this.snapSide = '';
        this._emit('dragend', {
            preventDefault: () => {

            },
            type: e.type,
            target: e.target
        })
        this.updateMica();
    }

    updateMica = () => {
        if (this.mica == true) {
            requestAnimationFrame(() => {
                const rect = this.container.getBoundingClientRect();
                this.micaElement.style.clipPath = `inset(${rect.top + 1}px ${viewport.width - rect.right + 1}px ${viewport.height - rect.bottom + 1}px ${rect.left + 1}px)`;
                this.micaElement.style.transform = `translate(${-rect.left}px,${-rect.top}px)`;
            });
        }
    }

    minimize = () => {
        var position = utils.getPosition(this.taskbarIconElement);
        var width = this.container.offsetWidth;
        var height = this.container.offsetHeight;

        this.container.style.transition = 'none';

        var scaleX = 180 / width;
        var scaleY = 120 / height;
        var scale = scaleX;

        if (scaleY < scaleX) {
            scale = scaleY
        }

        var windowWidth = width * scale;
        var windowHeight = height * scale;

        this.animate({
            to: {
                x: position.x - width * (1 - scale) / 2 - windowWidth / 2 + this.taskbarIconElement.offsetWidth / 2,
                y: viewport.height - 48 - 8 - height * (1 - scale) / 2 - windowHeight,
                scaleX: scale,
                scaleY: scale,
                opacity: 0
            },
            profile: 'window-hide'
        });
        this._emit('minimize');
    }

    unmaximizeWindow = (animation = true) => {
        this.originalSnapSide = '';
        this.isMaximized = false;
        this.container.removeAttribute('data-maximized');
        this.container.style.transform = `translate(${this.x}px,${this.y}px)`;

        if (animation == true) {
            this.container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            this.browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                this.browserWindow.window.style.transition = 'none';
            }, 200)
        } else {
            this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
            this.browserWindow.window.style.transition = 'none';
        }

        this.browserWindow.window.style.width = this.realWidth + 'px';
        this.browserWindow.window.style.height = this.realHeight + 'px';
        this.browserWindow.window.style.borderRadius = 'revert-layer';
        this.maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
        this.updateMica();
    }

    maximizeWindow = (animation = true) => {
        this.originalSnapSide = 'f';
        this.isMaximized = true;
        this.container.setAttribute('data-maximized', 'true');
        this.container.style.transform = `translate(0px,0px)`;
        // hostElement.style.width = 'var(--viewport-width)';
        // hostElement.style.height = 'calc(var(--viewport-height) - var(--taskbar-height))';

        if (animation == true) {
            this.container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            this.browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                this.browserWindow.window.style.transition = 'none';
            }, 200)
        } else {
            this.container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
            this.browserWindow.window.style.transition = 'none';
        }

        this.browserWindow.window.style.width = 'var(--viewport-width)';
        this.browserWindow.window.style.height = 'calc(var(--viewport-height) - var(--taskbar-height))';
        this.browserWindow.window.style.borderRadius = '0';
        this.maximizeImage.style.backgroundImage = `url(${icons.maximize})`;
        this.updateMica();
    }

    close = () => {
        if (window.modes.debug == true) {

        }
        this.container.style.transition = 'none';
        const position = utils.getPosition(this.container);
        this.animate({
            to: {
                x: position.x,
                y: position.y,
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            },
            profile: 'window-close'
        });
        this._emit('close');
        setTimeout(() => {
            this.container.remove();
        }, 200);
    }

    changeTitle = (title = 'App') => {
        if (!title) return;
        this.title = title;
        this.toolbarTitle.innerHTML = utils.replaceHTMLTags(title);
        this._emit('title-changed', title);
    }

    changeIcon = (url = '') => {
        if (!url) return;
        this.icon = url;
        this.toolbarIcon.style.backgroundImage = `url(${url})`;
        this._emit('icon-changed', url);
    }

    setTheme = (theme) => {
        this.windowTheme = theme == 'dark' ? 'dark' : 'light';
        this.browserWindow.window.setAttribute('data-theme', this.windowTheme);
    }

    getTheme = () => {
        return this.windowTheme;
    }

    setSnappable = (value) => {
        this.snappable = value == true;
    }

    setMovable = (element) => {
        events.start.forEach(event => {
            element.addEventListener(event, this.handleStartMoving);
        })
    }

    unsetMovable = (element) => {
        events.start.forEach(event => {
            element.removeEventListener(event, this.handleStartMoving);
        })
    }

    setImmovable = (element) => {
        if (!this.immovableElements.includes(element)) {
            this.immovableElements.push(element);
        }
    }

    unsetImmovable = (element) => {
        if (this.immovableElements.includes(element)) {
            this.immovableElements.splice(this.immovableElements.indexOf(element), 1);
        }
    }

    addEventListener = (event, listener) => {
        console.warn('%cBrowserWindow.addEventListener()%c has been deprecated.\nPlease use %cBrowserWindow.on()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        this.on(event, listener);
    }

    useTabview = (config = {
        icon: true
    }) => {
        const tabview = document.createElement('div');
        const tabStrip = document.createElement('div');
        const tabStripTabs = document.createElement('div');
        const tabStripCreate = document.createElement('div');
        const tabStripCreateButton = document.createElement('button');

        tabview.className = 'tabview';
        tabStrip.className = 'tabview-tabstrip';
        tabStripTabs.className = 'tabview-tabstrip-tabs';
        tabStripCreate.className = 'tabview-tabstrip-create';
        tabStripCreateButton.className = 'tabview-tabstrip-create-button';

        this.container.appendChild(tabview);
        if (config.icon == false) {
            this.browserWindow.toolbar.replaceChild(tabStrip, this.toolbarInfo);
        } else {
            this.toolbarInfo.replaceChild(tabStrip, this.toolbarTitle);
        }
        tabStrip.appendChild(tabStripTabs);
        tabStrip.appendChild(tabStripCreate);
        tabStripCreate.appendChild(tabStripCreateButton);

        tabStripCreateButton.addEventListener('click', async () => {
            triggerEvent('requestCreateTab', {
                active: true,
                target: tabStripCreateButton
            })
        })

        this.on('dragstart', (e) => {
            if (e.target == tabStripCreateButton || tabStripTabs.contains(e.target)) {
                e.preventDefault();
            }
        })

        var order = [];
        var tabs = {};
        var listeners = {};

        function randomID() {
            var patterns = '0123456789abcdef';
            var id = '_';
            for (var i = 0; i < 6; i++) {
                id += patterns.charAt(Math.floor(Math.random() * patterns.length));
            }
            if (tabs[id]) {
                return randomID();
            }
            return id;
        }

        function on(event, listener) {
            if (!listeners[event]) {
                listeners[event] = []
            }
            listeners[event].push(listener);
        }

        function triggerEvent(event, detail) {
            if (listeners[event]) {
                listeners[event].forEach((listener) => listener(detail));
            }
        }

        class Tab {
            tab = document.createElement('div');
            tabInfo = document.createElement('div');
            tabIcon = document.createElement('div');
            tabHeader = document.createElement('div');
            tabClose = document.createElement('div');
            tabviewItem = document.createElement('div');
            id = randomID();

            constructor(config = {
                active: true,
                icon: true,
                tabAnimation: true
            }) {
                // Initialize tab
                order.push(this.id);

                this.tab.className = 'tabview-tabstrip-tab';
                this.tabInfo.className = 'tabview-tabstrip-tab-info';
                this.tabIcon.className = 'tabview-tabstrip-tab-icon';
                this.tabHeader.className = 'tabview-tabstrip-tab-header';
                this.tabClose.className = 'tabview-tabstrip-tab-close';
                this.tabviewItem.className = 'tabview-item';

                var originalPosition = order.indexOf(this.id);
                var currentPosition = order.indexOf(this.id);
                var startX = 0;
                var dragging = false;
                var events = {
                    "start": ["mousedown", "touchstart", "pointerdown"],
                    "move": ["mousemove", "touchmove", "pointermove"],
                    "end": ["mouseup", "touchend", "pointerup", "blur"]
                }

                tabs[this.id] = this;

                function moveNodeToIndex(nodeIndex, targetIndex, container) {
                    const children = Array.from(container.children);
                    if (nodeIndex < 0 || nodeIndex >= children.length || targetIndex < 0 || targetIndex >= children.length) {
                        // console.error('over range');
                        return;
                    }
                    const nodeToMove = children[nodeIndex];
                    if (targetIndex === children.length - 1) {
                        container.appendChild(nodeToMove);
                    } else if (targetIndex < nodeIndex) {
                        container.insertBefore(nodeToMove, children[targetIndex]);
                    } else {
                        container.insertBefore(nodeToMove, children[targetIndex + 1]);
                    }
                }

                function moveArrayItem(arr, fromIndex, toIndex) {
                    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) {
                        // console.error('over range');
                        return;
                    }
                    const item = arr.splice(fromIndex, 1)[0];
                    arr.splice(toIndex, 0, item);
                    // console.log(arr, item)
                    return arr;
                }

                const dragStart = (e) => {
                    if (this.tabClose.contains(e.target)) return;
                    this.focus();
                    let pageX = e.pageX;
                    if (e.type.startsWith('touch')) {
                        const touch = e.touches[0] || e.changedTouches[0];
                        pageX = touch.pageX;
                    }
                    originalPosition = order.indexOf(this.id);
                    currentPosition = order.indexOf(this.id);
                    this.tab.style.transition = 'none';
                    dragging = true;
                    startX = pageX;
                }

                const dragMove = (e) => {
                    if (!dragging) return;
                    try {
                        document.getSelection().removeAllRanges();
                    } catch (e) { };
                    let pageX = e.pageX;
                    if (e.type.startsWith('touch')) {
                        const touch = e.touches[0] || e.changedTouches[0];
                        pageX = touch.pageX;
                    }
                    var x = pageX - startX;
                    var unit = this.tab.offsetWidth + 8;
                    var count = Math.round(x / unit);

                    if (config.tabAnimation != false) {
                        this.tab.style.transform = `translateX(${x}px)`;
                    }

                    currentPosition = originalPosition + count;
                    if (currentPosition > order.length - 1) {
                        currentPosition = order.length - 1;
                    } else if (currentPosition < 0) {
                        currentPosition = 0;
                    }
                    count = currentPosition - originalPosition;

                    if (x > 0) {
                        Object.values(tabs).filter(tab => tab.id != this.id).forEach(tab => {
                            if (config.tabAnimation != false) {
                                tab.tab.style.transition = 'revert-layer';
                            }
                            var index = order.indexOf(tab.id);
                            if (index <= originalPosition + count && index > originalPosition) {
                                tab.tab.style.transform = 'translateX(calc(-100% - 8px))';
                            } else {
                                tab.tab.style.transform = '';
                            }
                        })
                    } else if (x < 0) {
                        Object.values(tabs).filter(tab => tab.id != this.id).forEach(tab => {
                            if (config.tabAnimation != false) {
                                tab.tab.style.transition = 'revert-layer';
                            }
                            var index = order.indexOf(tab.id);
                            if (index >= originalPosition + count && index < originalPosition) {
                                tab.tab.style.transform = 'translateX(calc(100% + 8px))';
                            } else {
                                tab.tab.style.transform = '';
                            }
                        })
                    }
                }

                const dragEnd = () => {
                    if (dragging == false) return;
                    dragging = false;
                    if (currentPosition != originalPosition) {
                        moveNodeToIndex(originalPosition, currentPosition, tabStripTabs);
                        moveArrayItem(order, originalPosition, currentPosition);
                        originalPosition = currentPosition;
                        Object.values(tabs).forEach(tab => {
                            tab.tab.style.transition = 'none';
                            tab.tab.style.transform = 'translateX(0)';
                            tab.tab.style['-webkit-transform']
                            setTimeout(() => {
                                tab.tab.style.transition = 'revert-layer';
                            }, 200)
                        })
                    } else {
                        this.tab.style.transition = 'revert-layer';
                        this.tab.style.transform = '';
                    }
                }

                events.start.forEach(event => {
                    this.tab.addEventListener(event, dragStart);
                })
                events.move.forEach(event => {
                    window.addEventListener(event, dragMove);
                })
                events.end.forEach(event => {
                    window.addEventListener(event, dragEnd);
                })

                this.tabClose.addEventListener('click', () => {
                    this.close()
                });

                this.tab.appendChild(this.tabInfo);
                this.tab.appendChild(this.tabClose);
                this.tabInfo.appendChild(this.tabIcon);
                this.tabInfo.appendChild(this.tabHeader);
                tabStripTabs.appendChild(this.tab);
                tabview.appendChild(this.tabviewItem);

                if (config.active != false) {
                    this.focus();
                }
                if (config.icon == false) {
                    this.tabIcon.remove();
                }
            }
            getContainer() {
                return this.tabviewItem;
            }
            focus() {
                Object.values(tabs).forEach(tab => {
                    tab.blur();
                })
                this.tab.classList.add('active');
                this.tabviewItem.classList.add('active');
            }
            changeHeader(header) {
                this.tabHeader.innerHTML = utils.replaceHTMLTags(header);
            }
            changeIcon(icon) {
                this.tabIcon.style.backgroundImage = `url(${icon})`;
            }
            close() {
                this.tab.remove();
                this.tabviewItem.remove();
                var index = order.indexOf(this.id);
                delete tabs[this.id];
                order.splice(index, 1);
                if (Object.keys(tabs).length == 0) {
                    return close();
                } else if (order[index]) {
                    return tabs[order[index]].focus();
                } else if (order[index - 1]) {
                    return tabs[order[index - 1]].focus();
                } else {
                    return tabs[order[0]].focus();
                }
            }
            blur() {
                this.tab.classList.remove('active');
                this.tabviewItem.classList.remove('active');
            }
        }

        return { Tab, on };
    }
}