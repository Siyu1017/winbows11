/* WRT global types */

/// <reference path="./namespaces/fs.d.ts" />
/// <reference path="./namespaces/process.d.ts" />
/// <reference path="./namespaces/kernel/IPC.d.ts" />
/// <reference path="./namespaces/System/System.d.ts" />
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
