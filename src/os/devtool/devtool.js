import * as utils from "../../shared/utils.ts";
import WinbowsDevtool from "../../lib/winbows-devtool/dist/index.js";
import "../../lib/winbows-devtool/dist/index.css";
import { viewport } from "../core/viewport.js";
import { Tabview } from "./tabview.js";
import storage from "./storage.js";
import performanceMonitor from "./performance-monitor.js";
//import { apis } from "../kernelRuntime.js";
import tasks from "./tasks.js";
import terminal from "./terminal.js";
import Logger from "../core/log.js";
import { UserData } from "./userData.ts";
// import i18n from "../i18n/i18n.js";

const { root } = viewport;
//const { ShellInstance, process } = apis;
const events = {
    "start": ["mousedown", "touchstart", "pointerdown"],
    "move": ["mousemove", "touchmove", "pointermove"],
    "end": ["mouseup", "touchend", "pointerup", "blur"]
}

export default function Devtool() {
    let side = 'right';
    let width = 700;
    let height = window.innerHeight;

    let realWidth = width;
    if (width > window.innerWidth) {
        realWidth = window.innerWidth;
    }
    root.style.width = `calc(100% - ${realWidth}px)`;

    const devContainer = document.createElement('div');
    const resizer = document.createElement('div');
    const content = document.createElement('div');
    const tabview = new Tabview(devContainer);
    const footer = document.createElement('div');
    const devtool = new WinbowsDevtool();
    const lastClicked = UserData.get('tabview.last_clicked');

    resizer.className = 'winbows-devtool-resizer';
    content.className = 'winbows-devtool-content';
    devContainer.className = 'winbows-devtool-container winui-dark winui-no-background';
    devContainer.style = `right: 0; top: 0; width: ${realWidth}px; height: var(--winbows-screen-height);`;
    footer.className = 'winbows-devtool-footer';

    footer.textContent = `Winbows Devtool v${devtool.version} (c) Siyu1017 2025`

    document.body.appendChild(devContainer);
    devContainer.appendChild(resizer);
    devContainer.appendChild(content);
    content.appendChild(tabview.container);
    devContainer.appendChild(footer);

    let pointerDown = false;
    let startX = 0;
    let orgWidth = 0;

    function onStart(e) {
        pointerDown = true;
        startX = utils.getPointerPosition(e).x;
        orgWidth = devContainer.offsetWidth;
    }

    function onDrag(e) {
        if (pointerDown == false) return;
        const x = utils.getPointerPosition(e).x;
        if (side == 'right') {
            width = orgWidth + (startX - x);
        }

        let realWidth = width;
        if (width > window.innerWidth) {
            realWidth = window.innerWidth;
        }
        devContainer.style.width = `${realWidth}px`;
        root.style.width = `calc(100% - ${realWidth}px)`;
        try {
            document.getSelection()?.removeAllRanges();
        } catch { };
    }

    function onEnd(e) {
        if (pointerDown == false) return;
        pointerDown = false;
        let realWidth = width;
        if (width > window.innerWidth) {
            realWidth = window.innerWidth;
        }
        devContainer.width = `${realWidth}px`;
        root.style.width = `calc(100% - ${realWidth}px)`;
    }


    events.start.forEach(event => {
        resizer.addEventListener(event, onStart);
    })
    events.move.forEach(event => {
        window.addEventListener(event, onDrag);
    })
    events.end.forEach(event => {
        window.addEventListener(event, onEnd);
    })

    const observer = new ResizeObserver(() => {
        let realWidth = width;
        if (width > window.innerWidth) {
            realWidth = window.innerWidth;
        }
        devContainer.style.width = `${realWidth}px`;
        root.style.width = `calc(100% - ${realWidth}px)`;
    });
    observer.observe(document.body);

    const consoleTab = tabview.add({
        id: 'console',
        title: 'Console', //i18n.t('devtool.tab.console'),
        content: devtool.devtool,
        closable: false
    })
    const performanceMonitorTab = tabview.add({
        id: 'performance-monitor',
        title: 'Performance Monitor', //i18n.t('devtool.tab.performance-monitor'),
        content: performanceMonitor.container,
        closable: false
    })
    const storageTab = tabview.add({
        id: 'storage',
        title: 'Storage', //i18n.t('devtool.tab.storage'),
        content: storage,
        closable: false
    })
    const tasksTab = tabview.add({
        id: 'tasks',
        title: 'Tasks', //i18n.t('devtool.tab.tasks'),
        content: tasks,
        closable: false
    })
    const terminalTab = tabview.add({
        id: 'terminal',
        title: 'Terminal', //i18n.t('devtool.tab.terminal'),
        content: terminal,
        closable: false
    })

    tabview.select('console');
    tabview.on('select', id => {
        if (id != 'performance-monitor') {
            performanceMonitor.monitors.forEach(monitor => {
                monitor.stop();
            })
        } else {
            performanceMonitor.monitors.forEach(monitor => {
                monitor.start();
            })
        }
    })

    tabview.select(lastClicked);

    devtool.console.info("Winbows Devtool Version:", devtool.version);

    if (window.HMGR) {
        const logger = new Logger({
            module: 'Network'
        })
        window.HMGR.on('NIC:REQUEST:RECEIVED', (e) => {
            logger.info(`${e.isThisTab != true ? `From client [${e.fromClientId || 'UNKNOWN'}]\n` : ''}${e.method} ${e.url} ${e.status}`);
        })
    }

    [
        "log", "info", "warn", "error", "debug",
        "group", "groupCollapsed", "groupEnd",
        "count", "countReset",
        "time", "timeLog", "timeEnd",
        "table", "trace", "assert", "clear"
    ].forEach(method => {
        const original = console[method];
        console[method] = function (...args) {
            devtool.console[method].apply(devtool.console, args);
            original.apply(console, args);
        };
    });

    document.addEventListener('click', e => {
        const el = e.target.closest('[data-href]');
        if (!el) return;

        const url = el.dataset.href;
        //console.log('Clicked:', url);

        //const shell = new ShellInstance(process);
        //shell.stderr.on('data', (data) => {
        //    console.error(data);
        //})
        //shell.execCommand('start code://' + url);
        //shell.dispose();
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target.closest('[data-href]');
        if (!el) return;

        e.preventDefault();
        el.click();
    });

    return { devtool }
}