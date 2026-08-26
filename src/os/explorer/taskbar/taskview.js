import { safeEscape } from "../../../shared/utils.ts";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";
import { desktopEl } from "../desktop/init.js";

const controlbarHeight = 32;
const taskbarHeight = 48;

function computeTaskLayout(containerWidth, containerHeight, windows) {
    if (!windows.length) return [];

    const gap = 16;
    const preferredPreviewHeight = 300;
    const horizontalPadding = Math.min(24, Math.max(4, Math.floor(containerWidth / 12)));
    const verticalPadding = Math.min(24, Math.max(4, Math.floor((containerHeight - controlbarHeight) / 12)));
    const availableWidth = Math.max(1, containerWidth - horizontalPadding * 2);
    const availableHeight = Math.max(controlbarHeight + 1, containerHeight - verticalPadding * 2);

    const rows = Math.max(1, Math.floor(Math.sqrt(windows.length)));
    const columns = Math.ceil(windows.length / rows);
    const rowWindows = Array.from({ length: rows }, (_, row) => (
        windows.slice(row * columns, (row + 1) * columns)
    )).filter(row => row.length);
    const maxHeightByViewport = (availableHeight - gap * (rowWindows.length - 1)) / rowWindows.length - controlbarHeight;
    const maxHeightByRowWidth = Math.min(...rowWindows.map(row => {
        const aspectRatioSum = row.reduce((sum, win) => (
            sum + Math.max(1, win.realWidth) / Math.max(1, win.realHeight)
        ), 0);
        return (availableWidth - gap * (row.length - 1)) / aspectRatioSum;
    }));
    const previewHeight = Math.max(1, Math.min(preferredPreviewHeight, maxHeightByViewport, maxHeightByRowWidth));

    const rowHeight = previewHeight + controlbarHeight;
    const layoutHeight = rowWindows.length * rowHeight + gap * (rowWindows.length - 1);
    let y = Math.max(verticalPadding, (containerHeight - layoutHeight) / 2);
    const layouts = [];

    rowWindows.forEach(row => {
        const rowWidth = row.reduce((sum, win) => (
            sum + previewHeight * Math.max(1, win.realWidth) / Math.max(1, win.realHeight)
        ), 0) + gap * (row.length - 1);
        let x = Math.max(horizontalPadding, (containerWidth - rowWidth) / 2);

        row.forEach(win => {
            const h = previewHeight;
            const w = h * Math.max(1, win.realWidth) / Math.max(1, win.realHeight);
            layouts.push({ x, y: y + controlbarHeight, w, h });
            x += w + gap;
        });
        y += rowHeight + gap;
    });

    return layouts;
}

export default function Taskview(icon) {
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
        const mainWindows = windows.filter(w => w.type !== 'sub-window');
        const subWindows = windows.filter(w => w.type === 'sub-window');

        const layout = computeTaskLayout(viewport.width, viewport.height - taskbarHeight, mainWindows);
        mainWindows.forEach((win, i) => {
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
            maskControlbarInfoTitle.innerHTML = safeEscape(win.title);
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
            win.container.style.visibility = 'visible';
            win.container.hidden = false;
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
            win.focus();
        })
        subWindows.forEach((win) => {
            win.container.style.display = 'none';
        })
    }

    function close() {
        if (show == false) return;
        show = false;
        taskviewContainer.classList.remove('active');
        desktopEl.style.pointerEvents = 'auto';

        const windows = windowManager.all();
        const mainWindows = windows.filter(w => w.type !== 'sub-window');
        const subWindows = windows.filter(w => w.type === 'sub-window');
        while (masks.length) {
            const mask = masks.shift();
            mask.remove();
        }
        mainWindows.forEach((win, i) => {
            win.browserWindow.window.style.borderRadius = win.originalSnapSide ? '0px' : 'revert-layer';
            win.micaContainer.style.borderRadius = win.originalSnapSide ? '0px' : 'revert-layer';

            win.container.style.transition = 'none';
            if (win.isMinimized) {
                win.minimize(() => {
                    return show == false;
                });
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
        subWindows.forEach((win) => {
            win.container.style.display = 'revert-layer';
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
