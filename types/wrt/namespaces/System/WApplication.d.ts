/// <reference path="../../internal/eventEmitter.d.ts" />
/// <reference path="../../internal/browserWindow.d.ts" />

declare namespace WApplication {
    namespace app {
        function on(event: string, handler: Function): void;
        function executeAsync(): Promise<any>;
    }
    class BrowserWindow extends EventEmitter {
        constructor(config: BrowserWindowConfig);
        /** Load a WRT script or render a local HTML document directly in the window. */
        load(path: string): Promise<any>;
        /** Electron-compatible alias for `load(path)`. */
        loadFile(path: string): Promise<any>;
    }
}
