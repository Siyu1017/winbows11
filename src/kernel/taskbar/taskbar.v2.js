import { IDBFS } from "../../lib/fs";
import WinUI from "../../ui/winui";

const fs = IDBFS("C:/Winbows/System/kernel/kernel.js");
const pointerDownEvts = ["mousedown", "touchstart", "pointerdown"];

let taskbarItemOptions = {
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

const taskbar = document.createElement('div');
const taskbarIcons = document.createElement('div');
const taskbarControls = document.createElement('div');
const taskbarItems = document.createElement('div');
const taskbarApps = document.createElement('div');
const taskbarMenu = WinUI.contextMenu([
    {
        className: "taskmgr",
        icon: "diagnostic",
        text: "Task Manager",
        action: () => {
            window.System.Shell('run taskmgr');
        }
    }, {
        type: "separator"
    }, {
        className: "settings",
        icon: "settings",
        text: "Taskbar Settings",
        action: () => {
            window.System.Shell('run settings:/personalization/taskbar');
        },
    },
])

taskbar.className = 'taskbar';
taskbarIcons.className = 'taskbar-group icons';
taskbarControls.className = 'taskbar-group controls';
taskbarItems.className = 'taskbar-items';
taskbarApps.className = 'taskbar-apps';

taskbar.appendChild(taskbarIcons);
taskbar.appendChild(taskbarControls);
taskbarIcons.appendChild(taskbarItems);
taskbarIcons.appendChild(taskbarApps);

taskbar.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    taskbarMenu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
    taskbarMenu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
    taskbarMenu.open(e.pageX, taskbar.offsetHeight + 4, 'left-bottom');
    if (utils.getPosition(taskbarMenu.container).x + taskbarMenu.container.offsetWidth > window.innerWidth) {
        taskbarMenu.container.style.left = 'unset';
        taskbarMenu.container.style.right = '4px';
    }
})

pointerDownEvts.forEach(event => {
    window.addEventListener(event, (e) => {
        if (taskbarMenu.container.contains(e.target)) return;
        taskbarMenu.close();
        taskbarMenu.container.style.right = 'unset';
    })
})


document.addEventListener('pointerdown', e => {
    if (!iconRepository.start) return;
    if (e.target == startMenuContainer || startMenuContainer.contains(e.target) || powerMenu.container.contains(e.target) || iconRepository.start.item.contains(e.target)) return;
    iconRepository.start.hide();
})