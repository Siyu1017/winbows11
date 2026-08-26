/* Auto-generated from types/wrt. Do not edit. */

declare interface BrowserWindowConfig {
    resizable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
    snappable?: boolean;
    fullscreenable?: boolean;
    /** Creates a modal popup when used with `type: 'popup'`. */
    modal?: boolean;
    mica?: boolean;
    showOnTop?: boolean;
    theme?: 'light' | 'dark' | 'system';
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    x?: number | 'center';
    y?: number | 'center';
    icon?: string;
    title?: string;
    type?: 'main-window' | 'sub-window' | 'popup';
    parentWindow?: InternalBrowserWindow;
}

declare namespace TabviewObject {
    function on(event: string, handler: Function): void;
    class Tab {
        constructor(config: {
            active: boolean,
            icon?: string,
            tabAnimation?: boolean
        });

        // Elements
        tab: HTMLDivElement;
        tabInfo: HTMLDivElement;
        tabIcon: HTMLDivElement;
        tabHeader: HTMLDivElement;
        tabClose: HTMLDivElement;
        tabviewItem: HTMLDivElement;
        id: string;

        // Methods
        getContainer(): HTMLDivElement;
        focus: () => void;
        blur: () => void;
        close: () => void;
        changeTitle(header: string): void;
        changeIcon(icon: string): void;
    }
}

declare class InternalBrowserWindow {
    constructor(config: BrowserWindowConfig);

    // Elements
    shadowRoot: ShadowRoot;
    container: HTMLDivElement;
    window: HTMLDivElement;
    toolbar: HTMLDivElement;
    content: HTMLDivElement;

    // Window operations
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    close(): void;

    // Events
    on(event: string, handler: Function): void;
    // Alias for on
    addEventListener(event: string, handler: Function): void;

    // Theme management
    setTheme(theme: 'light' | 'dark' | 'system'): void;
    getTheme(): 'light' | 'dark' | 'system';

    // Movable / Immovable
    setMovable(element: Element): void;
    unsetMovable(element: Element): void;
    setImmovable(element: Element): void;
    unsetImmovable(element: Element): void;

    // Configurations
    changeTitle(title: string): void;
    changeIcon(icon: string): void;
    setSnappable(snappable: boolean): void;

    useTabview(config: {
        icon: boolean;
    }): typeof TabviewObject;
}

declare class EventEmitter {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
}
declare class PipeClient {
    on(event: 'data' | 'connect' | 'disconnect' | 'error' | 'close', handler: Function): void;
    send(data: any): void;
    disconnect(): void;
}

declare class PipeServer {
    readonly clients: string[];
    send(data: any, clientId: string): void;
    broadcast(data: any): void;
    disconnect(clientId: string): void;
    close(): void;
}
declare class Process extends EventEmitter {
    constructor(options?: {
        cwd?: string; name?: string; ppid?: number; type?: 'cli' | 'gui';
        env?: { [key: string]: string | undefined };
        stdin?: stdio.InputStream; stdout?: stdio.OutputStream; stderr?: stdio.OutputStream;
    });

    readonly pid: number;
    readonly ppid: number;
    readonly alive: boolean;
    readonly state: 'running' | 'stopped' | 'exiting' | 'exited' | 'killed';
    readonly startedAt: number;

    env: { [key: string]: string; };
    argv0: string;
    argv: string[];
    args: { [key: string]: unknown; };
    platform: 'win32';
    title: string;
    name: string;
    execPath: string;
    execArgv: string[];

    stderr: stdio.OutputStream;
    stdin: stdio.InputStream;
    stdout: stdio.OutputStream;

    nextTick(callback: () => void): void;
    exit(code?: number): Promise<void>;
    signal(signal: 'SIGINT' | 'SIGKILL' | 'SIGTERM' | 'SIGSTOP' | 'SIGCONT'): boolean;
    kill(pid: number, signal?: string | number): boolean;
    abort(): void;
    chdir(dir: string): void;
    cwd(): string;
    emitWarning(warning: string | Error, type?: string | any, code?: string, ctor?: Function): void;
    toJSON(): Record<string, unknown>;
}

declare namespace stdio {
    interface InputStream extends EventEmitter {
        readonly readableEnded: boolean;
        readonly destroyed: boolean;
        readonly readableHighWaterMark: number;
        isPaused(): boolean;
        pause(): this;
        resume(): this;
        write(data: string | ArrayBuffer | Uint8Array): boolean;
        read(size?: number): string | null;
        end(data?: string | ArrayBuffer | Uint8Array): this;
        destroy(error?: Error): this;
    }

    interface OutputStream extends EventEmitter {
        readonly writableEnded: boolean;
        readonly destroyed: boolean;
        readonly writableHighWaterMark: number;
        readonly maxBuffer: number;
        readonly isTruncated: boolean;
        write(data: string | ArrayBuffer | Uint8Array): boolean;
        toString(): string;
        read(): string | null;
        clear(): this;
        end(data?: string | ArrayBuffer | Uint8Array): this;
        destroy(error?: Error): this;
    }

    namespace tty {
        interface InputStream extends stdio.InputStream {
            readonly isTTY: true;
            readonly isRaw: boolean;
            setRawMode(mode: boolean): void;
        }
        interface OutputStream extends stdio.OutputStream {
            readonly isTTY: true;
            columns: number;
            rows: number;
            resize(columns: number, rows: number): void;
            clearLine(dir?: 0 | -1 | 1, callback?: () => void): void;
            clearScreenDown(): void;
            cursorTo(x: number, y?: number): void;
            moveCursor(dx: number, dy: number): void;
            hasColors(): boolean;
            getWindowSize(): [number, number];
        }
    }
}

/** Node.js-compatible asynchronous filesystem API backed by Winbows VFS. */
declare namespace fs {
  type PathLike = string;
  type Encoding = string | null;
  class Stats {
    readonly type: 'file' | 'dir'; readonly size: number;
    readonly atimeMs: number; readonly mtimeMs: number; readonly ctimeMs: number; readonly birthtimeMs: number;
    readonly atime: Date; readonly mtime: Date; readonly ctime: Date; readonly birthtime: Date;
    isFile(): boolean; isDirectory(): boolean; isBlockDevice(): boolean; isCharacterDevice(): boolean;
    isSymbolicLink(): boolean; isFIFO(): boolean; isSocket(): boolean;
  }
  class Dirent {
    readonly name: string;
    isFile(): boolean; isDirectory(): boolean; isBlockDevice(): boolean; isCharacterDevice(): boolean;
    isSymbolicLink(): boolean; isFIFO(): boolean; isSocket(): boolean;
  }
  class FileHandle {
    readonly path: string; close(): Promise<void>; stat(): Promise<Stats>;
    readFile(options?: Encoding | { encoding?: Encoding }): Promise<string | Uint8Array>;
    writeFile(data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }): Promise<void>;
    appendFile(data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }): Promise<void>;
  }
  type VolumeInfo = {
    id: string; mountPath: string; label: string; storeName: string;
    persistent: boolean; writable: boolean; capacity?: { used: number; total?: number };
  };
  const constants: { readonly F_OK: 0; readonly R_OK: 4; readonly W_OK: 2; readonly X_OK: 1; readonly COPYFILE_EXCL: 1 };
  function access(path: PathLike, mode?: number): Promise<void>;
  function appendFile(path: PathLike, data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }): Promise<void>;
  function copyFile(source: PathLike, destination: PathLike, flags?: number): Promise<void>;
  function cp(source: PathLike, destination: PathLike, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  function exists(path: PathLike): Promise<boolean>;
  function lstat(path: PathLike): Promise<Stats>;
  function mkdir(path: PathLike, options?: { recursive?: boolean }): Promise<string | undefined>;
  function mkdtemp(prefix: string): Promise<string>;
  function open(path: PathLike, flags?: string): Promise<FileHandle>;
  function readFile(path: PathLike, options: string | { encoding: string }): Promise<string>;
  function readFile(path: PathLike, options?: null | { encoding?: null }): Promise<Uint8Array>;
  function downloadFile(path: PathLike, options: string | { encoding: string }): Promise<string>;
  function downloadFile(path: PathLike, options?: null | { encoding?: null }): Promise<Uint8Array>;
  function readdir(path: PathLike, options?: { recursive?: boolean }): Promise<string[]>;
  function readdir(path: PathLike, options: { withFileTypes: true; recursive?: boolean }): Promise<Dirent[]>;
  function realpath(path: PathLike): Promise<string>;
  function rename(source: PathLike, destination: PathLike): Promise<void>;
  function rm(path: PathLike, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  function rmdir(path: PathLike, options?: { recursive?: boolean }): Promise<void>;
  function stat(path: PathLike): Promise<Stats>;
  function unlink(path: PathLike): Promise<void>;
  function writeFile(path: PathLike, data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }): Promise<void>;
  function watch(path: PathLike, listener?: (event: 'rename' | 'change', filename: string) => void): { close(): void };
  /** Browser-specific file URL support retained for system renderers. */
  function getFileURL(path: PathLike, type?: string): Promise<string>;
  function enumerateVolumes(): Promise<VolumeInfo[]>;
  namespace promises {
    const access: typeof fs.access; const appendFile: typeof fs.appendFile; const copyFile: typeof fs.copyFile;
    const cp: typeof fs.cp; const mkdir: typeof fs.mkdir; const mkdtemp: typeof fs.mkdtemp; const open: typeof fs.open;
    const downloadFile: typeof fs.downloadFile; const readFile: typeof fs.readFile; const readdir: typeof fs.readdir; const realpath: typeof fs.realpath;
    const rename: typeof fs.rename; const rm: typeof fs.rm; const rmdir: typeof fs.rmdir; const stat: typeof fs.stat;
    const unlink: typeof fs.unlink; const writeFile: typeof fs.writeFile;
  }
}

declare namespace IPC {
    const runtimeID: string;
    function listen(pipeName: string): PipeServer;
    function connect(pipeName: string): PipeClient;
    function close(): void;
}
/** Node.js-compatible path utilities using Winbows C:/ public paths. */
declare namespace path {
  const sep: '/';
  const delimiter: ';';
  function normalize(value: string): string;
  function join(...values: string[]): string;
  function resolve(...values: string[]): string;
  function isAbsolute(value: string): boolean;
  function dirname(value: string): string;
  function basename(value: string, suffix?: string): string;
  function extname(value: string): string;
  function relative(from: string, to: string): string;
  function parse(value: string): { root: string; dir: string; base: string; ext: string; name: string };
  function format(value: { dir?: string; root?: string; base?: string; name?: string; ext?: string }): string;
  function toNamespacedPath(value: string): string;
  const posix: typeof path;
  const win32: typeof path;
}

declare const process: Process;

interface appData {
    basePath: string;
    entryScript: string;
    icon: string;
}

declare namespace appRegistry {
    function install(): void;
    function uninstall(): void;
    function update(): void;

    function getIcon(path: string): string;
    function getApp(path: string): {
        basePath: string;
        entryScript: string;
        icon: string;
        name: string;
    } | {};
    function exists(name: string): boolean;
    function getInfoByName(name: string): appData | {};
    function getInfoByPath(path: string): appData | {};
    function getInfoByAppId(appId: string): appData | {};
}
/**
 * Represents a shell instance in WRT
 */
declare class ShellInstance extends EventEmitter {
    constructor(process: Process);

    /**
     * Disk (e.g. C:/, D:/, etc.)
     */
    root: string;

    /**
     * Current working directory ( without disk letter, e.g. /User/Documents/ )
     */
    pwd: string;
    env: { [key: string]: string; };
    stdin: stdio.InputStream;
    stdout: stdio.OutputStream;
    stderr: stdio.OutputStream;
    active: boolean;
    id: string;

    write(data: string): void;
    execCommand(command: string): Promise<any>
    getPwd(): string;
    setEnv(key: string, value: string): void;
    unsetEnv(key: string): void;
    getEnv(key: string): string | undefined;
    getAllEnv(): { [key: string]: string; };
    dispose(code?: number): void;
}

interface CommandConfig {
    description: string;
    usage: string;
    options: { [key: string]: string };
    category: string;
    handler: (
        param0: {
            args: string[],
            flags: { [key: string]: string | number | boolean }
        },
        shell: ShellInstance
    ) => void;
}

declare namespace System {
    namespace commandRegistry {
        function register(commandName: string, config: CommandConfig): void;
        function deregister(commandName: string): void;
        function addCategory(categoryName: string, config: {
            title: string
        }): void;
        function list(): string[];
        function get(commandName: string): CommandConfig | null;
        function has(commandName: string): boolean;
    }

    namespace fileIcons {
        function getIcon(extension: string): string;
        function register(extension: string, iconPath: string): void;
    }

    namespace fileViewers {
        function isRegistered(viewerName: string): boolean;
        function updateViewer(viewerName: string, prop: string, value: any): void;
        function registerViewer(viewerName: string, title: string, viewerScriptPath: string, supportedExtensions: string[]): void;
        function deregisterViewer(viewerName: string): void;
        function setDefaultViewer(extension: string, viewerName: string): void;
        function unsetDefaultViewer(extension: string, viewerName: string): void;
        function getDefaultViewer(extension: string): string | null;
        function getViewers(extension: string): string[];
    }

    namespace information {
        const buildId: string;
        const localBuildId: string;
        const version: string;
        const mode: 'development' | 'production';
    }

    namespace rom {
        function list(): string[];
        function exists(fileName: string): boolean;
        function write(fileName: string, data: string): void;
        function read(fileName: string): string;
        function rm(fileName: string): void;
    }

    const shell: ShellInstance;

    namespace theme {
        function set(themeName: string): void;
        function get(): string;
        function onChange(listener: (newTheme: string) => void): void;
    }
}

// System APIs, but global APIs: appRegistry, ShellInstance, WinUI, tasklist, WApplication
// System: commandRegistry, fileIcons, fileViewers, information, rom, shell, theme

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


/* WRT global types */


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

