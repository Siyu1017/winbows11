import WinUI from "../../ui/winui.js";
import { WRT } from "./kernel.js";
import * as utils from "../../utils.js";
import { IDBFS, fsUtils } from "../../lib/fs.js";
import { EventEmitter } from "./utils/eventEmitter.js";
import viewport from "../viewport.js";
import { appRegistry } from "../appRegistry.js";
import { System } from "../system.js";

const fs = IDBFS("~WRT");
const { appWrapper, screenElement } = viewport;

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

export async function register(path, ctx) {
    const app = {
        _cbs: {},
        on: (evt, cb) => {
            if (!app._cbs[evt]) app._cbs[evt] = [];
            app._cbs[evt].push(cb);
        },
        executeAsync: async () => {
            app._cbs['ready']?.forEach((cb) => cb())
            return new Promise((rs, rj) => {
                //browserWindow.setPromise(rs, rj);
            });
        }
    }

    function BrowserWindow(config) {
        const browserWindowObj = createBrowserWindow(config);
        const wrt = new WRT(WRT.defaultCwd, {
            keepAlive: true,
            subProcess: true
        })

        async function load(path) {
            const filePath = fsUtils.resolve(ctx.__dirname, path);
            let code = await fs.getFileAsText(filePath);
            code = `const {document,browserWindow}=this;\n${code}`;
            browserWindowObj.on('close', () => {
                wrt.close();
            })
            wrt.runCode(code, {
                __filename: filePath,
                // Proxy document
                document: new Proxy(document, {
                    get: (target, prop) => {
                        switch (prop) {
                            case 'damn':
                                return 'Damn!';
                            case 'head':
                                return browserWindowObj.shadowRoot;
                            case 'documentElement':
                                return browserWindowObj.window;
                            case 'body':
                                return browserWindowObj.content;
                            case 'write':
                                return () => {
                                    console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                                };
                            case 'addEventListener':
                                return (event, callback) => { browserWindowObj.shadowRoot.addEventListener(event, callback) };
                            case 'removeEventListener':
                                return (event, callback) => { browserWindowObj.shadowRoot.removeEventListener(event, callback) };
                            case 'querySelector':
                                return (selector) => { return browserWindowObj.shadowRoot.querySelector(selector) };
                            case 'querySelectorAll':
                                return (selector) => { return browserWindowObj.shadowRoot.querySelectorAll(selector) };
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
                browserWindow: browserWindowObj
            });
        }

        return { load };
    }
    BrowserWindow.prototype._ = '';

    return { app, BrowserWindow };
}

export function createBrowserWindow(config = {
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    snappable: true,
    fullscreenable: true,
    mica: false,
    showOnTop: false,
    theme: 'light',
    width: 800,
    height: 600,
    icon: '',
    title: 'App',
}) {
    const eventEmitter = new EventEmitter();

    // Status
    let isMaximized = false;
    let isMinimized = false;
    let originalSnapSide = '';
    let pointerMoved = false;
    let showSnapPreview = false;
    let snapMargin = 12;
    let pointerDown = false;
    let pointerPosition = [];
    let originalPosition = {};
    let immovableElements = [];
    let snapSide = '';

    // Elements
    const container = document.createElement('div');
    const micaElement = document.createElement('div');
    const windowElement = document.createElement('div');
    const resizerContainer = document.createElement('div');
    const windowContent = document.createElement('div');
    const shadowRoot = windowContent.attachShadow({ mode: 'open' });

    // Toolbar
    const toolbarInfo = document.createElement('div');
    const toolbarIcon = document.createElement('div');
    const toolbarTitle = document.createElement('div');
    const toolbarButtons = document.createElement('div');
    const minimizeButton = document.createElement('div');
    const minimizeImage = document.createElement('div');
    const maximizeButton = document.createElement('div');
    const maximizeImage = document.createElement('div');
    const closeButton = document.createElement('div');
    const closeImage = document.createElement('div');

    // Browser Window
    const browserWindow = {
        window: document.createElement('div'),
        toolbar: document.createElement('div'),
        content: document.createElement('div')
    }
    const taskbarIconElement = document.createElement('div');

    // Options
    let resizable = config.resizable;
    let minimizable = config.minimizable;
    let maximizable = config.maximizable;
    let closable = config.closable;
    let snappable = config.snappable;
    let fullscreenable = config.fullscreenable;
    let mica = config.mica;
    let showOnTop = config.showOnTop;
    let theme = config.theme;

    let width = config.width;
    let height = config.height;
    let x = (config.x == 'center' || !config.x) ? viewport.width / 2 - width / 2 : config.x;
    let y = (config.y == 'center' || !config.y) ? viewport.height / 2 - height / 2 : config.y;
    let icon = config.icon;
    let title = config.title;

    if (!config.x && !config.y && browserWindowPosition['caller']) {
        // Restore previous position
        x = browserWindowPosition['caller'][0];
        y = browserWindowPosition['caller'][1];
    }

    // Container
    container.className = 'browser-window-container';
    micaElement.className = 'browser-window-mica';
    windowElement.className = 'broser-window';
    resizerContainer.className = 'browser-window-resizers';
    windowContent.className = 'browser-window-content';

    maxZIndex++;
    container.style.zIndex = maxZIndex;
    container.style.transition = 'none';
    container.style.transform = `translate(${x}px,${y}px)`;

    container.appendChild(micaElement);
    container.appendChild(windowElement);
    windowElement.appendChild(resizerContainer);
    windowElement.appendChild(windowContent);

    // Inside Shadow Root
    browserWindow.window.className = 'window';
    browserWindow.toolbar.className = 'window-toolbar';
    browserWindow.content.className = 'window-content';

    shadowRoot.appendChild(browserWindow.window);
    browserWindow.window.appendChild(browserWindow.toolbar);
    browserWindow.window.appendChild(browserWindow.content);

    if (showOnTop == true) {
        screenElement.appendChild(container);
    } else {
        appWrapper.appendChild(container);
    }

    // Animation Data
    let animationData = {
        from: {
            x: x,
            y: y,
            scaleX: width / 800,
            scaleY: height / 600,
            opacity: 0,
            ts: Date.now()
        },
        to: {
            x: x,
            y: y,
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
    shadowRoot.appendChild(style);

    // Mica Effect
    if (mica == true) {
        const observer = new ResizeObserver(updateMica);
        observer.observe(container);
        window.addEventListener('resize', updateMica);

        container.classList.add('mica');
    }

    // Resizers
    if (resizable == true) {
        // Resizers
        Object.keys(resizerConfig).forEach(key => {
            var allowed = resizerConfig[key];
            var pointerDown = false;
            var pointerPosition = {};
            var resizer = document.createElement('div');
            var originalPosition = {};
            var originalSize = {};
            resizer.className = key;

            const updateSizeAndData = (e) => {
                const position = utils.getPointerPosition(e);
                var diffX = position.x - pointerPosition.x;
                var diffY = position.y - pointerPosition.y;
                var width = originalSize.width;
                var height = originalSize.height;
                if (allowed == 'vertical') {
                    diffX = 0;
                } else if (allowed == 'horizontal') {
                    diffY = 0;
                }
                var translateX = originalPosition.x;
                var translateY = originalPosition.y;
                // For vertical resize
                if (key.search('top') > -1) {
                    // Fixate bottom
                    translateY += diffY;
                    browserWindow.window.style.height = height - diffY + 'px';
                    height = height - diffY;
                } else if (key.search('bottom') > -1) {
                    // Fixate top
                    browserWindow.window.style.height = height + diffY + 'px';
                    height = height + diffY;
                }

                // For horizontal resize
                if (key.search('left') > -1) {
                    // Fixate right
                    translateX += diffX;
                    browserWindow.window.style.width = width - diffX + 'px';
                    width = width - diffX;
                } else {
                    // Fixate left
                    browserWindow.window.style.width = width + diffX + 'px';
                    width = width + diffX;
                }

                x = translateX;
                y = translateY;

                container.style.transition = 'none';
                container.style.transform = `translate(${x}px,${y}px)`;
            }

            const handleStartResizing = (e) => {
                if (isMaximized == true) return;
                pointerPosition = utils.getPointerPosition(e);
                originalPosition = {
                    x: x,
                    y: y
                }
                originalSize = {
                    width: width,
                    height: height
                }
                appWrapper.classList.add('moving');
                pointerDown = true;
                if (mica == true) {
                    updateMica();
                }
            }

            const handleMoveResizing = (e) => {
                if (pointerDown == true) {
                    try {
                        document.getSelection().removeAllRanges();
                    } catch (e) { };
                    updateSizeAndData(e);
                    if (mica == true) {
                        updateMica();
                    }
                }
            }

            const handleEndResizing = (e) => {
                if (pointerDown == false) return;
                updateSizeAndData(e);
                pointerDown = false;
                appWrapper.classList.remove('moving');
                if (mica == true) {
                    updateMica();
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

            resizerContainer.appendChild(resizer);
        })
    } else {
        resizerContainer.remove();
    }

    // Open window with animation
    container.style.transition = 'none';
    animate({
        from: {
            scaleX: .9,
            scaleY: .9,
            opacity: 0
        },
        to: {
            x: x,
            y: y,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
        },
        profile: 'window-open'
    });
    updateMica();

    // Default toolbar
    toolbarInfo.className = 'window-toolbar-info';
    toolbarIcon.className = 'window-toolbar-icon';
    toolbarTitle.className = 'window-toolbar-title';
    toolbarButtons.className = 'window-toolbar-buttons';
    minimizeButton.className = 'window-toolbar-button';
    maximizeButton.className = 'window-toolbar-button';
    closeButton.className = 'window-toolbar-button close';
    minimizeImage.className = 'window-toolbar-button-icon';
    maximizeImage.className = 'window-toolbar-button-icon';
    closeImage.className = 'window-toolbar-button-icon';

    // Load icon image
    fs.getFileURL(icon || appRegistry.getIcon(''))
        .then(url => {
            toolbarIcon.style.backgroundImage = `url(${url})`;
        });

    toolbarTitle.innerHTML = utils.replaceHTMLTags(title);
    minimizeImage.style.backgroundImage = `url(${icons.minimize})`;
    maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
    closeImage.style.backgroundImage = `url(${icons.close})`;

    minimizeButton.addEventListener('click', () => {
        minimize();
    });
    closeButton.addEventListener('click', () => {
        close();
    });
    maximizeButton.addEventListener('click', () => {
        if (isMaximized == false) {
            maximizeWindow();
        } else {
            unmaximizeWindow();
        }
    });

    minimizeButton.appendChild(minimizeImage);
    maximizeButton.appendChild(maximizeImage);
    closeButton.appendChild(closeImage);
    toolbarButtons.appendChild(minimizeButton);
    toolbarButtons.appendChild(maximizeButton);
    toolbarButtons.appendChild(closeButton);
    toolbarInfo.appendChild(toolbarIcon);
    toolbarInfo.appendChild(toolbarTitle);
    browserWindow.toolbar.appendChild(toolbarInfo);
    browserWindow.toolbar.appendChild(toolbarButtons);

    // Toolbar menu
    const toolbarMenu = WinUI.contextMenu([]);
    toolbarMenu.container.style.setProperty('--contextmenu-icon-size', '.58rem');
    toolbarMenu.container.style.setProperty('--contextmenu-expand-size', '.58rem');
    browserWindow.toolbar.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const { x, y } = utils.getPointerPosition(e);
        toolbarMenu.setItems([
            {
                className: "restore",
                icon: "chrome-restore",
                text: "Restore",
                disabled: !isMaximized == true,
                action: () => {
                    unmaximizeWindow();
                }
            }, {
                className: "minimize",
                icon: "chrome-minimize",
                text: "Minimize",
                disabled: minimizable == false,
                action: () => {
                    minimize();
                    // update icon status
                },
            }, {
                className: "maximize",
                icon: "chrome-maximize",
                text: "Maximize",
                disabled: !(isMaximized == false && !maximizable == false),
                action: () => {
                    maximizeWindow();
                },
            }, {
                type: "separator"
            }, {
                className: "close",
                icon: "chrome-close",
                text: "Close",
                action: () => {
                    close();
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

    if (fullscreenable == false) {
        maximizeButton.remove();
    }
    if (minimizable == false) {
        minimizeButton.remove();
    }
    if (maximizable == false) {
        maximizeButton.remove();
    }
    if (closable == false) {
        closeButton.remove();
    }

    let windowTheme = theme == 'system' ? System.theme.get() : theme == 'dark' ? 'dark' : 'light';
    browserWindow.window.setAttribute('data-theme', windowTheme);

    events.start.forEach(event => {
        browserWindow.toolbar.addEventListener(event, handleStartMoving);
    })
    events.move.forEach(event => {
        window.addEventListener(event, handleMoveMoving);
    })
    events.end.forEach(event => {
        window.addEventListener(event, handleEndMoving);
    })

    container.addEventListener('pointerdown', (e) => {
        eventEmitter._emit('focus');
    })

    function onFocus() {
        maxZIndex++;
        container.style.zIndex = maxZIndex;
        container.style.pointerEvents = 'all';
        container.style.visibility = 'visible';
        windowContent.style.pointerEvents = 'unset';
    }

    function onBlur() {

    }

    function animate({
        from,
        to,
        profile
    }) {
        if (profile) {
            animationData.profile = animateProfiles[profile];
        }
        Object.keys(to).forEach(CSSKey => {
            if (/[A-z]/gi.test(CSSKey[0])) {
                animationData.to[CSSKey] = to[CSSKey];
            }
        })
        var cT = getComputedStyle(container).transform;
        var cO = getComputedStyle(container).opacity;
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

        animationData.from.x = x;
        animationData.from.y = y;
        animationData.from.scaleX = scaleX;
        animationData.from.scaleY = scaleY;
        animationData.from.opacity = opacity;
        animationData.from.ts = now;
        animationData.to.ts = now + animationData.profile.duration;

        if (animationData.isRunning == false) {
            animateRunner();
        }
    }

    function animateRunner() {
        animationData.isRunning = true;
        const now = Date.now();
        const d = now - animationData.from.ts;
        const t = d / animationData.profile.duration;
        const p = animationData.profile.func(t > 1 ? 1 : t < 0 ? 0 : t);

        container.style.transform = `translate(
${animationData.from.x + (animationData.to.x - animationData.from.x) * p}px,
${animationData.from.y + (animationData.to.y - animationData.from.y) * p}px
) scale(
${animationData.from.scaleX + (animationData.to.scaleX - animationData.from.scaleX) * p},
${animationData.from.scaleY + (animationData.to.scaleY - animationData.from.scaleY) * p}
)`;
        container.style.opacity = (animationData.from.opacity + (animationData.to.opacity - animationData.from.opacity) * p).toString();

        if (now < animationData.to.ts) {
            requestAnimationFrame(animateRunner);
        } else {
            animationData.isRunning = false;
        }
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

    // Moving
    function handleStartMoving(e) {
        if (toolbarButtons.contains(e.target)) return;
        for (const element of immovableElements) {
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
        pointerDown = true;
        pointerMoved = false;
        var position = utils.getPosition(container);
        pointerPosition = [pageX, pageY];
        originalPosition = {
            x: position.x,
            y: position.y
        }
        eventEmitter._emit('dragstart', {
            preventDefault: () => {
                handleEndMoving({}, 'preventDefault');
            },
            type: e.type,
            target: e.target
        })
        updateMica()
    }

    function handleMoveMoving(e) {
        if (pointerDown) {
            try {
                document.getSelection().removeAllRanges();
            } catch (e) { };
            if (originalSnapSide != '' || isMaximized == true || browserWindow.window.offsetWidth != width || browserWindow.window.offsetHeight != browserWindow.window.offsetHeight) {
                container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                browserWindow.window.style.transition = 'none';
                container.removeAttribute('data-maximized');
                browserWindow.window.style.width = width + 'px';
                browserWindow.window.style.height = height + 'px';
                browserWindow.window.style.borderRadius = 'revert-layer';
                maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
                isMaximized = false;
                originalSnapSide = '';
            }
            const pointer = utils.getPointerPosition(e);
            var pageX = pointer.x, pageY = pointer.y;
            if (pageX != pointerPosition[0] || pageY != pointerPosition[1]) {
                pointerMoved = true;
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

            container.style.transition = 'none';
            container.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;

            if (snappable == false) {
                snapSide = '';
            } else {
                if (side != '') {
                    snapPreview.style.position = 'fixed';
                    if (!showSnapPreview == true) {
                        snapPreview.style.width = container.offsetWidth + 'px';
                        snapPreview.style.height = container.offsetHeight + 'px';
                        snapPreview.style.left = utils.getPosition(container).x + 'px';
                        snapPreview.style.top = utils.getPosition(container).y + 'px';
                        snapPreview.classList.add('active');
                    }
                    var size = getSnapPreviewSize(side);
                    var position = getSnapPreviewPosition(side);
                    snapPreview.style.transition = 'all .15s ease-in-out';
                    snapPreview.style.zIndex = container.style.zIndex || maxZIndex;
                    snapPreview.style.left = position.left + 'px';
                    snapPreview.style.top = position.top + 'px';
                    snapPreview.style.width = size.width + 'px';
                    snapPreview.style.height = size.height + 'px';
                    showSnapPreview = true;
                } else {
                    if (showSnapPreview == true) {
                        snapPreview.style.width = container.offsetWidth + 'px';
                        snapPreview.style.height = container.offsetHeight + 'px';
                        snapPreview.style.left = utils.getPosition(container).x + 'px';
                        snapPreview.style.top = utils.getPosition(container).y + 'px';
                        setTimeout(() => {
                            if (showSnapPreview == true) return;
                            snapPreview.style.transition = 'none';
                            snapPreview.classList.remove('active');
                        }, 150)
                    }
                    showSnapPreview = false;
                }
                snapSide = side;
            }
            eventEmitter._emit('dragging', {
                preventDefault: () => {
                    handleEndMoving({}, 'preventDefault');
                },
                type: e.type,
                target: e.target
            })
            updateMica()
        }
    }

    function handleEndMoving(e, type = 'user') {
        if (pointerDown == false) return;
        if (pointerMoved == false) {
            return pointerDown = false;
        }
        pointerDown = false;
        showSnapPreview = false;
        snapPreview.style.width = container.offsetWidth + 'px';
        snapPreview.style.height = container.offsetHeight + 'px';
        snapPreview.style.left = utils.getPosition(container).x + 'px';
        snapPreview.style.top = utils.getPosition(container).y + 'px';
        setTimeout(() => {
            snapPreview.style.transition = 'none';
            snapPreview.classList.remove('active');
        }, 150)
        appWrapper.classList.remove('moving');
        if (snapSide != '') {
            if (snapSide.includes('t') && snapSide.includes('f')) {
                maximizeWindow();
            }
            var position = getSnapPosition(snapSide);
            var size = getSnapSize(snapSide);

            container.style.transform = `translate(${position.left},${position.top})`;

            container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                browserWindow.window.style.transition = 'none';
            }, 200)

            browserWindow.window.style.width = size.width;
            browserWindow.window.style.height = size.height;
            browserWindow.window.style.borderRadius = '0';
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
            x = originalPosition.x + pageX - pointerPosition[0];
            y = originalPosition.y + pageY - pointerPosition[1];
            container.style.transition = 'none';
            container.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;
        }
        originalSnapSide = snapSide;
        snapSide = '';
        eventEmitter._emit('dragend', {
            preventDefault: () => {

            },
            type: e.type,
            target: e.target
        })
        updateMica()
    }

    function updateMica() {
        if (mica == true) {
            requestAnimationFrame(() => {
                const rect = container.getBoundingClientRect();
                micaElement.style.clipPath = `inset(${rect.top + 1}px ${viewport.width - rect.right + 1}px ${viewport.height - rect.bottom + 1}px ${rect.left + 1}px)`;
                micaElement.style.transform = `translate(${-rect.left}px,${-rect.top}px)`;
            });
        }
    }

    function minimize() {
        var position = utils.getPosition(taskbarIconElement);
        var width = container.offsetWidth;
        var height = container.offsetHeight;

        container.style.transition = 'none';

        var scaleX = 180 / width;
        var scaleY = 120 / height;
        var scale = scaleX;

        if (scaleY < scaleX) {
            scale = scaleY
        }

        var windowWidth = width * scale;
        var windowHeight = height * scale;

        animate({
            to: {
                x: position.x - width * (1 - scale) / 2 - windowWidth / 2 + taskbarIconElement.offsetWidth / 2,
                y: window.innerHeight - 48 - 8 - height * (1 - scale) / 2 - windowHeight,
                scaleX: scale,
                scaleY: scale,
                opacity: 0
            },
            profile: 'window-hide'
        });
        eventEmitter._emit('minimize');
    }

    function unmaximizeWindow(animation = true) {
        originalSnapSide = '';
        isMaximized = false;
        container.removeAttribute('data-maximized');
        container.style.transform = `translate(${x}px,${y}px)`;

        if (animation == true) {
            container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                browserWindow.window.style.transition = 'none';
            }, 200)
        } else {
            container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
            browserWindow.window.style.transition = 'none';
        }

        browserWindow.window.style.width = width + 'px';
        browserWindow.window.style.height = height + 'px';
        browserWindow.window.style.borderRadius = 'revert-layer';
        maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
        updateMica()
    }

    function maximizeWindow(animation = true) {
        originalSnapSide = 'f';
        isMaximized = true;
        container.setAttribute('data-maximized', 'true');
        container.style.transform = `translate(0px,0px)`;
        // hostElement.style.width = 'var(--viewport-width)';
        // hostElement.style.height = 'calc(var(--viewport-height) - var(--taskbar-height))';

        if (animation == true) {
            container.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            browserWindow.window.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
            setTimeout(() => {
                container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                browserWindow.window.style.transition = 'none';
            }, 200)
        } else {
            container.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
            browserWindow.window.style.transition = 'none';
        }

        browserWindow.window.style.width = 'var(--viewport-width)';
        browserWindow.window.style.height = 'calc(var(--viewport-height) - var(--taskbar-height))';
        browserWindow.window.style.borderRadius = '0';
        maximizeImage.style.backgroundImage = `url(${icons.maximize})`;
        updateMica()
    }

    function close() {
        if (window.modes.debug == true) {

        }
        container.style.transition = 'none';
        const position = utils.getPosition(container);
        animate({
            to: {
                x: position.x,
                y: position.y,
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            },
            profile: 'window-close'
        });
        eventEmitter._emit('close');
        setTimeout(() => {
            container.remove();
        }, 200);
    }

    function changeTitle(title = 'App') {
        if (!title) return;
        title = title;
        toolbarTitle.innerHTML = utils.replaceHTMLTags(title);
        eventEmitter._emit('title-changed', title);
    }

    function changeIcon(url = '') {
        if (!url) return;
        icon = url;
        toolbarIcon.style.backgroundImage = `url(${url})`;
        eventEmitter._emit('icon-changed', url);
    }

    function setTheme(theme) {
        windowTheme = theme == 'dark' ? 'dark' : 'light';
        browserWindow.window.setAttribute('data-theme', windowTheme);
    }

    function getTheme() {
        return windowTheme;
    }

    function setSnappable(value) {
        snappable = value == true;
    }

    function setMovable(element) {
        events.start.forEach(event => {
            element.addEventListener(event, handleStartMoving);
        })
    }

    function unsetMovable(element) {
        events.start.forEach(event => {
            element.removeEventListener(event, handleStartMoving);
        })
    }

    function setImmovable(element) {
        if (!immovableElements.includes(element)) {
            immovableElements.push(element);
        }
    }

    function unsetImmovable(element) {
        if (immovableElements.includes(element)) {
            immovableElements.splice(immovableElements.indexOf(element), 1);
        }
    }

    function addEventListener(event, listener) {
        console.warn('%cBrowserWindow.addEventListener()%c has been deprecated.\nPlease use %cBrowserWindow.on()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
        eventEmitter.on(event, listener);
    }

    function useTabview(config = {
        icon: true
    }) {
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

        container.appendChild(tabview);
        if (config.icon == false) {
            browserWindow.toolbar.replaceChild(tabStrip, toolbarInfo);
        } else {
            toolbarInfo.replaceChild(tabStrip, toolbarTitle);
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

        eventEmitter.on('dragstart', (e) => {
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

    eventEmitter.on('focus', onFocus);
    eventEmitter.on('blur', onBlur);

    onFocus();

    return {
        shadowRoot,
        container,
        window: browserWindow.window,
        toolbar: browserWindow.toolbar,
        content: browserWindow.content,

        // Methods
        close,
        addEventListener,
        setTheme,
        getTheme,
        setMovable,
        unsetMovable,
        setImmovable,
        unsetImmovable,
        changeTitle,
        changeIcon,
        setSnappable,
        useTabview,
        on: eventEmitter.on.bind(eventEmitter)
    }
}