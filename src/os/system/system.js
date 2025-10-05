import WinUI from "../../lib/winui/winui.js";
import ModuleManager from "../moduleManager.js";
import appRegistry from "./appRegistry.js";
import { commandRegistry } from "./shell/commandRegistry.js";
import { ShellInstance } from "./shell/shell.js";
import { IDBFS } from "../../shared/fs.js";
import ThemeManager from "./themeManager.js";
import rom from "../core/rom.js";
import { tasklist } from "../kernel/wrt/core.js";
import WApplication from "./WApplication/WApplication.js";
import initializeExplorer from "../explorer/explorer.wrt";
import SystemInformation from "../core/sysInfo.js";
import Logger from "../core/log.js";
import crashHandler from "../core/crashHandler.js";
import timer, { getDuration, marks } from "../core/timer.js";
import fileViewers from "./fileViewer.js";
import fileIcons from "./fileIcon.js";

async function init() {
    const logger = new Logger({
        module: 'System'
    })
    logger.info('Initializing system...');
    timer.groupEnd();
    timer.group('System');

    const fs = IDBFS('~SYSTEM');
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

    const _WRT = ModuleManager.get('WRT', 'kernel');
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
        __filename: 'C:/Winbows/System/system.wrt',
        options: {
            keepAlive: true
        }
    })
    pseudoProcess.process.title = 'System';
    pseudoProcess.main();
    pseudoProcess.process.on('exit', () => {
        logger.fatal('System process exited');
    })
    // System.systemProcess = pseudoProcess;
    logger.info('System pseudo-process created');

    function setupShell() {
        if (pseudoProcess.alive == false) return;
        System.shell = new ShellInstance(pseudoProcess.process);
        System.shell.on('dispose', setupShell);
    }
    setupShell();
    timer.mark('System process');

    ModuleManager.register('System', System, 'original');

    try {
        if (!fs.exists('C:/User/')) {
            await fs.mkdir('C:/User/');
        }
        if (!fs.exists('C:/User/Desktop/')) {
            await fs.mkdir('C:/User/Desktop/');
        }
        if (!fs.exists('C:/User/Documents/')) {
            await fs.mkdir('C:/User/Documents/');
        }
        if (!fs.exists('C:/User/Downloads/')) {
            await fs.mkdir('C:/User/Downloads/');
        }
        if (!fs.exists('C:/User/Music/')) {
            await fs.mkdir('C:/User/Music/');
        }
        if (!fs.exists('C:/User/Pictures/')) {
            await fs.mkdir('C:/User/Pictures/');
        }
        if (!fs.exists('C:/User/Videos/')) {
            await fs.mkdir('C:/User/Videos/');
        }
        if (!fs.exists('C:/User/AppData/')) {
            await fs.mkdir('C:/User/AppData/');
        }
        if (!fs.exists('C:/User/AppData/Local/')) {
            await fs.mkdir('C:/User/AppData/Local/');
        }
        if (!fs.exists('C:/User/AppData/Local/Temp/')) {
            await fs.mkdir('C:/User/AppData/Local/Temp/');
        }
    } catch (e) {
        logger.error(e);
    }

    timer.mark('Setting up directory');
    logger.info('System initialized');
    await initializeExplorer();

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