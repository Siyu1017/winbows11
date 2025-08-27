import { taskbarIcons as taskbarIconsEl, on } from "./taskbar.js";
import { appRegistry } from "../appRegistry.js";
import { System } from "../system.js";

let systemItemOptions = {
    start: {
        display: true,
        icon: {
            light: 'C:/Winbows/icons/applications/tools/start.ico',
            dark: 'C:/Winbows/icons/applications/tools/start2.ico'
        }
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

const taskbarItems = document.createElement('div');
const taskbarApps = document.createElement('div');

taskbarItems.className = 'taskbar-items';
taskbarApps.className = 'taskbar-apps';

taskbarIconsEl.appendChild(taskbarItems);
taskbarIconsEl.appendChild(taskbarApps);

let pinnedApps = [
    'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wrt',     // File explorer
    'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt',             // Edge
    'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wrt'    // MH Store
];
let taskbarIcons = {};
let taskbarAppIconOrder = [];

class TaskbarIcon {
    /**
     * @typedef {Object} TaskbarIconData
     * @property {number} appId
     * @property {'system'|'app'} type
     */
    /**
     * Create a taskbar icon
     * @param {TaskbarIconData} data 
     * @param {*} options 
     * @returns
     */
    constructor(data, options = {}) {
        if (!data.appId) return;
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
            this.icon = appRegistry.getIcon(data.appId);
        }

        this.item = document.createElement('div');
        this.itemImage = document.createElement('div');
        this.item.className = 'taskbar-item';
        this.itemImage.className = 'taskbar-icon';
        if (typeof data.icon === 'string') {
            this.itemImage.style.backgroundImage = `url(${data.icon})`;
        } else {
            this.itemImage.style.backgroundImage = `url(${data.icon[System.theme.get()]})`;
            System.theme.onChange(theme => {
                this.itemImage.style.backgroundImage = `url(${data.icon[theme]})`;
            })
        }
        this.item.appendChild(this.itemImage);

        if (this.type == 'app') {
            taskbarAppIconOrder.push(this.appId);
        }

        taskbarIcons.push(this);

        return {
            addWindow: () => {

            }
        }
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

}

function getIcon(data, options) {
    const icon = taskbarIcons[appId];
    if (icon) return icon;
    return new TaskbarIcon(data, options || {});
}

export const iconManager = {
    pinApp, unpinApp, isPinned, preloadImage, init, getIcon
}