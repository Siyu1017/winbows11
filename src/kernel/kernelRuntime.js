import { WRT } from "./WRT/kernel.js";
import crashHandler from "./crashHandler.js";

const kernelRuntime = new WRT('C:/Winbows/System/kernel/', {
    keepAlive: true
});
const apis = kernelRuntime.exposeAPIs();

kernelRuntime.process.on('exit', (code) => {
    crashHandler();
})
kernelRuntime.runCode('// Winbows NT Kernel\nprocess.title=\"Winbows NT Kernel\"', {
    __filename: 'C:/Winbows/System/kernel/kernel.js'
});

if (!apis.fs.exists('C:/')) {
    try {
        await apis.fs.mkdir('C:/');
    } catch { }
}

export {
    kernelRuntime,
    apis
}