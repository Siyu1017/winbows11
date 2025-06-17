class Listener {
    constructor(el) {
        this.target = el;
        this.listeners = {};
    }
    on(evt, listener) {
        if (!this.listeners[evt]) {
            return this.listeners = [listener];
        }
        return this.listeners.push(listener);
    }
    off(evt, listener) {
        if (!this.listeners[evt]) return;
        var index = this.listeners[evt].indexOf(listener);
        return this.listeners[evt].splice(index > -1 ? index : this.listeners.length, 1);
    }
}