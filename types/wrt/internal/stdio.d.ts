/// <reference path="./eventEmitter.d.ts" />

declare namespace stdio {
    interface InputStream extends EventEmitter {
        isPaused(): boolean;
        pause(): void;
        resume(): void;
        write(data: string): void;
        read(size?: number): Promise<string>;
        destroy(): void;
    }

    interface OutputStream extends EventEmitter {
        write(data: string): void;
        toString(): string;
        read(): string;
        clear(): void;
        destroy(): void;
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
            clearLine(dir?: 0 | -1 | 1, callback?: () => void): void;
            clearScreenDown(): void;
            cursorTo(x: number, y?: number): void;
            moveCursor(dx: number, dy: number): void;
            hasColors(): boolean;
            getWindowSize(): [number, number];
        }
    }
}
