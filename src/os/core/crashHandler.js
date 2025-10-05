import { viewport } from "./viewport.js";
import SystemInformation from "./sysInfo.js";
import { safeEscape, getStackTrace } from "../../shared/utils.js";
import Logger, { WinbowsDebugLog } from "./log.js";

let crashed = false;
const logger = new Logger({
    module: 'CrashHandler'
})

export default function crashHandler(e) {
    if (crashed == true) return;
    crashed = true;
    try {
        const stacktrace = getStackTrace();
        const message = `System Information:\nBuild ID: ${SystemInformation.buildId}\nLocal Build ID: ${SystemInformation.localBuildId}\nWinbows Version: ${SystemInformation.version}${e ? '\n\nError Message: ' + e.message : ''}`;
        const reportURL = `https://github.com/Siyu1017/winbows11/issues/new?title=${encodeURIComponent('Kernel Error')}&body=${encodeURIComponent(`${message}\n\nStacktrace:\n` + stacktrace.join('\n'))}`;

        console.clear();
        if (e) {
            logger.fatal('[Crash]', e);
        }
        logger.warn('We will restart for you in 10 seconds.');
        logger.info(`System Information:\nBuild ID: ${SystemInformation.buildId}\nLocal Build ID: ${SystemInformation.localBuildId}\nWinbows Version: ${SystemInformation.version}`);
        logger.info(`Report a bug: ${reportURL}`);

        const bsodEl = document.createElement('div');
        const containerEl = document.createElement('div');
        const headerEl = document.createElement('h1');
        const contentEl = document.createElement('div');
        const messageEl = document.createElement('div');
        const stacktraceEl = document.createElement('div');
        const reportEl = document.createElement('a');
        const downloadEl = document.createElement('div');

        bsodEl.className = 'bsod';
        containerEl.className = 'bsod-container';
        headerEl.textContent = ':(';
        contentEl.textContent = 'Your PC ran into a problem and needs to restart. We will restart for you in 10 seconds.';
        messageEl.textContent = message;
        stacktraceEl.textContent = stacktrace.map(t => {
            if (typeof t != 'string') return '';
            return safeEscape(t);
        }).join('\n');
        reportEl.href = reportURL;
        reportEl.target = '_blank';
        reportEl.textContent = 'Report a bug';
        downloadEl.textContent = 'Download debug log';
        downloadEl.addEventListener('click', (e) => {
            const t = Date.now();
            WinbowsDebugLog.export(`winbows-debug-${t}.log`);
        });

        headerEl.style = "font-size: 6rem;margin: 0 0 2rem;font-weight: 300;";
        contentEl.style = "font-size:1.375rem;";
        messageEl.style = "font-size:1.125rem;padding-top:1rem;white-space:pre-wrap;";
        reportEl.style = "margin-top: 2rem;color: rgb(0, 103, 192);padding: .5rem 1rem;background: #fff;border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0;font-family: inherit;font-weight: 600;max-width: 12rem;width: fit-content;display: block;";
        downloadEl.style = "margin-top: 2rem;color: rgb(0, 103, 192);padding: .5rem 1rem;background: #fff;border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0;font-family: inherit;font-weight: 600;max-width: 12rem;width: fit-content;display: block;";

        viewport.root.innerHTML = '';
        viewport.root.appendChild(bsodEl);
        bsodEl.appendChild(containerEl);
        containerEl.appendChild(headerEl);
        containerEl.appendChild(contentEl);
        containerEl.appendChild(messageEl);
        containerEl.appendChild(stacktraceEl);
        containerEl.appendChild(reportEl);
        containerEl.appendChild(downloadEl);

        /*
        viewport.root.innerHTML = `<div class="bsod"><div class="bsod-container"><h1 style="font-size: 6rem;margin: 0 0 2rem;font-weight: 300;">:(</h1><div style="font-size:1.375rem">Your PC ran into a problem and needs to restart. We will restart for you in 10 seconds.</div><div style="font-size:1.125rem;padding-top:1rem;white-space:pre-wrap;">${message}\n\nStacktrace: \n${stacktrace.map(t => {
            if (typeof t != 'string') return '';
            return safeEscape(t);
        }).join('\n')}</div><a href="${reportURL}" target="_blank" style="margin-top: 2rem;color: rgb(0, 103, 192);padding: .5rem 1rem;background: #fff;border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0;font-family: inherit;font-weight: 600;max-width: 12rem;width: fit-content;display: block;">Report a bug</a></div>`;*/
    } catch (e) {
        logger.error(e);
    }

    setTimeout(() => { location.reload() }, 10000);
}