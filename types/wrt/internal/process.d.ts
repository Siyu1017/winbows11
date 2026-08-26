/// <reference path="./eventEmitter.d.ts" />
/// <reference path="./stdio.d.ts" />

declare class Process extends EventEmitter {
    constructor(options?: {
        cwd?: string; name?: string; ppid?: number; type?: 'cli' | 'gui';
        env?: { [key: string]: string | undefined };
        stdin?: stdio.InputStream; stdout?: stdio.OutputStream; stderr?: stdio.OutputStream;
    });

    readonly pid: number;
    readonly ppid: number;
    readonly alive: boolean;
    readonly state: 'running' | 'stopped' | 'exiting' | 'exited' | 'killed';
    readonly startedAt: number;

    env: { [key: string]: string; };
    argv0: string;
    argv: string[];
    args: { [key: string]: unknown; };
    platform: 'win32';
    title: string;
    name: string;
    execPath: string;
    execArgv: string[];

    stderr: stdio.OutputStream;
    stdin: stdio.InputStream;
    stdout: stdio.OutputStream;

    nextTick(callback: () => void): void;
    exit(code?: number): Promise<void>;
    signal(signal: 'SIGINT' | 'SIGKILL' | 'SIGTERM' | 'SIGSTOP' | 'SIGCONT'): boolean;
    kill(pid: number, signal?: string | number): boolean;
    abort(): void;
    chdir(dir: string): void;
    cwd(): string;
    emitWarning(warning: string | Error, type?: string | any, code?: string, ctor?: Function): void;
    toJSON(): Record<string, unknown>;
}
