import WinUI from "../../lib/winui/winui.js";
import ModuleManager from "../moduleManager.js";
import appRegistry from "./appRegistry.js";
import { commandRegistry } from "./shell/commandRegistry.js";
import { ShellInstance } from "./shell/shell.js";
import { getMountedSystemFS } from "../fs/systemFs.ts";
import ThemeManager from "./themeManager.js";
import rom from "../core/rom.js";
import { tasklist } from "../kernel/wrt/core.js";
import initializeExplorer from "../explorer/explorer.wrt";
import SystemInformation from "../core/sysInfo.js";
import Logger from "../core/log.js";
import timer, { getDuration, marks } from "../core/timer.js";
import fileViewers from "./fileViewer.js";
import fileIcons from "./fileIcon.js";
import { loading, winbowsIcon } from "../core/viewport.js";

async function init() {
    try {
        // await VFS_TESTER();
    } catch (e) {
        console.warn('Initialization interrupted.\nTo proceed, call the proceed() function manually.');
        await (function () {
            return new Promise(resolve => {
                window.proceed = resolve;
            });
        })();
    }

    loading.textWithProgress('Initializing System...', 12);

    const logger = new Logger({
        module: 'System'
    })
    logger.info('Initializing system...');
    timer.groupEnd();
    timer.group('System');

    const WApplication = (await import('./WApplication/WApplication.js')).default;
    const fs = getMountedSystemFS();
    const System = {};
    System.appRegistry = appRegistry;
    System.commandRegistry = commandRegistry;
    System.WinUI = WinUI;
    System.WApplication = '';
    System.theme = ThemeManager;
    System.rom = rom;
    System.tasklist = tasklist;
    System.ShellInstance = ShellInstance;
    System.information = SystemInformation;
    System.fileViewers = fileViewers;
    System.fileIcons = fileIcons;

    const _WRT = ModuleManager.get('WRT');
    ModuleManager.update('WRT', class extends _WRT {
        constructor(options) {
            super(options);

            this.mountAPI({
                name: 'appRegistry',
                api: appRegistry
            });
            this.mountAPI({
                name: 'ShellInstance',
                api: ShellInstance
            });
            this.mountAPI({
                name: 'WinUI',
                api: WinUI
            });
            this.mountAPI({
                name: 'tasklist',
                api: System.tasklist
            })
            this.mountAPI({
                name: 'WApplication',
                api: WApplication.register(this)
            })
            this.mountAPI({
                name: 'System',
                api: System
            });
        }
    }, 'system');
    const WRT = ModuleManager.get('WRT');
    timer.mark('API registration');

    const pseudoProcess = new WRT({
        code: '//! System pseudo-process',
        __filename: 'C:/Winbows/System/system.js',
        options: {
            keepAlive: true
        },
        icon: winbowsIcon
    })
    pseudoProcess.process.title = 'System';
    pseudoProcess.main();
    pseudoProcess.process.on('exit', () => {
        logger.fatal('System process exited');
    })
    System.processAPIs = pseudoProcess.apis;
    // System.systemProcess = pseudoProcess;
    logger.info('System pseudo-process created');

    function setupShell() {
        if (pseudoProcess.alive == false) return;
        System.shell = new ShellInstance(pseudoProcess.process);
        System.shell.on('dispose', setupShell);
        System.shell.stderr.on('data', (dt) => {
            logger.error(dt);
        })
    }
    setupShell();
    timer.mark('System process');

    ModuleManager.register('System', System, 'original');

    try {
        for (const path of ['C:/User', 'C:/User/Desktop', 'C:/User/Documents', 'C:/User/Downloads', 'C:/User/Music', 'C:/User/Pictures', 'C:/User/Videos', 'C:/User/AppData', 'C:/User/AppData/Local', 'C:/User/AppData/Local/Temp']) {
            await fs.mkdir(path, { recursive: true }).catch(error => { if (error?.code !== 'EEXIST') throw error; });
        }
    } catch (e) {
        logger.error(e);
    }

    timer.mark('Setting up directory');
    logger.info('System initialized');
    await initializeExplorer();
    clearInterval(loading.updateProgressId);
    loading.setProgress(100);

    let output = [];
    let levels = [];
    let total = getDuration();
    function traversal(marks) {
        marks.forEach((mark, i) => {
            const isLast = i === marks.length - 1;
            const before = isLast ? '└' : '├';
            const sum = mark.sum;
            // const percent = `${(sum / total * 100).toFixed(2)}%`;
            if (mark.marks) {
                // Group
                output.push(levels.concat(['']).join(' ') + `${before} ${mark.name} (${sum}ms)`);
                levels.push(isLast ? ' ' : '│');
                traversal(mark.marks);
                levels.pop();
            } else {
                output.push(levels.concat(['']).join(' ') + `${before} ${mark.label} (${sum}ms)`);
            }
        })
    }
    traversal(marks);
    logger.info(`\nWinbows initialized (${total}ms)\n${output.join('\n')}`);

    //logger.info('[Copilot Test]');

    async function conversation(msg) {
        const start = Date.now();
        logger.info('> ' + msg);
        logger.info('< ' + await window.copilot.generateText(msg));
        const now = Date.now();
        logger.info(`Response generated in ${((now - start) / 1000).toFixed(2)}s`);
    }

    //await conversation('How are you?');
    //await conversation('What is your name?');
}

export default init;
