// System Level Process Implementation for Winbows WRT

class IProcess {
    constructor({ pid, ppid, name, type }) {
        this.pid = pid;
        this.ppid = ppid;
        this.name = name;
        this.type = type;

        this.state = "created";
        this.startTime = null;

        this.fdTable = new Map();
        this.messageQueue = [];
    }

    // === Life Cycle ===
    start() {
        this.state = "running";
        this.startTime = Date.now();
    }

    stop() {
        this.state = "stopped";
    }

    kill(signal = "SIGKILL") {
        this.state = "killed";
        this.exitCode = signal;
    }

    // === Resource ===
    allocateMemory(size) {
        this.memoryUsage += size;
    }

    freeMemory(size) {
        this.memoryUsage -= size;
    }

    // === IPC ===
    sendMessage(targetPid, message) {
        SystemIPC.send(this.pid, targetPid, message);
    }

    receiveMessage() {
        return this.messageQueue.shift();
    }

    // === Info ===
    getStatus() {
        return {
            pid: this.pid,
            state: this.state,
            cpu: this.cpuUsage,
            mem: this.memoryUsage
        };
    }
}

const processTable = new Map();
let nextProcess = 0;

function createProcess(options) {
    const pid = nextPid++;

    const proc = new Process({
        pid,
        name: options.name,
        priority: options.priority ?? 0,
        sandbox: options.sandbox
    });

    proc.runtime = new WRT({
        process: proc,
        entry: options.entry,
        appId: options.appId
    });

    processTable.set(pid, proc);
    Scheduler.registerProcess(proc);

    return proc;
}
