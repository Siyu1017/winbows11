import { IDBFS } from "../../../shared/fs.js";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";
import { desktopEl } from "../desktop/init.js";

const controlbarHeight = 32;

function computeTaskLayout(containerWidth, containerHeight, windows) {
    const padding = 20;
    const targetHeight = 300;
    const layouts = [];
    const rows = ~~Math.sqrt(windows.length);
    const cols = Math.ceil(windows.length / rows);
    const maxRowWidth = containerWidth - padding * 2;
    const maxRowHeight = targetHeight;
    const totalHeight = (rows * (maxRowHeight + controlbarHeight) - (rows - 1) * padding);

    let ySum = containerHeight / 2 - totalHeight / 2;
    if (ySum < padding + controlbarHeight) {
        ySum = padding + controlbarHeight;
    }

    for (let i = 0; i < rows; i++) {
        const rowLayouts = [];
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            const win = windows[index];
            if (!win) break;

            let w = win.realWidth;
            let h = win.realHeight;

            if (h < maxRowHeight) {
                const ratio = maxRowHeight / h;
                w *= ratio;
                h *= ratio;
            }

            rowLayouts.push({
                w, h
            })
        }

        let rowWidth = rowLayouts.map(b => b.w).reduce((a, b) => a + b, 0) + (rowLayouts.length - 1) * padding;
        let rowHeight = rowLayouts.reduce((max, o) => Math.max(max, o.h), -Infinity);

        while (rowWidth > maxRowWidth || rowHeight > maxRowHeight) {
            if (rowHeight > maxRowHeight) {
                const max = rowLayouts.reduce((max, o) => o.h > max.h ? o : max);
                const ratio = maxRowHeight / max.h;
                max.w *= ratio;
                max.h = maxRowHeight;
            } else if (rowWidth > maxRowWidth) {
                const max = rowLayouts.reduce((max, o) => o.w > max.w ? o : max);
                let ratio = (max.w - (rowWidth - maxRowWidth)) / max.w;
                if (ratio < 0.9) ratio = 0.9;
                max.w *= ratio;
                max.h *= ratio;
            }

            rowWidth = rowLayouts.map(b => b.w).reduce((a, b) => a + b, 0) + (rowLayouts.length - 1) * padding;
            rowHeight = rowLayouts.reduce((max, o) => Math.max(max, o.h), -Infinity);
        }

        let xSum = containerWidth / 2 - rowWidth / 2;
        for (let j = 0; j < rowLayouts.length; j++) {
            rowLayouts[j].x = xSum;
            rowLayouts[j].y = ySum;
            layouts.push(rowLayouts[j]);
            xSum += rowLayouts[j].w + padding;
        }
        ySum += maxRowHeight + controlbarHeight + padding;
    }

    return layouts;
}

export default function Taskview(icon) {
    const fs = IDBFS('~EXPLORER');
    const downEvts = ["mousedown", "touchstart", "pointerdown"];
    const windowManager = ModuleManager.get('WindowManager');
    const taskviewContainer = document.createElement('div');
    taskviewContainer.className = 'taskview-container';
    viewport.appWrapper.appendChild(taskviewContainer);

    let show = false;
    let masks = [];

    function open() {
        show = true;
        taskviewContainer.classList.add('active');
        desktopEl.style.pointerEvents = 'none';

        const windows = windowManager.all();
        const layout = computeTaskLayout(viewport.width, viewport.height - 48, windows);
        windows.forEach((win, i) => {
            const w = layout[i].w;
            const h = layout[i].h;
            const scale = w / win.realWidth;
            const x = layout[i].x - win.realWidth / 2 + w / 2;
            const y = layout[i].y - win.realHeight / 2 + h / 2;
            const borderRadius = 8 / scale;

            const mask = document.createElement('div');
            const maskControlbar = document.createElement('div');
            const maskControlbarInfo = document.createElement('div');
            const maskControlbarInfoIcon = document.createElement('div');
            const maskControlbarInfoTitle = document.createElement('div');
            const maskControlbarClose = document.createElement('div');

            mask.className = 'taskview-mask';
            maskControlbar.className = 'taskview-mask-controlbar';
            maskControlbarInfo.className = 'taskview-mask-controlbar-info';
            maskControlbarInfoIcon.className = 'taskview-mask-controlbar-info-icon';
            maskControlbarInfoTitle.className = 'taskview-mask-controlbar-info-title';
            maskControlbarClose.className = 'taskview-mask-controlbar-close';

            mask.style.transform = `translate(${layout[i].x}px, ${layout[i].y - controlbarHeight}px)`;
            mask.style.width = w + 'px';
            mask.style.height = h + controlbarHeight + 'px';
            maskControlbar.style.height = controlbarHeight + 'px';
            maskControlbarInfoTitle.innerHTML = win.title;
            maskControlbarInfoIcon.style.backgroundImage = `url(${win.icon})`;
            mask.addEventListener('click', (e) => {
                const IconManager = ModuleManager.get('IconManager');
                const icon = IconManager.getIconByWinID(win.id);
                icon?.show?.(win.id);
            })
            maskControlbarClose.addEventListener('click', (e) => {
                const IconManager = ModuleManager.get('IconManager');
                IconManager.getIconByWinID(win.id)?.close(win.id);
            })

            mask.appendChild(maskControlbar);
            maskControlbar.appendChild(maskControlbarInfo);
            maskControlbarInfo.appendChild(maskControlbarInfoIcon);
            maskControlbarInfo.appendChild(maskControlbarInfoTitle);
            maskControlbar.appendChild(maskControlbarClose);
            viewport.screenElement.appendChild(mask);
            masks.push(mask);

            mask.classList.add('active');

            win.browserWindow.window.style.borderRadius = `0px 0px ${borderRadius}px ${borderRadius}px`;
            win.micaContainer.style.borderRadius = `0px 0px ${borderRadius}px ${borderRadius}px`;
            win.container.style.transition = 'none';
            win.animate({
                to: {
                    x,
                    y,
                    scaleX: scale,
                    scaleY: scale,
                    opacity: 1
                },
                profile: 'taskview-in'
            })
        })
    }

    function close() {
        if (show == false) return;
        show = false;
        taskviewContainer.classList.remove('active');
        desktopEl.style.pointerEvents = 'auto';

        const windows = windowManager.all();
        while (masks.length) {
            const mask = masks.shift();
            mask.remove();
        }
        windows.forEach((win, i) => {
            win.browserWindow.window.style.borderRadius = win.originalSnapSide ? '0px' : 'revert-layer';
            win.micaContainer.style.borderRadius = win.originalSnapSide ? '0px' : 'revert-layer';

            win.container.style.transition = 'none';
            if (win.isMinimized) {
                win.minimize();
            } else {
                win.animate({
                    to: {
                        x: win.realX,
                        y: win.realY,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 1
                    },
                    profile: 'taskview-out'
                })
            }
        })
    }

    icon.on('blur', () => {
        icon.close();
    });

    viewport.root.addEventListener('click', (e) => {
        if (icon.iconEl.contains(e.target)) return;

        icon.close(null, true);
    })

    return {
        open, close
    }
}