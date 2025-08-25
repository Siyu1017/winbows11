import { taskbarIcons, on } from "./taskbar.js";
import startMenuContainer from "./startMenu.js";

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

taskbarIcons.appendChild(taskbarItems);
taskbarIcons.appendChild(taskbarApps);

let pinnedApps = [],
    pinApp = () => { },
    unpinApp = () => { },
    isPinned = () => { },
    createIcon = () => { },
    preloadImage = () => { },
    init = () => { };

export const iconManager = {
    pinApp, unpinApp, isPinned, createIcon, preloadImage, init
}