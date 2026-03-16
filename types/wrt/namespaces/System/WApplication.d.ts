/// <reference path="../../internal/eventEmitter.d.ts" />
/// <reference path="../../internal/browserWindow.d.ts" />

declare namespace WApplication {
    namespace app {
        function on(event: string, handler: Function): void;
        function executeAsync(): Promise<any>;
    }
    class BrowserWindow extends EventEmitter {
        constructor(config: BrowserWindowConfig);
        load(path: string): Promise<any>;
    }
}