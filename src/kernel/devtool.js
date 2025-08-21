import * as utils from "../utils";
import WinbowsDevtool from "../lib/external/winbows-devtool/dist/index";

export default function Devtool() {
    const devtool = new WinbowsDevtool();
    var devContainer = document.createElement('div');
    var devDragBar = document.createElement('div');
    var devLogs = document.createElement('div');
    var devResizer = document.createElement('div');
    var devResizerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var dragging = false;
    var x = 8, y = 8, width = window.innerWidth / 2, height = window.innerHeight / 2;
    devContainer.className = 'winbows-dev-container winui-dark winui-no-background';
    devContainer.style.width = width + 'px';
    devContainer.style.height = height + 'px';
    devContainer.style.transform = `translate(${x}px, ${y}px)`;
    devDragBar.className = 'winbows-dev-dragbar';
    devLogs.style.maxHeight = height + 'px';
    devLogs.className = 'winbows-dev-logs';
    devResizer.className = 'winbows-dev-resizer';
    devResizerSvg.innerHTML = '<path d="M10 1C10 5 7 10 1 10 1 10 0 10 0 9 0 9 0 8 1 8 5 8 8 5 8 1 8 1 8 0 9 0 9 0 10 0 10 1"></path>';
    devResizerSvg.setAttribute('viewBox', '-1 -1 12 12');
    devResizerSvg.setAttribute('width', 11);
    devResizerSvg.setAttribute('height', 11);
    devResizerSvg.style = 'stroke: #fff;fill: #fff;width:1rem;height:1rem';

    devDragBar.addEventListener('pointerdown', (e) => {
        dragging = true;
        let pageX = e.pageX;
        let pageY = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            pageX = touch.pageX;
            pageY = touch.pageY;
        }
        var position = utils.getPosition(devContainer);
        x = pageX - position.x;
        y = pageY - position.y;
    })
    window.addEventListener('pointermove', (e) => {
        if (dragging != true) return;
        let pageX = e.pageX;
        let pageY = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            pageX = touch.pageX;
            pageY = touch.pageY;
        }
        var dx = pageX - x;
        var dy = pageY - y;
        devContainer.style.transform = `translate(${dx}px, ${dy}px)`;
    })
    window.addEventListener('pointerup', () => {
        dragging = false;
    })
    window.addEventListener('blur', () => {
        dragging = false;
    })

    function setupDevOutput() {
        var x = 0, y = 0, dx = 0, dy = 0, dragging = false;
        devResizer.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            dragging = true;
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            x = pageX;
            y = pageY;
        })
        window.addEventListener('pointermove', (e) => {
            if (dragging != true) return;
            devContainer.style.userSelect = 'none';
            e.stopPropagation();
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            dx = pageX - x;
            dy = pageY - y;
            devContainer.style.width = `${width + dx}px`;
            devContainer.style.height = `${height + dy}px`;
            devContainer.style.maxWidth = `${width + dx}px`;
            devContainer.style.maxHeight = `${height + dy}px`;
            devLogs.style.maxHeight = `${height + dy}px`;
        })
        window.addEventListener('pointerup', () => {
            if (dragging == false) return;
            devContainer.style.userSelect = 'unset';
            dragging = false;
            width = width + dx;
            height = height + dy;
            devContainer.style.width = `${width}px`;
            devContainer.style.height = `${height}px`;
            devContainer.style.maxWidth = `${width}px`;
            devContainer.style.maxHeight = `${height}px`;
            devLogs.style.maxHeight = `${height}px`;
            dx = 0;
            dy = 0;
        })
        window.addEventListener('blur', () => {
            if (dragging == false) return;
            devContainer.style.userSelect = 'unset';
            dragging = false;
            width = width + dx;
            height = height + dy;
            devContainer.style.width = `${width}px`;
            devContainer.style.height = `${height}px`;
            devContainer.style.maxWidth = `${width}px`;
            devContainer.style.maxHeight = `${height}px`;
            devLogs.style.maxHeight = `${height}px`;
            dx = 0;
            dy = 0;
        })
    }

    setupDevOutput();

    document.body.appendChild(devContainer);
    devContainer.appendChild(devDragBar);
    devContainer.appendChild(devLogs);
    devContainer.appendChild(devResizer);
    devResizer.appendChild(devResizerSvg);

    devLogs.appendChild(devtool.devtool)

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

    return;
}