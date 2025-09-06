import { fsUtils } from "../../../shared/fs.js";
import { capitalizeFirstLetter, parseKeyValueArgs } from "../../../shared/utils.js";
import { tasklist } from "../kernel.js";
import { formatTwoColumns, parseURI, terminalTable } from "./utils.js";
import { appRegistry } from "../../appRegistry.js";
import { WRT } from "../kernel.js";

/**
 * @typedef {Object} CommandConfig
 * @property {string} description
 * @property {string} usage
 * @property {Object} options
 * @property {string} category
 * @property {Function} handler
 */

class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.categories = new Map([
            ['general', {
                title: 'General commands'
            }]
        ]);
    }

    /**
     * Register command
     * @param {string|string[]} name 
     * @param {CommandConfig} config
     */
    register(name, config = {}) {
        if (Array.isArray(name)) {
            name.forEach(n => {
                this.commands.set(n, {
                    description: config.description ?? '',
                    usage: config.usage ?? n,
                    options: config.options ?? {},
                    category: config.category ?? 'general',
                    handler: config.handler ?? (() => true)
                });
            })
        } else {
            this.commands.set(name, {
                description: config.description ?? '',
                usage: config.usage ?? name,
                options: config.options ?? {},
                category: config.category ?? 'general',
                handler: config.handler ?? (() => true)
            });
        }
    }

    /**
     * @param {string} category 
     * @param {Object} config 
     */
    addCategory(category, config = {}) {
        if (this.categories.has(category)) {
            throw new Error(`Category ${category} already exists.`);
        }
        this.categories.set(category, {
            title: capitalizeFirstLetter(config.title ?? category)
        });
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

commandRegistry.addCategory('built-in', {
    title: 'Built-in commands'
})

//=========== File and directory operations ===========//

// Change directory
commandRegistry.register(['cd', 'chdir'], {
    description: 'Displays the name of the current directory or changes the current directory.',
    usage: 'cd|chdir [..]',
    options: {
        '[..]': 'Specifies that you want to change to the parent folder.'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {
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

        const pwd = fsUtils.resolve(shell.pwd, dir);
        shell.pwd = fsUtils.parsePath(pwd).path;
        return true;
    }
});

// List directory
commandRegistry.register('dir', {
    description: 'Displays a list of a directory\'s files and subdirectories.',
    usage: 'dir [/a] [/s] [/b]',
    options: {
        '/a': '',
        '/s': 'Lists every occurrence of the specified file name within the specified directory and all subdirectories.',
        '/b': 'Displays a bare list of directories and files, with no additional information.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
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
    }
})

// Make directory
commandRegistry.register(['md', 'mkdir'], {
    description: 'Creates a directory or subdirectory.',
    usage: 'md|mkdir <path>',
    options: {
        '<path>': 'Specifies the name and location of the new directory. The maximum length of any single path is determined by the file system. This is a required parameter.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
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
    }
})

// TODO: Fix register config

// Remove directory
commandRegistry.register(['rd', 'rmdir'], {
    description: 'Deletes a directory.',
    usage: 'rd|rmdir <path> [/s [/q]]',
    options: {
        '<path>': 'Specifies the location and the name of the directory that you want to delete.',
        '/s': 'Deletes a directory tree (the specified directory and all its subdirectories, including all files).',
        '/q': 'Specifies quiet mode. Does not prompt for confirmation when deleting a directory tree. The /q parameter works only if /s is also specified. CAUTION: When you run in quiet mode, the entire directory tree is deleted without confirmation. Make sure that important files are moved or backed up before using the /q command-line option.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
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
    }
})

// Remove file
commandRegistry.register(['del', 'erase'], {
    description: 'Deletes one or more files.',
    usage: 'del|erase <path> [/p] [/s] [/q]',
    options: {
        '<path>': 'Specifies the file or the directory that you want to delete',
        '/p': 'Prompts for confirmation before deleting the specified file.',
        '/s': 'Deletes specified files from the current directory and all subdirectories. Displays the names of the files as they are being deleted. ( Unavailable )',
        '/q': 'Specifies quiet mode. You are not prompted for delete confirmation.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
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
            const confirm = await shell.input(`Are you sure (y/n)?`, 'normal');
            if (confirm.search(/[yY]/i) == -1) return true;
        }

        try {
            await shell.fs.rm(resolvedPath, {
                force: quietMode
            });
            shell.stdout.write('Removed successfully\n');
        } catch (e) {
            shell.stderr.write(`Could not delete ${resolvedPath}: ${e.message}\n`);
        }

        return true;
    }
})

//=========== System info and management ===========//

commandRegistry.register('tasklist', {
    description: 'Displays a list of currently running processes on the local computer.',
    usage: 'tasklist',
    category: 'built-in',
    handler: (_, shell) => {
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
    }
})

commandRegistry.register('taskkill', {
    description: 'Ends one or more tasks or processes. Processes can be ended by process ID or image name. You can use the tasklist command command to determine the process ID (PID) for the process to be ended.',
    usage: 'taskkill [/pid <processID> | /im <imagename>]',
    options: {
        '/pid <processID>': 'Specifies the process ID of the process to be terminated.',
        '/im <imagename>': 'Specifies the image name of the process to be terminated. Use the wildcard character (*) to specify all image names.'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {

    }
})

commandRegistry.register('start', {
    description: 'Starts a separate Command Prompt window to run a specified program.',
    usage: 'start <program>',
    options: {
        '<program>': 'Specifies the program to start.'
    },
    category: 'built-in',
    handler: async ({ flags, args }, shell) => {
        const uri = parseURI(args[0]);
        if (!uri.scheme) {
            shell.stderr.write(`Invalid URI: ${args[0]}\n`);
            return false;
        }

        if (uri.scheme.startsWith('http') && flags['new-window']) {
            window.open(args[0].substring(1, args[0].length - 1), '_blank');
            return true;
        }

        const app = appRegistry.getInfo(uri.scheme);
        if (!app || !app.entryScript) {
            shell.stderr.write(`Can not found file ${uri.scheme}.\n`);
            return false;
        }

        try {
            const wrt = new WRT();
            wrt.runFile(app.entryScript, {
                uri
            });
            return true;
        } catch (e) {
            shell.stderr.write(e.message + '\n');
            return false;
        }
    }
})

// Set env variable
commandRegistry.register('set', {
    description: 'Set an env variable.',
    usage: 'set <name>=<value>',
    options: {
        '<name>': 'Specifies the env variable name to set.',
        '<value>': 'Specifies the value to set.'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {
        const kv = parseKeyValueArgs(args);
        if (Object.keys(kv).length === 0) {
            shell.stderr.write('Usage: set <name>=<value>\n');
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
    }
});

// Unset env variable
commandRegistry.register('unset', {
    description: 'Unset an env variable.',
    usage: 'unset <name>',
    options: {
        '<name>': 'Specifies the env variable name to unset.'
    },
    category: 'built-in',
    handler: ({ args, flag }, shell) => {
        if (args.length !== 1) {
            shell.stderr.write('Usage: unset <name>\n');
            return false;
        }
        try {
            shell.unsetEnv(args[0]);
            return true;
        } catch (e) {
            shell.stderr.write(e.message + '\n');
            return false;
        }
    }
})

// List env keys
commandRegistry.register('env', {
    description: 'List all environtment variables.',
    usage: 'env',
    category: 'built-in',
    handler: (_, shell) => {
        const env = shell.getAllEnv();
        for (const [key, val] of Object.entries(env)) {
            shell.stdout.write(`${key}=${val}\n`);
        }
        return true;
    }
});

// Clear screen
commandRegistry.register('cls', {
    description: 'Clears the screen.',
    usage: 'cls',
    category: 'built-in',
    handler: (_, shell) => {
        shell.stdout.clear?.();
        return true;
    }
})

// Print Working Directory
commandRegistry.register('pwd', {
    description: 'Print the working directory.',
    usage: 'pwd',
    category: 'built-in',
    handler: (_, shell) => {
        let pwd = fsUtils.normalize(shell.root + shell.pwd);
        if (/^[a-zA-Z]:$/i.test(pwd)) {
            pwd += '/';
        }
        shell.stdout.write(pwd + '\n');
        return true;
    }
})

// Exit shell
commandRegistry.register('exit', {
    description: 'Exit the shell.',
    usage: 'exit [code]',
    options: {
        '[code]': 'Specifies the exit code.'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {
        const exitCode = args[0] || 0;
        shell.active = false;
        shell.fs?.quit?.();
        shell.stdout.write?.(`Shell exited with code ${exitCode}\n`);
        shell._emit('dispose', exitCode);
        return true;
    }
})

//==== Text processing and file operation assistance ====//

// Echo
commandRegistry.register('echo', {
    description: 'Displays messages or turns on or off the command echoing feature.',
    usage: 'echo [<message>]',
    options: {
        '<message>': 'Specifies the message to display.'
    },
    category: 'built-in',
    handler: ({ args, flag }, shell) => {
        shell.stdout.write(args.join(' ') + '\n');
        return true;
    }
})

// Help
commandRegistry.register('help', {
    description: 'Displays a list of the available commands or detailed help information on a specified command. If used without parameters, help lists and briefly describes every system command.',
    usage: 'help [<command>]',
    options: {
        '<command>': 'Specifies the command for which to display detailed help information.'
    },
    category: 'built-in',
    handler: ({ args, flag }, shell) => {
        if (args.length !== 0) {
            const cmd = commandRegistry.commands.get(args[0]);
            if (cmd) {
                shell.stdout.write(cmd.description + '\n\n');
                shell.stdout.write(cmd.usage + '\n');
                if (cmd.options && Object.keys(cmd.options).length > 0) {
                    shell.stdout.write('\n');
                    for (const [key, val] of Object.entries(cmd.options)) {
                        shell.stdout.write('  ' + formatTwoColumns(key, val, 12) + '\n');
                    }
                }
                return true;
            } else {
                shell.stderr.write(`Command not found: ${args[0]}\n`);
                return false;
            }
        }

        shell.stdout.write('For more information on a specific command, type HELP command-name');

        const categories = commandRegistry.categories.keys();
        for (const category of categories) {
            shell.stdout.write(`\n\n${commandRegistry.categories.get(category).title}`);
            for (const cmd of commandRegistry.commands.keys()) {
                if (commandRegistry.commands.get(cmd).category === category) {
                    shell.stdout.write('\n' + formatTwoColumns(cmd, commandRegistry.commands.get(cmd).description));
                }
            }
        }

        shell.stdout.write('\n');

        return true;
    }
})

//==================== Easter Egg =======================//
commandRegistry.addCategory('easter-egg', {
    title: 'Easter eggs'
})

commandRegistry.register('nothing', {
    description: 'Nothing beats a jet2 holiday!',
    usage: 'nothing',
    category: 'easter-egg',
    handler: async (_, shell) => {
        const parts = [{
            text: 'Nothing ',
            duration: 100
        }, {
            text: 'Beats ',
            duration: 100
        }, {
            text: 'A ',
            duration: 100
        }, {
            text: 'Jet2 ',
            duration: 100
        }, {
            text: 'Holiday!\n',
            duration: 100
        }, {
            text: 'And ',
            duration: 100
        }, {
            text: 'Right ',
            duration: 100
        }, {
            text: 'Now ',
            duration: 100
        }, {
            text: 'You ',
            duration: 100
        }, {
            text: 'Can ',
            duration: 100
        }, {
            text: 'Save ',
            duration: 100
        }, {
            text: '£50 ',
            duration: 100
        }, {
            text: 'Per ',
            duration: 100
        }, {
            text: 'Person!\n',
            duration: 100
        }, {
            text: 'That’s ',
            duration: 100
        }, {
            text: '£200 ',
            duration: 100
        }, {
            text: 'Off ',
            duration: 100
        }, {
            text: 'For ',
            duration: 100
        }, {
            text: 'A ',
            duration: 100
        }, {
            text: 'Family ',
            duration: 100
        }, {
            text: 'Of ',
            duration: 100
        }, {
            text: '4!\n',
            duration: 100
        }];

        for (let i = 0; i < parts.length; i++) {
            shell.stdout.write(parts[i].text);
            await (function () {
                return new Promise(r => setTimeout(r, parts[i].duration));
            })();
        }

        return true;
    }
})

export { commandRegistry };