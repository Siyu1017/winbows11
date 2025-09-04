import { taskbarIcons as taskbarIconsEl, on } from "./taskbar.js";
import { appRegistry } from "../appRegistry.js";
import { System } from "../system.js";
import { EventEmitter } from "../WRT/utils/eventEmitter.js";
import { apis } from "../kernelRuntime.js";
import { fallbackImage } from "../fallback.js";
import { WRT } from "../WRT/kernel.js";
import startMenuHandler from "./startMenu.js";

const { fs } = apis;

let systemItemOptions = {
    start: {
        display: true,
        icon: {
            light: 'C:/Winbows/icons/applications/tools/start.ico',
            dark: 'C:/Winbows/icons/applications/tools/start2.ico'
        },
        handler: startMenuHandler
    },
    search: {
        display: true,
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
        }
    },
    widgets: {
        display: false,
        icon: 'C:/Winbows/icons/applications/tools/widgets.ico'
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

const taskbarItems = document.createElement('div');
const taskbarApps = document.createElement('div');

taskbarItems.className = 'taskbar-items';
taskbarApps.className = 'taskbar-apps';

taskbarIconsEl.appendChild(taskbarItems);
taskbarIconsEl.appendChild(taskbarApps);

let pinnedApps = [
    'explorer',     // File explorer
    'edge',         // Edge
    'store'         // MH Store
];
let taskbarIcons = {};
let taskbarAppIconOrder = [];
let lastClicked = null;

pinnedApps.forEach((app, i) => {
    pinnedApps[i] = appRegistry.getInfo(app).appId;
})

class TaskbarIcon extends EventEmitter {
    /**
     * @typedef {Object} TaskbarIconData
     * @property {string} appId
     * @property {'system'|'app'} type
     */
    /**
     * Create a taskbar icon
     * @param {TaskbarIconData} data 
     * @param {*} options 
     * @returns
     */
    constructor(data, options = {}) {
        super();

        if (!data.appId && data.type != 'system') return;
        if (taskbarIcons[data.appId]) return taskbarIcons[data.appId];

        this.appId = data.appId;
        this.type = data.type == 'system' ? 'system' : 'app';

        this.status = {
            focused: false,
            show: false,
            opened: false
        }

        if (this.type == 'app') {
            // Not available on system icon
            this.windows = [];
            this.icon = appRegistry.getData(data.appId)?.icon ?? 'C:/Winbows/icons/files/program.ico';
        } else {
            this.icon = data.icon;
        }

        this.item = document.createElement('div');
        this.itemImage = document.createElement('div');
        this.item.className = 'taskbar-item';
        this.itemImage.className = 'taskbar-icon';
        if (typeof this.icon === 'string') {
            fs.getFileURL(this.icon).then(url => {
                this.itemImage.style.backgroundImage = `url(${url})`;
            }).catch(e => {
                console.error(e);
            })
        } else {
            this.itemImage.style.backgroundImage = `url(${this.icon[System.theme.get()]})`;
            System.theme.onChange(theme => {
                this.itemImage.style.backgroundImage = `url(${this.icon[theme]})`;
            })
        }
        this.item.appendChild(this.itemImage);

        if (pinnedApps.includes(this.appId)) {
            this.item.addEventListener('click', (e) => {
                try {
                    new WRT().runFile(appRegistry.getData(this.appId).entryScript);
                } catch (e) {
                    console.error(e);
                }
            })
            taskbarApps.appendChild(this.item);
        } else if (this.type == 'system') {
            taskbarItems.appendChild(this.item);
        }

        if (this.type == 'app') {
            taskbarAppIconOrder.push(this.appId);
            taskbarIcons[this.appId] = this;
        }
    }

    open() {
        if (this.type == 'app') {
            try {
                this.status.opened = true;
                this.item.setAttribute('data-opened', this.status.opened);

                lastClicked = this.appId;
                /*
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
                    */
            } catch (e) {
                console.log(e);
            };
        }

        this._emit('open');
    }

    close() {
        if (this.windows) {
            this.windows.forEach(windowObj => {
                windowObj.close();
            })
        }

        if (!pinnedApps.includes(this.appId) && this.type != 'system') {
            taskbarApps.removeChild(this.item);
        }

        this.status.opened = false;
    }
}

function pinApp(name) {
    if (appRegistry.exists(name) && !pinnedApps.includes(name)) {
        pinnedApps.push(name);
    }
}

function unpinApp(name) {
    if (pinnedApps.includes(name)) {
        pinnedApps.splice(pinnedApps.indexOf(name), 1);
    }
}

function isPinned(path) {
    return window.Taskbar.pinnedApps.includes(path);
}

function preloadImage() {

}

function init() {
    Object.values(systemItemOptions).forEach((item) => {
        if (item.display == true) {
            const icon = new TaskbarIcon({
                type: 'system',
                icon: item.icon
            });
            item.handler?.(icon);
        }
    })

    pinnedApps.forEach((appId) => {
        new TaskbarIcon({
            appId,
            type: 'app'
        });
    })
}

function getIcon(data, options) {
    const icon = taskbarIcons[appId];
    if (icon) return icon;
    return new TaskbarIcon(data, options || {});
}

export const iconManager = {
    pinApp, unpinApp, isPinned, preloadImage, init, getIcon
}