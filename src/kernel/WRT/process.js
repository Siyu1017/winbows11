import { fsUtils } from "../../lib/fs.js";
import { InputStream } from "./utils/inputStream.js";
import { OutputStream } from "./utils/outputStream.js";
import { EventEmitter } from "./utils/eventEmitter.js";

function createNextTick() {
    const queue = [];
    const textNode = document.createTextNode('');
    const observer = new MutationObserver(() => {
        const toRun = queue.splice(0);
        for (const fn of toRun) fn();
    });

    observer.observe(textNode, { characterData: true });

    let toggle = 0;

    return (cb) => {
        queue.push(cb);
        toggle = 1 - toggle;
        textNode.data = toggle;
    };
}
const fallbackNextTick = createNextTick();

export function generateEnv() {
    return {
        APPDATA: 'C:/User/AppData/Local',
        COMPUTERNAME: 'SUPERCOMPUTER',
        LOCALAPPDATA: 'C:/User/AppData/Local',
        NUMBER_OF_PROCESSORS: navigator.hardwareConcurrency,
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

const processes = new Array(8192).fill(null);
const emit = Symbol('emit');

class Process {
    constructor(cwd) {
        // Process id
        this.pid = processes.findIndex(p => p == null);
        if (this.pid == -1) {
            console.error(new Error('The maximum number of processes has been reached'));
            return;
        }
        processes[this.pid] = this;

        // Initialize
        this.env = generateEnv();
        this.argv0 = 'C:/Program Files/WNR/WNR.js';
        this.argv = [this.argv0];
        this.platform = 'win32';
        this.cwd = () => (cwd || 'C:/User/');

        this.stdin = new InputStream();
        this.stdout = new OutputStream();
        this.stderr = new OutputStream();

        const eventEmitter = new EventEmitter();
        this.on = eventEmitter.on.bind(eventEmitter);
        this.off = eventEmitter.off.bind(eventEmitter);
        this[emit] = eventEmitter._emit.bind(eventEmitter);
    }
    nextTick(cb) {
        return 'queueMicrotask' in window ? queueMicrotask(cb) : fallbackNextTick(cb)
    }
    kill() {
        processes[this.pid] = null;
        this[emit]('exit', 0);
    }
    exit(code) {
        processes[this.pid] = null;
        this[emit]('exit', code || 0);
    }
    abort() { }
    chdir(dir) {
        dir = fsUtils.toDirFormat(dir);
        if (!fs.exists(dir)) {
            throw new Error(`Directory not found : ${dir}`);
        } else {
            this.cwd = () => dir;
        }
    }
}

export { Process, processes };