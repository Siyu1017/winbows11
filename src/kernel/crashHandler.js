import viewport from "./viewport.js";
import SystemInformation from "./systemInformationProvider.js";
import { safeEscape, getStackTrace } from "../utils.js";

export default function crashHandler(e) {
    try {
        const stacktrace = getStackTrace();
        const message = `System Information:\nBuild ID: ${SystemInformation.buildId}\nLocal Build ID: ${SystemInformation.localBuildId}\nWinbows Version: ${SystemInformation.version}${e ? '\n\nError Message: ' + e.message : ''}`;
        const reportURL = `https://github.com/Siyu1017/winbows11/issues/new?title=${encodeURIComponent('Kernel Error')}&body=${encodeURIComponent(`${message}\n\nStacktrace:\n` + stacktrace.join('\n'))}`;

        console.clear();
        console.group('[Kernel]');
        if (e) {
            console.error(e);
        }
        console.warn('We will restart for you in 10 seconds.');
        console.log(`System Information:\nBuild ID: ${SystemInformation.buildId}\nLocal Build ID: ${SystemInformation.localBuildId}\nWinbows Version: ${SystemInformation.version}`);
        console.log(`Report a bug: ${reportURL}`);
        viewport.root.innerHTML = `<div class="bsod"><div class="bsod-container"><h1 style="font-size: 6rem;margin: 0 0 2rem;font-weight: 300;">:(</h1><div style="font-size:1.375rem">Your PC ran into a problem and needs to restart. We will restart for you in 10 seconds.</div><div style="font-size:1.125rem;padding-top:1rem;white-space:pre-wrap;">${message}\n\nStacktrace: \n${stacktrace.map(t => {
            if (typeof t != 'string') return '';
            return safeEscape(t);
        }).join('\n')}</div><a href="${reportURL}" target="_blank" style="margin-top: 2rem;color: rgb(0, 103, 192);padding: .5rem 1rem;background: #fff;border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0;font-family: inherit;font-weight: 600;max-width: 12rem;width: fit-content;display: block;">Report a bug</a></div>`;
    } catch (e) {
        console.error(e);
    }

    setTimeout(() => { location.reload() }, 10000);
}