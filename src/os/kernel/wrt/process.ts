// Winbows Runtime Process Wrapper Implementation

import { EventEmitter } from "../../../shared/utils";
import stdio from "../../lib/stdio.js";
import crashHandler from "../../core/crashHandler.js";
import { IDBFS, fsUtils } from "../../../shared/fs.js";
import Logger from "../../core/log.js";

const fs = IDBFS('~KERNEL');
const logger = new Logger({
    module: 'Process'
})

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

const processes = new ((() => {
    const processes = new Array(8192).fill(null);
    return class TaskList extends EventEmitter {
        constructor() {
            super();
        }
        add(pid: number, process: Process) {
            if (processes[pid]) {
                const err = new Error(`Process ${pid} already exists`);
                logger.error(err);
                return crashHandler(err);
            }
            processes[pid] = process;
            this._emit('add', { pid, process });
        }
        remove(pid: number) {
            if (processes[pid]) {
                processes[pid] = null;
                this._emit('remove', { pid });
            }
        }
        update(pid: number, key: string, value: any) {
            const process = processes[pid];
            if (!process) return;
            process[key] = value;
            this._emit('update', { pid, key, value });
        }
        get(pid: number) {
            return processes[pid];
        }
        list() {
            return [...processes];
        }
        findVacant() {
            return processes.findIndex(p => p == null);
        }
    }
})())();

type IProcessSignal = "SIGINT" | "SIGKILL" | "SIGTERM" | "SIGSTOP";
type IProcessOptions = {
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
}

const signalManager = (() => {
    const eventEmitter = new EventEmitter();
    return {
        onSignal: (callback: (signal: IProcessSignal) => void) => {
            eventEmitter.on('signal', callback);
        },
        emit: (signal: IProcessSignal) => {
            eventEmitter.emit('signal', signal);
        }
    }
})();

// disconnect, send, -> IPC
// TODOs: debugPort, report, permission

const _cwd = Symbol('cwd');
const _exitCode = Symbol('exitCode');
const _uncaughtExceptionCaptureCallback = Symbol('uncaughtExceptionCaptureCallback');
const _startTime = Symbol('startTime');
const _title = Symbol('title');
const _env = Symbol('env');

class Process extends EventEmitter {
    [key: symbol]: any;

    private [_cwd]: string = 'C:/';
    private [_exitCode]: number | null | undefined = undefined;
    private [_uncaughtExceptionCaptureCallback]: Function | null = null;
    private [_startTime]: number = Date.now();
    private [_title]: string = 'Winbows Node.js Runtime';
    private [_env]: Record<string, any>;

    get alive() {
        return this[_exitCode] === undefined;
    }
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
        if (this[_exitCode] !== undefined) return;
        if (typeof code !== 'number' && code !== null && code !== undefined) return;
        if (code === undefined || code === null) {
            this[_exitCode] = 0;
        } else {
            this[_exitCode] = code;
        }
        this._emit('exit', this[_exitCode]);
        processes.remove(this.pid);
    }
    readonly noDeprecation: boolean;
    readonly permission?: Object;
    readonly pid: number;
    readonly platform: string = 'win32';
    readonly ppid: number | undefined;
    report?: Object;
    readonly stderr: stdio.OutputStream | stdio.tty.OutputStream;
    readonly stdin: stdio.InputStream | stdio.tty.InputStream;
    readonly stdout: stdio.OutputStream | stdio.tty.OutputStream;
    throwDeprecation: boolean = false;
    get title(): string {
        return this[_title];
    }
    set title(val: string) {
        if (this[_title] !== val) {
            this[_title] = val;
            this._emit('change:title', { value: val });
        }
    }
    traceDeprecation: boolean = false;
    version: string = 'v1.0.0';

    constructor(options?: IProcessOptions) {
        super();

        this[_env] = generateEnv();

        this.argv0 = '~wrt';
        this.argv = [this.argv0];
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
        this.pid = processes.findVacant();
        if (this.pid == -1) {
            logger.error(new Error('The maximum number of processes has been reached'));
            throw new Error('The maximum number of processes has been reached');
        }

        if (options?.isTTY === true) {
            this.stderr = new stdio.tty.OutputStream();
            this.stdin = new stdio.tty.InputStream();
            this.stdout = new stdio.tty.OutputStream();
        } else {
            this.stderr = new stdio.OutputStream();
            this.stdin = new stdio.InputStream();
            this.stdout = new stdio.OutputStream();
        }

        if (options?.cwd) {
            this[_cwd] = options?.cwd;
        }
        if (!fs.exists(this[_cwd])) {
            logger.warn(`The specified working directory ${this[_cwd]} could not be found.`);
            this[_cwd] = 'C:/';
        }

        processes.add(this.pid, this);
        signalManager.onSignal(this._handleSignal);
    }

    private _handleSignal(signal: IProcessSignal) {
        if (signal === 'SIGKILL') {
            return this.exitCode = 0;
        }

        switch (signal) {
            case "SIGINT":
            case "SIGTERM":
                this.exitCode = 0;
                break;
            default:
                break;
        }

        this._emit(signal);
    }

    abort(): void {
        this[_exitCode] = 1;
        processes.remove(this.pid);
    }
    availableMemory(): number {
        return 0;
    }
    chdir(directory: string): void | Error {
        directory = fsUtils.toDirFormat(directory);
        if (!fs.exists(directory)) {
            throw new Error(`Directory not found : ${directory}`);
        } else {
            this[_cwd] = directory;
        }
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
    async exit(code?: number | null | undefined): Promise<void> {
        if (this[_exitCode] !== undefined) return;
        if (typeof code !== 'number' && code !== null && code !== undefined) return;
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
            eventEmitter._emit('beforeExit', evt);
            const allPromises = Promise.all(promises.map(promise => promise.catch(e => {
                console.error(e);
            })))
            const timeoutPromise = new Promise(rs => setTimeout(rs, 10000));

            await Promise.race([allPromises.then(), timeoutPromise]);
        }
        this._emit('exit', this[_exitCode]);
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
    kill(pid: number, signal?: string | number) {

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
}

export { Process, processes };