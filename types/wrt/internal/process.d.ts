/// <reference path="./eventEmitter.d.ts" />
/// <reference path="./stdio.d.ts" />

declare class Process extends EventEmitter {
    constructor(cwd: string);

    readonly pid: number;
    readonly alive: boolean;

    env: { [key: string]: string; };
    argv0: string;
    argv: string[];
    platform: 'win32';
    title: string;
    execPath: string;
    execArgv: string;

    stderr: stdio.OutputStream;
    stdin: stdio.InputStream;
    stdout: stdio.OutputStream;

    nextTick(callback: () => void): void;
    exit(code?: number): void;
    kill(): void;
    abort(): void;
    chdir(dir: string): void;
    cwd(): string;
    emitWarning(warning: string | Error, type?: string | any, code?: string, ctor?: Function): void;
}