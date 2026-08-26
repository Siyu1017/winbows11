// Winbows Runtime Process Wrapper Implementation

import { EventEmitter } from "../../../shared/utils";
import stdio from "../../lib/stdio";
import { processes, type ProcessSignal, type ProcessState } from "./ProcessManager";

function createNextTick() {
    const queue: Function[] = [];
    const textNode = document.createTextNode('');
    const observer = new MutationObserver(() => {
        const toRun = queue.splice(0);
        for (const fn of toRun) fn();
    });

    observer.observe(textNode, { characterData: true });

    let toggle = 0;

    return (cb: Function) => {
        queue.push(cb);
        toggle = 1 - toggle;
        textNode.data = String(toggle);
    };
}
const fallbackNextTick = createNextTick();

export function generateEnv() {
    return {
        APPDATA: 'C:/User/AppData/Local',
        COMPUTERNAME: 'SUPERCOMPUTER',
        LOCALAPPDATA: 'C:/User/AppData/Local',
        NUMBER_OF_PROCESSORS: `${navigator.hardwareConcurrency}`,
        OS: 'Winbows_NT',
        ProgramFiles: 'C:/Program Files',
        SystemDrive: 'C:',
        SystemRoot: 'C:/Winbows',
        TEMP: 'C:/User/AppData/Local/Temp',
        TMP: 'C:/User/AppData/Local/Temp',
        USERDOMAIN: 'SUPERCOMPUTER',
        USERDOMAIN_ROAMINGPROFILE: 'SUPERCOMPUTER',
        USERNAME: 'ADMIN',
        USERPROFILE: 'C:/User',
        windir: 'C:/Winbows',
    };
}

export type ProcessOptions = {
    argv0?: string;
    cwd?: string;
    encoding?: string;
    env?: Record<string, string>;
    isTTY?: boolean;
    killSignal?: string | number;
    maxBuffer?: number;
    shell?: string;
    stdio?: boolean | string;
    timeout?: number;
    windowsHide?: boolean;
    name?: string;
    ppid?: number;
    type?: 'cli' | 'gui';
    stdin?: stdio.InputStream | stdio.tty.InputStream;
    stdout?: stdio.OutputStream | stdio.tty.OutputStream;
    stderr?: stdio.OutputStream | stdio.tty.OutputStream;
}

// disconnect, send, -> IPC
// TODOs: debugPort, report, permission

const _cwd = Symbol('cwd');
const _exitCode = Symbol('exitCode');
const _uncaughtExceptionCaptureCallback = Symbol('uncaughtExceptionCaptureCallback');
const _startTime = Symbol('startTime');
const _title = Symbol('title');
const _env = Symbol('env');
const _state = Symbol('state');
const _ownedStreams = Symbol('ownedStreams');

class Process extends EventEmitter {
    [key: symbol]: any;

    private [_cwd]: string = 'C:/';
    private [_exitCode]: number | null | undefined = undefined;
    private [_uncaughtExceptionCaptureCallback]: Function | null = null;
    private [_startTime]: number = Date.now();
    private [_title]: string = 'Winbows Node.js Runtime';
    private [_env]: Record<string, any>;
    private [_state]: ProcessState = 'running';
    private [_ownedStreams]: Array<{ destroy?: () => void }> = [];

    get alive() {
        return this[_exitCode] === undefined && ['running', 'stopped'].includes(this[_state]);
    }
    get state(): ProcessState { return this[_state]; }
    arch: string = 'x64';
    argv: string[];
    argv0: string;
    channel: undefined;
    connected: boolean = false;
    debugPort?: number;
    env: Record<string, string | undefined>;
    readonly execArgv: string[];
    readonly execPath: string;
    get exitCode(): number | null | undefined {
        return this[_exitCode];
    }
    set exitCode(code: number | null | undefined) {
        void this.exit(code);
    }
    readonly noDeprecation: boolean;
    readonly permission?: Object;
    readonly pid: number;
    readonly platform: string = 'win32';
    readonly ppid: number;
    readonly startedAt: number = this[_startTime];
    readonly type: 'cli' | 'gui';
    name: string;
    report?: Object;
    stderr: stdio.OutputStream | stdio.tty.OutputStream;
    stdin: stdio.InputStream | stdio.tty.InputStream;
    stdout: stdio.OutputStream | stdio.tty.OutputStream;
    throwDeprecation: boolean = false;
    get title(): string {
        return this[_title];
    }
    set title(val: string) {
        if (this[_title] !== val) {
            this[_title] = val;
            processes.update(this, 'title', val);
            this._emit('change:title', { value: val });
        }
    }
    traceDeprecation: boolean = false;
    version: string = 'v1.0.0';

    constructor(options: ProcessOptions = {}) {
        super();

        this[_env] = { ...generateEnv(), ...options.env };

        this.argv0 = options.argv0 ?? '~wrt';
        this.argv = [this.argv0];
        this.name = options.name ?? this.argv0;
        this.ppid = options.ppid ?? 0;
        this.type = options.type ?? 'cli';
        this.env = new Proxy(this[_env], {
            set: (obj, prop, value) => {
                if (typeof prop !== 'string') return false;
                this[_env][prop] = value === undefined ? undefined : String(value);
                return true;
            },
            get: (obj, prop) => {
                return this[_env][String(prop)];
            }
        });
        this.execArgv = [];
        this.execPath = '~wrt';
        this.noDeprecation = this.argv.includes('--no-deprecation');
        this.pid = processes.allocatePid();

        if (options?.isTTY === true) {
            this.stdin = options.stdin ?? new stdio.tty.InputStream();
            this.stdout = options.stdout ?? new stdio.tty.OutputStream();
            this.stderr = options.stderr ?? new stdio.tty.OutputStream();
        } else {
            this.stdin = options.stdin ?? new stdio.InputStream();
            this.stdout = options.stdout ?? new stdio.OutputStream();
            this.stderr = options.stderr ?? new stdio.OutputStream();
        }
        if (!options.stdin) this[_ownedStreams].push(this.stdin);
        if (!options.stdout) this[_ownedStreams].push(this.stdout);
        if (!options.stderr) this[_ownedStreams].push(this.stderr);

        if (options?.cwd) {
            this[_cwd] = normalizeVfsPath(options.cwd);
        }

        processes.add(this);
    }

    abort(): void {
        void this.exit(1, 'SIGKILL');
    }
    availableMemory(): number {
        return 0;
    }
    chdir(directory: string): void | Error {
        this[_cwd] = normalizeVfsPath(directory, this[_cwd]);
        processes.update(this, 'cwd', this[_cwd]);
        this._emit('change:cwd', { value: this[_cwd] });
    }
    constrainedMemory(): number {
        return 0;
    }
    cwd(): string {
        return this[_cwd];
    }
    emitWarning(warning: string | Error, type?: string | any, code?: string, ctor?: Function): void {
        if (this.noDeprecation && type === 'DeprecationWarning') {
            return;
        }
        let detail;
        if (type !== null && typeof type === 'object' && !Array.isArray(type)) {
            ctor = type.ctor;
            code = type.code;
            if (typeof type.detail === 'string')
                detail = type.detail;
            type = type.type || 'Warning';
        } else if (typeof type === 'function') {
            ctor = type;
            code = undefined;
            type = 'Warning';
        }
        if (typeof code === 'function') {
            ctor = code;
            code = undefined;
        }
        if (typeof warning === 'string') {
            warning = new Error(warning);
            warning.name = String(type || 'Warning');
            if (code !== undefined) (warning as any).code = code;
            if (detail !== undefined) (warning as any).detail = detail;
            (Error as any).captureStackTrace(warning, ctor || this.emitWarning);
        } else if (!(warning instanceof Error)) {
            throw new Error('First argument must be a string or an Error');
        }
        if (warning.name === 'DeprecationWarning') {
            if (this.noDeprecation)
                return;
            if (this.throwDeprecation) {
                // Delay throwing the error to guarantee that all former warnings were
                // properly logged.
                return process.nextTick(() => {
                    throw warning;
                });
            }
        }
        this.nextTick(() => {
            this._emit('warning', warning);
        }, warning);
    }
    async exit(code?: number | null | undefined, signal: ProcessSignal | null = null): Promise<void> {
        if (this[_exitCode] !== undefined) return;
        if (typeof code !== 'number' && code !== null && code !== undefined) {
            throw new TypeError('Exit code must be a number or null');
        }
        this[_state] = 'exiting';
        processes.update(this, 'state', this[_state]);
        if (code === undefined || code === null) {
            this[_exitCode] = 0;
        } else {
            this[_exitCode] = code;
        }
        if (this._list('beforeExit').length > 0) {
            const promises: Promise<any>[] = [];
            const evt = {
                waitUntil(promise: Promise<any>) {
                    if (!promise || typeof promise.then !== 'function') return;
                    promises.push(promise);
                }
            }
            this._emit('beforeExit', evt);
            const allPromises = Promise.all(promises.map(promise => promise.catch(e => {
                console.error(e);
            })))
            const timeoutPromise = new Promise(rs => setTimeout(rs, 10000));

            await Promise.race([allPromises.then(), timeoutPromise]);
        }
        this[_ownedStreams].forEach(stream => stream.destroy?.());
        this[_state] = signal === 'SIGKILL' ? 'killed' : 'exited';
        this._emit('exit', this[_exitCode], signal);
        processes.remove(this.pid);
    }
    getActiveResourcesInfo(): string[] {
        return [];
    }
    getBuiltinModule(id: string): Object | undefined {
        return undefined;
    }
    hasUncaughtExceptionCaptureCallback(): boolean {
        return this[_uncaughtExceptionCaptureCallback] !== null;
    }
    signal(signal: ProcessSignal): boolean {
        if (!this.alive) return false;
        if (signal === 'SIGSTOP') {
            this[_state] = 'stopped';
            processes.update(this, 'state', this[_state]);
            this._emit(signal);
            return true;
        }
        if (signal === 'SIGCONT') {
            if (this[_state] !== 'stopped') return false;
            this[_state] = 'running';
            processes.update(this, 'state', this[_state]);
            this._emit(signal);
            return true;
        }
        this._emit('signal', signal);
        this._emit(signal);
        void this.exit(signal === 'SIGKILL' ? 137 : 0, signal);
        return true;
    }
    kill(pid: number, signal?: string | number) {
        const normalized = typeof signal === 'number'
            ? ({ 2: 'SIGINT', 9: 'SIGKILL', 15: 'SIGTERM', 19: 'SIGSTOP', 18: 'SIGCONT' } as Record<number, ProcessSignal>)[signal]
            : (signal?.toUpperCase() ?? 'SIGTERM') as ProcessSignal;
        if (!['SIGINT', 'SIGKILL', 'SIGTERM', 'SIGSTOP', 'SIGCONT'].includes(normalized)) return false;
        return processes.kill(pid, normalized);
    }
    memoryUsage(): Object {
        return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
    }
    nextTick(callback: Function, ...args: any[]): void {
        return 'queueMicrotask' in window ? queueMicrotask(() => callback(...args)) : fallbackNextTick(() => callback(...args))
    }
    resourceUsage(): Object {
        return {
            userCPUTime: 0,
            systemCPUTime: 0,
            maxRSS: 0,
            sharedMemorySize: 0,
            unsharedDataSize: 0,
            unsharedStackSize: 0,
            minorPageFault: 0,
            majorPageFault: 0,
            swappedOut: 0,
            fsRead: 0,          // fs.usage().reads
            fsWrite: 0,         // fs.usage().writes
            ipcSent: 0,         // IPC.usage().sents
            ipcReceived: 0,     // IPC.usage().received
            signalsCount: 0,    // signals.usage().count
            voluntaryContextSwitches: 0,
            involuntaryContextSwitches: 0
        }
    }
    setUncaughtExceptionCaptureCallback(fn: Function | null) {
        if (typeof fn === 'function' || fn === null) {
            this[_uncaughtExceptionCaptureCallback] = fn;
        }
    }
    uptime(): number {
        return Date.now() - this[_startTime];
    }
    toJSON() {
        return {
            pid: this.pid,
            ppid: this.ppid,
            name: this.name,
            title: this.title,
            type: this.type,
            state: this.state,
            startedAt: this.startedAt,
            cwd: this.cwd(),
            argv: [...this.argv]
        };
    }
}

function normalizeVfsPath(value: string, cwd = 'C:/') {
    const path = value.replace(/^C:\//i, '/');
    const normalizedCwd = cwd.replace(/^C:\//i, '/');
    const source = path.startsWith('/') ? path : `${normalizedCwd}/${path}`;
    const parts: string[] = [];
    for (const part of source.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    return `C:/${parts.join('/')}`;
}

export { Process, processes };
export type { ProcessSignal, ProcessState };
