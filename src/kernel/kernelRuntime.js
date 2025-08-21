import { WRT } from "./WRT/kernel";

const kernelRuntime = new WRT('C:/Winbows/System/kernel/');
const apis = kernelRuntime.exposeAPIs();

export {
    kernelRuntime,
    apis
}