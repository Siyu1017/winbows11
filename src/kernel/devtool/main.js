import * as utils from "../../utils.js";
import WinbowsDevtool from "../../lib/external/winbows-devtool/dist/index.js";
import "../../lib/external/winbows-devtool/dist/index.css";
import { root } from "../viewport.js";
import { Tabview } from "./tabview.js";
import storage from "./storage.js";
import performanceMonitor from "./performance-monitor.js";

export default function Devtool() {

    let side = 'right';
    let width = 700;
    let height = window.innerHeight;

    if (width > window.innerWidth) {
        width = window.innerWidth;
    }

    root.style.width = `calc(100% - ${width}px)`;

    const devContainer = document.createElement('div');
    const tabview = new Tabview(devContainer);
    devContainer.className = 'winbows-dev-container winui-dark winui-no-background';
    devContainer.style = `right: 0; top: 0; width: ${width}px; height: var(--winbows-screen-height);`;
    document.body.appendChild(devContainer);

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

    //const el = document.createElement('div');
    //el.style = `background: #0000004f;color: #fff;position: fixed;right: .5rem;top: .5rem;z-index: 999999999;border-radius: .375rem;padding: .25rem .5rem;pointer-events: none;backdrop-filter:blur(1rem);-webkit-backdrop-filter:blur(1rem);`;
    //document.body.appendChild(el);

    /*
    let prevTime = Date.now(),
        frames = 0;
    var interval = 1000;
    var scale = 1000 / interval;
    requestAnimationFrame(function loop() {
        const time = Date.now();
        frames++;
        if (time > prevTime + interval) {
            let fps = Math.round((frames * scale * interval) / (time - prevTime));

            performanceMonitorItem.style.fontFamily = 'monospace';
            performanceMonitorItem.style.fontSize = '14px';
            performanceMonitorItem.innerHTML = `Used JS Heap: ${utils.formatBytes(performance.memory.usedJSHeapSize)} / ${utils.formatBytes(performance.memory.totalJSHeapSize)} ( ${((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100).toFixed(0)}% )\nFPS: ${fps}`;

            prevTime = time;
            frames = 0;
        }
        requestAnimationFrame(loop);
    });
*/
    return;
}