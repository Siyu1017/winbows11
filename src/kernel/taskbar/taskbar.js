import { EventEmitter } from "../WRT/utils/eventEmitter.js";
import WinUI from "../../ui/winui.js";
import * as utils from "../../utils.js";
import { apis } from "../kernelRuntime.js";

const { ShellInstance, process } = apis;
const eventEmitter = new EventEmitter();

function on(...args) {
    return eventEmitter.on.call(eventEmitter, ...args);
}

function off(...args) {
    return eventEmitter.off.call(eventEmitter, ...args);
}

const taskbar = document.createElement('div');
const taskbarIcons = document.createElement('div');
const taskbarControls = document.createElement('div');

const taskbarMenu = WinUI.contextMenu([
    {
        className: "taskmgr",
        icon: "diagnostic",
        text: "Task Manager",
        action: () => {
            new ShellInstance(process).execCommand('taskmgr').then(res => {
                console.log(res);
            }).catch(e => {
                console.error(e);
            })
        }
    }, {
        type: "separator"
    }, {
        className: "settings",
        icon: "settings",
        text: "Taskbar Settings",
        action: () => {
            new ShellInstance(process).execCommand('start settings://personalization/taskbar').then(res => {
                console.log(res);
            }).catch(e => {
                console.error(e);
            })
        },
    },
])

taskbar.className = 'taskbar';
taskbarIcons.className = 'taskbar-group icons';
taskbarControls.className = 'taskbar-group controls';


["mousedown", "touchstart", "pointerdown"].forEach(event => {
    window.addEventListener(event, (e) => {
        eventEmitter._emit('pointerdown', e);
    })
})

taskbar.appendChild(taskbarIcons);
taskbar.appendChild(taskbarControls);

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

// Taskbar menu
on('pointerdown', (e) => {
    if (!taskbarMenu.container.contains(e.target)) {
        taskbarMenu.close();
        taskbarMenu.container.style.right = 'unset';
    }
})

export {
    taskbar,
    taskbarIcons,
    taskbarControls,
    on,
    off
}