import { fsUtils } from "../../lib/fs";
import WinUI from "../../ui/winui";
import { WRT } from "./kernel";
import * as utils from "../../utils";

const fs = IDBFS("~WRT");

let browserWindowPosition = {};

let AppWrapper, Screen;
const snapPreview = document.createElement('div');
snapPreview.className = 'browser-window-snap-preview';

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
    let resolve = null, reject = null;

    const browserWindow = await BrowserWindow(path, ctx);
    const app = {
        _cbs: {},
        on: (evt, cb) => {
            if (!app._cbs[evt]) app._cbs[evt] = [];
            app._cbs[evt].push(cb);
        },
        executeAsync: async () => {
            app._cbs['ready']?.forEach(cb => cb())
            return new Promise((rs, rj) => {
                browserWindow.setPromise(rs, rj);
            });
        }
    }
    return { app, BrowserWindow: browserWindow.create };
}

export function setWinbows(Winbows) {
    AppWrapper = Winbows.AppWrapper;
    Screen = Winbows.Screen;

    AppWrapper.appendChild(snapPreview);
}

async function BrowserWindow(path, ctx) {
    let resolve = null, reject = null;

    const caller = path;
    const ICON = await window.Taskbar.createIcon({
        title: 'App',
        name: caller,
        icon: await fs.getFileURL(window.appRegistry.getIcon(caller)),
        openable: true,
        category: 'app',
        status: {
            opened: true,
            active: true
        }
    })

    function createBrowserWindow(config = {}) {
        const wrt = new WRT(WRT.defaultCwd, {
            keepAlive: true,
            subProcess: true
        })
        const parent = config.showOnTop == true ? Screen : AppWrapper;
        const { width = 800, height = 600 } = config;
        const windowData = {
            width, height,
            x: (window.innerWidth / 2) - width / 2,
            y: ((window.innerHeight - 48) / 2) - height / 2
        }
        const animateData = {
            x: windowData.x,
            y: windowData.y,
            scaleX: .9,
            scaleY: .9,
            opacity: 0,
            __x: windowData.x,
            __y: windowData.y,
            __scaleX: .9,
            __scaleY: .9,
            __opacity: 0,
            __targetTime: Date.now(),
            __startTime: Date.now(),
            __isRunning: false,
            __profile: {
                func: cubicBezier(.42, 0, .58, 1),
                duration: 100
            }
        }

        let listeners = {};
        let isMaximized = false;
        let originalSnapSide = '';

        if (config.x || config.y) {
            // Taskbar height : 48
            windowData.x = config.x && config.x != 'center' ? parseInt(config.x) : windowData.x;
            windowData.y = config.y && config.y != 'center' ? parseInt(config.y) : windowData.y;
        } else if (browserWindowPosition[caller]) {
            // 
            windowData.x = browserWindowPosition[caller][0];
            windowData.y = browserWindowPosition[caller][1];
        }

        const containerElement = document.createElement('div');
        const micaElement = document.createElement('div');
        const hostElement = document.createElement('div');
        const resizers = document.createElement('div');
        const content = document.createElement('div');
        const shadowRoot = content.attachShadow({ mode: 'open' });
        const windowElement = document.createElement('div');
        const toolbarElement = document.createElement('div');
        const contentElement = document.createElement('div');

        containerElement.className = 'browser-window-container active';
        micaElement.className = 'browser-window-mica';
        hostElement.className = 'browser-window';

        // Outside
        resizers.className = 'browser-window-resizers';
        content.className = 'browser-window-content';

        // In shadow root
        windowElement.className = 'window';
        toolbarElement.className = 'window-toolbar';
        contentElement.className = 'window-content';

        containerElement.style.transition = 'none';
        containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;

        const windowID = ICON.open({
            browserWindow: containerElement,
            shadowRoot: shadowRoot,
            pid: ctx.process.pid,
            mica: config.mica,
            close,
            update: function (type, icon) {

            }
        });

        containerElement.addEventListener('pointerdown', (e) => {
            ICON.focus(windowID);
        })

        ICON.addEventListener('blur', (e) => {
            content.style.pointerEvents = '';
            triggerEvent('blur', {})
        })

        ICON.addEventListener('focus', (e) => {
            if (e.id != windowID) {
                return content.style.pointerEvents = '';
            }
            content.style.pointerEvents = 'unset';
            triggerEvent('focus', {});
        })

        const toolbarMenu = WinUI.contextMenu([])
        toolbarMenu.container.style.setProperty('--contextmenu-icon-size', '.58rem');
        toolbarMenu.container.style.setProperty('--contextmenu-expand-size', '.58rem');
        toolbarElement.addEventListener('contextmenu', (e) => {
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
                    disabled: config.minimizable == false,
                    action: () => {
                        // update icon status
                    },
                }, {
                    className: "maximize",
                    icon: "chrome-maximize",
                    text: "Maximize",
                    disabled: !(isMaximized == false && !config.maximizable == false),
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

        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (toolbarMenu.container.contains(e.target)) return;
                toolbarMenu.close();
            })
        })

        function animate(params, profile) {
            if (profile && typeof profile === 'string' && animateProfiles[profile]) {
                animateData.__profile = animateProfiles[profile];
            }
            Object.keys(params).forEach(CSSKey => {
                if (/[A-z]/gi.test(CSSKey[0])) {
                    animateData[CSSKey] = params[CSSKey];
                }
            })
            var cT = getComputedStyle(containerElement).transform;
            var cO = getComputedStyle(containerElement).opacity;
            var opacity = Number(cO);

            var x = 0, y = 0, scaleX = 1, scaleY = 1;
            if (cT.startsWith("matrix(")) {
                var transform = decompose2DMatrix(cT);
                x = transform.translateX;
                y = transform.translateY;
                scaleX = transform.scaleX;
                scaleY = transform.scaleY;
            }

            if (params.__from) {
                x = params.__from.x || x;
                y = params.__from.y || y;
                scaleX = params.__from.scaleX || scaleX;
                scaleY = params.__from.scaleY || scaleY;
                opacity = params.__from.opacity || opacity;
            }

            animateData.__x = x;
            animateData.__y = y;
            animateData.__scaleX = scaleX;
            animateData.__scaleY = scaleY;
            animateData.__opacity = opacity;
            animateData.__targetTime = Date.now() + animateData.__profile.duration;

            if (animateData.__isRunning == false) {
                animateRunner();
            }
        }
        function animateRunner() {
            animateData.__isRunning = true;
            var now = Date.now();
            var d = animateData.__targetTime - now;
            var t = 1 - (d / animateData.__profile.duration);
            var p = animateData.__profile.func(t > 1 ? 1 : t < 0 ? 0 : t);

            containerElement.style.transform = `translate(
                ${animateData.__x + (animateData.x - animateData.__x) * p}px,
                ${animateData.__y + (animateData.y - animateData.__y) * p}px
                ) scale(${animateData.__scaleX + (animateData.scaleX - animateData.__scaleX) * p},${animateData.__scaleY + (animateData.scaleY - animateData.__scaleY) * p})`;
            containerElement.style.opacity = animateData.__opacity + (animateData.opacity - animateData.__opacity) * p;

            if (now < animateData.__targetTime) {
                requestAnimationFrame(animateRunner);
            } else {
                animateData.__isRunning = false;
            }
        }

        function updateMica() {
            if (config.mica == true) {
                requestAnimationFrame(() => {
                    const rect = containerElement.getBoundingClientRect();
                    micaElement.style.clipPath = `inset(${rect.top + 1}px ${window.innerWidth - rect.right + 1}px ${window.innerHeight - rect.bottom + 1}px ${rect.left + 1}px)`;
                    micaElement.style.transform = `translate(${-rect.left}px,${-rect.top}px)`;
                })
            }
        }

        const observer = new ResizeObserver(updateMica);
        observer.observe(containerElement);
        window.addEventListener('resize', updateMica)

        parent.appendChild(containerElement);
        containerElement.appendChild(micaElement);
        containerElement.appendChild(hostElement);
        hostElement.appendChild(resizers);
        hostElement.appendChild(content);
        shadowRoot.appendChild(windowElement);
        windowElement.appendChild(toolbarElement);
        windowElement.appendChild(contentElement);

        containerElement.style.transition = 'none';
        animate({
            x: windowData.x,
            y: windowData.y,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            __from: {
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            }
        }, 'window-open');

        updateMica();

        if (config.resizable == false) {
            resizers.remove();
        }

        // Resizers
        Object.keys(resizerConfig).forEach(key => {
            var allowed = resizerConfig[key];
            var pointerDown = false;
            var pointerPosition = [];
            var resizer = document.createElement('div');
            var originalPosition = {};
            var originalSize = {};
            resizer.className = key;

            function updateSizeAndData(e) {
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
                    windowElement.style.height = height - diffY + 'px';
                    windowData.height = height - diffY;
                } else if (key.search('bottom') > -1) {
                    // Fixate top
                    windowElement.style.height = height + diffY + 'px';
                    windowData.height = height + diffY;
                }

                // For horizontal resize
                if (key.search('left') > -1) {
                    // Fixate right
                    translateX += diffX;
                    windowElement.style.width = width - diffX + 'px';
                    windowData.width = width - diffX;
                } else {
                    // Fixate left
                    windowElement.style.width = width + diffX + 'px';
                    windowData.width = width + diffX;
                }

                windowData.x = translateX;
                windowData.y = translateY;

                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;
            }

            function handleStartResizing(e) {
                if (isMaximized == true) return;
                pointerPosition = utils.getPointerPosition(e);
                originalPosition = {
                    x: windowData.x,
                    y: windowData.y
                }
                originalSize = {
                    width: windowData.width,
                    height: windowData.height
                }
                AppWrapper.classList.add('moving');
                pointerDown = true;
                updateMica();
            }

            function handleMoveResizing(e) {
                if (pointerDown == true) {
                    try {
                        document.getSelection().removeAllRanges();
                    } catch (e) { };
                    updateSizeAndData(e);
                    updateMica();
                }
            }

            function handleEndResizing(e) {
                if (pointerDown == false) return;
                updateSizeAndData(e);
                pointerDown = false;
                AppWrapper.classList.remove('moving');
                updateMica();
                console.log(windowData)
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

            resizers.appendChild(resizer);
        })

        // Default toolbar
        var toolbarInfo = document.createElement('div');
        var toolbarIcon = document.createElement('div');
        var toolbarTitle = document.createElement('div');
        var toolbarButtons = document.createElement('div');

        toolbarInfo.className = 'window-toolbar-info';
        toolbarIcon.className = 'window-toolbar-icon';
        toolbarTitle.className = 'window-toolbar-title';
        toolbarButtons.className = 'window-toolbar-buttons';

        var icon = config.icon || window.appRegistry.getIcon('');
        var title = config.title || 'App';

        toolbarTitle.innerHTML = utils.replaceHTMLTags(title);

        var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = defaultStyle;
        shadowRoot.appendChild(style);

        (async () => {
            var url = await fs.getFileURL(icon);
            await loadImage(url);
            toolbarIcon.style.backgroundImage = `url(${url})`;
        })();

        function changeTitle(title = '') {
            if (!title) return;
            config.title = title;
            toolbarTitle.innerHTML = utils.replaceHTMLTags(title);
            ctx.process.title = config.title || 'App';
            ICON.changeTitle(windowID, title);
        }

        function changeIcon(url = '') {
            if (!url) return;
            config.icon = url;
            toolbarIcon.style.backgroundImage = `url(${url})`;
            ICON.changeIcon(windowID, url);
        }

        var minimizeButton = document.createElement('div');
        var maximizeButton = document.createElement('div');
        var closeButton = document.createElement('div');

        minimizeButton.className = 'window-toolbar-button';
        maximizeButton.className = 'window-toolbar-button';
        closeButton.className = 'window-toolbar-button close';

        minimizeButton.addEventListener('click', () => {
            ICON.hide(windowID);
        });
        closeButton.addEventListener('click', close);

        // var iconStyle = document.createElement('style');
        // iconStyle.innerHTML = `.window{--close-icon:url(${await window.fs.getFileURL(icons[0])});--maximize-icon:url(${await window.fs.getFileURL(icons[1])});--minimize-icon:url(${await window.fs.getFileURL(icons[2])});--maxmin-icon:url(${await window.fs.getFileURL(icons[3])});}`;
        // shadowRoot.appendChild(iconStyle);

        var minimizeImage = document.createElement('div');
        minimizeImage.className = 'window-toolbar-button-icon';
        minimizeImage.style.backgroundImage = `url(${icons.minimize})`;
        minimizeButton.appendChild(minimizeImage);

        var maximizeImage = document.createElement('div');
        maximizeImage.className = 'window-toolbar-button-icon';
        maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
        maximizeButton.appendChild(maximizeImage);

        var closeImage = document.createElement('div');
        closeImage.className = 'window-toolbar-button-icon';
        closeImage.style.backgroundImage = `url(${icons.close})`;
        closeButton.appendChild(closeImage)

        toolbarButtons.appendChild(minimizeButton);
        toolbarButtons.appendChild(maximizeButton);
        toolbarButtons.appendChild(closeButton);

        toolbarInfo.appendChild(toolbarIcon);
        toolbarInfo.appendChild(toolbarTitle);

        toolbarElement.appendChild(toolbarInfo);
        toolbarElement.appendChild(toolbarButtons);

        async function unmaximizeWindow(animation = true) {
            originalSnapSide = '';
            isMaximized = false;
            containerElement.removeAttribute('data-maximized');
            containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;

            if (animation == true) {
                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)
            } else {
                containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                windowElement.style.transition = 'none';
            }

            windowElement.style.width = windowData.width + 'px';
            windowElement.style.height = windowData.height + 'px';
            windowElement.style.borderRadius = 'revert-layer';
            maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
            updateMica()
        }

        async function maximizeWindow(animation = true) {
            originalSnapSide = 'f';
            isMaximized = true;
            containerElement.setAttribute('data-maximized', 'true');
            containerElement.style.transform = `translate(0px,0px)`;
            // hostElement.style.width = 'var(--winbows-screen-width)';
            // hostElement.style.height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';

            if (animation == true) {
                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)
            } else {
                containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                windowElement.style.transition = 'none';
            }

            windowElement.style.width = 'var(--winbows-screen-width)';
            windowElement.style.height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';
            windowElement.style.borderRadius = '0';
            maximizeImage.style.backgroundImage = `url(${icons.maximize})`;
            updateMica()
        }


        maximizeButton.addEventListener('click', () => {
            if (isMaximized == false) {
                maximizeWindow();
            } else {
                unmaximizeWindow();
            }
        });

        function minimize() {
            var position = utils.getPosition(ICON.item);
            var width = containerElement.offsetWidth;
            var height = containerElement.offsetHeight;

            containerElement.style.transition = 'none';

            var scaleX = 180 / width;
            var scaleY = 120 / height;
            var scale = scaleX;

            if (scaleY < scaleX) {
                scale = scaleY
            }

            var windowWidth = width * scale;
            var windowHeight = height * scale;

            animate({
                x: position.x - width * (1 - scale) / 2 - windowWidth / 2 + ICON.item.offsetWidth / 2,
                y: window.innerHeight - 48 - 8 - height * (1 - scale) / 2 - windowHeight,
                scaleX: scale,
                scaleY: scale,
                opacity: 0
            }, 'window-hide');
        }

        function close() {
            if (window.modes.debug == true) {
                console.log('close', windowID);
            }
            containerElement.style.transition = 'none';
            const position = utils.getPosition(containerElement);
            animate({
                x: position.x,
                y: position.y,
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            }, 'window-close');
            wrt.close(0);
            resolve?.();
            ICON.close(windowID);
        }

        if (config.fullscreenable == false) {
            maximizeButton.remove();
        }
        if (config.minimizable == false) {
            minimizeButton.remove();
        }
        if (config.maximizable == false) {
            maximizeButton.remove();
        }
        if (config.closable == false) {
            closeButton.remove();
        }

        var pointerMoved = false;
        var showSnapPreview = false;
        var snapMargin = 12;
        var pointerDown = false;
        var pointerPosition = [];
        var originalPosition = {};
        var immovableElements = [];
        var snapSide = '';

        function getSnapSide(x, y) {
            var side = '';
            if (y >= AppWrapper.offsetHeight - snapMargin) {
                side += 'b';
            } else if (y <= snapMargin) {
                side += 't';
            }
            if (x >= AppWrapper.offsetWidth - snapMargin) {
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
            var width = 'var(--winbows-screen-width)';
            var height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';
            if (side.includes('l') || side.includes('r')) {
                width = 'calc(var(--winbows-screen-width) / 2)';
            }
            if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                height = 'calc((var(--winbows-screen-height) - var(--taskbar-height)) / 2)';
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
                left = 'calc(var(--winbows-screen-width) / 2)';
            }
            if (side.includes('b')) {
                top = 'calc((var(--winbows-screen-height) - var(--taskbar-height)) / 2)';
            }
            return {
                left: left,
                top: top
            }
        }

        function getSnapPreviewSize(side) {
            var width = AppWrapper.offsetWidth - snapMargin * 2;
            var height = AppWrapper.offsetHeight - snapMargin * 2;
            if (side.includes('l') || side.includes('r')) {
                width = AppWrapper.offsetWidth / 2 - snapMargin * 2;
            }
            if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                height = AppWrapper.offsetHeight / 2 - snapMargin * 2;
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
                left = AppWrapper.offsetWidth / 2 + snapMargin;
            }
            if (side.includes('b')) {
                top = AppWrapper.offsetHeight / 2 + snapMargin;
            }
            return {
                left: left,
                top: top
            }
        }

        function handleStartMoving(e) {
            if (toolbarButtons.contains(e.target)) return;
            var prevent = false;
            immovableElements.forEach(element => {
                if (element == e.target || element.contains(e.target)) {
                    prevent = true;
                }
            })
            if (prevent == true) return;
            const pointer = utils.getPointerPosition(e);
            var pageX = pointer.x, pageY = pointer.y;
            if (pageX < 0) {
                pageX = 0;
            } else if (pageX > window.innerWidth) {
                pageX = window.innerWidth;
            }
            if (pageY < 0) {
                pageY = 0;
            } else if (pageY > parent.offsetHeight) {
                pageY = parent.offsetHeight;
            }
            pointerDown = true;
            pointerMoved = false;
            var position = utils.getPosition(containerElement);
            pointerPosition = [pageX, pageY];
            originalPosition = {
                x: position.x,
                y: position.y
            }
            triggerEvent('dragstart', {
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
                if (originalSnapSide != '' || isMaximized == true || windowElement.offsetWidth != windowData.width || windowElement.offsetHeight != windowElement.offsetHeight) {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                    containerElement.removeAttribute('data-maximized');
                    windowElement.style.width = windowData.width + 'px';
                    windowElement.style.height = windowData.height + 'px';
                    windowElement.style.borderRadius = 'revert-layer';
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
                } else if (pageX > window.innerWidth) {
                    pageX = window.innerWidth;
                }
                if (pageY < 0) {
                    pageY = 0;
                } else if (pageY > parent.offsetHeight) {
                    pageY = parent.offsetHeight;
                }
                const side = getSnapSide(pageX, pageY);
                AppWrapper.classList.add('moving');

                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;

                if (config.snappable == false) {
                    snapSide = '';
                } else {
                    if (side != '') {
                        snapPreview.style.position = 'fixed';
                        if (!showSnapPreview == true) {
                            snapPreview.style.width = containerElement.offsetWidth + 'px';
                            snapPreview.style.height = containerElement.offsetHeight + 'px';
                            snapPreview.style.left = utils.getPosition(containerElement).x + 'px';
                            snapPreview.style.top = utils.getPosition(containerElement).y + 'px';
                            snapPreview.classList.add('active');
                        }
                        var size = getSnapPreviewSize(side);
                        var position = getSnapPreviewPosition(side);
                        snapPreview.style.transition = 'all .15s ease-in-out';
                        snapPreview.style.zIndex = containerElement.style.zIndex || ICON.getMaxZIndex();
                        snapPreview.style.left = position.left + 'px';
                        snapPreview.style.top = position.top + 'px';
                        snapPreview.style.width = size.width + 'px';
                        snapPreview.style.height = size.height + 'px';
                        showSnapPreview = true;
                    } else {
                        if (showSnapPreview == true) {
                            snapPreview.style.width = containerElement.offsetWidth + 'px';
                            snapPreview.style.height = containerElement.offsetHeight + 'px';
                            snapPreview.style.left = utils.getPosition(containerElement).x + 'px';
                            snapPreview.style.top = utils.getPosition(containerElement).y + 'px';
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
                triggerEvent('dragging', {
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
            snapPreview.style.width = containerElement.offsetWidth + 'px';
            snapPreview.style.height = containerElement.offsetHeight + 'px';
            snapPreview.style.left = utils.getPosition(containerElement).x + 'px';
            snapPreview.style.top = utils.getPosition(containerElement).y + 'px';
            setTimeout(() => {
                snapPreview.style.transition = 'none';
                snapPreview.classList.remove('active');
            }, 150)
            AppWrapper.classList.remove('moving');
            if (snapSide != '') {
                if (snapSide.includes('t') && snapSide.includes('f')) {
                    maximizeWindow();
                }
                var position = getSnapPosition(snapSide);
                var size = getSnapSize(snapSide);

                containerElement.style.transform = `translate(${position.left},${position.top})`;

                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)

                windowElement.style.width = size.width;
                windowElement.style.height = size.height;
                windowElement.style.borderRadius = 0;
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
                } else if (pageX > window.innerWidth) {
                    pageX = window.innerWidth;
                }
                if (pageY < 0) {
                    pageY = 0;
                } else if (pageY > parent.offsetHeight) {
                    pageY = parent.offsetHeight;
                }
                windowData.x = originalPosition.x + pageX - pointerPosition[0];
                windowData.y = originalPosition.y + pageY - pointerPosition[1];
                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;
            }
            originalSnapSide = snapSide;
            snapSide = '';
            triggerEvent('dragend', {
                preventDefault: () => {

                },
                type: e.type,
                target: e.target
            })
            updateMica()
        }

        var windowTheme = config.theme == 'system' ? window.System.theme.get() : config.theme == 'dark' ? 'dark' : 'light';
        windowElement.setAttribute('data-theme', windowTheme);

        function setTheme(theme) {
            windowTheme = theme == 'dark' ? 'dark' : 'light';
            windowElement.setAttribute('data-theme', windowTheme);
        }

        function getTheme(theme) {
            return windowTheme;
        }

        function setSnappable(value) {
            config.snappable = value == true;
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

        function triggerEvent(event, details) {
            if (listeners.hasOwnProperty(event)) {
                listeners[event].forEach(listener => listener(details));
            }
        }

        function addEventListener(event, listener) {
            if (!listeners.hasOwnProperty(event)) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
        }

        events.start.forEach(event => {
            toolbarElement.addEventListener(event, handleStartMoving);
        })
        events.move.forEach(event => {
            window.addEventListener(event, handleMoveMoving);
        })
        events.end.forEach(event => {
            window.addEventListener(event, handleEndMoving);
        })

        containerElement.addEventListener('pointerdown', (e) => {
            ICON.focus(windowID);
        })

        ICON.focus(windowID);

        const browserWindow = {
            // Elements
            shadowRoot, container: containerElement, window: windowElement, toolbar: toolbarElement, content: contentElement,
            // Methods
            close, addEventListener, setTheme, getTheme, setMovable, unsetMovable, setImmovable, unsetImmovable, changeTitle, changeIcon,
            setSnappable,
            useTabview
        };

        function useTabview(config = {
            icon: true
        }) {
            var tabview = document.createElement('div');
            var tabStrip = document.createElement('div');
            var tabStripTabs = document.createElement('div');
            var tabStripCreate = document.createElement('div');
            var tabStripCreateButton = document.createElement('button');

            tabview.className = 'tabview';
            tabStrip.className = 'tabview-tabstrip';
            tabStripTabs.className = 'tabview-tabstrip-tabs';
            tabStripCreate.className = 'tabview-tabstrip-create';
            tabStripCreateButton.className = 'tabview-tabstrip-create-button';

            contentElement.appendChild(tabview);
            if (config.icon == false) {
                toolbarElement.replaceChild(tabStrip, toolbarInfo);
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

            addEventListener('dragstart', (e) => {
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
                    listeners[event].forEach(listener => listener(detail));
                }
            }

            class Tab {
                constructor(config = {
                    active: true,
                    icon: true
                }) {
                    // Initialize tab
                    this.tab = document.createElement('div');
                    this.tabInfo = document.createElement('div');
                    this.tabIcon = document.createElement('div');
                    this.tabHeader = document.createElement('div');
                    this.tabClose = document.createElement('div');
                    this.tabviewItem = document.createElement('div');

                    this.id = randomID();
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

                    var dragStart = (e) => {
                        if (this.tabClose.contains(e.target)) return;
                        this.focus();
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                        }
                        originalPosition = order.indexOf(this.id);
                        currentPosition = order.indexOf(this.id);
                        this.tab.style.transition = 'none';
                        dragging = true;
                        startX = e.pageX;
                    }

                    var dragMove = (e) => {
                        if (!dragging) return;
                        try {
                            document.getSelection().removeAllRanges();
                        } catch (e) { };
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                        }
                        var x = e.pageX - startX;
                        var unit = this.tab.offsetWidth + 8;
                        var count = Math.round(x / unit);

                        console.log(config.tabAnimation)

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

                    var dragEnd = () => {
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
                    this.tabHeader.innerHTML = header;
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

        async function load(path) {
            const filePath = fsUtils.resolve(ctx.__dirname, path);
            let code = await fs.getFileAsText(filePath);
            code = `const {document,browserWindow}=this;\n${code}`;
            wrt.runCode(code, {
                __filename: filePath,
                // Proxy document
                document: new Proxy(document, {
                    get: (target, prop) => {
                        switch (prop) {
                            case 'damn':
                                return 'Damn man!';
                            case 'head':
                                return shadowRoot;
                            case 'documentElement':
                                return shadowRoot.querySelector('.window');
                            case 'body':
                                return shadowRoot.querySelector('.window-content');
                            case 'write':
                                return () => {
                                    console.error('Missing permissions to access %cdocument.write', 'background: rgb(30,30,30);color:#ededed;border-radius:8px;padding:6px 8px;')
                                };
                            case 'addEventListener':
                                return (event, callback) => { shadowRoot.addEventListener(event, callback) };
                            case 'removeEventListener':
                                return (event, callback) => { shadowRoot.removeEventListener(event, callback) };
                            case 'querySelector':
                                return selector => { return shadowRoot.querySelector(selector) };
                            case 'querySelectorAll':
                                return selector => { return shadowRoot.querySelectorAll(selector) };
                            default:
                                if (target[prop]) {
                                    const value = Reflect.get(target, prop);
                                    return typeof value === 'function' ? value.bind(document) : value;
                                } else {
                                    return undefined;
                                }
                        }
                    },
                    set: (target, prop, value) => {

                    }
                }),
                // browserWindow
                browserWindow
            });
        }

        return { load };
    }

    createBrowserWindow.prototype._ = '';

    return { create: createBrowserWindow, setPromise: (rs, rj) => {
        resolve = rs;
        reject = rj;
    }};
}