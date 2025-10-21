import { IDBFS } from "../../../shared/fs.js";
import { EventEmitter, getPosition, getStackTrace, randomID } from "../../../shared/utils.js";
import { fallbackImage } from "../../core/fallback.js";
import Logger from "../../core/log.js";
import timer from "../../core/timer.js";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";
import { BrowserWindow } from "../../system/WApplication/browserWindow.js";
import StartMenu from "./startMenu.js";
import Taskview from "./taskview.js";

export default async function IconManager({ taskbarIconsApps, taskbarIconsItems, taskbarIcons }) {
    timer.group('Icon Manager');

    const fs = IDBFS('~EXPLORER');
    const System = ModuleManager.get('System');
    const WindowManager = ModuleManager.get('WindowManager');
    const appRegistry = System.appRegistry;
    const systemItemOptions = {
        start: {
            display: true,
            icon: {
                light: 'C:/Winbows/icons/applications/tools/start.ico',
                dark: 'C:/Winbows/icons/applications/tools/start2.ico'
            },
            handler: StartMenu
        },
        search: {
            display: false,
            icon: {
                light: 'C:/Winbows/icons/applications/tools/search.ico',
                dark: 'C:/Winbows/icons/applications/tools/search2.ico'
            }
        },
        taskview: {
            display: true,
            icon: {
                light: 'C:/Winbows/icons/applications/tools/taskview.ico',
                dark: 'C:/Winbows/icons/applications/tools/taskview2.ico'
            },
            handler: Taskview
        },
        widgets: {
            display: false,
            icon: 'C:/Winbows/icons/applications/tools/widgets.ico'
        }
    }
    const pinnedIcons = [
        'explorer', 'edge', 'store', 'cmd', 'info'
    ]

    const downEvts = ["mousedown", "touchstart", "pointerdown"];
    const thumbnailContainer = document.createElement("div");
    const thumbnailSetting = {
        maxWidth: 192,
        maxHeight: 108,
        padding: {
            top: 8,
            bottom: 8,
            left: 8,
            right: 8
        }
    }
    let currentThumbnail = {};
    let overThumbnailWindow = false;
    let autoHideThumbnail = true;

    thumbnailContainer.className = "thumbnail-container";
    viewport.screenElement.appendChild(thumbnailContainer);

    function createThumbnailWindow(app, id) {
        const thumbnailWindow = document.createElement("div");
        const thumbnailBar = document.createElement("div");
        const thumbnailIcon = document.createElement("div");
        const thumbnailTitle = document.createElement("div");
        const thumbnailView = document.createElement("div");
        const thumbnailCloseButton = document.createElement("div");

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
        fs.getFileURL(app.icon).then(url => {
            thumbnailIcon.style.backgroundImage = `url(${url})`;
        })
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
            if (autoHideThumbnail == true) {
                overThumbnailWindow = false;
                setTimeout(() => {
                    hideThumbnailWindow();
                }, 200);
            }
        })

        thumbnailCloseButton.addEventListener("click", () => {
            currentThumbnail.close(id);
            thumbnailWindow.remove();
            updateThumbnailPosition();
            if (Object.values(currentThumbnail.windows).length == 0) {
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
        let el = currentThumbnail.iconEl;
        let left = getPosition(el).x + el.offsetWidth / 2 - thumbnailContainer.offsetWidth / 2;
        if (left < 8) {
            left = 8;
        } else if (left + thumbnailContainer.offsetWidth > viewport.width - 8) {
            left = viewport.height - thumbnailContainer.offsetWidth - 8;
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

        Object.keys(app.windows).forEach(id => {
            createThumbnailWindow(app.windows[id], id);
        })
        updateThumbnailPosition();

        thumbnailContainer.classList.add('active');
    }

    function hideThumbnailWindow(force = false) {
        if (overThumbnailWindow == true && force == false) return;
        overThumbnailWindow = false;
        autoHideThumbnail = true;
        thumbnailContainer.classList.remove('active');
        thumbnailContainer.innerHTML = '';
    }

    downEvts.forEach(event => {
        window.addEventListener(event, (e) => {
            if (!thumbnailContainer.contains(e.target)) {
                hideThumbnailWindow(true);
            }
        })
    })

    let focusedIconIds = [];        // App icons and system icons
    let lastClickedIconId = null;   // App icons and system icons
    let activeWindows = [];         // App icons only
    let iconRepository = {};        // AppID => Icon

    class Icon extends EventEmitter {
        constructor(iconData) {
            super();

            this.type = iconData.type == 'system' ? 'system' : 'app';
            this.owner = iconData.owner;
            this.windows = {};
            this.status = {
                enabled: iconData.status?.enabled || false, // Indicates that the application corresponding to the icon is running
                active: iconData.status?.active || false,   // Show window once status.active is true
                focused: iconData.status?.focused || false  // Show window on the top once status.focused is true
            }
            this.target = this.type === 'app' ? iconData.target : null;

            // data-show -> status.active
            // data-focused -> status.focused
            // data-opened -> status.enabled
            // data-openable -> type !== 'system'

            this.iconEl = document.createElement('div');
            this.iconImageEl = document.createElement('div');
            this.iconEl.className = 'taskbar-icon';
            this.iconImageEl.className = 'taskbar-icon-image';
            this.iconEl.appendChild(this.iconImageEl);

            if (typeof iconData.icon === 'string') {
                this.iconImageEl.style.backgroundImage = `url(${iconData.icon})`;
            } else {
                this.iconImageEl.style.backgroundImage = `url(${iconData.icon[System.theme.get()]})`;
                System.theme.onChange(theme => {
                    this.iconImageEl.style.backgroundImage = `url(${iconData.icon[theme]})`;
                })
            }

            if (this.type === 'system') {
                this.iconEl.setAttribute('data-openable', false);
                this.iconEl.addEventListener('click', (e) => {
                    if (this.status.enabled == false) {
                        this.open();
                        lastClickedIconId = null;
                        return;
                    }
                    this.close();
                    lastClickedIconId = null;
                    return;
                })
                taskbarIconsItems.appendChild(this.iconEl);
                return;
            } else {
                this.iconEl.setAttribute('data-openable', true);
                this.iconEl.addEventListener('click', (e) => {
                    if (this.status.enabled == false) {
                        System.shell.execCommand(`"${this.target}"`);
                        return;
                    }

                    if (Object.keys(this.windows).length > 1) {
                        overThumbnailWindow = true;
                        autoHideThumbnail = false;
                        showThumbnailWindow(this);
                        return;
                    }

                    if (lastClickedIconId == this.owner) {
                        this.iconEl.setAttribute('data-toggle', 'self');
                        if (this.status.active == true) {
                            this.hide(Object.keys(this.windows)[0]);
                        } else {
                            this.show(Object.keys(this.windows)[0]);
                        }
                    } else {
                        this.iconEl.removeAttribute('data-toggle');
                        this.show(Object.keys(this.windows)[0]);
                    }
                    lastClickedIconId = this.owner;
                })
                taskbarIconsApps.appendChild(this.iconEl);
            }

            this.iconEl.addEventListener("pointerover", () => {
                if (Object.values(this.windows).length == 0) return;
                if (autoHideThumbnail == false) return;
                overThumbnailWindow = true;
                showThumbnailWindow(this);
            })

            this.iconEl.addEventListener("pointerout", () => {
                if (autoHideThumbnail == false) return;
                overThumbnailWindow = false;
                setTimeout(() => {
                    hideThumbnailWindow();
                }, 200)
            })

            iconRepository[this.owner] = this;
        }

        /**
         * @param {BrowserWindow} win 
         * @returns 
         */
        open(win) {
            if (this.type === 'system') {
                this.status.enabled = true;
                this.focus();
                this.update();
                this._emit('open');
                return;
            }

            const id = win?.id;
            if (this.windows[id]) return;
            this.windows[id] = {
                ...win,
                active: true,
                focused: true,
                owner: this.owner
            }

            focusedIconIds.push({
                id: id,
                icon: this
            })

            win.on('focus', () => {
                this.focus(id, true);
            });
            win.on('minimize', () => {
                this.hide(id, true);
            })
            win.on('change:title', e => {
                this.windows[id].title = e.value;
            })
            win.taskbarIconElement = this.iconEl;
            this.focus(id);
            this.status.active = true;
            this.status.enabled = true;
            this.update();
        }
        close(winId, passive = false) {
            if (!this.status.enabled) return;
            if (this.type === 'system') {
                this.status.active = false;
                this.status.focused = false;
                this.status.enabled = false;
                this.update();
                this._emit('close');

                if (focusedIconIds.length > 0 && passive == false) {
                    const obj = focusedIconIds[focusedIconIds.length - 1];
                    obj.icon.focus(obj.id);
                }
                return;
            }

            const win = this.windows[winId];
            if (win) {
                delete this.windows[winId];
                win.close();
                focusedIconIds = focusedIconIds.filter(o => o.id != winId);
            }

            if (Object.keys(this.windows) == 0) {
                lastClickedIconId = null;
                this.iconEl.removeAttribute('data-toggle');

                this.status.active = false;
                this.status.focused = false;
                this.status.enabled = false;
                this.update();
                if (!pinnedIcons.find(icon => icon.appId == this.owner)) {
                    this.destroy();
                }
            }

            if (focusedIconIds.length > 0) {
                const obj = focusedIconIds[focusedIconIds.length - 1];
                obj.icon.focus(obj.id);
            }
        }
        show(winId) {
            const win = this.windows[winId];
            if (win) {
                win.unminimize();
            }

            Object.values(iconRepository).forEach(icon => {
                if (icon.owner === this.owner) return;
                icon.blur();
            })

            this.status.active = true;
            this.status.focused = true;
            this.update();

            this.focus(winId, true);
        }
        hide(winId, passive = false) {
            const win = this.windows[winId];
            if (win && passive == false) {
                win.minimize();
            }

            this.status.active = false;
            this.status.focused = false;
            this.update();

            focusedIconIds = focusedIconIds.filter(o => o.id != winId);
            if (focusedIconIds.length > 0) {
                const obj = focusedIconIds[focusedIconIds.length - 1];
                obj.icon.focus(obj.id);
            }
        }
        focus(winId, force = false) {
            const win = this.windows[winId];
            if (win && (force == false ? focusedIconIds.findIndex(o => o.id == winId) !== focusedIconIds.length - 1 : true)) {
                win.focus();
                focusedIconIds = focusedIconIds.filter(o => o.id != winId);
                focusedIconIds.push({
                    id: winId,
                    icon: this
                })
            }

            Object.values(iconRepository).forEach(icon => {
                if (icon.owner === this.owner) return;
                icon.blur();
            })

            if (this.type !== 'system') {
                lastClickedIconId = this.owner;
            }
            this.status.focused = true;
            this.update();
            this._emit('focus');
        }
        blur() {
            this.status.focused = false;
            this.update();
            this._emit('blur');
        }
        update() {
            this.iconEl.setAttribute('data-focused', this.status.focused);
            this.iconEl.setAttribute('data-show', this.status.active);
            this.iconEl.setAttribute('data-opened', this.status.enabled);
        }
        destroy() {
            if (
                this.type !== 'app' ||
                pinnedIcons.find(icon => icon.appId == this.owner)
            ) return;

            lastClickedIconId = null;
            delete iconRepository[this.owner];
            this.iconEl.classList.add('hide');
        }
    }

    for (const key of Object.keys(systemItemOptions)) {
        try {
            const icon = systemItemOptions[key].icon;
            if (typeof icon === 'string') {
                systemItemOptions[key].icon = await fs.getFileURL(icon);
            } else {
                for (const theme of Object.keys(icon)) {
                    systemItemOptions[key].icon[theme] = await fs.getFileURL(icon[theme]);
                }
            }
        } catch (e) {
            systemItemOptions[key].icon = fallbackImage;
        }
    }

    for (let i = 0; i < pinnedIcons.length; i++) {
        const appData = appRegistry.getInfoByName(pinnedIcons[i]);
        pinnedIcons[i] = appRegistry.generateProfile(appData.appName, appData.basePath, appData.entryScript);
        pinnedIcons[i].preloadedIcon = await fs.getFileURL(pinnedIcons[i].icon);
    }

    async function init() {
        function delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        const appCount = Object.values(systemItemOptions).filter(item => item.display == true).concat(pinnedIcons).length;
        taskbarIcons.style.width = appCount * 40 + (appCount - 1) * 4 + 'px';

        // System icons
        for (const key of Object.keys(systemItemOptions)) {
            const config = systemItemOptions[key];
            if (config.display === true) {
                const icon = new Icon({
                    type: 'system',
                    owner: '__EXPLORER__.__TASKBAR__.' + key.toUpperCase(),
                    icon: config.icon
                })
                if (config.handler) {
                    const { open, close } = await config.handler(icon);
                    icon.on('open', open);
                    icon.on('close', close);
                }
                await delay(40);
            }
        }

        // Pinned app icons
        for (let i = 0; i < pinnedIcons.length; i++) {
            new Icon({
                type: 'app',
                owner: pinnedIcons[i].appId,
                icon: pinnedIcons[i].preloadedIcon,
                target: pinnedIcons[i].entryScript
            });
            await delay(50);
        }

        taskbarIcons.style.width = 'revert-layer';
    }

    timer.groupEnd();

    return {
        init,
        async getIcon(appData) {
            const appId = appData.appId;
            if (!iconRepository[appId]) {
                iconRepository[appId] = new Icon({
                    type: appData.type,
                    owner: appId,
                    icon: await fs.getFileURL(appData.icon),
                });
            }
            return iconRepository[appId];
        },
        getIconByWinID(winId) {
            const icons = Object.values(iconRepository);
            for (let i = 0; i < icons.length; i++) {
                if (icons[i].windows[winId]) {
                    return icons[i];
                }
            }
            return null;
        }
    }
}