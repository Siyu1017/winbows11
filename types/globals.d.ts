/* WRT global types */

/// <reference path="./namespaces/fs.d.ts" />
/// <reference path="./namespaces/process.d.ts" />
/// <reference path="./namespaces/kernel/IPC.d.ts" />
/// <reference path="./namespaces/System/System.d.ts" />
/// <reference path="./internal/browserWindow.d.ts" />

/**
 * Absolute path of current module.
 */
declare const __dirname: string;

/**
 * Current filename of module.
 */
declare const __filename: string;

/**
 * Load a module asynchronously by ID (name or path).
 */
declare function requireAsync(id: string): Promise<any>;

/**
 * Module object of current file.
 */
declare const module: {
    exports: any;
};

/**
 * Shortcut to module.exports
 */
declare const exports: any;

/**
 * Unique runtime identifier
 */
declare const runtimeID: string;

/**
 * Browser window APIs for GUI applications.
 */
declare const browserWindow: InternalBrowserWindow;