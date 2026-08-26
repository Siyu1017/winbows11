import { EventEmitter } from "../../shared/utils";

export type StdioChunk = string | ArrayBuffer | Uint8Array;

export interface StreamOptions {
    highWaterMark?: number;
}

export interface OutputStreamOptions extends StreamOptions {
    /** Keep a bounded transcript for pipes, redirects, and diagnostics. */
    maxBuffer?: number;
}

function normalizeChunk(data: StdioChunk): string {
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
    if (data instanceof Uint8Array) return new TextDecoder().decode(data);
    throw new TypeError('stdio streams only accept strings, ArrayBuffers, or Uint8Arrays');
}

function normalizeLimit(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!Number.isSafeInteger(value) || value < 1) throw new RangeError('Stream limits must be positive integers');
    return value;
}

/** A small readable stream used as a process stdin or a pipeline source. */
export class InputStream extends EventEmitter {
    private chunks: string[] = [];
    private bufferedBytes = 0;
    private paused = true;
    private closed = false;
    private ended = false;
    readonly readableHighWaterMark: number;

    constructor(options: StreamOptions = {}) {
        super();
        this.readableHighWaterMark = normalizeLimit(options.highWaterMark, 64 * 1024);
    }

    get readableEnded() { return this.ended; }
    get destroyed() { return this.closed; }
    isPaused() { return this.paused; }

    on(eventName: string, handler: Function) {
        super.on(eventName, handler);
        if (eventName === 'data') this.resume();
        return this;
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            this._emit('pause');
        }
        return this;
    }

    resume() {
        if (!this.paused || this.closed) return this;
        this.paused = false;
        this._emit('resume');
        this.flush();
        return this;
    }

    write(data: StdioChunk): boolean {
        if (this.closed || this.ended) return false;
        const chunk = normalizeChunk(data);
        if (this.paused) {
            this.chunks.push(chunk);
            this.bufferedBytes += chunk.length;
        } else {
            this._emit('data', chunk);
        }
        return this.bufferedBytes < this.readableHighWaterMark;
    }

    read(size?: number): string | null {
        if (this.chunks.length === 0) {
            this.emitEndIfReady();
            return null;
        }
        if (size === undefined) {
            const chunk = this.chunks.shift()!;
            this.bufferedBytes -= chunk.length;
            this.emitDrainIfReady();
            this.emitEndIfReady();
            return chunk;
        }
        if (!Number.isSafeInteger(size) || size < 1) throw new RangeError('size must be a positive integer');
        let remaining = size;
        let output = '';
        while (remaining > 0 && this.chunks.length > 0) {
            const chunk = this.chunks[0];
            if (chunk.length <= remaining) {
                output += this.chunks.shift();
                this.bufferedBytes -= chunk.length;
                remaining -= chunk.length;
            } else {
                output += chunk.slice(0, remaining);
                this.chunks[0] = chunk.slice(remaining);
                this.bufferedBytes -= remaining;
                remaining = 0;
            }
        }
        this.emitDrainIfReady();
        this.emitEndIfReady();
        return output;
    }

    end(data?: StdioChunk) {
        if (this.closed || this.ended) return this;
        if (data !== undefined) this.write(data);
        this.ended = true;
        this.emitEndIfReady();
        return this;
    }

    destroy(error?: Error) {
        if (this.closed) return this;
        this.closed = true;
        this.chunks = [];
        this.bufferedBytes = 0;
        if (error) this._emit('error', error);
        this._emit('close');
        return this;
    }

    private flush() {
        while (!this.paused && !this.closed && this.chunks.length > 0) {
            const chunk = this.chunks.shift()!;
            this.bufferedBytes -= chunk.length;
            this._emit('data', chunk);
        }
        this.emitDrainIfReady();
        this.emitEndIfReady();
    }

    private emitDrainIfReady() {
        if (this.bufferedBytes < this.readableHighWaterMark) this._emit('drain');
    }

    private emitEndIfReady() {
        if (this.ended && this.chunks.length === 0 && !this.closed) this._emit('end');
    }
}

/** A writable stream with a bounded, non-destructive transcript. */
export class OutputStream extends EventEmitter {
    private transcript: string[] = [];
    private transcriptBytes = 0;
    private unread: string[] = [];
    private unreadBytes = 0;
    private closed = false;
    private ended = false;
    private truncated = false;
    readonly writableHighWaterMark: number;
    readonly maxBuffer: number;

    constructor(options: OutputStreamOptions = {}) {
        super();
        this.writableHighWaterMark = normalizeLimit(options.highWaterMark, 64 * 1024);
        this.maxBuffer = normalizeLimit(options.maxBuffer, 1024 * 1024);
    }

    get destroyed() { return this.closed; }
    get writableEnded() { return this.ended; }
    get isTruncated() { return this.truncated; }

    write(data: StdioChunk): boolean {
        if (this.closed || this.ended) return false;
        const chunk = normalizeChunk(data);
        this.unread.push(chunk);
        this.unreadBytes += chunk.length;
        this.trimUnread();
        this.appendTranscript(chunk);
        this._emit('data', chunk);
        return !this.truncated;
    }

    read(): string | null {
        const chunk = this.unread.shift() ?? null;
        if (chunk !== null) this.unreadBytes -= chunk.length;
        return chunk;
    }

    toString() {
        return this.transcript.join('');
    }

    clear() {
        this.transcript = [];
        this.unread = [];
        this.transcriptBytes = 0;
        this.unreadBytes = 0;
        this.truncated = false;
        this._emit('clear');
        this._emit('drain');
        return this;
    }

    end(data?: StdioChunk) {
        if (this.closed || this.ended) return this;
        if (data !== undefined) this.write(data);
        this.ended = true;
        this._emit('finish');
        return this;
    }

    destroy(error?: Error) {
        if (this.closed) return this;
        this.closed = true;
        if (error) this._emit('error', error);
        this._emit('close');
        return this;
    }

    private appendTranscript(chunk: string) {
        if (chunk.length >= this.maxBuffer) {
            this.transcript = [chunk.slice(-this.maxBuffer)];
            this.transcriptBytes = this.maxBuffer;
            this.truncated = true;
            this._emit('overflow', { maxBuffer: this.maxBuffer });
            return;
        }
        this.transcript.push(chunk);
        this.transcriptBytes += chunk.length;
        while (this.transcriptBytes > this.maxBuffer && this.transcript.length > 0) {
            const removed = this.transcript.shift()!;
            this.transcriptBytes -= removed.length;
            this.truncated = true;
        }
        if (this.truncated) this._emit('overflow', { maxBuffer: this.maxBuffer });
    }

    private trimUnread() {
        while (this.unreadBytes > this.maxBuffer && this.unread.length > 0) {
            const removed = this.unread.shift()!;
            this.unreadBytes -= removed.length;
        }
    }
}

class TTYInputStream extends InputStream {
    private raw = false;
    get isTTY() { return true as const; }
    get isRaw() { return this.raw; }
    setRawMode(mode: boolean) {
        this.raw = Boolean(mode);
        return this;
    }
}

class TTYOutputStream extends OutputStream {
    private _columns: number;
    private _rows: number;

    constructor(columns = 80, rows = 24, options: OutputStreamOptions = {}) {
        super(options);
        this._columns = normalizeLimit(columns, 80);
        this._rows = normalizeLimit(rows, 24);
    }

    get isTTY() { return true as const; }
    get columns() { return this._columns; }
    set columns(value: number) { this.resize(value, this._rows); }
    get rows() { return this._rows; }
    set rows(value: number) { this.resize(this._columns, value); }

    resize(columns: number, rows: number) {
        const nextColumns = normalizeLimit(columns, this._columns);
        const nextRows = normalizeLimit(rows, this._rows);
        if (nextColumns === this._columns && nextRows === this._rows) return;
        this._columns = nextColumns;
        this._rows = nextRows;
        this._emit('resize');
    }

    clearLine(dir: -1 | 0 | 1 = 0, callback: () => void = () => {}) {
        this.write(`\x1b[${dir === -1 ? '1' : dir === 1 ? '0' : '2'}K`);
        callback();
    }
    clearScreenDown() { this.write('\x1b[J'); }
    cursorTo(x: number, y?: number) { this.write(y === undefined ? `\x1b[${x + 1}G` : `\x1b[${y + 1};${x + 1}H`); }
    moveCursor(dx: number, dy: number) {
        if (dx < 0) this.write(`\x1b[${-dx}D`);
        if (dx > 0) this.write(`\x1b[${dx}C`);
        if (dy < 0) this.write(`\x1b[${-dy}A`);
        if (dy > 0) this.write(`\x1b[${dy}B`);
    }
    hasColors() { return true; }
    getWindowSize(): [number, number] { return [this.columns, this.rows]; }
}

export const tty = { InputStream: TTYInputStream, OutputStream: TTYOutputStream };

export default { InputStream, OutputStream, tty };
