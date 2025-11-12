import { EventEmitter } from "../../shared/utils.ts";

const _flowing = Symbol('flowing');
const _columns = Symbol('columns');
const _rows = Symbol('rows');
const _isRaw = Symbol('isRaw');
const _closed = Symbol('closed');
const _paused = Symbol('paused');

const tty = {};

// Input stream
class InputStream extends EventEmitter {
    constructor() {
        super();

        this.buffer = [];
        this[_closed] = false;
        this[_paused] = true;
    }

    isPaused() {
        return this[_paused];
    }

    pause() {
        this[_paused] = true;
    }

    resume() {
        this[_paused] = false;
    }

    write(data) {
        if (this[_closed]) return;
        this.buffer.push(data);

        if (!this[_paused]) {
            this._emit('data', data);
        }
    }

    read(size) {
        if (this.buffer.length === 0) return null;
        if (size) return this.buffer.splice(0, size).join('');
        return this.buffer.shift();
    }

    destroy() {
        if (this[_closed]) return;
        this[_closed] = true;

        this._emit('close');
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
        return this.buffer.join('');
    }

    read() {
        return this.buffer.shift();
    }

    clear() {
        this.buffer = [];
        this._emit('clear');
    }
}

tty.InputStream = class extends InputStream {
    constructor() {
        super();

        this[_isRaw] = false;
    }

    get isTTY() {
        return true;
    }

    get isRaw() {
        return this[_isRaw];
    }

    setRawMode(mode) {
        this[_isRaw] = !!mode;
    }
}

tty.OutputStream = class extends OutputStream {
    constructor(columns, rows) {
        super();

        this[_columns] = columns || Infinity;
        this[_rows] = rows || Infinity;
    }

    get isTTY() {
        return true;
    }

    get columns() {
        return this[_columns];
    }
    set columns(value) {
        this[_columns] = value;
        this._emit('resize');
    }

    get rows() {
        return this[_rows];
    }
    set rows(value) {
        this[_rows] = value;
        this._emit('resize');
    }


    clearLine(dir = 0, callback = function () { }) {
        this.write(`\x1b[${dir == -1 ? '1' : dir == 1 ? '0' : '2'}K`);
        callback();
    }

    clearScreenDown() {
        this.write('\x1b[J');
    }

    cursorTo(x, y) {
        if (y === undefined) {
            this.write(`\x1b[${x + 1}G`);
        } else {
            this.write(`\x1b[${y + 1};${x + 1}H`);
        }
    }


    moveCursor(dx, dy) {
        if (dx < 0) this.write(`\x1b[${-dx}D`);
        if (dx > 0) this.write(`\x1b[${dx}C`);
        if (dy < 0) this.write(`\x1b[${-dy}A`);
        if (dy > 0) this.write(`\x1b[${dy}B`);
    }

    hasColors() {
        return true;
    }

    getWindowSize() {
        return [this.columns, this.rows];
    }
}


// TODO: Readable ( stdin ) and Writable ( stdout, stderr ) Stream, TTY

export default {
    InputStream,
    OutputStream,
    tty: tty
}