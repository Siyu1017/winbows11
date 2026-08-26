import { EventEmitter } from "../../../../shared/utils";
import stdio from "../../../lib/stdio";
import { Process, type ProcessSignal } from "../process";

type StdioMode = "pipe" | "ignore" | "inherit";
type Stream = stdio.InputStream | stdio.OutputStream | stdio.tty.InputStream | stdio.tty.OutputStream;

export type ChildRuntime = { process: Process; main: () => Promise<unknown> };
export type ChildRuntimeFactory = (request: {
    file: string; args: string[]; cwd: string; env: Record<string, string | undefined>; parent: Process;
    stdin?: Stream; stdout?: Stream; stderr?: Stream;
}) => Promise<ChildRuntime>;

type SpawnOptions = {
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdio?: StdioMode | Array<StdioMode | number | null | undefined>;
    shell?: boolean | string;
};
type ExecCallback = (error: Error | null, stdout: string, stderr: string) => void;

const signals: Record<number, ProcessSignal> = { 2: 'SIGINT', 9: 'SIGKILL', 15: 'SIGTERM', 18: 'SIGCONT', 19: 'SIGSTOP' };

function createSpawnError(file: string, cause: unknown) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    (error as Error & { code?: string; path?: string }).code ??= 'ENOENT';
    (error as Error & { path?: string }).path = file;
    return error;
}

function tokenizeCommand(command: string) {
    const tokens = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
    return tokens.map(token => token.replace(/^(?:"|')|(?:"|')$/g, ''));
}

function normalizeExecFileArgs(file: string, args?: string[] | SpawnOptions | ExecCallback, options?: SpawnOptions | ExecCallback, callback?: ExecCallback) {
    if (!Array.isArray(args)) {
        callback = typeof options === 'function' ? options : callback;
        options = args as SpawnOptions | undefined;
        args = [];
    }
    if (typeof options === 'function') callback = options;
    return { file, args, options: (typeof options === 'object' ? options : {}) as SpawnOptions, callback };
}

/** Launches another WRT runtime; host shells and Node IPC are intentionally unsupported. */
export function child_process(parent: Process, createRuntime: ChildRuntimeFactory) {
    const children = new Set<ChildProcess>();

    class ChildProcess extends EventEmitter {
        _handle: Process | null = null;
        connected = false;
        signalCode: ProcessSignal | null = null;
        exitCode: number | null = null;
        killed = false;
        pid: number | undefined;
        spawnfile: string | null = null;
        spawnargs: string[] = [];
        stdin: stdio.InputStream | stdio.tty.InputStream | null = null;
        stdout: stdio.OutputStream | stdio.tty.OutputStream | null = null;
        stderr: stdio.OutputStream | stdio.tty.OutputStream | null = null;
        private closed = false;
        private requestedSignal: ProcessSignal | null = null;

        spawn(file: string, args: string[], options: SpawnOptions) {
            this.spawnfile = file;
            this.spawnargs = [file, ...args];
            children.add(this);
            void this.start(file, args, options);
            return this;
        }

        kill(signal: ProcessSignal | number = 'SIGTERM') {
            const normalized = typeof signal === 'number' ? signals[signal] : signal;
            if (!normalized) throw new TypeError(`Unsupported signal: ${signal}`);
            this.killed = true;
            if (!this._handle) {
                this.requestedSignal = normalized;
                return true;
            }
            return this._handle.signal(normalized);
        }

        private async start(file: string, args: string[], options: SpawnOptions) {
            try {
                if (options.shell) throw new Error('WRT child_process does not provide a host shell; spawn a .wrt or .js program directly');
                const cwd = options.cwd ? resolveVfsPath(parent.cwd(), options.cwd) : parent.cwd();
                const inherited = makeStdio(parent, normalizeStdio(options.stdio));
                const runtime = await createRuntime({
                    file: resolveVfsPath(cwd, file), args, cwd, env: { ...parent.env, ...options.env }, parent,
                    ...inherited.streams
                });
                this._handle = runtime.process;
                this.pid = runtime.process.pid;
                this.stdin = inherited.public.stdin ?? runtime.process.stdin;
                this.stdout = inherited.public.stdout ?? runtime.process.stdout;
                this.stderr = inherited.public.stderr ?? runtime.process.stderr;
                runtime.process.on('exit', (code: number, signal: ProcessSignal | null) => this.finish(code, signal));
                this.emit('spawn');
                if (this.requestedSignal) runtime.process.signal(this.requestedSignal);
                if (runtime.process.alive) {
                    void runtime.main().catch(error => {
                        if (runtime.process.alive) void runtime.process.exit(1);
                        console.error(error);
                    });
                }
            } catch (cause) {
                this.emit('error', createSpawnError(file, cause));
                this.finish(null, null);
            }
        }

        private finish(code: number | null, signal: ProcessSignal | null) {
            if (this.closed) return;
            this.closed = true;
            this._handle = null;
            this.exitCode = code;
            this.signalCode = signal;
            children.delete(this);
            this.emit('exit', code, signal);
            this.emit('close', code, signal);
        }
    }

    parent.on('exit', () => {
        for (const child of [...children]) child.kill('SIGTERM');
    });

    function spawn(file: string, args?: string[] | SpawnOptions, options?: SpawnOptions) {
        if (!file || typeof file !== 'string') throw new TypeError("The 'file' argument must be a non-empty string");
        if (!Array.isArray(args)) {
            options = args ?? options;
            args = [];
        }
        return new ChildProcess().spawn(file, args, options ?? {});
    }

    function execFile(file: string, args?: string[] | SpawnOptions | ExecCallback, options?: SpawnOptions | ExecCallback, callback?: ExecCallback) {
        const normalized = normalizeExecFileArgs(file, args, options, callback);
        const child = spawn(normalized.file, normalized.args, { ...normalized.options, stdio: normalized.options.stdio ?? 'pipe' });
        if (normalized.callback) {
            let callbackCalled = false;
            const done = (error: Error | null) => {
                if (callbackCalled) return;
                callbackCalled = true;
                normalized.callback!(error, child.stdout?.toString() ?? '', child.stderr?.toString() ?? '');
            };
            child.once('close', (code: number | null, signal: ProcessSignal | null) =>
                done(code === 0 && !signal ? null : Object.assign(new Error(`Command failed: ${file}`), { code, signal })));
            child.once('error', (error: Error) => done(error));
        }
        return child;
    }

    function exec(command: string, options?: SpawnOptions | ExecCallback, callback?: ExecCallback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        const [file, ...args] = tokenizeCommand(command);
        if (!file) throw new TypeError("The 'command' argument must not be empty");
        return execFile(file, args, options, callback);
    }

    function fork(modulePath: string, args?: string[] | SpawnOptions, options?: SpawnOptions) {
        if (!Array.isArray(args)) {
            options = args ?? options;
            args = [];
        }
        return spawn(modulePath, args, { ...options, stdio: options?.stdio ?? 'pipe' });
    }

    return { ChildProcess, exec, execFile, fork, spawn };
}

function resolveVfsPath(cwd: string, value: string) {
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

function normalizeStdio(value: SpawnOptions['stdio']): [StdioMode, StdioMode, StdioMode] {
    if (value === undefined || value === 'pipe') return ['pipe', 'pipe', 'pipe'];
    if (value === 'ignore' || value === 'inherit') return [value, value, value];
    if (!Array.isArray(value)) throw new TypeError(`Invalid stdio option: ${value}`);
    return [0, 1, 2].map(index => {
        const channel = value[index] ?? 'pipe';
        if (channel === 0 || channel === 1 || channel === 2) return 'inherit';
        if (channel === 'pipe' || channel === 'ignore' || channel === 'inherit') return channel;
        throw new TypeError(`Invalid stdio channel at index ${index}`);
    }) as [StdioMode, StdioMode, StdioMode];
}

function makeStdio(parent: Process, modes: [StdioMode, StdioMode, StdioMode]) {
    const streams: { stdin?: Stream; stdout?: Stream; stderr?: Stream } = {};
    const exposed: { stdin?: stdio.InputStream | stdio.tty.InputStream; stdout?: stdio.OutputStream | stdio.tty.OutputStream; stderr?: stdio.OutputStream | stdio.tty.OutputStream } = {};
    const keys = ['stdin', 'stdout', 'stderr'] as const;
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        if (modes[index] === 'inherit') {
            streams[key] = parent[key] as Stream;
        } else if (modes[index] === 'ignore') {
            streams[key] = key === 'stdin' ? new stdio.InputStream() : new stdio.OutputStream();
            if (key === 'stdin') (streams[key] as stdio.InputStream).end();
        }
    }
    return { streams, public: exposed };
}
