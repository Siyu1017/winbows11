import * as utils from "../../utils.js";
import WinbowsDevtool from "../../lib/external/winbows-devtool/dist/index.js";
import "../../lib/external/winbows-devtool/dist/index.css";
import viewport from "../viewport.js";
import { Tabview } from "./tabview.js";
import storage from "./storage.js";
import performanceMonitor from "./performance-monitor.js";
import { apis } from "../kernelRuntime.js";

const { root } = viewport;
const { ShellInstance, process } = apis;
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
    const tabview = new Tabview(devContainer);
    devContainer.className = 'winbows-devtool-container winui-dark winui-no-background';
    devContainer.style = `right: 0; top: 0; width: ${realWidth}px; height: var(--winbows-screen-height);`;
    resizer.className = 'winbows-devtool-resizer';

    document.body.appendChild(devContainer);
    devContainer.appendChild(resizer);

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

    const devtool = new WinbowsDevtool();
    const consoleTab = tabview.add({
        id: 'console',
        title: 'Console',
        content: devtool.devtool,
        closable: false
    })
    const performanceMonitorTab = tabview.add({
        id: 'performance-monitor',
        title: 'Performance Monitor',
        content: performanceMonitor.container,
        closable: false
    })
    const storageTab = tabview.add({
        id: 'storage',
        title: 'Storage',
        content: storage,
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

    devtool.console.info("Winbows Devtool Version:", devtool.version);

    if (window.HMGR) {
        window.HMGR.on('NIC:REQUEST:RECEIVED', (e) => {
            devtool.console.log(`${e.isThisTab != true ? `From client [${e.fromClientId || 'UNKNOWN'}]\n` : ''}%c[HMGR] %c${e.method} %c${e.url} %c${e.status}`, 'color:#ff00ff', '', 'color:#86b7ff', e.ok ? 'color:#58ff31' : 'color:red');
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

        const shell = new ShellInstance(process);
        shell.stderr.on('data', (data) => {
            console.error(data);
        })
        shell.execCommand('start code://' + url);
        shell.dispose();
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target.closest('[data-href]');
        if (!el) return;

        e.preventDefault();
        el.click();
    });

    return;
}