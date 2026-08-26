import fsUtils from "../../fs/path.ts";
import { capitalizeFirstLetter, parseKeyValueArgs } from "../../../shared/utils.ts";
import { formatTwoColumns, parseURI, terminalTable } from "./shellUtils.js";
import appRegistry from "../appRegistry.js";
import SystemInformation from "../../core/sysInfo.js";
import ModuleManager from "../../moduleManager.js";
import { tasklist } from "../../kernel/wrt/core.js";
import { processes } from "../../kernel/wrt/process.ts";
import { viewport } from "../../core/viewport.js";
import { stat } from "../../core/stat.js";

const INTERNAL_COMMAND_PREFIX = 'internal:';
const INTERNAL_CATEGORY = '@internal';

function resolveShellPath(shell, input) {
    let path = fsUtils.resolve(
        fsUtils.normalize(shell.root + shell.pwd),
        fsUtils.resolveEnvPath(input)
    );
    // Keep the canonical drive root spelling for FS IO.
    if (/^[A-Za-z]:$/.test(path)) path += '/';
    if (!path?.toUpperCase().startsWith(shell.root)) {
        throw new Error(`Access denied: ${input}`);
    }
    return path;
}

function resolveShellDirectory(shell, input) {
    return fsUtils.toDirFormat(resolveShellPath(shell, input));
}

function readStdin(shell) {
    let content = '';
    let chunk;
    while ((chunk = shell.stdin.read()) !== null) content += String(chunk);
    return content;
}

async function readTextFile(shell, input) {
    const path = resolveShellPath(shell, input);
    if (!await shell.fs.exists(path)) throw new Error(`File not found: ${input}`);
    if ((await shell.fs.stat(path)).isDirectory()) throw new Error(`Path is a directory: ${input}`);
    return shell.fs.readFile(path, 'utf-8');
}

/**
 * @callback CommandHandler
 * @param {{ args: any[], flags: any }} param0
 * @param {ShellInstance} shell
 * @returns {void}
 */

/**
 * @typedef {Object} CommandConfig
 * @property {string} description
 * @property {string} usage
 * @property {Object} options
 * @property {string} category
 * @property {CommandHandler} handler
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
commandRegistry.addCategory('file', { title: 'File commands' });
commandRegistry.addCategory('text', { title: 'Text commands' });
commandRegistry.addCategory('system', { title: 'System commands' });

//=========== File and directory operations ===========//

// Change directory
commandRegistry.register(['cd', 'chdir'], {
    description: 'Displays the name of the current directory or changes the current directory.',
    usage: 'cd|chdir [..]',
    options: {
        '[..]': 'Specifies that you want to change to the parent folder.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
        let target = args[0];
        if (!target) {
            shell.stdout.write(shell.getPwd() + '\n');
            return true;
        }

        target = fsUtils.resolveEnvPath(target);
        const resolvedDir = fsUtils.resolve(fsUtils.normalize(shell.root + shell.pwd), target);
        const dir = fsUtils.toDirFormat(resolvedDir);

        if (!fsUtils.isValidAbsolutePath(dir)) {
            shell.stderr.write(`Invalid directory: ${target}\n`);
            return false;
        }
        if (!await shell.fs.exists(dir)) {
            shell.stderr.write(`Directory not found: ${target}\n`);
            return false;
        }
        if (!dir?.toUpperCase().startsWith(shell.root)) {
            shell.stderr.write(`Access denied: ${target}\n`);
            return false;
        }

        if (!(await shell.fs.stat(dir)).isDirectory()) {
            shell.stderr.write(`Not a directory: ${target}\n`);
            return false;
        }
        shell.setCwd(dir);
        return true;
    }
});

// List directory
commandRegistry.register('dir', {
    description: 'Displays a list of a directory\'s files and subdirectories.',
    usage: 'dir [path] [/a] [/s] [/b]',
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
        const target = args.find(arg => !arg.startsWith('/')) || '.';

        // Display all types
        if (/\/[aA]/i.test(argString)) displayAll = true;

        // Display subdirectory
        if (/\/[sS]/i.test(argString)) displaySubdir = true;

        // No header
        if (/\/[bB]/i.test(argString)) displayMinimally = true;

        let directory;
        try {
            directory = resolveShellDirectory(shell, target);
            if (!await shell.fs.exists(directory) || !(await shell.fs.stat(directory)).isDirectory()) {
                throw new Error(`Directory not found: ${target}`);
            }
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
        // Stream entries as they are discovered.  Collecting a recursive
        // `readdir()` result first makes `dir C:/ /s` appear frozen until the
        // whole disk has been traversed.
        const printDirectory = async (currentDirectory) => {
            const entries = await shell.fs.readdir(currentDirectory);
            for (const name of entries) {
                const path = fsUtils.resolve(currentDirectory, name);
                // A stat is still required for recursive traversal; avoid it
                // for a non-recursive bare listing.
                const stat = displaySubdir || !displayMinimally
                    ? await shell.fs.stat(path)
                    : null;

                if (displayMinimally) {
                    shell.stdout.write(name + '\n');
                } else {
                    const date = stat.mtime;
                    let dateString = '';
                    if (isNaN(date)) {
                        dateString = 'Invalid date';
                    } else {
                        const day = date.format("yyyy/MM/dd");
                        const time = (date.format("hh") < 13 ? date.format("hh:mm") : new Date(date.getTime() - 12 * 1000 * 60 * 60).format("hh:mm")) + (date.format("hh") < 12 ? ' AM' : ' PM');
                        dateString = day + ' ' + time;
                    }
                    shell.stdout.write(dateString + '\t' + (stat.isDirectory() ? '<DIR>\t\t' : '\t' + stat.size + '\t') + name + '\n');
                }

                if (displaySubdir && stat.isDirectory()) {
                    await printDirectory(path);
                }
            }
        };

        await printDirectory(directory);

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
        if (await shell.fs.exists(dir)) {
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
        if (!await shell.fs.exists(dir)) {
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

commandRegistry.register(['copy', 'cp'], {
    description: 'Copies a file to another location.',
    usage: 'copy <source> <destination>',
    category: 'file',
    handler: async ({ args }, shell) => {
        if (args.length !== 2) {
            shell.stderr.write('Usage: copy <source> <destination>\n');
            return false;
        }
        try {
            const source = resolveShellPath(shell, args[0]);
            const destination = resolveShellPath(shell, args[1]);
            if (!await shell.fs.exists(source) || (await shell.fs.stat(source)).isDirectory()) {
                throw new Error(`File not found: ${args[0]}`);
            }
            await shell.fs.writeFile(destination, await shell.fs.readFile(source));
            shell.stdout.write('        1 file(s) copied.\n');
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register(['move', 'mv'], {
    description: 'Moves a file or directory to another location.',
    usage: 'move <source> <destination>',
    category: 'file',
    handler: async ({ args }, shell) => {
        if (args.length !== 2) {
            shell.stderr.write('Usage: move <source> <destination>\n');
            return false;
        }
        try {
            const source = resolveShellPath(shell, args[0]);
            const destination = resolveShellPath(shell, args[1]);
            if (!await shell.fs.exists(source)) throw new Error(`Path not found: ${args[0]}`);
            await shell.fs.rename(source, destination);
            shell.stdout.write('        1 item(s) moved.\n');
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register(['ren', 'rename'], {
    description: 'Renames a file or directory.',
    usage: 'ren <path> <new-name>',
    category: 'file',
    handler: async ({ args }, shell) => {
        if (args.length !== 2 || /[\\/]/.test(args[1])) {
            shell.stderr.write('Usage: ren <path> <new-name>\n');
            return false;
        }
        try {
            const source = resolveShellPath(shell, args[0]);
            const destination = fsUtils.resolve(fsUtils.dirname(source), args[1]);
            if (!await shell.fs.exists(source)) throw new Error(`Path not found: ${args[0]}`);
            await shell.fs.rename(source, destination);
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register(['type', 'cat'], {
    description: 'Displays the contents of one or more text files.',
    usage: 'type|cat <file> [file...]',
    category: 'text',
    handler: async ({ args }, shell) => {
        if (!args.length) {
            shell.stderr.write('Usage: type|cat <file> [file...]\n');
            return false;
        }
        try {
            for (const file of args) {
                const content = await readTextFile(shell, file);
                shell.stdout.write(content);
                if (content && !content.endsWith('\n')) shell.stdout.write('\n');
            }
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register('touch', {
    description: 'Creates an empty file or updates a file timestamp.',
    usage: 'touch <file>',
    category: 'file',
    handler: async ({ args }, shell) => {
        if (args.length !== 1) {
            shell.stderr.write('Usage: touch <file>\n');
            return false;
        }
        try {
            const path = resolveShellPath(shell, args[0]);
            if (await shell.fs.exists(path) && (await shell.fs.stat(path)).isDirectory()) throw new Error(`Path is a directory: ${args[0]}`);
            const content = await shell.fs.exists(path) ? await shell.fs.readFile(path) : new Uint8Array();
            await shell.fs.writeFile(path, content);
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register('tree', {
    description: 'Graphically displays the directory structure.',
    usage: 'tree [path]',
    category: 'file',
    handler: async ({ args }, shell) => {
        try {
            const root = resolveShellDirectory(shell, args[0] || '.');
            if (!await shell.fs.exists(root) || !(await shell.fs.stat(root)).isDirectory()) throw new Error(`Directory not found: ${args[0] || '.'}`);
            shell.stdout.write(root + '\n');
            const entries = await shell.fs.readdir(root, { recursive: true });
            for (const entry of entries.sort()) {
                const relative = entry.slice(root.length).replace(/^\//, '');
                const depth = relative.split('/').length - 1;
                shell.stdout.write(`${'  '.repeat(depth)}${fsUtils.basename(entry)}\n`);
            }
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

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

        tasklist.list().forEach(k => {
            try {
                const task = tasklist.get(k);
                table.row([{ text: fsUtils.basename(task.__filename || '') }, { text: String(task.process.pid) }, { text: task.process.title }, { text: k }]);
            } catch (e) {
                console.error(e);
            }
        })

        shell.stdout.write('\r\n');

        return true;
    }
})

commandRegistry.register('shutdown', {
    description: 'Enables you to shut down or restart local or remote computers, one at a time.',
    usage: 'shutdown [/r]',
    options: {
        '/r': 'Restarts the computer after shutdown.'
    },
    category: 'built-in',
    handler: async ({ args }, shell) => {
        if (args.includes('/r')) {
            location.reload();
            return;
        }

        setTimeout(() => {
            stat.set('Kernel.WRT.available', false);
            tasklist.list().forEach(k => {
                tasklist.get(k)?.kill();
            })
            viewport.root.innerHTML = '';
        })
    }
})

commandRegistry.register('taskkill', {
    description: 'Ends one or more tasks or processes. Processes can be ended by process ID or image name. You can use the tasklist command command to determine the process ID (PID) for the process to be ended.',
    usage: 'taskkill [/pid <processID> | /im <imagename>]',
    options: {
        '/pid <processID>': 'Specifies the process ID of the process to be terminated.',
        // '/im <imagename>': 'Specifies the image name of the process to be terminated. Use the wildcard character (*) to specify all image names. ( Unavailable )'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {
        const _args = args.slice(1);
        const argString = args.join(' ');

        if (/\/pid/i.test(argString)) {
            for (const arg of _args) {
                try {
                    const p = processes.get(Number(arg));
                    console.log(p)
                    if (p) {
                        p.exitCode = 0;
                        shell.stdout.write(`Process with pid ${arg} has been terminated.\n`);
                    }
                } catch (e) {
                    shell.stderr.write(e.message);
                }
            }
            return true;
        }

        return false;
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
            window.open(args[0], '_blank');
            return true;
        }

        const app = appRegistry.getInfoByName(uri.scheme);
        if (!app || !app.entryScript) {
            shell.stderr.write(`Can not found scheme: ${uri.scheme}.\n`);
            return false;
        }

        try {
            const WRT = ModuleManager.get('WRT')
            const wrt = new WRT({
                __filename: app.entryScript,
                code: await shell.fs.readFile(app.entryScript, 'utf-8'),
                argv: [`--path="${uri.path}"`]
            });
            wrt.main();
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
        if (!args.length) {
            const env = shell.getAllEnv();
            for (const [key, value] of Object.entries(env)) shell.stdout.write(`${key}=${value}\n`);
            return true;
        }
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

// Print Winbows Version
commandRegistry.register('ver', {
    description: 'Print Winbows version.',
    usage: 'version',
    category: 'built-in',
    handler: (_, shell) => {
        shell.stdout.write(`Winbows11 [Version ${SystemInformation.version}]\n`);
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
        shell.dispose(exitCode);
        return true;
    }
})

//==== Text processing and file operation assistance ====//

// Set title
commandRegistry.register('title', {
    description: 'Creates a title for the Command Prompt window.',
    usage: 'title [<string>]',
    options: {
        '<string>': 'Specifies the text to appear as the title of the Command Prompt window.'
    },
    category: 'built-in',
    handler: ({ args }, shell) => {
        shell.process.title = args.join(' ');
        return true;
    }
})

// Echo
commandRegistry.register('echo', {
    description: 'Displays messages or turns on or off the command echoing feature.',
    usage: 'echo [<message>]',
    options: {
        '<message>': 'Specifies the message to display.'
    },
    category: 'built-in',
    handler: ({ args, flag }, shell) => {
        if (args.length === 0) {
            shell.stdout.write('\n');
            return true;
        }
        shell.stdout.write(args.join(' ') + '\n');
        return true;
    }
})

commandRegistry.register('more', {
    description: 'Displays text from a file or pipeline input.',
    usage: 'more [file]',
    category: 'text',
    handler: async ({ args }, shell) => {
        try {
            const content = args.length ? await readTextFile(shell, args[0]) : readStdin(shell);
            if (!content && !args.length) return true;
            shell.stdout.write(content);
            if (content && !content.endsWith('\n')) shell.stdout.write('\n');
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register('sort', {
    description: 'Sorts lines from a file or pipeline input.',
    usage: 'sort [/r] [file]',
    category: 'text',
    handler: async ({ args }, shell) => {
        try {
            const reverse = args.some(arg => /^\/r$/i.test(arg));
            const file = args.find(arg => !/^\//.test(arg));
            const content = file ? await readTextFile(shell, file) : readStdin(shell);
            const lines = content.split(/\r?\n/).filter((line, index, all) => line || index < all.length - 1);
            lines.sort((a, b) => a.localeCompare(b));
            if (reverse) lines.reverse();
            shell.stdout.write(lines.join('\n') + (lines.length ? '\n' : ''));
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register(['find', 'findstr'], {
    description: 'Searches for text in a file or pipeline input.',
    usage: 'find|findstr [/i] [/n] <text> [file]',
    category: 'text',
    handler: async ({ args }, shell) => {
        const ignoreCase = args.some(arg => /^\/i$/i.test(arg));
        const showLineNumbers = args.some(arg => /^\/n$/i.test(arg));
        const values = args.filter(arg => !/^\/[in]$/i.test(arg));
        if (!values.length) {
            shell.stderr.write('Usage: find|findstr [/i] [/n] <text> [file]\n');
            return false;
        }
        try {
            const [needle, file] = values;
            const content = file ? await readTextFile(shell, file) : readStdin(shell);
            const matchNeedle = ignoreCase ? needle.toLocaleLowerCase() : needle;
            let count = 0;
            content.split(/\r?\n/).forEach((line, index) => {
                const subject = ignoreCase ? line.toLocaleLowerCase() : line;
                if (subject.includes(matchNeedle)) {
                    shell.stdout.write((showLineNumbers ? `${index + 1}:` : '') + line + '\n');
                    count++;
                }
            });
            return count > 0;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register('fc', {
    description: 'Compares the contents of two text files.',
    usage: 'fc <file1> <file2>',
    category: 'text',
    handler: async ({ args }, shell) => {
        if (args.length !== 2) {
            shell.stderr.write('Usage: fc <file1> <file2>\n');
            return false;
        }
        try {
            const [left, right] = await Promise.all(args.map(file => readTextFile(shell, file)));
            if (left === right) {
                shell.stdout.write('FC: no differences encountered\n');
                return true;
            }
            const leftLines = left.split(/\r?\n/);
            const rightLines = right.split(/\r?\n/);
            const length = Math.max(leftLines.length, rightLines.length);
            for (let index = 0; index < length; index++) {
                if (leftLines[index] !== rightLines[index]) {
                    shell.stdout.write(`***** ${args[0]}\n${leftLines[index] ?? ''}\n`);
                    shell.stdout.write(`***** ${args[1]}\n${rightLines[index] ?? ''}\n`);
                }
            }
            return true;
        } catch (error) {
            shell.stderr.write(error.message + '\n');
            return false;
        }
    }
});

commandRegistry.register('where', {
    description: 'Locates registered commands, apps, or files in the current directory.',
    usage: 'where <name>',
    category: 'file',
    handler: async ({ args }, shell) => {
        if (args.length !== 1) {
            shell.stderr.write('Usage: where <name>\n');
            return false;
        }
        const name = args[0].toLowerCase();
        const matches = [];
        if (commandRegistry.has(name)) matches.push(`${name} (built-in command)`);
        const app = appRegistry.getInfo(args[0]);
        if (app?.entryScript) matches.push(app.entryScript);
        const cwd = fsUtils.normalize(shell.root + shell.pwd);
        const entries = await shell.fs.readdir(cwd);
        for (const entry of entries) {
            if (fsUtils.basename(entry).toLowerCase() === name) matches.push(entry);
        }
        if (!matches.length) {
            shell.stderr.write(`INFO: Could not find files for the given pattern(s).\n`);
            return false;
        }
        shell.stdout.write(matches.join('\n') + '\n');
        return true;
    }
});

commandRegistry.register('pause', {
    description: 'Pauses execution until a key is entered.',
    usage: 'pause',
    category: 'built-in',
    handler: async (_, shell) => {
        await shell.input('Press any key to continue...', 'normal');
        shell.stdout.write('\n');
        return true;
    }
});

commandRegistry.register('hostname', {
    description: 'Displays the system host name.',
    usage: 'hostname',
    category: 'system',
    handler: (_, shell) => {
        shell.stdout.write((shell.getEnv('COMPUTERNAME') || 'WINBOWS11') + '\n');
        return true;
    }
});

commandRegistry.register('whoami', {
    description: 'Displays the current user name.',
    usage: 'whoami',
    category: 'system',
    handler: (_, shell) => {
        shell.stdout.write((shell.getEnv('USERNAME') || shell.getEnv('USER') || 'User') + '\n');
        return true;
    }
});

commandRegistry.register('date', {
    description: 'Displays the current date.',
    usage: 'date',
    category: 'system',
    handler: (_, shell) => {
        shell.stdout.write(new Date().toLocaleDateString() + '\n');
        return true;
    }
});

commandRegistry.register('time', {
    description: 'Displays the current time.',
    usage: 'time',
    category: 'system',
    handler: (_, shell) => {
        shell.stdout.write(new Date().toLocaleTimeString() + '\n');
        return true;
    }
});

commandRegistry.register('systeminfo', {
    description: 'Displays basic Winbows system information.',
    usage: 'systeminfo',
    category: 'system',
    handler: (_, shell) => {
        shell.stdout.write(`Host Name: ${shell.getEnv('COMPUTERNAME') || 'WINBOWS11'}\n`);
        shell.stdout.write(`OS Name: Winbows11\n`);
        shell.stdout.write(`OS Version: ${SystemInformation.version}\n`);
        shell.stdout.write(`Current Directory: ${shell.getPwd()}\n`);
        return true;
    }
});

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
            if (category === INTERNAL_CATEGORY) continue;
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
        const parts = [
            { text: 'Nothing ', duration: 100 },
            { text: 'Beats ', duration: 100 },
            { text: 'A ', duration: 100 },
            { text: 'Jet2 ', duration: 100 },
            { text: 'Holiday!\n', duration: 100 },
            { text: 'And ', duration: 100 },
            { text: 'Right ', duration: 100 },
            { text: 'Now ', duration: 100 },
            { text: 'You ', duration: 100 },
            { text: 'Can ', duration: 100 },
            { text: 'Save ', duration: 100 },
            { text: '£50 ', duration: 100 },
            { text: 'Per ', duration: 100 },
            { text: 'Person!\n', duration: 100 },
            { text: 'That’s ', duration: 100 },
            { text: '£200 ', duration: 100 },
            { text: 'Off ', duration: 100 },
            { text: 'For ', duration: 100 },
            { text: 'A ', duration: 100 },
            { text: 'Family ', duration: 100 },
            { text: 'Of ', duration: 100 },
            { text: '4!\n', duration: 100 }
        ];

        for (let i = 0; i < parts.length; i++) {
            shell.stdout.write(parts[i].text);
            await (function () {
                return new Promise(r => setTimeout(r, parts[i].duration));
            })();
        }

        return true;
    }
})

// ============== Internal commands ============== //
commandRegistry.addCategory(INTERNAL_CATEGORY, {
    title: ''
})

commandRegistry.register(`${INTERNAL_COMMAND_PREFIX}animation-speed`, {
    description: 'Set animation speed. (For development use only)',
    usage: `${INTERNAL_COMMAND_PREFIX}animation-speed <multiplier>`,
    options: {
        '<multiplier>': 'Specifies the animation speed multiplier.'
    },
    category: INTERNAL_CATEGORY,
    handler: ({ args }, shell) => {
        const multiplier = Number(args[0]);
        if (isNaN(multiplier)) {
            shell.stderr.write(`Usage: ${INTERNAL_COMMAND_PREFIX}animation-speed <multiplier>\n`);
            return false;
        }

        const animateProfiles = ModuleManager.get('BrowserWindow.internal.animationProfiles');
        for (const k of Object.keys(animateProfiles)) {
            animateProfiles[k].duration = animateProfiles[k].base * multiplier;
        }

        return true;
    }
})

commandRegistry.register(`${INTERNAL_COMMAND_PREFIX}wipe-data`, {
    description: 'Wipe all user data. (For development use only)',
    usage: `${INTERNAL_COMMAND_PREFIX}wipe-data`,
    category: INTERNAL_CATEGORY,
    handler: async ({ args }, shell) => {
        await shell.fs.rm("C:/", {
            recursive: true,
            force: true
        });

        return true;
    }
})

export { commandRegistry };
