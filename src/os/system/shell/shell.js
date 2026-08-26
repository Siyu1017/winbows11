import minimistJs from "../../../lib/minimist.js/index.js";
import fsUtils from "../../fs/path.ts";
import { getMountedSystemFS } from "../../fs/systemFs.ts";
import { setNodeFSCwd } from "../../fs/nodeFs.ts";
import { commandRegistry } from "./commandRegistry.js";
import stdio from "../../lib/stdio.ts";
import { EventEmitter, randomID } from "../../../shared/utils.ts";
import { generateEnv } from "../../kernel/wrt/process.ts";
import appRegistry from "../appRegistry.js";
import ModuleManager from "../../moduleManager.js";
import { CommandParseError, expandEnvironmentVariables, parseCommandLine } from './commandParser.js';

const reservedEnvKeys = Object.keys(generateEnv());
const _queue = new WeakMap();
const _queueRunning = new WeakMap();
const _handleCLI = Symbol('handleCLI');

export class ShellInstance extends EventEmitter {
    constructor(process, {
        isTTY = false
    } = {}) {
        super();

        // Initialize queue
        _queue.set(this, []);
        _queueRunning.set(this, false);

        const initialCwd = fsUtils.normalize(process.cwd());
        const { disk, path } = fsUtils.parsePath(initialCwd);

        this.process = process;
        this.root = (disk || 'C').toUpperCase() + ':/';
        this.pwd = fsUtils.toDirFormat(path);
        this.env = {
            ...process.env
        };
        this.isTTY = isTTY != false;
        const StreamInput = this.isTTY ? stdio.tty.InputStream : stdio.InputStream;
        const StreamOutput = this.isTTY ? stdio.tty.OutputStream : stdio.OutputStream;
        this.stdin = new StreamInput();
        this.stdout = new StreamOutput();
        this.stderr = new StreamOutput();
        this.stdinBuffer = '';
        this.active = true;
        this._pendingDispose = false;
        this._exitCode = 0;
        this.fs = getMountedSystemFS(initialCwd);
        this.id = randomID(24);

        this.process.on('exit', (code) => {
            this.dispose(code);
        })

        // Define pwd
        Object.defineProperty(this.env, 'pwd', {
            get: () => this.getPwd(),
            set: (fullPath) => {
                this.setCwd(fullPath);
            },
            enumerable: true,
            configurable: true
        });

        this.stdout.on('clear', () => this._emit('clear'));
    }

    async [_handleCLI](wrt) {
        if (wrt.type !== 'cli') return;
        const start = performance.now();
        if (!wrt.runInBackground && !this.isTTY) {
            const System = ModuleManager.get('System');
            const WRT = ModuleManager.get('WRT');
            const pipeName = `system://shell-service/` + randomID(64);
            const ipc = System.processAPIs.IPC.listen(pipeName);
            const data = appRegistry.getInfo('cmd');
            const cmdWRT = new WRT({
                code: await this.fs.readFile(data.entryScript, 'utf-8'),
                __filename: data.entryScript
                // token: token
            });
            cmdWRT.process.env.pipe = pipeName;
            cmdWRT.main();

            ipc.on('data', (e) => {
                // if (e.data.type === 'check') {
                //     ipc.send({
                //         type: 'check',
                //         data: token
                //     })
                // }
                if (e.data.type === 'ready') {
                    ipc.send({
                        type: 'data',
                        data: wrt
                    })
                    setTimeout(() => {
                        ipc.close();
                    })
                }
            })

            if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                const end = performance.now();
                this.stdout.write(`Execution completed, took ${(end - start).toFixed(2)}ms\n`);
            }

            return null;
        } else {
            wrt.main();

            return wrt;
        }
    }

    input(promptText, type = 'normal') {
        this.stdout.write(promptText);
        return new Promise(resolve => {
            const stdin = this.stdin;
            // Subscribe before notifying the terminal. A terminal integration
            // may answer synchronously when it receives the input event.
            stdin.once('data', dt => {
                stdin.pause();
                resolve(dt);
            });
            stdin.resume();
            this._emit('input', {
                promptText,
                type,
                stdin
            });
        })
    }

    write(input) {
        this.stdinBuffer += input;
        if (input.includes('\n')) {
            const lines = this.stdinBuffer.split('\n');
            this.stdinBuffer = lines.pop();
            for (const line of lines) {
                this.execCommand(line.trim());
            }
        }
    }

    getPwd() {
        return fsUtils.normalize(this.root + this.pwd);
    }

    /** Keep the prompt, process, and process-scoped FS view on one cwd. */
    setCwd(directory) {
        const fullPath = fsUtils.normalize(directory);
        const { disk, path } = fsUtils.parsePath(fullPath);
        this.root = (disk || 'C').toUpperCase() + ':/';
        this.pwd = fsUtils.toDirFormat(path);
        setNodeFSCwd(this.fs, this.getPwd());
        this.process.chdir(this.getPwd());
    }

    async execCommand(command) {
        if (!this.active) return Promise.reject(new Error('Shell is not active'));
        if (command.trim() === '') return;
        return new Promise(async (resolve, reject) => {
            _queue.get(this).push({ command, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (_queueRunning.get(this)) return;
        _queueRunning.set(this, true);

        while (_queue.get(this).length > 0) {
            const { command, resolve, reject } = _queue.get(this).shift();
            try {
                const groups = parseCommandLine(command.trim());
                let lastResult;
                let lastSucceeded = true;

                for (const group of groups) {
                    if ((group.connector === '&&' && !lastSucceeded) ||
                        (group.connector === '||' && lastSucceeded)) continue;

                    const pipeline = await this.executePipeline(group.commands);
                    lastResult = pipeline.result;
                    lastSucceeded = pipeline.succeeded;
                }
                if (!lastSucceeded) throw lastResult instanceof Error ? lastResult : new Error('Command failed.');
                resolve(lastResult);
            } catch (err) {
                const message = err.reported ? null : err instanceof CommandParseError
                    ? `Invalid command syntax: ${err.message}\n`
                    : `An error occurred while executing the command : ${command}\nMessage : ${err.message || err}\n`;
                if (message) this.stderr.write(message);
                reject(err);
            }
        }

        _queueRunning.set(this, false);
    }

    /** Execute one or more commands connected with `|`. */
    async executePipeline(commands) {
        let input = '';
        let result;
        let succeeded = true;

        for (let index = 0; index < commands.length; index++) {
            const isLast = index === commands.length - 1;
            const command = commands[index];
            // The first command reads from the terminal just like a normal
            // shell command. Only later pipeline stages receive the captured
            // output of the preceding command, which is finite and can end.
            const stdin = index === 0 ? this.stdin : new stdio.InputStream();
            if (index > 0) {
                if (input) stdin.write(input);
                stdin.end();
            }
            const stdout = command.redirect || !isLast
                ? new stdio.OutputStream({ maxBuffer: 16 * 1024 * 1024 })
                : this.stdout;
            const shell = new Proxy(this, {
                get: (target, property) => {
                    if (property === 'stdin') return stdin;
                    if (property === 'stdout') return stdout;
                    if (property === 'stderr') return target.stderr;
                    return Reflect.get(target, property);
                },
                set: (target, property, value) => Reflect.set(target, property, value)
            });

            try {
                result = await this.executeStage(command.tokens, shell);
                if (command.redirect) await this.writeRedirect(command.redirect, stdout.toString(), shell);
                succeeded = result !== false;
            } catch (error) {
                result = error;
                succeeded = false;
            }
            if (!succeeded || isLast) break;
            // A redirect takes precedence over the pipe; the next stage gets
            // an empty input stream, matching normal shell behaviour.
            input = command.redirect ? '' : stdout.toString();
        }
        return { result, succeeded };
    }

    async writeRedirect(redirect, content, shell) {
        const target = fsUtils.resolveEnvPath(expandEnvironmentVariables(redirect.target, name => shell.getEnv(name)));
        const path = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), target);
        if (!path?.toUpperCase().startsWith(shell.root)) {
            throw new Error(`Access denied: ${redirect.target}`);
        }
        if (await shell.fs.exists(path) && (await shell.fs.stat(path)).isDirectory()) {
            throw new Error(`Cannot redirect output to a directory: ${redirect.target}`);
        }
        const previous = redirect.mode === 'append' && await shell.fs.exists(path)
            ? await shell.fs.readFile(path)
            : null;
        await shell.fs.writeFile(path, new Blob(previous ? [previous, content] : [content], {
            type: 'text/plain;charset=utf-8'
        }));
    }

    /** Execute one already-tokenized command against the supplied streams. */
    async executeStage(tokens, shell) {
        const start = performance.now();
        const argsArr = tokens.map(token => {
            const expanded = expandEnvironmentVariables(token, name => shell.getEnv(name));
            if (shell.getEnv('CMD_DELAYED_EXPANSION') !== '1') return expanded;
            return expanded.replace(/!([^!]+)!/g, (match, name) => shell.getEnv(name) ?? match);
        });
        const argv = minimistJs(argsArr);
        const cmdName = argv._[0];
        const args = argv._.slice(1);
        const handler = commandRegistry.get(String(cmdName).toLowerCase())?.handler;
        const WRT = ModuleManager.get('WRT');

        if (handler) {
            const result = await handler({ args, flags: argv }, shell);
            if (shell.getEnv("SHOW_EXEC_TIME") == "1" && shell.active != false) {
                shell.stdout.write(`Command executed in ${(performance.now() - start).toFixed(2)}ms\n`);
            }
            return result;
        }

        const programArgv = argsArr.slice(1);
        let wrt;
        let path;
        if (/.+\.(wrt|wbsf|js)$/i.test(cmdName)) {
            path = fsUtils.resolveEnvPath(cmdName);
            path = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), path);
            const code = await shell.fs.readFile(path, 'utf-8');
            if (cmdName.toLowerCase().endsWith('wbsf')) {
                wrt = new WRT({ code: '', __filename: path, argv: programArgv });
                const shell = new ShellInstance(wrt.process);
                for (const line of code.split('\n')) {
                    await shell.execCommand(line);
                }
            } else if (code) wrt = new WRT({ code, __filename: path, argv: programArgv });
        } else {
            const app = appRegistry.getInfo(cmdName);
            if (app?.entryScript) {
                path = app.entryScript;
                wrt = new WRT({
                    code: await shell.fs.readFile(path, 'utf-8'),
                    __filename: path,
                    argv: programArgv
                });
            }
        }
        if (!wrt) {
            const error = new Error(`'${cmdName}' is not recognized as an internal or external command, operable program or batch file.`);
            error.reported = true;
            shell.stderr.write(error.message + '\n');
            throw error;
        }

        try {
            // Programs receive the same streams as built-ins, so their output
            // can participate in a pipeline as well.
            wrt.process.stdin = shell.stdin;
            wrt.process.stdout = shell.stdout;
            wrt.process.stderr = shell.stderr;
            const data = wrt.type === 'cli' ? await shell[_handleCLI](wrt) : wrt.main();
            if (shell.getEnv("SHOW_EXEC_TIME") == "1" && shell.active != false) {
                shell.stdout.write(`Execution completed, took ${(performance.now() - start).toFixed(2)}ms\n`);
            }
            return { type: wrt.type === 'cli' ? 'cli' : 'gui', data: data ?? wrt };
        } catch (error) {
            shell.stderr.write(`An error occurred while executing file : ${path}\nMessage : ${error.message}\n`);
            error.reported = true;
            throw error;
        }
    }

    setEnv(key, value) {
        if (reservedEnvKeys.includes(key) || ['pwd'].includes(key)) {
            throw new Error(`Cannot modify reserved variable: ${key}`);
        }
        this.env[key] = value;
    }

    unsetEnv(key) {
        if (reservedEnvKeys.includes(key) || ['pwd'].includes(key)) {
            throw new Error(`Cannot delete reserved variable: ${key}`);
        }
        delete this.env[key];
    }

    /**
     * Get the environment variable by key
     * @param {string} key 
     * @returns {string|undefined}
     */
    getEnv(key) {
        const value = this.env[key];
        return value != null ? String(value) : undefined;
    }

    getAllEnv() {
        return { ...this.env };
    }

    async dispose(exitCode) {
        if (!this.active) return;
        exitCode = exitCode || 0;

        this.stderr.destroy();
        this.stdin.destroy();
        this.stdout.destroy();

        this.active = false;
        // this.stdout.write?.(`ShellInstance exited with code ${exitCode}\n`);
        this._emit('dispose', exitCode);
    }
}
