import minimistJs from "../../../lib/minimist.js/index.js";
import { fsUtils, IDBFS } from "../../../shared/fs.js";
import { commandRegistry } from "./commandRegistry.js";
import stdio from "../../lib/stdio.js";
import { EventEmitter, randomID } from "../../../shared/utils.js";
import { generateEnv } from "../../kernel/wrt/process.js";
import appRegistry from "../appRegistry.js";
import ModuleManager from "../../moduleManager.js";
import parseArgsStringToArgv from 'string-argv';

const reservedEnvKeys = Object.keys(generateEnv());
const _queue = new WeakMap();
const _queueRunning = new WeakMap();

export class ShellInstance extends EventEmitter {
    constructor(process) {
        super();

        // Initialize queue
        _queue.set(this, []);
        _queueRunning.set(this, false);

        const { disk, path } = fsUtils.parsePath(process.cwd());

        this.process = process;
        this.root = (disk || 'C').toUpperCase() + ':/';
        this.pwd = fsUtils.toDirFormat(path);
        this.env = {
            ...process.env
        };
        this.stdin = new stdio.InputStream();
        this.stdout = new stdio.OutputStream();
        this.stderr = new stdio.OutputStream();
        this.stdinBuffer = '';
        this.active = true;
        this._pendingDispose = false;
        this._exitCode = 0;
        this.fs = IDBFS();
        this.id = randomID(24);

        this.process.on('exit', (code) => {
            this.dispose(code);
        })

        // Define pwd
        Object.defineProperty(this.env, 'pwd', {
            get: () => fsUtils.resolve(this.root, this.pwd),
            set: (fullPath) => {
                const { disk, path } = fsUtils.parsePath(fullPath);

                this.root = disk.toUpperCase() + ':/';
                this.pwd = fsUtils.toDirFormat(path);
            },
            enumerable: true,
            configurable: true
        });

        this.stdout.onClear = () => {
            this._emit('clear');
        }
    }

    input(promptText, type = 'normal') {
        this.stdout.write(promptText);
        this._emit('input', {
            promptText,
            type
        });

        return this.stdin.read();
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

    async execCommand(command) {
        if (!this.active) return Promise.reject(new Error('Shell is not active'));
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
                const start = performance.now();
                const argv = minimistJs(parseArgsStringToArgv(command.trim()) || []);
                const cmdName = argv._[0];
                const args = argv._.slice(1);
                const handler = commandRegistry.get(String(cmdName).toLowerCase())?.handler;
                const WRT = ModuleManager.get('WRT');

                if (!handler) {
                    // argv without cmdName
                    const argv = command.trim().split(' ').filter(Boolean).slice(1);

                    // Check if it's an operable program
                    if (/.+\.wrt$/.test(cmdName)) {
                        let path = fsUtils.resolveEnvPath(cmdName);
                        path = fsUtils.resolve(fsUtils.normalize(this.root + this.pwd), path)
                        if (this.fs.exists(path)) {
                            const wrt = new WRT({
                                code: await this.fs.readFileAsText(path),
                                __filename: path,
                                argv: argv
                            });

                            try {
                                wrt.main();

                                if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                                    const end = performance.now();
                                    this.stdout.write(`Execution completed, took ${(end - start).toFixed(2)}ms\n`);
                                }
                                resolve();
                            } catch (err) {
                                this.stderr.write(`An error occurred while executing file : ${path}\nMessage : ${err.message}\n`);
                                reject(err);
                            }
                            continue;
                        }
                    }

                    // Check app rergistry
                    const app = appRegistry.getInfo(cmdName);
                    if (app && app.entryScript) {
                        const wrt = new WRT({
                            code: await this.fs.readFileAsText(app.entryScript),
                            __filename: app.entryScript,
                            argv: argv
                        });

                        try {
                            wrt.main();

                            if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                                const end = performance.now();
                                this.stdout.write(`Execution completed, took ${(end - start).toFixed(2)}ms\n`);
                            }
                            resolve();
                        } catch (err) {
                            this.stderr.write(`An error occurred while executing file : ${path}\nMessage : ${err.message}\n`);
                            reject(err);
                        }
                        continue;
                    }

                    const err = `'${cmdName}' is not recognized as an internal or external command, operable program or batch file.\n`;
                    this.stderr.write(err);
                    reject(err);
                    continue;
                }

                const result = await handler({ args, flags: argv }, this);

                // Use "set SHOW_EXEC_TIME=1" command to display the command execution time
                if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                    const end = performance.now();
                    this.stdout.write(`Command executed in ${(end - start).toFixed(2)}ms\n`);
                }
                resolve(result);
            } catch (err) {
                this.stderr.write(`An error occurred while executing the command : ${command}\nMessage : ${err.message}\n`);
                reject(err);
            }
        }

        _queueRunning.set(this, false);
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
        this.active = false;
        this.fs.quit?.();
        this.stdout.write?.(`ShellInstance exited with code ${exitCode}\n`);
        this._emit('dispose', exitCode);
    }
} 