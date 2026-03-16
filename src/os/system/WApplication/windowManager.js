import { EventEmitter } from "../../../shared/utils.ts";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";

const WindowManager = (() => {
    const windows = new Map();
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
            this._emit('add', { id, win });
        }
        remove(id) {
            if (windows.has(id)) {
                windows.delete(id);
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
    })();
})();
ModuleManager.register('WindowManager', WindowManager, 'original');

export default WindowManager;