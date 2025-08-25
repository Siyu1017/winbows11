import { WRT } from "./WRT/kernel.js";

const kernelRuntime = new WRT('C:/Winbows/System/kernel/');
const apis = kernelRuntime.exposeAPIs();

export {
    kernelRuntime,
    apis
}