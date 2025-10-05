import { EventEmitter } from "../../../shared/utils.js";
import stdio from "../../lib/stdio.js";
import crashHandler from "../../core/crashHandler.js";
import { IDBFS, fsUtils } from "../../../shared/fs.js";
import Logger from "../../core/log.js";

const fs = IDBFS('~KERNEL');
const logger = new Logger({
    module: 'Kernel.Process'
})

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

const processes = new ((() => {
    const processes = new Array(8192).fill(null);
    return class TaskList extends EventEmitter {
        constructor() {
            super();
        }
        add(pid, process) {
            if (processes[pid]) {
                const err = new Error(`Process ${pid} already exists`);
                logger.error(err);
                return crashHandler(err);
            }
            processes[pid] = process;
            this._emit('add', { pid, process });
        }
        remove(pid) {
            if (processes[pid]) {
                processes[pid] = null;
                this._emit('remove', { pid });
            }
        }
        update(pid, key, value) {
            const process = processes[pid];
            if (!process) return;
            process[key] = value;
            this._emit('update', { pid, key, value });
        }
        get(pid) {
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

function Process(cwd) {
    const eventEmitter = new EventEmitter();
    this.on = eventEmitter.on.bind(eventEmitter);
    this.off = eventEmitter.off.bind(eventEmitter);

    // Process id
    const pid = processes.findVacant();
    if (pid == -1) {
        logger.error(new Error('The maximum number of processes has been reached'));
        return;
    }

    // Initialize
    this.env = generateEnv();
    this.argv0 = '~wrt';
    this.argv = [this.argv0];
    this.platform = 'win32';
    this.title = "Winbows Node.js Runtime";

    // Internal variables
    let _cwd = cwd || 'C:/';
    let alive = true;
    if (!fs.exists(_cwd)) {
        console.warn(`The specified working directory ${_cwd} could not be found.`);
        _cwd = () => 'C:/';
    }

    // Readonly variables
    Object.defineProperty(this, 'pid', {
        value: pid,
        configurable: false,
        writable: false
    })
    Object.defineProperty(this, 'alive', {
        get: () => alive,
        configurable: false,
        enumerable: false
    })

    // Standard IO
    this.stderr = new stdio.OutputStream();
    this.stdin = new stdio.InputStream();
    this.stdout = new stdio.OutputStream();

    this.nextTick = (cb) => {
        return 'queueMicrotask' in window ? queueMicrotask(cb) : fallbackNextTick(cb)
    }
    this.kill = () => {
        alive = false;
        processes.remove(pid);
        eventEmitter._emit('exit', 0);
    }
    this.exit = async (code) => {
        if (eventEmitter._list('beforeExit').length > 0) {
            const pms = [];
            const evt = {
                waitUntil(pm) {
                    if (!pm || typeof pm.then !== 'function') return;
                    pms.push(pm);
                }
            }
            eventEmitter._emit('beforeExit', evt);
            const aPD = Promise.all(pms.map(pm => pm.catch(e => {
                console.error(e);
            })))
            const tP = new Promise(rs => setTimeout(rs, 10000));

            await Promise.race([aPD.then(), tP]);
        }
        alive = false;
        processes.remove(pid);
        eventEmitter._emit('exit', code || 0);
    }
    this.abort = () => {
        alive = false;
        processes.remove(pid);
    }
    this.chdir = (dir) => {
        dir = fsUtils.toDirFormat(dir);
        if (!fs.exists(dir)) {
            throw new Error(`Directory not found : ${dir}`);
        } else {
            _cwd = dir;
        }
    }
    this.cwd = () => {
        return _cwd;
    }

    processes.add(pid, this);
}

export { Process, processes };