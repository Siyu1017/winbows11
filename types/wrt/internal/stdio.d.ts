/// <reference path="./eventEmitter.d.ts" />

declare namespace stdio {
    interface InputStream extends EventEmitter {
        readonly readableEnded: boolean;
        readonly destroyed: boolean;
        readonly readableHighWaterMark: number;
        isPaused(): boolean;
        pause(): this;
        resume(): this;
        write(data: string | ArrayBuffer | Uint8Array): boolean;
        read(size?: number): string | null;
        end(data?: string | ArrayBuffer | Uint8Array): this;
        destroy(error?: Error): this;
    }

    interface OutputStream extends EventEmitter {
        readonly writableEnded: boolean;
        readonly destroyed: boolean;
        readonly writableHighWaterMark: number;
        readonly maxBuffer: number;
        readonly isTruncated: boolean;
        write(data: string | ArrayBuffer | Uint8Array): boolean;
        toString(): string;
        read(): string | null;
        clear(): this;
        end(data?: string | ArrayBuffer | Uint8Array): this;
        destroy(error?: Error): this;
    }

    namespace tty {
        interface InputStream extends stdio.InputStream {
            readonly isTTY: true;
            readonly isRaw: boolean;
            setRawMode(mode: boolean): void;
        }
        interface OutputStream extends stdio.OutputStream {
            readonly isTTY: true;
            columns: number;
            rows: number;
            resize(columns: number, rows: number): void;
            clearLine(dir?: 0 | -1 | 1, callback?: () => void): void;
            clearScreenDown(): void;
            cursorTo(x: number, y?: number): void;
            moveCursor(dx: number, dy: number): void;
            hasColors(): boolean;
            getWindowSize(): [number, number];
        }
    }
}
