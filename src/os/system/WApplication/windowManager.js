import { EventEmitter } from "../../../shared/utils.ts";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";

const WindowManager = (() => {
    const windows = new Map();
    const modalWindows = new Map();
    viewport.onResize(e => {
        windows.forEach(win => {
            win.updateData();
            win.updateMica();
        })
    })

    return new (class extends EventEmitter {
        constructor() {
            super();
        }
        add(id, win) {
            if (windows.has(id)) throw new Error(`Window ${id} already exists`);
            windows.set(id, win);
            if (win.modal === true && win.parentWindow?.id) {
                if (!modalWindows.has(win.parentWindow.id)) {
                    modalWindows.set(win.parentWindow.id, new Set());
                }
                modalWindows.get(win.parentWindow.id).add(id);
            }
            this._emit('add', { id, win });
        }
        remove(id) {
            if (windows.has(id)) {
                windows.delete(id);
                modalWindows.delete(id);
                modalWindows.forEach((children, parentId) => {
                    children.delete(id);
                    if (children.size === 0) modalWindows.delete(parentId);
                });
                this._emit('remove', { id });
            }
        }
        get(id) {
            return windows.get(id);
        }
        all() {
            return [...windows.values()];
        }
        list() {
            return windows.keys();
        }
        getModal(parent) {
            const ids = modalWindows.get(parent?.id);
            if (!ids) return null;

            const modals = [...ids]
                .map(id => windows.get(id))
                .filter(win => win && !win.isClosed && !win.isMinimized);
            if (modals.length === 0) return null;

            return modals.reduce((topmost, win) =>
                Number(win.container.style.zIndex) > Number(topmost.container.style.zIndex) ? win : topmost
            );
        }
    })();
})();
ModuleManager.register('WindowManager', WindowManager, 'original');

export default WindowManager;
