import { FS } from './core/vfs';
import { enumerateVolumes, type VolumeInfo } from './systemVFS';

type PathLike = string;
type Encoding = string | null | undefined;
type Callback<T> = (error: Error | null, value?: T) => void;

const textEncoder = new TextEncoder();
const nodeFSViews = new WeakMap<NodeFS, FS>();

function asError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function callbackify<T>(operation: () => Promise<T>, callback?: Callback<T>): Promise<T> | void {
    if (typeof callback !== 'function') return operation();
    operation().then(value => callback(null, value), error => callback(asError(error)));
}

function wantsText(options?: Encoding | { encoding?: Encoding } | null) {
    const encoding = typeof options === 'object' ? options?.encoding : options;
    return encoding !== null && encoding !== undefined && encoding !== 'buffer';
}

function decode(bytes: Uint8Array, options?: Encoding | { encoding?: Encoding } | null): string | Uint8Array {
    if (!wantsText(options)) return bytes;
    const encoding = (typeof options === 'object' ? options?.encoding : options) || 'utf-8';
    return new TextDecoder(encoding === 'utf8' ? 'utf-8' : encoding).decode(bytes);
}

function encode(data: string | Uint8Array | ArrayBuffer | Blob, encoding: Encoding = 'utf-8'): Promise<Uint8Array> {
    if (typeof data === 'string') return Promise.resolve(textEncoder.encode(data));
    if (data instanceof Uint8Array) return Promise.resolve(data);
    if (data instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(data));
    if (data instanceof Blob) return data.arrayBuffer().then(buffer => new Uint8Array(buffer));
    return Promise.reject(new TypeError(`Unsupported file data: ${Object.prototype.toString.call(data)}`));
}

export class Stats {
    readonly type: 'file' | 'dir';
    readonly size: number;
    readonly atimeMs: number;
    readonly mtimeMs: number;
    readonly ctimeMs: number;
    readonly birthtimeMs: number;
    readonly atime: Date;
    readonly mtime: Date;
    readonly ctime: Date;
    readonly birthtime: Date;
    readonly mode = 0o666;
    readonly nlink: number;

    constructor(private readonly entry: any) {
        this.type = entry.type;
        this.size = entry.size ?? 0;
        this.atimeMs = entry.atime ?? 0;
        this.mtimeMs = entry.mtime ?? 0;
        this.ctimeMs = entry.ctime ?? 0;
        this.birthtimeMs = entry.btime ?? 0;
        this.atime = new Date(this.atimeMs);
        this.mtime = new Date(this.mtimeMs);
        this.ctime = new Date(this.ctimeMs);
        this.birthtime = new Date(this.birthtimeMs);
        this.nlink = entry.links ?? 1;
    }
    isFile() { return this.entry.type === 'file'; }
    isDirectory() { return this.entry.type === 'dir'; }
    isBlockDevice() { return false; }
    isCharacterDevice() { return false; }
    isSymbolicLink() { return false; }
    isFIFO() { return false; }
    isSocket() { return false; }
}

export class Dirent {
    constructor(public readonly name: string, private readonly stat: Stats) { }
    isFile() { return this.stat.isFile(); }
    isDirectory() { return this.stat.isDirectory(); }
    isBlockDevice() { return false; }
    isCharacterDevice() { return false; }
    isSymbolicLink() { return false; }
    isFIFO() { return false; }
    isSocket() { return false; }
}

/** Node.js-style asynchronous fs API backed by a process-scoped VFS view. */
export class NodeFS {
    readonly constants = Object.freeze({ F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1, COPYFILE_EXCL: 1, COPYFILE_FICLONE: 2, COPYFILE_FICLONE_FORCE: 4 });
    readonly promises: Record<string, Function>;

    private readonly view: FS;

    constructor(view: FS) {
        this.view = view;
        nodeFSViews.set(this, view);
        this.promises = Object.freeze({
            access: this.access.bind(this), appendFile: this.appendFile.bind(this), copyFile: this.copyFile.bind(this),
            cp: this.cp.bind(this), mkdir: this.mkdir.bind(this), mkdtemp: this.mkdtemp.bind(this), open: this.open.bind(this),
            downloadFile: this.downloadFile.bind(this), readFile: this.readFile.bind(this), readdir: this.readdir.bind(this), realpath: this.realpath.bind(this),
            rename: this.rename.bind(this), rm: this.rm.bind(this), rmdir: this.rmdir.bind(this), stat: this.stat.bind(this),
            unlink: this.unlink.bind(this), writeFile: this.writeFile.bind(this)
        });
    }

    enumerateVolumes(): Promise<VolumeInfo[]> { return enumerateVolumes(); }

    access(path: PathLike, _mode?: number, callback?: Callback<void>) {
        if (typeof _mode === 'function') callback = _mode as any;
        return callbackify(async () => { if (!await this.view.exists(path)) throw Object.assign(new Error(`ENOENT: no such file or directory, access '${path}'`), { code: 'ENOENT' }); }, callback);
    }
    exists(path: PathLike, callback?: (exists: boolean) => void): Promise<boolean> | void {
        const operation = () => this.view.exists(path);
        if (typeof callback !== 'function') return operation();
        operation().then(callback, () => callback(false));
    }
    readFile(path: PathLike, options?: Encoding | { encoding?: Encoding } | Callback<string | Uint8Array> | null, callback?: Callback<string | Uint8Array>) {
        if (typeof options === 'function') { callback = options; options = undefined; }
        return callbackify(async () => decode(await this.view.read(path), options as any), callback);
    }
    /**
     * Compatibility alias for system tools that explicitly request a download.
     * Development read-through is owned by the storage layer, so this has the
     * same arguments and result as readFile without creating a second path.
     */
    downloadFile(path: PathLike, options?: Encoding | { encoding?: Encoding } | Callback<string | Uint8Array> | null, callback?: Callback<string | Uint8Array>) {
        return this.readFile(path, options as any, callback);
    }
    writeFile(path: PathLike, data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding } | Callback<void>, callback?: Callback<void>) {
        if (typeof options === 'function') { callback = options; options = undefined; }
        return callbackify(async () => this.view.write(path, await encode(data, typeof options === 'object' ? options?.encoding : options)), callback);
    }
    write(path: PathLike, data: Uint8Array) { return this.view.write(path, data); }
    appendFile(path: PathLike, data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding } | Callback<void>, callback?: Callback<void>) {
        if (typeof options === 'function') { callback = options; options = undefined; }
        return callbackify(async () => {
            const addition = await encode(data, typeof options === 'object' ? options?.encoding : options);
            const original = await this.view.read(path).catch(() => new Uint8Array());
            const combined = new Uint8Array(original.length + addition.length);
            combined.set(original); combined.set(addition, original.length);
            await this.view.write(path, combined);
        }, callback);
    }
    stat(path: PathLike, callback?: Callback<Stats>) { return callbackify(async () => new Stats(await this.view.stats(path)), callback); }
    lstat(path: PathLike, callback?: Callback<Stats>) { return this.stat(path, callback); }
    readdir(path: PathLike, options?: { withFileTypes?: boolean; recursive?: boolean } | Callback<string[] | Dirent[]>, callback?: Callback<string[] | Dirent[]>) {
        if (typeof options === 'function') { callback = options; options = {}; }
        return callbackify(async () => {
            const entries: string[] = [];
            const collect = async (directory: string, relative = ''): Promise<void> => {
                for (const name of await this.view.readdir(directory)) {
                    const entry = relative ? `${relative}/${name}` : name;
                    entries.push(entry);
                    if ((options as any)?.recursive) {
                        const fullPath = this.view.resolvePath(name, directory);
                        if ((await this.view.stats(fullPath)).type === 'dir') await collect(fullPath, entry);
                    }
                }
            };

            await collect(this.view.resolvePath(path));
            if (!(options as any)?.withFileTypes) return entries;
            return Promise.all(entries.map(async entry => new Dirent(entry, new Stats(await this.view.stats(this.view.resolvePath(entry, path))))));
        }, callback);
    }
    mkdir(path: PathLike, options?: { recursive?: boolean } | Callback<string | undefined>, callback?: Callback<string | undefined>) {
        if (typeof options === 'function') { callback = options; options = {}; }
        return callbackify(async () => {
            if ((options as any)?.recursive) await this.view.ensureDirectory(path);
            else await this.view.mkdir(path);
            return (options as any)?.recursive ? this.view.resolvePath(path) : undefined;
        }, callback);
    }
    async mkdtemp(prefix: string) {
        const path = `${prefix}${crypto.randomUUID().replaceAll('-', '').slice(0, 6)}`;
        await this.view.mkdir(path);
        return this.view.resolvePath(path);
    }
    unlink(path: PathLike, callback?: Callback<void>) { return callbackify(() => this.view.delete(path), callback); }
    rmdir(path: PathLike, options?: { recursive?: boolean } | Callback<void>, callback?: Callback<void>) {
        if (typeof options === 'function') { callback = options; options = {}; }
        return callbackify(() => this.view.rmdir(path, options as any), callback);
    }
    rm(path: PathLike, options?: { recursive?: boolean; force?: boolean } | Callback<void>, callback?: Callback<void>) {
        if (typeof options === 'function') { callback = options; options = {}; }
        return callbackify(async () => {
            try { const stat = await this.stat(path) as Stats; await (stat.isDirectory() ? this.view.rmdir(path, { recursive: (options as any)?.recursive }) : this.view.delete(path)); }
            catch (error) { if (!(options as any)?.force) throw error; }
        }, callback);
    }
    copyFile(source: PathLike, destination: PathLike, flags?: number | Callback<void>, callback?: Callback<void>) {
        if (typeof flags === 'function') { callback = flags; flags = 0; }
        return callbackify(async () => {
            if ((flags || 0) & this.constants.COPYFILE_EXCL && await this.view.exists(destination)) throw Object.assign(new Error(`EEXIST: file already exists, copyfile '${destination}'`), { code: 'EEXIST' });
            await this.view.write(destination, await this.view.read(source));
        }, callback);
    }
    async cp(source: PathLike, destination: PathLike, options: { recursive?: boolean; force?: boolean } = {}) {
        const stat = await this.stat(source) as Stats;
        if (stat.isFile()) return this.copyFile(source, destination);
        if (!options.recursive) throw Object.assign(new Error(`EISDIR: illegal operation on a directory, cp '${source}'`), { code: 'EISDIR' });
        await this.view.mkdir(destination, { recursive: true });
        for (const name of await this.view.readdir(source)) await this.cp(this.view.resolvePath(name, source), this.view.resolvePath(name, destination), options);
    }
    async rename(source: PathLike, destination: PathLike) { await this.cp(source, destination, { recursive: true }); await this.rm(source, { recursive: true }); }
    realpath(path: PathLike, callback?: Callback<string>) { return callbackify(async () => this.view.resolvePath(path), callback); }
    async open(path: PathLike, flags: string = 'r') { return new FileHandle(this, path, flags); }
    watch(path: PathLike, options?: any, listener?: (event: string, filename: string) => void) {
        if (typeof options === 'function') listener = options;
        const root = this.view.resolveInternal(path);
        const handler = (event: any) => { if (event.path === root || event.path.startsWith(`${root}/`)) listener?.(event.type === 'change' ? 'change' : 'rename', event.path.slice(event.path.lastIndexOf('/') + 1)); };
        const vfs = this.view.getVFS(); vfs.addEventListener('change', handler);
        return { close: () => vfs.removeEventListener('change', handler), ref() { return this; }, unref() { return this; } };
    }
    /** Browser-specific file URL support retained for system renderers. */
    getFileURL(path: PathLike, type = '') { return this.view.getFileURL(path, type); }
}

/** Internal process integration; not part of the Node-style fs API. */
export function setNodeFSCwd(fs: NodeFS, cwd: string): void {
    const view = nodeFSViews.get(fs);
    if (!view) throw new TypeError('Unknown NodeFS instance');
    view.setCwd(cwd);
}

export class FileHandle {
    private closed = false;
    constructor(private readonly fs: NodeFS, readonly path: string, readonly flags: string) { }
    private assertOpen() { if (this.closed) throw new Error('EBADF: file handle is closed'); }
    async readFile(options?: Encoding | { encoding?: Encoding } | null) { this.assertOpen(); return this.fs.readFile(this.path, options as any) as Promise<string | Uint8Array>; }
    async writeFile(data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }) { this.assertOpen(); if (!/[wa+]/.test(this.flags)) throw new Error('EBADF: file handle is not writable'); return this.fs.writeFile(this.path, data, options as any); }
    async appendFile(data: string | Uint8Array | ArrayBuffer | Blob, options?: Encoding | { encoding?: Encoding }) { this.assertOpen(); return this.fs.appendFile(this.path, data, options as any); }
    async stat() { this.assertOpen(); return this.fs.stat(this.path) as Promise<Stats>; }
    async close() { this.closed = true; }
}
