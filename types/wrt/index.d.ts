/* WRT global types */

/// <reference path="./namespaces/fs.d.ts" />
/// <reference path="./namespaces/path.d.ts" />
/// <reference path="./namespaces/process.d.ts" />
/// <reference path="./namespaces/kernel/IPC.d.ts" />
/// <reference path="./namespaces/System/System.d.ts" />
/// <reference path="./namespaces/System/appRegistry.d.ts" />
/// <reference path="./namespaces/System/tasklist.d.ts" />
/// <reference path="./namespaces/System/WApplication.d.ts" />
/// <reference path="./namespaces/System/WinUI.d.ts" />
/// <reference path="./internal/browserWindow.d.ts" />

export { };

declare global {
    /**
     * Absolute path of current module.
     */
    // @ts-ignore
    const __dirname: string;

    /**
     * Current filename of module.
     */
    // @ts-ignore
    const __filename: string;

    /**
     * Load a module asynchronously by ID (name or path).
     */
    function requireAsync(id: 'fs' | 'node:fs'): Promise<typeof fs>;
    function requireAsync(id: 'fs/promises' | 'node:fs/promises'): Promise<typeof fs.promises>;
    function requireAsync(id: 'path' | 'node:path'): Promise<typeof path>;
    function requireAsync(id: string): Promise<any>;

    /**
     * Module object of current file.
     */
    // @ts-ignore
    const module: {
        exports: any;
    };

    /**
     * Shortcut to module.exports
     */
    // @ts-ignore
    const exports: any;

    /**
     * Unique runtime identifier
     */
    const runtimeID: string;

    /**
     * Browser window APIs for GUI applications.
     */
    const browserWindow: InternalBrowserWindow;
}
