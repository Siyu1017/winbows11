import { fsUtils } from "../../../lib/fs.js";
import { parseKeyValueArgs } from "../../../utils.js";
import { tasklist } from "../kernel.js";
import { terminalTable } from "./utils.js";

class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    /**
     * Register command
     * @param {string|string[]} name 
     * @param {Function} fn 
     */
    register(name, fn) {
        if (Array.isArray(name)) {
            name.forEach(n => {
                this.commands.set(n, fn);
            })
        } else {
            this.commands.set(name, fn);
        }
    }

    deregister(name) {
        this.commands.delete(name);
    }

    list() {
        return this.commands.keys();
    }

    get(name) {
        return this.commands.get(name);
    }

    has(name) {
        return this.commands.has(name);
    }
}

const commandRegistry = new CommandRegistry();

//=========== File and directory operations ===========//

// Change directory
commandRegistry.register(['cd', 'chdir'], ({ args }, shell) => {
    let target = args[0];
    if (!target) return true;

    target = fsUtils.resolveEnvPath(target);
    const resolvedDir = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), target);
    const dir = fsUtils.toDirFormat(resolvedDir);

    if (!fsUtils.isValidAbsolutePath(dir)) {
        shell.stderr.write(`Invalid directory: ${target}\n`);
        return false;
    }
    if (!shell.fs.exists(dir)) {
        shell.stderr.write(`Directory not found: ${target}\n`);
        return false;
    }
    if (!dir?.toUpperCase().startsWith(shell.root)) {
        shell.stderr.write(`Access denied: ${target}\n`);
        return false;
    }

    const pwd = fsUtils.resolve(shell.pwd, target);
    shell.pwd = fsUtils.parsePath(pwd).path;
    return true;
});

// List directory
commandRegistry.register('dir', async ({ args }, shell) => {
    let displayAll = false;
    let displaySubdir = false;
    let displayMinimally = false;
    let argString = args.join(' ');

    // Display all types
    if (/\/[aA]/i.test(argString)) displayAll = true;

    // Display subdirectory
    if (/\/[sS]/i.test(argString)) displaySubdir = true;

    // No header
    if (/\/[bB]/i.test(argString)) displayMinimally = true;

    const contents = await shell.fs.readdir(fsUtils.normalize(shell.root + shell.pwd), {
        recursive: displaySubdir
    });
    for (const path of contents) {
        const name = fsUtils.basename(path);
        if (displayMinimally) {
            shell.stdout.write(name + '\n');
        } else {
            const stat = shell.fs.stat(path);
            const date = new Date(stat.lastModifiedTime);
            let dateString = '';
            if (isNaN(date)) {
                dateString = 'Invalid date';
            } else {
                const day = date.format("yyyy/MM/dd");
                const time = (date.format("hh") < 13 ? date.format("hh:mm") : new Date(date.getTime() - 12 * 1000 * 60 * 60).format("hh:mm")) + (date.format("hh") < 12 ? ' AM' : ' PM');
                dateString = day + ' ' + time;
            }
            shell.stdout.write(dateString + '\t' + (stat.type == 'directory' ? '<DIR>\t\t' : '\t' + stat.length + '\t') + name + '\n');
        }
    }

    return true;
})

// Make directory
commandRegistry.register(['md', 'mkdir'], async ({ args }, shell) => {
    let dirname = args[0];
    if (!dirname) {
        shell.stderr.write('Usage: md|mkdir <path>\n');
        return false;
    }

    dirname = fsUtils.resolveEnvPath(dirname);
    const resolvedDir = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), dirname);
    const dir = fsUtils.toDirFormat(resolvedDir);

    if (!fsUtils.isValidAbsolutePath(dir)) {
        shell.stderr.write(`Invalid directory: ${dirname}\n`);
        return false;
    }
    if (shell.fs.exists(dir)) {
        shell.stderr.write(`Directory already exists: ${dirname}\n`);
        return false;
    }
    if (!dir?.toUpperCase().startsWith(shell.root)) {
        shell.stderr.write(`Access denied: ${dirname}\n`);
        return false;
    }

    try {
        await shell.fs.mkdir(dir);
        return true;
    } catch (e) {
        shell.stderr.write('Error: ' + e.name + ', Message: ' + e.message + '\n');
        return false;
    }
})

// Remove directory
commandRegistry.register(['rd', 'rmdir'], async ({ args }, shell) => {
    let dirname = args[0];
    if (!dirname) {
        shell.stderr.write('Usage: rd|rmdir <path> [/s [/q]]\n');
        return false;
    }

    dirname = fsUtils.resolveEnvPath(dirname);
    const resolvedDir = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), dirname);
    const dir = fsUtils.toDirFormat(resolvedDir);

    if (!fsUtils.isValidAbsolutePath(dir)) {
        shell.stderr.write(`Invalid directory: ${dirname}\n`);
        return false;
    }
    if (!shell.fs.exists(dir)) {
        shell.stderr.write(`Directory not found: ${dirname}\n`);
        return false;
    }
    if (!dir?.toUpperCase().startsWith(shell.root)) {
        shell.stderr.write(`Access denied: ${dirname}\n`);
        return false;
    }

    let argString = args.slice(1).join(' ');
    let recursive = false;
    let quietMode = false;

    // Subitems
    if (/\/[sS]/i.test(argString)) recursive = true;

    // Quiet mode
    if (/\/[qQ]/i.test(argString)) quietMode = true;

    // Show prompt
    if (quietMode == false) {
        const confirm = await shell.input(`Confirm to remove the directory ${dir} (y/n)?`, 'normal');
        if (confirm.search(/[yY]/i) == -1) return true;
    }

    try {
        await shell.fs.rm(dir, {
            recursive,
            force: quietMode
        });
        shell.stdout.write('Directory removed successfully\n');
        return true;
    } catch (e) {
        shell.stderr.write('Error: ' + e.name + ', Message: ' + e.message + '\n');
        return false;
    }
})

// Remove file
commandRegistry.register(['del', 'erase'], async ({ args }, shell) => {
    let path = args[0];
    if (!path) {
        shell.stderr.write('Usage: del|erase <path> [/p] [/s] [/q]\n');
        return false;
    }

    path = fsUtils.resolveEnvPath(path);
    const resolvedPath = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), path);

    if (!resolvedPath?.toUpperCase().startsWith(shell.root)) {
        shell.stderr.write(`Access denied: ${path}\n`);
        return false;
    }

    let argString = args.slice(1).join(' ');
    let recursive = false;
    let quietMode = false;

    // Show prompt
    if (/\/[pP]/i.test(argString)) quietMode = false;

    // Subitems
    if (/\/[sS]/i.test(argString)) recursive = true;

    // Quiet mode
    if (/\/[qQ]/i.test(argString)) quietMode = true;

    // Show prompt
    if (quietMode == false) {
        const confirm = await shell.input(`Confirm to delete the item ${resolvedPath} (y/n)?`, 'normal');
        if (confirm.search(/[yY]/i) == -1) return true;
    }

    try {
        await shell.fs.rm(resolvedPath, {
            force: quietMode
        });
        shell.stdout.write('Item removed successfully\n');
    } catch (e) {
        shell.stderr.write(`Could not delete ${resolvedPath}: ${e.message}\n`);
    }

    return true;
})

//=========== System info and management ===========//

commandRegistry.register('tasklist', (_, shell) => {
    const table = terminalTable(shell.stdout, [{
        size: 16,
        text: 'Name'
    }, {
        size: 8,
        text: 'PID',
        align: 'right'
    }, {
        size: 24,
        text: 'Title'
    }, {
        size: 16,
        text: 'Runtime ID'
    }]);

    Object.keys(tasklist).forEach(k => {
        try {
            const task = tasklist[k];
            table.row([{ text: fsUtils.basename(task.__filename || '') }, { text: String(task.process.pid) }, { text: task.title }, { text: k }]);
        } catch (e) {
            console.error(e);
        }
    })

    shell.stdout.write('\r\n');

    return true;
})

commandRegistry.register('taskkill', ({ args}, shell) => {
    
})

// Set env key
commandRegistry.register('set', ({ args }, shell) => {
    const kv = parseKeyValueArgs(args);
    if (Object.keys(kv).length === 0) {
        shell.stderr.write('Usage: set KEY=VALUE\n');
        return false;
    }
    try {
        for (const [key, val] of Object.entries(kv)) {
            shell.setEnv(key, val);
        }
        return true;
    } catch (e) {
        shell.stderr.write(e.message + '\n');
        return false;
    }
});

// Unset env key
commandRegistry.register('unset', ({ args, flag }, shell) => {
    if (args.length !== 1) {
        shell.stderr.write('Usage: unset KEY\n');
        return false;
    }
    try {
        shell.unsetEnv(args[0]);
        return true;
    } catch (e) {
        shell.stderr.write(e.message + '\n');
        return false;
    }
})

// List env keys
commandRegistry.register('env', (_, shell) => {
    const env = shell.getAllEnv();
    for (const [key, val] of Object.entries(env)) {
        shell.stdout.write(`${key}=${val}\n`);
    }
    return true;
});

// Clear screen
commandRegistry.register('cls', (_, shell) => {
    shell.stdout.clear?.();
    return true;
})

// Print Working Directory
commandRegistry.register('pwd', (_, shell) => {
    let pwd = fsUtils.normalize(shell.root + shell.pwd);
    if (/^[a-zA-Z]:$/i.test(pwd)) {
        pwd += '/';
    }
    shell.stdout.write(pwd + '\n');
    return true;
})

// Exit shell
commandRegistry.register('exit', ({ args }, shell) => {
    const exitCode = args[0] || 0;
    shell.active = false;
    shell.fs?.quit?.();
    shell.stdout.write?.(`Shell exited with code ${exitCode}\n`);
    shell._emit('dispose', exitCode);
    return true;
})

//==== Text processing and file operation assistance ====//

// Echo
commandRegistry.register('echo', ({ args, flag }, shell) => {
    shell.stdout.write(args.join(' ') + '\n');
    return true;
})

// Help
commandRegistry.register('help', ({ args, flag }, shell) => {
    const commands = commandRegistry.list();
    shell.stdout.write(`Available commands:\n${[...commands].join('\n')}\n`);
    return true;
})

export { commandRegistry };