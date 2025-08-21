import { EventEmitter } from "./eventEmitter";

export class OutputStream extends EventEmitter {
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