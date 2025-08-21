export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, handler) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(handler);
    }

    off(eventName, handler) {
        if (!this.listeners.has(eventName)) return;
        this.listeners.get(eventName).delete(handler);
    }

    _emit(eventName, ...args) {
        if (!this.listeners.has(eventName)) return;
        for (const handler of this.listeners.get(eventName)) {
            try {
                handler(...args);
            } catch (e) {
                console.error(`Error in handler for ${eventName}:`, e);
            }
        }
    }
}