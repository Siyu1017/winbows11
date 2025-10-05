import { EventEmitter } from "../../shared/utils.js";

// Input stream
class InputStream extends EventEmitter {
    constructor() {
        super();
        this.buffer = [];
        this.readListeners = [];
        this.ended = false;
    }

    write(data) {
        if (this.ended) return;
        if (this.readListeners.length > 0) {
            const listener = this.readListeners.shift();
            listener(data);
        } else if (this.buffer.length > 0) {
            resolve(this.buffer.shift());
        } else {
            this.buffer.push(data);
        }

        this._emit('data', data);
    }

    read() {
        return new Promise(resolve => {
            if (this.buffer.length > 0) {
                resolve(this.buffer.shift());
            } else {
                this.readListeners.push(resolve);
            }
        });
    }

    end() {
        if (this.ended) return;
        this.ended = true;

        while (this.listeners.length > 0) {
            const listener = this.listeners.shift();
            listener(null);
        }

        this.emit('end');
    }
}

// Output stream
class OutputStream extends EventEmitter {
    constructor() {
        super();
        this.buffer = [];
    }

    write(data) {
        this.buffer.push(data);
        this._emit('data', data);
    }

    toString() {
        return this.buffer;
    }

    read() {
        return this.buffer.shift();
    }

    clear() {
        this.buffer = [];
        this._emit('clear');
    }
}

export default {
    InputStream,
    OutputStream
}