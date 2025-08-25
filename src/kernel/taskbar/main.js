import { IDBFS } from "../../lib/fs.js";
import WinUI from "../../ui/winui.js";

const fs = IDBFS("C:/Winbows/System/kernel/kernel.js");
const pointerDownEvts = ["mousedown", "touchstart", "pointerdown"];



// =================== Taskbar =================== //


// ================= Start Menu ================= //


// ================ Control Panel ================ //




!(async () => {
    // Start Menu
    var pinnedList = [
        {
            name: 'File Explorer',
            app: 'explorer'
        }, {
            name: 'Edge',
            app: 'edge'
        }, {
            name: 'VSCode',
            app: 'code'
        }, {
            name: 'Command',
            app: 'cmd'
        }, {
            name: 'Paint',
            app: 'paint'
        }, {
            name: 'Info',
            app: 'info'
        }, {
            name: 'Task Manager',
            app: 'taskmgr'
        }, {
            name: 'FPS Meter',
            app: 'fpsmeter'
        }, {
            name: 'Photos',
            app: 'photos'
        },/* {
                name: 'Edge BETA',
                app: 'edgebeta'
            },*/ {
            name: 'Network Listener',
            app: 'network-listener'
        }, {
            name: 'JSON Viewer',
            app: 'json-viewer'
        }, {
            name: 'Notepad',
            app: 'notepad'
        }, {
            name: 'Settings',
            app: 'settings'
        }
    ];
    pinnedList.forEach(pinned => {
        var info = window.appRegistry.getInfo(pinned.app);
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');
        item.className = 'start-menu-pinned-app';
        itemIcon.className = 'start-menu-pinned-app-icon';
        itemName.className = 'start-menu-pinned-app-name';

        itemName.innerHTML = utils.replaceHTMLTags(pinned.name);
        fs.getFileURL(info.icon).then(url => {
            itemIcon.style.backgroundImage = `url(${url})`;
        })

        item.addEventListener('click', (e) => {
            const wrt = new WRT(WRT.defaultCwd);
            wrt.runFile(info.script);
            iconRepository.start.hide();
        })

        pinnedApps.appendChild(item);
        item.appendChild(itemIcon);
        item.appendChild(itemName);
    })
})();

/**
 * TODO: Rewrite Taskbar APIs
 */

const Taskbar = {
    iconManager: {
        pinnedApps: [],
        pinApp: () => { },
        unpinApp: () => { },
        isPinned: () => { },
        createIcon: () => { },
        preloadImage: () => { },
        init: () => { }
    }
}






// Status
var focused = null;         // For all
var lastClicked = null;     // For all
var activeWindows = [];     // Only for apps, not for items
var iconRepository = {};
var idDatas = {};
var maxIndex = 0;

function getID(app) {
    var arr = [];
    Object.keys(idDatas).forEach(key => {
        if (idDatas[key] == app) {
            arr.push(key);
        }
    })
    return arr;
}

function updateStatus() {
    Object.values(iconRepository).forEach(icon => {
        if (icon.type == 'item') {
            icon.blur();
        } else if (!Object.values(idDatas).includes(icon.owner)) {
            icon._hide(null);
        } else if (!getID(icon.owner).includes(activeWindows[activeWindows.length - 1]) || focused != null) {
            icon.blur();
        }
    })
    if (focused) {
        iconRepository[idDatas[focused]]._show(focused);
    } else if (activeWindows.length > 0 && iconRepository[idDatas[activeWindows[activeWindows.length - 1]]]) {
        iconRepository[idDatas[activeWindows[activeWindows.length - 1]]].focus([activeWindows[activeWindows.length - 1]]);
    }
}

!(() => {
    var temp = [];
    controlToggleDesktop.addEventListener('click', () => {
        if (activeWindows.length > 0) {
            temp = activeWindows;
            activeWindows.forEach((id) => {
                try {
                    iconRepository[idDatas[id]].hide(id);
                } catch (e) {
                    activeWindows = activeWindows.filter(obj => obj != id);
                    console.log(e);
                }
            })
        } else {
            temp.forEach(id => {
                try {
                    iconRepository[idDatas[id]].show(id);
                } catch (e) {
                    console.log(e);
                }
            })
            temp = [];
        }
    })
})();

function runItem(name, e = {}) {
    if (e.type == 'hide') {
        if (name == 'start') {
            startMenuContainer.classList.remove('active');
        } else if (name == 'search') {

        } else if (name == 'taskview') {
            taskview.start();
        }
    } else {
        if (name == 'start') {
            startMenuContainer.classList.toggle('active');
        } else if (name == 'search') {

        } else if (name == 'taskview') {
            taskview.exit();
        }
    }
}

function isSelf(owner) {
    if (getID(owner).includes(activeWindows[activeWindows.length - 1]) || lastClicked == owner) {
        return true;
    } else {
        return false;
    }
}

function getThumbnailWindowRatio(parent, pt = false) {
    return {
        x: pt == true ? parent.offsetWidth / thumbnailSetting.maxWidth : thumbnailSetting.maxWidth / parent.offsetWidth,
        y: pt == true ? parent.offsetHeight / thumbnailSetting.maxHeight : thumbnailSetting.maxHeight / parent.offsetHeight
    }
}

var thumbnailContainer = document.createElement("div");
var thumbnailSetting = {
    maxWidth: 192,
    maxHeight: 108,
    padding: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8
    }
}
var currentThumbnail = {};
var overThumbnailWindow = false;

thumbnailContainer.className = "thumbnail-container";
window.Winbows.Screen.appendChild(thumbnailContainer);

function createThumbnailWindow(app, id) {
    var thumbnailWindow = document.createElement("div");
    var thumbnailBar = document.createElement("div");
    var thumbnailIcon = document.createElement("div");
    var thumbnailTitle = document.createElement("div");
    var thumbnailView = document.createElement("div");
    var thumbnailCloseButton = document.createElement("div");

    thumbnailWindow.className = "thumbnail-window";
    thumbnailView.className = "thumbnail-window-view";
    thumbnailBar.className = "thumbnail-window-bar";
    thumbnailIcon.className = "thumbnail-window-icon";
    thumbnailTitle.className = "thumbnail-window-title";
    thumbnailCloseButton.className = "thumbnail-window-close-button";
    thumbnailCloseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>`;

    thumbnailContainer.appendChild(thumbnailWindow);
    thumbnailWindow.appendChild(thumbnailBar);
    thumbnailWindow.appendChild(thumbnailView);
    thumbnailBar.appendChild(thumbnailIcon);
    thumbnailBar.appendChild(thumbnailTitle);
    thumbnailBar.appendChild(thumbnailCloseButton);

    // Thumbnail info
    thumbnailIcon.style.backgroundImage = `url(${app.icon})`;
    thumbnailTitle.innerHTML = app.title;

    // Thumbnail styles
    thumbnailWindow.style.padding = `${thumbnailSetting.padding.top}px ${thumbnailSetting.padding.right}px ${thumbnailSetting.padding.bottom}px ${thumbnailSetting.padding.left}px`;
    thumbnailWindow.style.maxWidth = `${thumbnailSetting.padding.right + thumbnailSetting.padding.left + thumbnailSetting.maxWidth}px`
    thumbnailView.style.maxWidth = thumbnailSetting.maxWidth + "px";
    thumbnailView.style.maxHeight = thumbnailSetting.maxHeight + "px";
    thumbnailView.style.width = '999px';
    thumbnailView.style.height = '999px';

    thumbnailWindow.addEventListener("pointerover", () => {
        overThumbnailWindow = true;
    })

    thumbnailWindow.addEventListener("pointerleave", () => {
        overThumbnailWindow = false;
        setTimeout(() => {
            hideThumbnailWindow();
        }, 200);
    })

    thumbnailCloseButton.addEventListener("click", () => {
        console.log(currentThumbnail.getRegistry(id))
        currentThumbnail.getRegistry(id)[id].close();
        thumbnailWindow.remove();
        updateThumbnailPosition();
        if (Object.values(currentThumbnail.getRegistry()).length == 0) {
            overThumbnailWindow = false;
            hideThumbnailWindow();
        }
    });

    thumbnailWindow.addEventListener("click", (e) => {
        if (e.target == thumbnailCloseButton || thumbnailCloseButton.contains(e.target)) return;
        currentThumbnail.show(id);
        hideThumbnailWindow(true);
    })
}

function updateThumbnailPosition() {
    if (!currentThumbnail) return;
    var item = currentThumbnail.item;
    var left = utils.getPosition(item).x + item.offsetWidth / 2 - thumbnailContainer.offsetWidth / 2;
    if (left < 8) {
        left = 8;
    } else if (left + thumbnailContainer.offsetWidth > window.innerWidth - 8) {
        left = window.innerWidth - thumbnailContainer.offsetWidth - 8;
    }
    thumbnailContainer.style.left = left + "px";
}

function showThumbnailWindow(app) {
    /*
    var ratio = getThumbnailWindowRatio(app.elements.window, true);
    var scale = getThumbnailWindowRatio(app.elements.window).x;
    if (ratio.x < ratio.y) {
        scale = getThumbnailWindowRatio(app.elements.window).y;
    }
    var cloneNode = app.elements.window.cloneNode(true);
    cloneNode.style.position = "static";
    cloneNode.style.transform = `scale(${scale})`;
    cloneNode.style.opacity = "1";
    thumbnailView.appendChild(cloneNode);
 
    thumbnailView.style.maxWidth = thumbnailSetting.maxWidth + "px";
    thumbnailView.style.maxHeight = thumbnailSetting.maxHeight + "px";
    thumbnailView.style.width = cloneNode.offsetWidth * scale + "px";
    thumbnailView.style.height = cloneNode.offsetHeight * scale + "px";
    thumbnailWindow.style.maxWidth = cloneNode.offsetWidth * scale + thumbnailSetting.padding.left + thumbnailSetting.padding.right + "px";
    */
    if (!app) return;

    currentThumbnail = app;
    thumbnailContainer.innerHTML = '';

    var registry = app.getRegistry();

    Object.keys(registry).forEach(id => {
        createThumbnailWindow(registry[id], id)
    })

    updateThumbnailPosition();

    thumbnailContainer.classList.add('active');
}

function hideThumbnailWindow(force = false) {
    if (overThumbnailWindow == true && force == false) return;
    overThumbnailWindow = false;
    thumbnailContainer.classList.remove('active');
    thumbnailContainer.innerHTML = '';
}

let appIconOrder = [];

Object.defineProperty(window, 'Taskbar', {
    value: {}
})
Object.defineProperties(window.Taskbar, {
    'pinnedApps': {
        value: ['C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wrt', 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt', 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wrt']
    },
    'pinApp': {
        value: (name) => {
            if (window.appRegistry.exists(name) && !window.Taskbar.pinnedApps.includes(name)) {
                window.Taskbar.pinnedApps.push(name);
            }
        },
        writable: false,
        configurable: false
    },
    'unpinApp': {
        value: (name) => {
            if (window.Taskbar.pinnedApps.includes(name)) {
                window.Taskbar.pinnedApps.splice(window.Taskbar.pinnedApps.indexOf(name), 1);
            }
        },
        writable: false,
        configurable: false
    },
    'isPinned': {
        value: (path) => {
            return window.Taskbar.pinnedApps.includes(path);
        },
        writable: false,
        configurable: false
    },
    'createIcon': {
        value: async (icon, callback = () => { }, init = false) => {
            console.log(icon)
            var type = icon.category == 'item' ? 'item' : 'app';
            var owner = icon.name;
            var registry = {};

            icon.status = icon.status || {};

            if (iconRepository.hasOwnProperty(owner)) {
                return iconRepository[owner];
            }

            var status = {
                opened: icon.status.opened || false,    // Window opened
                show: icon.status.show || false,        // Whether to show the window 
                focused: icon.status.focused || true    // Window is focused
            }
            var listeners = {};
            var item = document.createElement('div');
            var itemImage = document.createElement('div');
            item.className = 'taskbar-item';
            itemImage.className = 'taskbar-icon';
            if (typeof icon.icon === 'string') {
                itemImage.style.backgroundImage = `url(${icon.icon})`;
            } else {
                itemImage.style.backgroundImage = `url(${icon.icon[window.System.theme.get()]})`;
                window.System.theme.onChange(theme => {
                    itemImage.style.backgroundImage = `url(${icon.icon[theme]})`;
                })
            }
            item.appendChild(itemImage);

            if (icon.category != 'item') {
                appIconOrder.push({
                    itemElement: item,
                    ts: Date.now(),
                    transformX: 0
                });

                !(() => {
                    let startX = 0;
                    let startY = 0;
                    let pointerDown = false;
                    let dragging = false;
                    let lastDX = 0;

                    function handleStart(e) {
                        if (e.button != 0) return;
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                            e.pageY = touch.pageY;
                        }
                        if (typeof e.cancelable !== "boolean" || e.cancelable) {
                            e.preventDefault();
                        }
                        startX = e.pageX;
                        startY = e.pageY;
                        pointerDown = true;
                        dragging = false;
                    }

                    function handleMove(e) {
                        if (!pointerDown) return;
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                            e.pageY = touch.pageY;
                        }
                        if (typeof e.cancelable !== "boolean" || e.cancelable) {
                            e.preventDefault();
                        }
                        var dx = e.pageX - startX;
                        var dy = e.pageY - startY;
                        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                            dragging = true;
                        }
                        if (dragging == true) {
                            let index = appIconOrder.findIndex(x => x.itemElement == item);
                            let di = Math.round(dx / 44);
                            if (index + Math.ceil(dx / 44) > appIconOrder.length - 1) {
                                dx = (appIconOrder.length - 1 - index) * 44;
                            }
                            if (index + Math.floor(dx / 44) < 0) {
                                dx = -index * 44;
                            }
                            di = Math.round(dx / 44);
                            item.setAttribute('data-dragging', true);
                            item.style.pointerEvents = 'none';
                            item.style.transition = 'none';
                            item.style.transform = `translateX(${appIconOrder[index].transformX + dx}px)`;
                            //console.log(di);
                            appIconOrder.forEach((item, i) => {
                                if (index != i && (di < 0 ? di + index <= i && i < index : di + index >= i && i > index)) {
                                    item.itemElement.style.transform = `translateX(${item.transformX + (di < 0 ? 44 : -44)}px)`;
                                } else if (index != i) {
                                    item.itemElement.style.transform = `translateX(${item.transformX}px)`;
                                }
                            })
                            lastDX = dx;
                        }
                    }

                    function handleEnd(e) {
                        pointerDown = false;
                        if (dragging == true) {
                            dragging = false;
                            let finalDIndex = Math.round(lastDX / 44);
                            let finalDX = finalDIndex * 44;
                            let index = appIconOrder.findIndex(x => x.itemElement == item);
                            if (index + Math.ceil(lastDX / 44) > appIconOrder.length - 1) {
                                lastDX = (appIconOrder.length - 1 - index) * 44;
                            }
                            if (index + Math.floor(lastDX / 44) < 0) {
                                lastDX = -index * 44;
                            }
                            finalDIndex = Math.round(lastDX / 44);
                            appIconOrder.forEach((item, i) => {
                                if (index == i) {
                                    item.transformX += finalDX;

                                } else if (finalDIndex < 0 ? finalDIndex + index <= i && i <= index : finalDIndex + index >= i && i > index) {
                                    item.transformX += finalDIndex < 0 ? 44 : -44;
                                }
                                item.itemElement.style.transform = `translateX(${item.transformX}px)`;
                            })
                            item.style.pointerEvents = 'auto';
                            item.style.transition = 'revert-layer';
                            item.removeAttribute('data-dragging');
                            if (finalDIndex != 0) {
                                let obj = appIconOrder[index];
                                console.log(obj.itemElement)
                                appIconOrder.splice(index, 1);
                                appIconOrder.splice(index + finalDIndex, 0, obj);
                                console.log(appIconOrder);
                            }
                        }
                    }

                    const events = {
                        "start": ["mousedown", "touchstart", "pointerdown"],
                        "move": ["mousemove", "touchmove", "pointermove"],
                        "end": ["mouseup", "touchend", "pointerup", "blur"]
                    }

                    events.start.forEach(event => {
                        item.addEventListener(event, handleStart, {
                            passive: false
                        });
                    })
                    events.move.forEach(event => {
                        window.addEventListener(event, handleMove, {
                            passive: false
                        });
                    })
                    events.end.forEach(event => {
                        window.addEventListener(event, handleEnd);
                    })
                })();
            }

            var properties = {
                status, type, owner, icon, item, itemImage,
                open, close, show, hide, addEventListener, focus, blur, updateWindowStatus,
                getRegistry,
                _show, _hide,
                changeIcon, changeTitle,
                setMaxZIndex, getMaxZIndex
            }

            function getRegistry() {
                return registry;
            }

            function getMaxZIndex() {
                return maxIndex;
            }

            function setMaxZIndex(value) {
                maxIndex = value;
            }

            function open(obj) {
                var id = '';
                if (type != 'item') {
                    try {
                        var exist = false;
                        id = generateID();
                        Object.values(registry).forEach((item, i) => {
                            if (item.browserWindow == obj.browserWindow) {
                                exist = true;
                            }
                        })
                        if (exist == false) {
                            registry[id] = {
                                pid: obj.pid,
                                browserWindow: obj.browserWindow,
                                shadowRoot: obj.shadowRoot,
                                close: obj.close,
                                opened: true,
                                show: true,
                                focused: true,
                                icon: icon.icon,
                                owner: owner,
                                title: icon.title || 'App'
                            };
                        }
                        maxIndex++;
                        registry[id].browserWindow.style.zIndex = maxIndex;
                        status.opened = true;
                        lastClicked = owner;
                        item.setAttribute('data-opened', status.opened);
                        idDatas[id] = owner;
                        show(id);
                        activeWindows = activeWindows.filter(item => item !== id);
                        if (type != 'item') {
                            activeWindows.push(id);
                        }
                        if (obj.mica == true) {
                            var active = obj.browserWindow.classList.contains('active');
                            const observer = new MutationObserver((mutationsList) => {
                                for (const mutation of mutationsList) {
                                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                                        var temp = obj.browserWindow.classList.contains('active');
                                        if (active != temp) {
                                            //obj.browserWindow.classList.remove('mica');
                                            active = temp;
                                        }
                                        setTimeout(() => {
                                            if (obj.browserWindow.classList.contains('active')) {
                                                obj.browserWindow.classList.add('mica');
                                            }
                                        }, 101);
                                    }
                                }
                            });

                            observer.observe(obj.browserWindow, {
                                attributes: true,
                                attributeFilter: ['class']
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    };
                }
                triggerEvent('open', {
                    type: 'open'
                });
                updateStatus();
                return id;
            }

            function close(id) {
                if (!registry.hasOwnProperty(id)) {
                    if (window.modes.debug == true) {
                        console.log(`WINDOW ID [ ${id} ] NOT FOUND`);
                    }
                    return;
                }
                item.removeAttribute('data-toggle');
                if (type != 'item') {
                    const browserWindow = registry[id].browserWindow;
                    const pid = registry[id].pid;
                    const isLast = Object.values(registry).length == 1;
                    if (isLast == true) {
                        status.opened = false;
                        item.setAttribute('data-opened', status.opened);
                    }
                    blur(id);
                    // close window
                    browserWindow.classList.remove('active');
                    //browserWindow.classList.remove('mica');
                    browserWindow.style.transform = 'scale(.8)';
                    if (!window.Taskbar.isPinned(owner) && isLast == true) {
                        item.classList.add('hide');
                        let index = appIconOrder.findIndex(x => x.itemElement == item);
                        let iconGeneratedTime = appIconOrder[index].ts;
                        let transformX = appIconOrder[index].transformX;
                        appIconOrder.splice(index, 1);
                        console.trace(icon);
                        appIconOrder.forEach((item, i) => {
                            if (iconGeneratedTime < item.ts && index > i) {
                                item.transformX += 44;
                            }
                            if (iconGeneratedTime > item.ts && index <= i) {
                                item.transformX -= 44;
                            }
                            item.itemElement.style.transform = `translateX(${item.transformX}px)`;
                        })
                        //console.log(appIconOrder)
                        /*
                        function hide() {
                            let start = Date.now();
                            let fn = t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
                            function animate() {
                                let d = Date.now() - start;
                                if (d > 300) return cancelAnimationFrame(animate);
                                let p = d/300;
                                if (0 <= p && p <= .5) {
                                    item.style.transform = `translate3d(${transformX}px,${100*fn(p*2)}%)`;
                                    item.style.width = `${100*fn(p*2)}%`;
                                } else {
                                    item.style.transform = `translate3d(${transformX}px,100%)`;
                                    item.style.width = `100%`;
                                }
                                requestAnimationFrame(animate);
                            }
                            animate();
                        }
                        hide();
                        */
                    }
                    lastClicked = owner;
                    if (window.modes.debug == true) {
                        console.log(registry, id);
                    }
                    activeWindows = activeWindows.filter(item => item !== id);
                    delete registry[id];
                    delete idDatas[id];
                    if (!window.Taskbar.isPinned(owner) && Object.values(registry).length == 0) {
                        delete iconRepository[owner];
                    }
                    setTimeout(() => {
                        // remove window element
                        browserWindow.remove();
                        if (!window.Taskbar.isPinned(owner) && Object.values(registry).length == 0) {
                            item.remove();
                        }
                        if (window.System.processes[pid]) {
                            window.System.processes[pid]._exit_Window();
                        }
                    }, 300);
                }
                triggerEvent('close', {
                    type: 'close'
                });
                updateStatus();
            }

            function changeIcon(id, icon) {
                registry[id].icon = icon;
            }

            function changeTitle(id, title) {
                registry[id].title = title;
                window.System.processes[registry[id].pid].title = title || 'App';
            }

            function show(id) {
                _show(id);
                triggerEvent('show', {
                    type: 'show'
                });
                updateStatus();
            }

            function hide(id) {
                _hide(id);
                triggerEvent('hide', {
                    type: 'hide'
                });
                //updateStatus();
            }

            function focus(id) {
                if (!id) {
                    id = Object.keys(registry)[0];
                }
                Object.values(iconRepository).filter(icon => icon != properties).forEach(icon => {
                    icon.blur();
                })
                activeWindows = activeWindows.filter(item => item !== id);
                activeWindows.push(id);
                focused = id;
                status.focused = true;
                item.setAttribute('data-focused', true);
                updateWindowStatus(registry[id], 'focus');
                triggerEvent('focus', {
                    type: 'focus', id
                });
            }

            function blur(id) {
                focused = activeWindows[activeWindows.length - 1];
                status.focused = false;
                item.setAttribute('data-focused', false);
                triggerEvent('blur', {
                    type: 'blur', id
                });
            }

            function generateID() {
                var id = "";
                var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (let i = 0; i < 16; i++) {
                    id += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                if (registry.hasOwnProperty(id)) {
                    return generateID();
                }
                return id;
            }

            function addEventListener(event, listener) {
                if (!listeners.hasOwnProperty(event)) {
                    listeners[event] = [];
                }
                listeners[event].push(listener);
            }

            function triggerEvent(event, details) {
                if (listeners.hasOwnProperty(event)) {
                    listeners[event].forEach(listener => {
                        listener(details);
                    });
                }
            }

            function _show(id) {
                if (!id) {
                    id = Object.keys(registry)[0];
                }
                if (!isSelf(owner)) {
                    item.removeAttribute('data-toggle');
                }
                status.show = true;
                activeWindows = activeWindows.filter(item => item !== id);
                if (type != 'item') {
                    activeWindows.push(id);
                    focused = id;
                }
                item.setAttribute('data-show', status.show);
                updateWindowStatus(registry[id], 'show');
                focus(id);
                triggerEvent('_show', id);
            }

            function _hide(id) {
                if (!isSelf(owner)) {
                    item.removeAttribute('data-toggle');
                }
                status.show = false;
                activeWindows = activeWindows.filter(item => item !== id);
                focused = activeWindows[activeWindows.length - 1];
                item.setAttribute('data-show', status.show);
                if (id == null) return;
                updateWindowStatus(registry[id], 'hide');
                blur(id);
                triggerEvent('_hide', id);
            }

            var originalIndex = maxIndex;
            function updateWindowStatus(obj, type) {
                try {
                    if (!obj) return;
                    if (type == 'focus') {
                        if (obj.browserWindow.style.zIndex != maxIndex) {
                            maxIndex++;
                            obj.browserWindow.style.zIndex = maxIndex;
                        }
                    } else if (type == 'show') {
                        obj.browserWindow.style.zIndex = originalIndex;
                        obj.browserWindow.style.visibility = 'visible';
                        obj.browserWindow.classList.add('active');
                        obj.browserWindow.style.pointerEvents = 'all';
                    } else if (type == 'hide') {
                        originalIndex = parseInt(obj.browserWindow.style.zIndex);
                        obj.browserWindow.classList.remove('active');
                        obj.browserWindow.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (status.show == false) {
                                obj.browserWindow.style.setProperty('z-index', '-1', 'important');
                                obj.browserWindow.style.setProperty('visibility', 'hidden');
                            }
                        }, 100);
                    } else if (type == 'toggle') {
                        obj.browserWindow.classList.toggle('active');
                    }
                } catch (e) { console.log(e); }
            }

            if (icon.type == 'pinned') {
                if (type == 'item') {
                    // openable : false
                    // opened : false
                    // show : true | false
                    item.setAttribute('data-openable', false);
                    item.addEventListener('click', (e) => {
                        if (status.show == true) {
                            hide();
                        } else {
                            show();
                        }
                        lastClicked = owner;
                    })
                    taskbarItems.appendChild(item);
                } else {
                    item.setAttribute('data-openable', icon.openable);
                    item.addEventListener('click', (e) => {
                        if (status.opened == false) {
                            callback({});
                            return;
                        }
                        if (Object.keys(registry).length > 1) {
                            overThumbnailWindow = true;
                            showThumbnailWindow(properties);
                            return;
                        }
                        if (isSelf(owner) == true) {
                            item.setAttribute('data-toggle', 'self');
                            if (status.show == true) {
                                hide(Object.keys(registry)[0]);
                            } else {
                                show(Object.keys(registry)[0]);
                            }
                        } else {
                            item.removeAttribute('data-toggle');
                            show(Object.keys(registry)[0]);
                        }
                        lastClicked = owner;
                    })

                    item.addEventListener("pointerover", () => {
                        if (Object.values(registry).length == 0) return;
                        overThumbnailWindow = true;
                        showThumbnailWindow(properties);
                    })

                    item.addEventListener("pointerout", () => {
                        overThumbnailWindow = false;
                        setTimeout(() => {
                            hideThumbnailWindow();
                        }, 200)
                    })

                    taskbarApps.appendChild(item);
                }
            } else {
                addEventListener('open', () => {
                    if (type == 'item') {
                        // openable : false
                        // opened : false
                        // show : true | false
                        item.setAttribute('data-openable', false);
                        item.addEventListener('click', (e) => {
                            if (status.show == true) {
                                hide();
                            } else {
                                show();
                            }
                            lastClicked = owner;
                        })
                        taskbarItems.appendChild(item);
                    } else {
                        item.setAttribute('data-openable', icon.openable);
                        item.addEventListener('click', (e) => {
                            if (status.opened == false) {
                                callback({});
                                return;
                            }
                            if (Object.keys(registry).length > 1) {
                                overThumbnailWindow = true;
                                showThumbnailWindow(properties);
                                return;
                            }
                            if (isSelf(owner) == true) {
                                item.setAttribute('data-toggle', 'self');
                                if (status.show == true) {
                                    hide(Object.keys(registry)[0]);
                                } else {
                                    show(Object.keys(registry)[0]);
                                }
                            } else {
                                item.removeAttribute('data-toggle');
                                show(Object.keys(registry)[0]);
                            }
                            lastClicked = owner;
                        })

                        item.addEventListener("pointerover", () => {
                            if (Object.values(registry).length == 0) return;
                            overThumbnailWindow = true;
                            showThumbnailWindow(properties);
                        })

                        item.addEventListener("pointerout", () => {
                            overThumbnailWindow = false;
                            setTimeout(() => {
                                hideThumbnailWindow();
                            }, 200)
                        })

                        taskbarApps.appendChild(item);
                    }
                })
            }

            iconRepository[owner] = properties;

            return properties;
        },
        writable: false,
        configurable: false
    },
    'preloadImage': {
        value: async () => {
            await (async () => {
                const itemsArray = Object.values(taskbarItemOptions);
                for (let i in itemsArray) {
                    const item = itemsArray[i];
                    const icon = item.icon;
                    if (typeof icon === 'string') {
                        var url = await fs.getFileURL(icon);
                        item.icon = { light: url, dark: url };
                    } else {
                        item.icon = {};
                        for (let j in Object.keys(icon)) {
                            item.icon[Object.keys(icon)[j]] = await fs.getFileURL(Object.values(icon)[j]);
                        }
                    }
                }
                return;
            })();

            await (async () => {
                for (let i in window.Taskbar.pinnedApps) {
                    var url = await fs.getFileURL(window.appRegistry.getApp(window.Taskbar.pinnedApps[i]).icon);
                    window.appRegistry.getApp(window.Taskbar.pinnedApps[i]).cachedIcon = url;
                }
                return;
            })();

            return;
        },
        writable: false,
        configurable: false
    },
    'init': {
        value: async () => {
            var appCount = Object.values(taskbarItemOptions).filter(item => item.display == true).concat(window.Taskbar.pinnedApps).length;
            taskbarIcons.style.width = appCount * 40 + (appCount - 1) * 4 + 'px';

            // Taskbar items
            for (let i in Object.keys(taskbarItemOptions)) {
                await (async (i) => {
                    var key = Object.keys(taskbarItemOptions)[i];
                    if (taskbarItemOptions[key].display == true || key == 'start') {
                        var item = await window.Taskbar.createIcon({
                            name: key,
                            icon: taskbarItemOptions[key].icon,
                            openable: false,
                            category: 'item',
                            type: 'pinned'
                        })
                        item.addEventListener('show', () => {
                            runItem(key, {
                                type: 'show'
                            });
                        })
                        item.addEventListener('hide', () => {
                            runItem(key, {
                                type: 'hide'
                            });
                        })
                    }
                    await delay(25);
                    return;
                })(i)
            }

            // Taskbar pinned apps
            for (let i in window.Taskbar.pinnedApps) {
                await (async (i) => {
                    var app = window.appRegistry.getApp(window.Taskbar.pinnedApps[i]);
                    var name = app.name;
                    var script = app.script;

                    await window.Taskbar.createIcon({
                        title: name[0].toUpperCase() + name.slice(1),
                        name: app.script,
                        icon: app.cachedIcon, //await fs.getFileURL(app.icon),
                        openable: true,
                        category: 'app',
                        type: 'pinned'
                    }, (e) => {
                        const wrt = new WRT(WRT.defaultCwd);
                        wrt.runFile(script);
                    })
                    await delay(25);
                    return;
                })(i)
            }

            Object.values(window.appRegistry.apps).forEach(app => {
                if (app.autoExecute == true) {
                    new WRT().runFile(app.script); // TODO : update the filepath of app.script
                }
            })

            taskbarIcons.style.width = 'revert-layer';
        },
        writable: false,
        configurable: false
    }
})