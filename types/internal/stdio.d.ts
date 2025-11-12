/// <reference path="./eventEmitter.d.ts" />

declare namespace stdio {
    interface InputStream extends EventEmitter {
        write(data: string): void;
        read(): Promise<string>;
        end(): void;
    }

    interface OutputStream extends EventEmitter {
        write(data: string): void;
        toString(): string;
        read(): string;
        clear(): void;
    }

    interface Writable extends EventEmitter {
        on(event: 'close'|'drain'|'erorr'|'pipe'|'unpipe', listener: Function): void;
    }
}
