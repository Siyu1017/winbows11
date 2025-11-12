import { EventEmitter } from "../../../shared/utils";

class ChildProcess extends EventEmitter {
    constructor(public command: string, public options?: Object) {
        super();


    }
}

function exec(command: string, options?: Object, callback?: (error: Error | null, stdout: string, stderr: string) => void): ChildProcess {
    return new ChildProcess(command, options);
}

function execFile(file: string, args?: string[], options?: Object, callback?: (error: Error | null, stdout: string, stderr: string) => void): ChildProcess {
    return new ChildProcess(file, options);
}

function fork(modulePath: string, args?: string[], options?: Object): ChildProcess {
    return new ChildProcess(modulePath, options);
}

function spawn(command: string, args?: string[], options?: Object): ChildProcess {
    return new ChildProcess(command, options);
}

export const child_process = { exec, execFile, fork, spawn };