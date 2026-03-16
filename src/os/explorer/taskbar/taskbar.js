import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";
import WinUI from "../../../lib/winui/winui.js";
import { EventEmitter, getPosition } from "../../../shared/utils.ts";
import { ControlPanel } from "./controlPanel.js";
import timer from "../../core/timer.js";
import IconManager from "./iconManager.js";

async function Taskbar() {
    timer.group('Taskbar');

    const { screenElement } = viewport;
    const System = ModuleManager.get('System');

    const taskbar = document.createElement('div');
    const taskbarIcons = document.createElement('div');
    const taskbarIconsItems = document.createElement('div');
    const taskbarIconsApps = document.createElement('div');
    const taskbarControls = document.createElement('div');
    const taskbarMenu = WinUI.contextMenu([
        {
            className: "taskmgr",
            icon: "diagnostic",
            text: "Task Manager",
            action: () => {
                System.shell.execCommand('taskmgr').catch(e => {
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
                System.shell.execCommand('settings --path=/personalization/taskbar').catch(e => {
                    console.error(e);
                })
            },
        },
    ])

    taskbar.className = 'taskbar';
    taskbarIcons.className = 'taskbar-group icons';
    taskbarIconsItems.className = 'taskbar-icons-items';
    taskbarIconsApps.className = 'taskbar-icons-apps';
    taskbarControls.className = 'taskbar-group controls';

    screenElement.appendChild(taskbar);
    taskbar.appendChild(taskbarIcons);
    taskbarIcons.appendChild(taskbarIconsItems);
    taskbarIcons.appendChild(taskbarIconsApps);
    taskbar.appendChild(taskbarControls);

    ["mousedown", "touchstart", "pointerdown"].forEach(event => {
        window.addEventListener(event, (e) => {
            if (!taskbarMenu.container.contains(e.target)) {
                taskbarMenu.close();
                taskbarMenu.container.style.right = 'unset';
            }
        })
    })

    taskbar.appendChild(taskbarIcons);
    taskbar.appendChild(taskbarControls);
    taskbar.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        let x = e.pageX;
        let y = e.pageY;
        if (e.type.startsWith('touch')) {
            const touch = e.touches[0] || e.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        }
        taskbarMenu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        taskbarMenu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        taskbarMenu.open(x, taskbar.offsetHeight + 4, 'left-bottom');
        if (getPosition(taskbarMenu.container).x + taskbarMenu.container.offsetWidth > viewport.width) {
            taskbarMenu.container.style.left = 'unset';
            taskbarMenu.container.style.right = '4px';
        }
    })

    const controlPanel = ControlPanel(taskbarControls);
    const iconManager = await IconManager({ taskbarIconsApps, taskbarIconsItems, taskbarIcons });
    ModuleManager.register('IconManager', iconManager, 'original');

    timer.groupEnd();

    return {
        taskbar, taskbarIcons, taskbarIconsApps, taskbarIconsItems, taskbarControls, controlPanel, iconManager,
        init: iconManager.init
    }
}

export default Taskbar;