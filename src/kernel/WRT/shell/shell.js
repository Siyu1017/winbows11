import minimistJs from "../../../lib/external/minimist.js/index.js";
import { fsUtils, IDBFS } from "../../../lib/fs.js";
import { commandRegistry } from "./commandRegistry.js";
import { InputStream } from "../utils/inputStream.js";
import { OutputStream } from "../utils/outputStream.js";
import { EventEmitter } from "../utils/eventEmitter.js";
import { generateEnv } from "../process.js";
import { WRT } from "../kernel.js";
import { appRegistry } from "../../appRegistry.js";

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
        this.stdin = new InputStream();
        this.stdout = new OutputStream();
        this.stderr = new OutputStream();
        this.stdinBuffer = '';
        this.active = true;
        this._pendingDispose = false;
        this._exitCode = 0;
        this.fs = IDBFS();

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
        console.log("[PROMPT]", promptText);
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
                const argv = minimistJs(command.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || []);
                const cmdName = argv._[0];
                const args = argv._.slice(1);
                const handler = commandRegistry.get(cmdName?.toLowerCase());

                if (/.+\.wrt$/.test(cmdName)) {
                    let path = fsUtils.resolveEnvPath(cmdName);
                    path = fsUtils.resolve(fsUtils.normalize(this.root + this.pwd), path)
                    if (this.fs.exists(path)) {
                        const wrt = new WRT(WRT.defaultCwd);

                        try {
                            const result = await wrt.runFile(path);
                            if (result.evaluation != null) {
                                this.stdout.write(result.evaluation + '\n');
                            }

                            if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                                const end = performance.now();
                                this.stdout.write(`Execution completed, took ${(end - start).toFixed(2)}ms\n`);
                            }
                            resolve(result);
                        } catch (err) {
                            this.stderr.write(`An error occurred while executing file : ${path}\nMessage : ${err.message}\n`);
                            reject(err);
                        }
                        continue;
                    }
                }

                const app = appRegistry.getInfo(cmdName);
                if (app && app.script) {
                    const wrt = new WRT(WRT.defaultCwd);

                    try {
                        const result = await wrt.runFile(app.script);
                        if (result.evaluation != null) {
                            this.stdout.write(result.evaluation + '\n');
                        }

                        if (this.getEnv("SHOW_EXEC_TIME") == "1" && this.active != false) {
                            const end = performance.now();
                            this.stdout.write(`Execution completed, took ${(end - start).toFixed(2)}ms\n`);
                        }
                        resolve(result);
                    } catch (err) {
                        this.stderr.write(`An error occurred while executing file : ${path}\nMessage : ${err.message}\n`);
                        reject(err);
                    }
                    continue;
                }

                if (!handler) {
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
        return this.execCommand(`exit ${exitCode || 0}`);
    }
} 