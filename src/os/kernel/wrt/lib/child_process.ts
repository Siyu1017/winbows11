import { EventEmitter } from "../../../../shared/utils";
import { fsUtils } from "../../../../shared/fs";
import { Process } from "../process";

type IChildProcessOptionsStdio = "pipe" | "ipc" | "ignore" | "inherit";

function normalizeExecArgs(command: string, options?: any, callback?: (error: Error | null, stdout: string, stderr: string) => void) {
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }

    options = { __proto__: null, ...options };
    options.shell = typeof options.shell === 'string' ? options.shell : true;

    return {
        file: command,
        options: options,
        callback: callback,
    };
}

function normalizeExecFileArgs(file: string, args: any, options?: any, callback?: (error: Error | null, stdout: string, stderr: string) => void) {
    if (Array.isArray(args)) {
        args = args.slice();
    } else if (args != null && typeof args === 'object') {
        callback = options;
        options = args;
        args = null;
    } else if (typeof args === 'function') {
        callback = args;
        options = null;
        args = null;
    }

    args ??= [];

    if (typeof options === 'function') {
        callback = options;
    }

    options ??= Object.freeze({ __proto__: null });

    return { file, args, options, callback };
}

function stdioStringToArray(stdio: string, channel: string) {
    const options: (string | number)[] = [];

    switch (stdio) {
        case 'ignore':
        case 'pipe': options.push(stdio, stdio, stdio); break;
        case 'inherit': options.push(0, 1, 2); break;
        default:
            throw new Error(`The argument 'stdio' is invalid. Received ${stdio}`);
    }

    if (channel) options.push(channel);

    return options;
}

export function child_process(process: Process) {
    const owner_symbol = Symbol('owner');

    function flushStdio(subprocess: ChildProcess) {
        // const stdio = subprocess.stdio;

        // if (stdio == null) return;

        // for (let i = 0; i < stdio.length; i++) {
        //     const stream = stdio[i];
        //     if (!stream || !stream.readable || stream[kIsUsedAsStdio]) {
        //         continue;
        //     }
        //     stream.resume();
        // }
    }

    function maybeClose(subprocess: ChildProcess) {
        subprocess._closesGot++;

        if (subprocess._closesGot === subprocess._closesNeeded) {
            subprocess.emit('close', subprocess.exitCode, subprocess.signalCode);
        }
    }


    class ChildProcess extends EventEmitter {
        _closesNeeded: number;
        _closesGot: number;
        _handle: Process | null;

        connected: boolean;
        signalCode: string | null;
        exitCode: number | null;
        killed: boolean;
        spawnfile: string | null;
        spawnargs: string[] = [];

        constructor(options?: Object) {
            super();

            this._closesNeeded = 1;
            this._closesGot = 0;
            this.connected = false;

            this.signalCode = null;
            this.exitCode = null;
            this.killed = false;
            this.spawnfile = null;

            this._handle = new Process(options);
            this._handle[owner_symbol] = this;

            this._handle.on('exit', (exitCode: number, signalCode: string) => {
                if (signalCode) {
                    this.signalCode = signalCode;
                } else {
                    this.exitCode = exitCode;
                }

                // if (this.stdin) {
                //     this.stdin.destroy();
                // }

                // this._handle.close();
                this._handle = null;

                if (exitCode < 0) {
                    const syscall = this.spawnfile ? 'spawn ' + this.spawnfile : 'spawn';
                    const err = new Error(`${syscall} ${exitCode}`);

                    if (this.spawnfile)
                        (err as any).path = this.spawnfile;

                    (err as any).spawnargs = this.spawnargs.slice(1);
                    this.emit('error', err);
                } else {
                    this.emit('exit', this.exitCode, this.signalCode);
                }

                // If any of the stdio streams have not been touched,
                // then pull all the data through so that it can get the
                // eof and emit a 'close' event.
                // Do it on nextTick so that the user has one last chance
                // to consume the output, if for example they only want to
                // start reading the data once the process exits.
                process.nextTick(flushStdio, this);

                maybeClose(this);
            });

            // if (childProcessChannel.hasSubscribers) {
            //     childProcessChannel.publish({
            //         process: this,
            //     });
            // }
        }

        spawn(options: Object) {

        }
    }

    let emittedDEP0190Already = false;
    let windowsVerbatimArguments = false;
    function normalizeSpawnArguments(file: string, args?: any, options?: any) {
        if (file.length === 0)
            throw new Error(`The argumant \'file\' cannot be empty. Received ${file}`);

        if (Array.isArray(args)) {
            args = args.slice();
        } else if (args == null) {
            args = [];
        } else if (typeof args !== 'object') {
            throw new Error(``)
        } else {
            options = args;
            args = [];
        }

        if (options === undefined)
            options = Object.freeze({ __proto__: null });

        options = { __proto__: null, ...options };
        let cwd = options.cwd;

        if (options.shell != null &&
            typeof options.shell !== 'boolean' &&
            typeof options.shell !== 'string') {
            throw new TypeError(`The property 'shell' is in valid. Received ${options.shell}`);
        }

        if (options.shell) {
            if (args.length > 0 && !emittedDEP0190Already) {
                process.emitWarning(
                    'Passing args to a child process with shell option true can lead to security ' +
                    'vulnerabilities, as the arguments are not escaped, only concatenated.',
                    'DeprecationWarning',
                    'DEP0190');
                emittedDEP0190Already = true;
            }

            const command = args.length > 0 ? `${file} ${args.join(' ')}` : file;
            if (typeof options.shell === 'string')
                file = options.shell;
            else
                file = process.env.comspec || 'cmd.exe';
            if (/^(?:.*\\)?cmd(?:\.exe)?$/i.exec(file) !== null) {
                args = ['-d', '-s', '-c', `"${command}"`];
                windowsVerbatimArguments = true;
            } else {
                args = ['-c', command];
            }
        }

        if (typeof options.argv0 === 'string') {
            args.unshift(options.argv0);
        } else {
            args.unshift(file);
        }

        const env = options.env || { ...process.env };
        const envPairs = [];

        let envKeys: string[] = [];
        for (const key in env) {
            envKeys.push(key);
        }

        if (process.platform === 'win32') {
            const sawKey = new Set();
            envKeys = envKeys.sort().filter(
                (key) => {
                    const uppercaseKey = key.toUpperCase();
                    if (sawKey.has(uppercaseKey)) {
                        return false;
                    }
                    sawKey.add(uppercaseKey);
                    return true;
                },
            );
        }

        for (const key of envKeys) {
            const value = env[key];
            if (value !== undefined) {
                envPairs.push(`${key}=${value}`);
            }
        }

        return {
            __proto__: null,
            ...options,
            args,
            cwd,
            detached: !!options.detached,
            envPairs,
            file,
            windowsHide: !!options.windowsHide,
            windowsVerbatimArguments: !!windowsVerbatimArguments,
        };
    }

    function exec(command: string, options?: any, callback?: (error: Error | null, stdout: string, stderr: string) => void): ChildProcess {
        const opts = normalizeExecArgs(command, options, callback);
        return execFile(opts.file, opts.options, opts.callback);
    }

    function execFile(file: string, args?: string[], options?: any, callback?: (error: Error | null, stdout: string, stderr: string) => void): ChildProcess {
        ({ file, args, options, callback } = normalizeExecFileArgs(file, args, options, callback));

        options = {
            __proto__: null,
            encoding: 'utf8',
            timeout: 0,
            maxBuffer: 1024 * 1024,
            killSignal: 'SIGTERM',
            cwd: null,
            env: null,
            shell: false,
            ...options,
        };

        const child = spawn(file, args, {
            cwd: options.cwd,
            env: options.env,
            gid: options.gid,
            shell: options.shell,
            signal: options.signal,
            uid: options.uid,
            windowsHide: !!options.windowsHide,
            windowsVerbatimArguments: !!options.windowsVerbatimArguments,
        });

        return child;
    }

    function fork(modulePath: string, args?: string[], options?: any): ChildProcess {
        let execArgv;

        if (args == null) {
            args = [];
        } else if (typeof args === 'object' && !Array.isArray(args)) {
            options = args;
            args = [];
        }

        options = { __proto__: null, ...options, shell: false };
        options.execPath ||= process.execPath;
        execArgv = options.execArgv || process.execArgv;

        args = [...execArgv, modulePath, ...args];

        if (typeof options.stdio === 'string') {
            options.stdio = stdioStringToArray(options.stdio, 'ipc');
        } else if (!Array.isArray(options.stdio)) {
            options.stdio = stdioStringToArray(
                options.silent ? 'pipe' : 'inherit',
                'ipc');
        } else if (!options.stdio.includes('ipc')) {
            throw new Error('Forked processes must have an IPC channel');
        }

        return spawn(options.execPath, args, options);
    }

    function spawn(file: string, args?: string[], options?: any): ChildProcess {
        options = normalizeSpawnArguments(file, args, options);

        const child = new ChildProcess();
        child.spawn(options);

        return child;
    }

    return { exec, execFile, fork, spawn };
}