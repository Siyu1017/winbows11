import { EventEmitter } from "../../../shared/utils";
import type { Process } from "./process.ts";

export type ProcessSignal = "SIGINT" | "SIGKILL" | "SIGTERM" | "SIGSTOP" | "SIGCONT";
export type ProcessState = "running" | "stopped" | "exiting" | "exited" | "killed";

const MAX_PID = 65535;

/** The kernel-owned index of live WRT processes. */
export class ProcessManager extends EventEmitter {
    private readonly table = new Map<number, Process>();
    private nextPid = 0;

    allocatePid(): number {
        for (let attempts = 0; attempts < MAX_PID; attempts++) {
            const pid = this.nextPid;
            this.nextPid = this.nextPid === MAX_PID ? 1 : this.nextPid + 1;
            if (!this.table.has(pid)) return pid;
        }
        throw new Error("The maximum number of processes has been reached");
    }

    add(process: Process) {
        if (this.table.has(process.pid)) throw new Error(`Process ${process.pid} already exists`);
        this.table.set(process.pid, process);
        this._emit("add", { pid: process.pid, process, snapshot: process.toJSON() });
    }

    remove(pid: number) {
        const process = this.table.get(pid);
        if (!process) return false;
        this.table.delete(pid);
        this._emit("remove", { pid, process, snapshot: process.toJSON() });
        return true;
    }

    get(pid: number) {
        return this.table.get(pid);
    }

    list() {
        return [...this.table.values()];
    }

    update(process: Process, key: string, value: unknown) {
        if (!this.table.has(process.pid)) return;
        this._emit("update", { pid: process.pid, process, key, value, snapshot: process.toJSON() });
    }

    kill(pid: number, signal: ProcessSignal = "SIGTERM") {
        return this.table.get(pid)?.signal(signal) ?? false;
    }
}

export const processes = new ProcessManager();
