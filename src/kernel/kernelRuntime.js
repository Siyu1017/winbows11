import { WRT } from "./WRT/kernel.js";
import { getStackTrace } from "../utils.js";
import { safeEscape } from "../utils.js";

const kernelRuntime = new WRT('C:/Winbows/System/kernel/', {
    keepAlive: true
});
const apis = kernelRuntime.exposeAPIs();

kernelRuntime.process.on('exit', (code) => {
    console.error('Kernel process exited with code', code);
    console.trace('Stacktrace:');
    try {
        document.body.innerHTML = `<div class="bsod"><div class="bsod-container"><h1 style="font-size: 6rem;margin: 0 0 2rem;font-weight: 300;">:(</h1><div style="font-size:1.375rem">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</div><div style="font-size:1.125rem;padding-top:1rem;white-space:pre-wrap;">Stacktrace: \n${getStackTrace().map(t => {
            if (typeof t != 'string') return '';
            return safeEscape(t);
        }).join('\n')}</div></div>`;
    } catch (e) {
        console.error(e);
    }
    setTimeout(() => { location.reload() }, 10000);
})
kernelRuntime.runCode('// Winbows NT Kernel\nprocess.title=\"Winbows NT Kernel\"', {
    __filename: 'C:/Winbows/System/kernel/kernel.js'
});

export {
    kernelRuntime,
    apis
}