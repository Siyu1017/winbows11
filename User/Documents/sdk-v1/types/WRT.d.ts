/*!
 * Winbows node.js-like RunTime (WRT) declarations.
 * Copyright (C) Siyu1017 2025.
 */

declare namespace fs {
    const disks: string[];

    // Basic FS methods
    function exists(fullPath: string): boolean;
    function mkdir(fullPath: string): Promise<void>;
    function mv(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;
    function readdir(fullPath: string, options?: { recursive?: boolean }): Promise<string[]>;
    function readFile(fullPath: string): Promise<Blob>;
    function rm(fullPath: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
    function stat(fullPath: string): {
        isFile(): boolean;
        isDirectory(): boolean;
        length: number;
        exists: boolean;
        type: string | null;
        changeTime: number | null;
        createdTime: number | null;
        lastModifiedTime: number | null;
        mimeType: string | null;
    };
    function writeFile(fullPath: string, blob: Blob): Promise<void>;

    // Web Worker proxy
    function proxy(method: string, param: any[]): Promise<any>;

    // Convenient functions
    function downloadFile(fullPath: string, responseType?: 'blob' | 'text'): Promise<Blob | string>;
    function getFileURL(fullPath: string): Promise<string>;
    function getFileAsText(fullPath: string): Promise<string>;

    // Deprecated
    function getFileExtension(file?: string): string;
    function resolvePath(path: string): string;
}

interface FSUtils {
    sep: string;

    normalize(p: string): string;
    join(...args: string[]): string;
    resolve(...paths: string[]): string;

    dirname(p: string): string;
    basename(p: string): string;
    extname(p: string): string;

    isAbsolute(p: string): boolean;
    relative(from: string, to: string): string;

    parsePath(v: string): { disk: string; path: string };
    toDirFormat(path: string): string;
}

interface ShellInstance {
    new(process: Process): ShellInstance;

    write(data: string): Promise<void>;
    execCommand(command: string): Promise<string>;
    setEnv(key: string, value: string): void;
    getEnv(key: string): any;
    dispose(): void;
}

declare const fs: fs;
declare const path: FSUtils;
declare const process: Process;
declare const ShellInstance: ShellInstance;
declare const exports: object;

/**
 * Requires a module asynchronously.
 * @param modulePath The path to the module to require.
 * @param basedir The base directory used to resolve the module path.
 */
declare async function require(modulePath: string, basedir?: string): Promise<any>;

