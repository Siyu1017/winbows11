import { getMountedSystemFS } from "../../fs/systemFs.ts";
import { getFileURL } from "../../fs/fileUrl.ts";
import { AnimationEngine } from "../../../shared/animationEngine.js";
import { EventEmitter, getPosition, safeEscape } from "../../../shared/utils.ts";
import { fallbackImage } from "../../core/fallback.js";
import timer from "../../core/timer.js";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";
import StartMenu from "./startMenu.js";
import Taskview from "./taskview.js";

export default async function IconManager({ taskbarIconsApps, taskbarIconsItems, taskbarIcons }) {
    timer.group('Icon Manager');

    const fs = getMountedSystemFS();
    const System = ModuleManager.get('System');
    //const BrowserWindow = ModuleManager.get('BrowserWindow')
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
        'explorer', 'edge', 'store', 'cmd'
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
        if (app.icon.startsWith('blob:')) {
            thumbnailIcon.style.backgroundImage = `url(${app.icon})`;
        } else {
            getFileURL(fs, app.icon).then(url => {
                thumbnailIcon.style.backgroundImage = `url(${url})`;
            }).catch(e => {
                thumbnailIcon.style.backgroundImage = `url(${fallbackImage})`;
                console.error(e)
            })
        }
        thumbnailTitle.innerHTML = safeEscape(app.title);

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

    const ICON_SIZE = 40;
    const ICON_GAP = 4;

    let lastClickedIconId = null;   // Shared
    let focusedIconIds = [];        // App icons only
    const iconRepository = {};      // AppID => Icon
    const systemIcons = [];
    const appIcons = [];

    let selectedItem = null;
    let initialPointerPos = null;
    let isReordering = false;

    function updateAppIconPositions(draggedIcon = null) {
        appIcons.forEach((icon, index) => {
            icon.setOrder(index, icon !== draggedIcon);
        });
    }

    function reorderAppIcon(draggedIcon, targetIndex) {
        const currentIndex = appIcons.indexOf(draggedIcon);
        if (currentIndex === -1 || currentIndex === targetIndex) return;

        appIcons.splice(currentIndex, 1);
        appIcons.splice(targetIndex, 0, draggedIcon);
        updateAppIconPositions(draggedIcon);
    }

    document.addEventListener('pointermove', (e) => {
        if (!initialPointerPos || !selectedItem) return;
        const containerPos = getPosition(taskbarIconsApps);
        const pointerDelta = e.clientX - initialPointerPos.x;
        isReordering = true;

        // if (Math.abs(pointerDelta) < 4) return;

        const minCenter = ICON_SIZE / 2;
        const maxCenter = taskbarIconsApps.offsetWidth - ICON_SIZE / 2;
        const pointerX = Math.min(Math.max(e.clientX - containerPos.x, minCenter), maxCenter);
        const targetIndex = Math.min(
            Math.max(Math.floor((pointerX + ICON_GAP / 2) / (ICON_SIZE + ICON_GAP)), 0),
            appIcons.length - 1
        );

        reorderAppIcon(selectedItem, targetIndex);
        selectedItem.iconEl.setAttribute('data-dragging', 'true');
        selectedItem.setDragging(true, pointerX - ICON_SIZE / 2 - selectedItem.position.x);
    })

    document.addEventListener('pointerup', (e) => {
        if (selectedItem) {
            if (isReordering) {
                e.preventDefault();
                selectedItem.suppressNextClick = true;
            }
            selectedItem.iconEl.setAttribute('data-dragging', 'false');
            selectedItem.setDragging(false);
        }
        initialPointerPos = null;
        selectedItem = null;
        isReordering = false;
    })

    class Icon extends EventEmitter {
        static apps_idx = 0;
        static system_idx = 0;
        static nextId(type) {
            return type === 'app' ? Icon.apps_idx++ : Icon.system_idx++;
        }
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

            this.id = Icon.nextId(this.type);
            this.order = this.type === 'app' ? appIcons.length : systemIcons.length;
            this.iconEl = document.createElement('div');
            this.iconImageEl = document.createElement('div');
            this.iconEl.className = 'taskbar-icon';
            this.iconImageEl.className = 'taskbar-icon-image';
            this.iconEl.appendChild(this.iconImageEl);

            this.iconEl.style.width = `${ICON_SIZE}px`;
            this.iconEl.style.height = `${ICON_SIZE}px`;
            this.position = {
                x: this.order * (ICON_SIZE + ICON_GAP),
                y: 0
            }
            this.dragOffset = 0;
            this.isDragging = false;
            this.isDestroyed = false;
            this.suppressNextClick = false;
            this.imageMotionId = 0;
            this.iconAnimation = new AnimationEngine(this.iconEl, { profile: 'taskbar-icon-enter' });
            this.imageAnimation = new AnimationEngine(this.iconImageEl, { profile: 'taskbar-icon-bounce-out' });
            this.iconAnimation.animate({
                from: { x: this.position.x, y: ICON_SIZE, opacity: 0 },
                to: { x: this.position.x, y: this.position.y, opacity: 1 }
            });

            if (typeof iconData.icon === 'string') {
                this.iconImageEl.style.backgroundImage = `url(${iconData.icon})`;
            } else {
                this.iconImageEl.style.backgroundImage = `url(${iconData.icon[System.theme.get()]})`;
                System.theme.onChange(theme => {
                    this.iconImageEl.style.backgroundImage = `url(${iconData.icon[theme]})`;
                })
            }

            this.iconEl.addEventListener('pointerdown', (e) => {
                if (this.type === 'app') {
                    initialPointerPos = {
                        x: e.clientX,
                        y: e.clientY
                    }
                }
                selectedItem = this;
                this.imageAnimation.cancel();
                this.imageAnimation.animate({
                    to: { scaleX: 0.8, scaleY: 0.8, x: 0, y: 0 },
                    profile: 'taskbar-icon-generic'
                });
            })

            this.iconEl.addEventListener('pointerup', () => {
                this.setDragging(false)
            })

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
                systemIcons.push(this);
                taskbarIconsItems.style.width = `${systemIcons.length * ICON_SIZE + (systemIcons.length - 1) * ICON_GAP}px`;
                return;
            } else {
                this.iconEl.setAttribute('data-openable', true);

                this.iconEl.addEventListener('click', (e) => {
                    if (this.suppressNextClick) {
                        this.suppressNextClick = false;
                        return;
                    }
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
                        if (this.status.active == true) {
                            this.playToggleAnimation('hide');
                            this.hide(Object.keys(this.windows)[0]);
                        } else {
                            this.playToggleAnimation('show');
                            this.show(Object.keys(this.windows)[0]);
                        }
                    } else {
                        this.show(Object.keys(this.windows)[0]);
                    }
                    lastClickedIconId = this.owner;
                })
                taskbarIconsApps.appendChild(this.iconEl);
                appIcons.push(this);
                taskbarIconsApps.style.width = `${appIcons.length * ICON_SIZE + (appIcons.length - 1) * ICON_GAP}px`;
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
        setDragging(isDragging, offset = 0) {
            this.isDragging = isDragging;
            this.dragOffset = isDragging ? offset : 0;
            this.iconAnimation.cancel();
            this.imageAnimation.cancel();
            this.iconAnimation.animate({
                to: { x: this.position.x + this.dragOffset, y: this.position.y },
                profile: isDragging ? 'no-animation' : 'taskbar-icon-reorder'
            });
            this.imageAnimation.animate({
                to: { scaleX: isDragging ? 1.3 : 1, scaleY: isDragging ? 1.3 : 1, x: 0, y: 0 },
                profile: 'taskbar-icon-reorder'// isDragging ? 'no-animation' : 'taskbar-icon-reorder'
            });
        }
        setOrder(order, animate = true) {
            this.order = order;
            this.position.x = order * (ICON_SIZE + ICON_GAP);
            if (!animate || this.isDragging) return;
            this.iconAnimation.animate({
                to: { x: this.position.x, y: this.position.y },
                profile: 'taskbar-icon-reorder'
            });
        }
        async playToggleAnimation(direction) {
            const motionId = ++this.imageMotionId;
            const y = direction === 'show' ? -4 : 4;
            await this.imageAnimation.animate({
                to: { x: 0, y, scaleX: 1, scaleY: 1 },
                profile: 'taskbar-icon-bounce-out'
            });
            if (motionId !== this.imageMotionId || this.isDragging) return;
            await this.imageAnimation.animate({
                to: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
                profile: 'taskbar-icon-bounce-in'
            });
        }
        open(win) {
            if (this.type === 'system') {
                this.status.enabled = true;
                this.focus();
                this.update();
                this._emit('open');
                return;
            }

            const id = win?.id;
            if (this.windows[id] || win.type === 'sub-window') return;
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
            win.on('change:icon', e => {
                this.windows[id].icon = e.value;
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

            if (Object.keys(this.windows).length === 0) {
                lastClickedIconId = null;

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
                systemIcons.forEach(icon => {
                    icon.close(null, true);
                })
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
        async destroy() {
            if (
                this.isDestroyed ||
                this.type !== 'app' ||
                pinnedIcons.find(icon => icon.appId == this.owner)
            ) return;

            lastClickedIconId = null;
            delete iconRepository[this.owner];
            this.isDestroyed = true;
            this.iconEl.style.pointerEvents = 'none';
            const index = appIcons.indexOf(this);
            if (index !== -1) {
                appIcons.splice(index, 1);
                updateAppIconPositions();
                taskbarIconsApps.style.width = `${appIcons.length * ICON_SIZE + Math.max(appIcons.length - 1, 0) * ICON_GAP}px`;
            }
            await this.iconAnimation.animate({
                to: { x: this.position.x, y: this.position.y + ICON_SIZE, opacity: 0 },
                profile: 'taskbar-icon-exit'
            });
            this.iconEl.remove();
        }
    }

    for (const key of Object.keys(systemItemOptions)) {
        try {
            const icon = systemItemOptions[key].icon;
            if (typeof icon === 'string') {
                systemItemOptions[key].icon = await getFileURL(fs, icon);
            } else {
                for (const theme of Object.keys(icon)) {
                    systemItemOptions[key].icon[theme] = await getFileURL(fs, icon[theme]);
                }
            }
        } catch (e) {
            systemItemOptions[key].icon = fallbackImage;
        }
    }

    for (let i = 0; i < pinnedIcons.length; i++) {
        const appData = appRegistry.getInfoByName(pinnedIcons[i]);
        pinnedIcons[i] = appRegistry.generateProfile(appData.appName, appData.basePath, appData.entryScript);
        try {
            pinnedIcons[i].preloadedIcon = await getFileURL(fs, pinnedIcons[i].icon);
        } catch (e) {
            pinnedIcons[i].preloadedIcon = fallbackImage;
        }
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

    let waitingList = {};
    async function generateIcon({
        appId, owner, type, icon
    }) {
        if (iconRepository[appId]) return false;
        if (waitingList[appId]) {
            return new Promise((rs, rj) => {
                waitingList[appId].on('ok', rs);
                waitingList[appId].on('error', rj);
            })
        }
        const eventEmitter = new EventEmitter();
        waitingList[appId] = eventEmitter;

        try {
            if (icon.toUpperCase().startsWith('C:/')) {
                icon = await getFileURL(fs, icon);
            }
        } catch (e) {
            eventEmitter._emit('error', e);
            icon = fallbackImage;
        }

        iconRepository[appId] = new Icon({
            owner, type, icon
        })

        waitingList[appId] = null;
    }

    timer.groupEnd();

    return {
        init,
        async getIcon(appData) {
            const appId = appData.appId;
            if (!iconRepository[appId]) {
                await generateIcon({
                    appId: appId,
                    type: appData.type,
                    owner: appId,
                    icon: appData.icon,
                })
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
