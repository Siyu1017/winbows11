import { getJsonFromURL } from "../../../shared/utils";
import { Driver, DriverState, RawData } from "../drivers/driver";
import { DirTable, GenericInode, IError, InodeType } from "./types";
import { formatVolumePath, resolveVolumePath } from "../volume";

/** Mirrors the legacy runtime's `window.modes.dev` URL flags. */
function isDevelopmentModeFromURL(): boolean {
    if (typeof location === 'undefined') return false;
    const params = getJsonFromURL();
    return !!(params['dev'] || params['develop'] || params['embed']) || (window as any).needsUpdate || (window as any).modes?.dev == true;
}

function normalizePath(path: string): string[] {
    if (typeof path !== 'string' || !path.startsWith("/")) {
        throw new Error("Only absolute paths supported");
    }
    const normalized: string[] = [];
    for (const part of path.replaceAll('\\', '/').split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') {
            normalized.pop();
            continue;
        }
        normalized.push(part);
    }
    return normalized;
}

function encodeJSON(obj: any): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(obj));
}

function decodeJSON(data: Uint8Array): any {
    return JSON.parse(new TextDecoder().decode(data));
}

function encodeUint64(n: number): Uint8Array {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setBigUint64(0, BigInt(n), true);
    return new Uint8Array(buf);
}

function decodeUint64(arr: Uint8Array): number {
    return Number(new DataView(arr.buffer).getBigUint64(0, true));
}

async function normalizeData(data: unknown): Promise<RawData> {
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
    throw new Error(`Invalid data type: ${typeof data}`);
}

function createInode(
    id: number,
    type: InodeType,
    now: number = Date.now()
): GenericInode {
    const inode: any = {
        id,
        type,
        atime: now,
        mtime: now,
        ctime: now,
        btime: now,
        links: 0
    }

    if (type === 'dir') {
        inode.entries = new Map();
    } else if (type === 'file') {
        inode.size = 0;
        inode.blocks = [];
    } else {
        throw new Error(`Invalid inode type: ${type}`);
    }

    return inode;
}

const ErrorCodes = {
    PATH_NOT_FOUND: "ENOENT",
    ALREADY_EXISTS: "EEXIST",
    NOT_A_DIRECTORY: "ENOTDIR",
    IS_A_DIRECTORY: "EISDIR",
    DIRECTORY_NOT_EMPTY: "ENOTEMPTY",
    INVALID_ARGUMENT: "EINVAL",
    PERMISSION_DENIED: "EPERM",
    ACCESS_DENIED: "EACCES",
    NAME_TOO_LONG: "ENAMETOOLONG",
    SYMLINK_LOOP: "ELOOP",
    ROOT_OPERATION: "EROOT",
    FILE_TABLE_FULL: "ENFILE",
    TOO_MANY_OPEN_FILES: "EMFILE",
    IO_ERROR: "EIO",
    NO_SPACE_LEFT: "ENOSPC",
    READ_ONLY_FS: "EROFS",
    RESOURCE_BUSY: "EBUSY",
    TEXT_FILE_BUSY: "ETXTBSY",
    UNLINK_DIR: "EISDIR",
    RMDIR_NONEMPTY: "ENOTEMPTY",
    RMDIR_NOTDIR: "ENOTDIR"
};


const ROOT_INODE_ID = 2;
const IDENTIFIER: {
    signature: string;
    version: number;
    rootInodeId: number;
} = {
    signature: "__WINBOWS_FS__",
    version: 1,
    rootInodeId: ROOT_INODE_ID
};

class VFSError extends Error {
    code: string;
    syscall: string;
    path?: string;

    constructor(code: string, syscall: string, path?: string, message?: string) {
        super(`${code}${message ? `: ${message}` : ''}, ${syscall} ${path ? `\'${path}\'` : ''}`);
        this.name = 'Error';
        this.code = code;
        this.syscall = syscall;
        this.path = path;
    }
}

/** A broken inode/table is structural corruption, not a normal fs error. */
export class VFSCorruptionError extends Error {
    readonly code = 'EVFSCORRUPT';
    constructor(message: string, readonly cause?: unknown) {
        super(message);
        this.name = 'VFSCorruptionError';
        this.message = message;
    }
}

function throwVFSError(code: string, syscall: string, path?: string, message?: string): never {
    const err = new VFSError(code, syscall, path, message);
    // logger.error(err);
    throw err;
}

export class VFS {
    private driver: Driver;
    private rootInodeId: number = ROOT_INODE_ID;
    initialized: boolean = false;
    options: {
        noatime?: boolean;
        readonly?: boolean;
        cacheFileURLs?: boolean;
        developmentReadThrough?: boolean;
    } = {
            noatime: false,
            readonly: false,
            cacheFileURLs: !isDevelopmentModeFromURL(),
            developmentReadThrough: isDevelopmentModeFromURL()
        }
    private listeners = new Map<string, Set<(event: any) => void>>();
    private fileURLCache = new Map<string, string>();
    private mutationQueue: Promise<void> = Promise.resolve();

    constructor(driver: Driver) {
        if (driver.state !== DriverState.Operational) throw new Error("Driver is not operational");
        this.driver = driver;
    }

    private raiseCorruption(message: string, cause?: unknown): never {
        const error = new VFSCorruptionError(message, cause);
        this.emit('fatal', error);
        throw error;
    }

    private async loadInode(id: number): Promise<GenericInode> {
        const raw = await this.driver.read(`inode:${id}`);
        if (!raw) return this.raiseCorruption(`Filesystem corruption: inode '${id}' is missing.`);
        try {
            const inode = decodeJSON(raw) as GenericInode;
            if (!inode || inode.id !== id || (inode.type !== 'file' && inode.type !== 'dir')) {
                return this.raiseCorruption(`Filesystem corruption: inode '${id}' is invalid.`);
            }
            return inode;
        } catch (error) {
            if (error instanceof VFSCorruptionError) throw error;
            return this.raiseCorruption(`Filesystem corruption: inode '${id}' cannot be decoded.`, error);
        }
    }

    private async hasInode(id: number): Promise<boolean> {
        return await this.driver.exists(`inode:${id}`);
    }

    private async saveInode(inode: GenericInode) {
        const raw = encodeJSON(inode);
        await this.driver.write(`inode:${inode.id}`, raw);
    }

    private async loadDirTable(inodeId: number): Promise<DirTable> {
        const raw = await this.driver.read(`dir:${inodeId}`);
        if (!raw) return this.raiseCorruption(`Filesystem corruption: directory table for inode '${inodeId}' is missing.`);
        try {
            const table = decodeJSON(raw);
            if (!table || typeof table !== 'object' || Array.isArray(table)) {
                return this.raiseCorruption(`Filesystem corruption: directory table for inode '${inodeId}' is invalid.`);
            }
            return table as DirTable;
        } catch (error) {
            if (error instanceof VFSCorruptionError) throw error;
            return this.raiseCorruption(`Filesystem corruption: directory table for inode '${inodeId}' cannot be decoded.`, error);
        }
    }

    private async saveDirTable(inodeId: number, table: DirTable) {
        const raw = encodeJSON(table);
        await this.driver.write(`dir:${inodeId}`, raw);
    }

    private async loadMeta(key: string): Promise<any> {
        return await this.driver.read(`meta:${key}`);
    }

    private async saveMeta(key: string, data: any) {
        await this.driver.write(`meta:${key}`, data);
    }

    /** Metadata updates are read-modify-write operations and must not race. */
    private serializeMutation<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.mutationQueue.then(operation, operation);
        this.mutationQueue = result.then(() => undefined, () => undefined);
        return result;
    }

    /** Removes links left behind by pre-lock VFS races without touching valid files. */
    private async repairDanglingDirectoryEntries(inodeId: number, visited = new Set<number>()): Promise<void> {
        if (visited.has(inodeId)) return;
        visited.add(inodeId);
        const table = await this.loadDirTable(inodeId);
        let changed = false;
        for (const [name, childId] of Object.entries(table)) {
            if (!await this.hasInode(childId)) {
                delete table[name];
                changed = true;
                continue;
            }
            const child = await this.loadInode(childId);
            if (child.type === 'dir') {
                if (!await this.driver.exists(`dir:${childId}`)) {
                    this.raiseCorruption(`Filesystem corruption: directory table for inode '${childId}' is missing.`);
                } else {
                    await this.repairDanglingDirectoryEntries(childId, visited);
                }
            }
        }
        if (changed) await this.saveDirTable(inodeId, table);
    }

    private async format() {
        // clear driver storage
        await this.driver.clear();

        // identifier
        await this.driver.write(IDENTIFIER.signature, encodeJSON(IDENTIFIER));

        // root inode
        const rootInodeId: GenericInode = createInode(ROOT_INODE_ID, "dir", Date.now());
        await this.driver.write(`inode:${ROOT_INODE_ID}`, encodeJSON(rootInodeId));

        // root dir table
        const rootDir: DirTable = {};
        await this.driver.write(`dir:${ROOT_INODE_ID}`, encodeJSON(rootDir));

        // meta data
        await this.saveMeta('nextInodeId', encodeUint64(ROOT_INODE_ID + 1));
    }

    private assertWritable(syscall: string, path?: string) {
        if (this.options.readonly || !this.driver.capabilities.writable) {
            throwVFSError(ErrorCodes.READ_ONLY_FS, syscall, path);
        }
    }

    private emit(type: string, path: any) {
        const event = { type, path };
        for (const listener of this.listeners.get(type) ?? []) listener(event);
        for (const listener of this.listeners.get('change') ?? []) listener(event);
    }

    private invalidateFileURLs(path: string, recursive = false) {
        const normalized = '/' + normalizePath(path).join('/');
        const prefix = normalized === '/' ? '/' : `${normalized}/`;
        for (const [cachedPath, url] of this.fileURLCache) {
            if (cachedPath === normalized || (recursive && cachedPath.startsWith(prefix))) {
                URL.revokeObjectURL(url);
                this.fileURLCache.delete(cachedPath);
            }
        }
    }

    /** Development reads are always server-first; local data is a fallback. */
    private async readDevelopmentSource(path: string): Promise<Uint8Array | null> {
        if (!this.options.developmentReadThrough || typeof fetch === 'undefined') return null;
        if (path === '/') return null;

        if (path.startsWith('/User/Desktop')) {
            return null;
        }

        try {
            const response = await fetch(`./${path.slice(1)}`, { cache: 'no-store' });
            if (!response.ok) return null;
            const bytes = new Uint8Array(await response.arrayBuffer());
            // Match the old downloadFile contract: a successful development
            // fetch becomes a real VFS file, including every missing parent.
            const parent = path.slice(0, path.lastIndexOf('/')) || '/';
            await this.ensureDirectory(parent);
            await this.write(path, bytes);
            return bytes;
        } catch {
            return null;
        }
    }

    private async walkPath(parts: string[]): Promise<{
        inodeId: number;
        nodes: number[];
    } | IError> {
        let currentId = this.rootInodeId;
        const nodes: number[] = [currentId];

        if (parts.length === 0) {
            return { inodeId: currentId, nodes };
        }

        for (const part of parts) {
            const dir = await this.loadDirTable(currentId);
            const nextId = dir[part];
            if (!nextId) {
                return { code: ErrorCodes.PATH_NOT_FOUND };
            }
            const inode = await this.loadInode(Number(nextId));
            if (inode.type !== "dir") {
                return { code: ErrorCodes.NOT_A_DIRECTORY };
            }

            currentId = Number(nextId);
            nodes.push(currentId);
        }

        return { inodeId: currentId, nodes };
    }

    private async resolveParent(path: string, operation: string): Promise<{
        parentId: number | null;
        name: string | null;
        nodes: number[];
    }> {
        const parts = normalizePath(path);
        if (parts.length === 0) {
            return {
                parentId: null,
                name: null,
                nodes: []
            };
        }

        const parentParts = parts.slice(0, -1);
        const name = parts[parts.length - 1];
        let inodeId, nodes;

        if (parentParts.length === 0) {
            inodeId = this.rootInodeId;
            nodes = [this.rootInodeId];
        } else {
            const result = await this.walkPath(parentParts);
            if ('code' in result) {
                throwVFSError(result.code, operation, path);
            }
            inodeId = result.inodeId;
            nodes = result.nodes;
        }

        return {
            parentId: inodeId,
            name,
            nodes
        };
    }

    private async resolveExisting(path: string, operation: string): Promise<{
        parentId: number | null;
        inodeId: number;
        name: string | null;
        nodes: number[];
    }> {
        const parts = normalizePath(path);

        if (parts.length === 0) {
            return {
                inodeId: ROOT_INODE_ID,
                parentId: null,
                name: null,
                nodes: []
            };
        }

        const parentParts = parts.slice(0, -1);
        const name = parts[parts.length - 1];

        const parent = await this.walkPath(parentParts);
        if ('code' in parent) {
            throwVFSError(parent.code, operation, path);
        }
        const parentInode = await this.loadInode(parent.inodeId);

        if (parentInode.type !== "dir") {
            throwVFSError(ErrorCodes.NOT_A_DIRECTORY, operation, path);
        }

        const dir = await this.loadDirTable(parent.inodeId);
        const inodeId = dir[name];
        if (inodeId === undefined) {
            throwVFSError(ErrorCodes.PATH_NOT_FOUND, operation, path);
        }

        return {
            inodeId,
            parentId: parent.inodeId,
            name,
            nodes: parent.nodes.concat([inodeId])
        };
    }

    private async allocateInode(type: "file" | "dir"): Promise<GenericInode> {
        const metadata = await this.loadMeta('nextInodeId');
        if (!metadata)
            throwVFSError(ErrorCodes.IO_ERROR, 'allocateInode', undefined, 'Failed to load nextInodeId metadata');

        const id = decodeUint64(metadata);
        if (await this.hasInode(id))
            throwVFSError(ErrorCodes.IO_ERROR, 'allocateInode', undefined, `Inode ID collision: ${id}`);

        await this.saveMeta('nextInodeId', encodeUint64(id + 1));

        const now = Date.now();
        const inode = createInode(id, type, now);
        await this.saveInode(inode);

        if (type === "dir") {
            const dirTable: DirTable = {};
            await this.saveDirTable(id, dirTable);
        }

        return inode;
    }

    private validatePath(path: string, operation: string) {
        const parts = normalizePath(path);
        // TODO: validate path ( length, invalid chars, etc. )
    }

    private writeData(path: string, data: Uint8Array) {

    }

    private deleteData(path: string) {

    }

    private readData(path: string) {

    }

    async init() {
        if (this.initialized) return;

        if (!await this.driver.exists(IDENTIFIER.signature)) {
            console.warn("No file system identifier found");
            await this.format();
        } else {
            const bytes = await this.driver.read(IDENTIFIER.signature);
            if (!bytes) {
                throw new Error("Failed to read filesystem identifier");
            }

            const identifier = JSON.parse(new TextDecoder().decode(bytes));
            if (identifier.signature !== IDENTIFIER.signature) {
                throw new Error("Invalid or unsupported file system");
            }
            if (identifier.rootInodeId !== ROOT_INODE_ID) {
                throw new Error(`Unexpected root inode id: ${identifier.rootInodeId}`);
            }

            // Always use root inode id from identifier
            const rootExists = await this.driver.exists(`inode:${identifier.rootInodeId}`);
            if (!rootExists) {
                throw new Error("Corrupted FS: root inode missing");
            }

            this.rootInodeId = identifier.rootInodeId;
        }

        await this.repairDanglingDirectoryEntries(this.rootInodeId);
        this.initialized = true;
    }

    /**
     * Resolves a path to an absolute path given a current working directory.
     * This method handles relative paths, ".." navigation, and "." references.
     * @param path The path to resolve (can be relative or absolute)
     * @param cwd The current working directory (must be absolute)
     * @returns The resolved absolute path
     */
    resolvePath(path: string, cwd: string = "/"): string {
        // Handle relative path
        let fullPath: string;
        if (path.startsWith('/')) {
            fullPath = path;
        } else if (cwd === "/") {
            fullPath = "/" + path;
        } else {
            fullPath = cwd + "/" + path;
        }

        // Split and normalize
        const parts = fullPath.split("/").filter(p => p !== "");
        const normalized: string[] = [];

        for (const part of parts) {
            if (part === ".") {
                // Current directory, skip
                continue;
            } else if (part === "..") {
                // Parent directory
                if (normalized.length > 0) {
                    normalized.pop();
                }
                // If we're at root and try to go up, stay at root
            } else {
                normalized.push(part);
            }
        }

        return "/" + normalized.join("/");
    }

    /**
     * If the target item does not exist, it will be created.
     * Otherwise, the target item must be a file, and its contents will be overwritten.
     * accept_types="file"
     * update_inode=[m,c]
     */
    async write(path: string, data: Uint8Array) {
        return this.serializeMutation(() => this.writeUnlocked(path, data));
    }

    private async writeUnlocked(path: string, data: Uint8Array) {
        this.assertWritable('write', path);
        data = await normalizeData(data);
        path = '/' + normalizePath(path).join("/");

        const { parentId, name } = await this.resolveParent(path, 'write');
        if (!parentId || !name)
            throwVFSError(ErrorCodes.ALREADY_EXISTS, 'write', path);

        const dir = await this.loadDirTable(parentId);
        let inodeId: number = dir[name];
        let inode;
        const inodeExists = !!inodeId;

        if (!inodeId) {
            // The target inode does not exist, create it!
            inode = await this.allocateInode("file");
            inodeId = inode.id;
            await this.link(parentId, name, inodeId);
        } else {
            // Load metadata from existing inode
            inode = await this.loadInode(inodeId);
            if (inode.type !== "file") {
                throwVFSError(ErrorCodes.IS_A_DIRECTORY, 'write', path);
            }
        }
        await this.driver.write(`data:${inodeId}`, data);

        if (inodeExists) {
            // Update inode
            inode.mtime = Date.now();
            inode.ctime = inode.mtime;
        }

        inode.size = data.length;
        await this.saveInode(inode);
        this.invalidateFileURLs(path);
        this.emit(inodeExists ? 'change' : 'create', path);
    }

    /**
     * update_inode=[a]
     */
    async read(path: string): Promise<Uint8Array> {
        path = '/' + normalizePath(path).join("/");

        const developmentSource = await this.readDevelopmentSource(path);
        if (developmentSource) return developmentSource.slice();

        const { inodeId } = await this.resolveExisting(path, 'read');
        const inode = await this.loadInode(inodeId);
        if (inode.type === "dir") throwVFSError(ErrorCodes.IS_A_DIRECTORY, 'read', path);
        const data = await this.driver.read(`data:${inodeId}`);
        if (!data) throwVFSError(ErrorCodes.PATH_NOT_FOUND, 'read', path);
        if (!this.options.noatime) {
            inode.atime = Date.now();
            await this.saveInode(inode);
        }
        return data.slice();
    }

    async readBlob(path: string, type = ''): Promise<Blob> {
        const data = await this.read(path);
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        return new Blob([copy], { type });
    }

    async readText(path: string): Promise<string> {
        return new TextDecoder().decode(await this.read(path));
    }

    async writeBlob(path: string, data: Blob | ArrayBuffer | Uint8Array | string) {
        const bytes = await normalizeData(data);
        return this.write(path, bytes);
    }

    async getFileURL(path: string, type = ''): Promise<string> {
        const normalized = '/' + normalizePath(path).join('/');
        if (this.options.cacheFileURLs) {
            const cached = this.fileURLCache.get(normalized);
            if (cached) return cached;
        }
        const url = URL.createObjectURL(await this.readBlob(normalized, type));
        if (this.options.cacheFileURLs) this.fileURLCache.set(normalized, url);
        return url;
    }

    /** Explicitly revoke cached Blob URLs; useful during shutdown or remount. */
    clearFileURLCache() {
        for (const url of this.fileURLCache.values()) URL.revokeObjectURL(url);
        this.fileURLCache.clear();
    }

    async ensureDirectory(path: string) {
        path = '/' + normalizePath(path).join('/');
        let current = '';
        for (const name of normalizePath(path)) {
            current += `/${name}`;
            try {
                await this.mkdir(current);
            } catch (error) {
                if (!(error instanceof VFSError) || error.code !== ErrorCodes.ALREADY_EXISTS) throw error;
                if ((await this.stats(current)).type !== 'dir') throwVFSError(ErrorCodes.NOT_A_DIRECTORY, 'mkdir', current);
            }
        }
    }

    /**
     * update_inode=[]
     */
    async delete(path: string) {
        return this.serializeMutation(() => this.deleteUnlocked(path));
    }

    private async deleteUnlocked(path: string) {
        this.assertWritable('unlink', path);
        path = '/' + normalizePath(path).join("/");

        const { parentId, inodeId, name } = await this.resolveExisting(path, 'delete');
        if (!parentId || !name) throwVFSError(ErrorCodes.ACCESS_DENIED, 'delete', path);
        const inode = await this.loadInode(inodeId);
        if (inode.type === "dir") throwVFSError(ErrorCodes.IS_A_DIRECTORY, 'delete', path);
        await this.unlink(parentId, name);
        await this.driver.delete(`data:${inodeId}`);
        await this.driver.delete(`inode:${inodeId}`);
        this.invalidateFileURLs(path);
        this.emit('delete', path);
    }

    async link(parentInodeId: number, name: string, targetInodeId: number) {
        this.assertWritable('link', name);
        const parentDir = await this.loadDirTable(parentInodeId);
        const parentInode = await this.loadInode(parentInodeId);
        if (parentInode.type !== "dir")
            throwVFSError(ErrorCodes.NOT_A_DIRECTORY, 'internal.link', name);

        if (name in parentDir) throwVFSError(ErrorCodes.ALREADY_EXISTS, 'internal.link', name);

        // Update parent dir table
        const now = Date.now();
        parentDir[name] = targetInodeId;
        await this.saveDirTable(parentInodeId, parentDir);

        // Update parent dir inode
        parentInode.mtime = now;
        parentInode.ctime = now;
        await this.saveInode(parentInode);

        const inode = await this.loadInode(targetInodeId);
        inode.links = (inode.links || 1) + 1;
        await this.saveInode(inode);
    }

    async unlink(parentInodeId: number, name: string) {
        this.assertWritable('unlink', name);
        const parentDir = await this.loadDirTable(parentInodeId);

        const inodeId = parentDir[name];
        if (!inodeId)
            throwVFSError(ErrorCodes.PATH_NOT_FOUND, 'internal.unlink', name);

        const inode = await this.loadInode(inodeId);
        if (inode.type === "dir") {
            const dirTable = await this.loadDirTable(inodeId);
            if (Object.keys(dirTable).length > 0) {
                throwVFSError(ErrorCodes.DIRECTORY_NOT_EMPTY, 'internal.unlink', name);
            }
        }

        const parentInode = await this.loadInode(parentInodeId);

        // Update parent dir table
        const now = Date.now();
        delete parentDir[name];
        await this.saveDirTable(parentInodeId, parentDir);

        // Update parent dir inode
        parentInode.mtime = now;
        parentInode.ctime = now;
        await this.saveInode(parentInode);

        inode.links = (inode.links || 1) - 1;
        if (inode.links <= 0) {
            await this.driver.delete(`inode:${inodeId}`);
            if (inode.type === "dir") {
                await this.driver.delete(`dir:${inodeId}`);
            }
        } else {
            await this.saveInode(inode);
        }
    }

    async mkdir(path: string, options?: { recursive?: boolean }) {
        return this.serializeMutation(() => this.mkdirUnlocked(path, options));
    }

    private async mkdirUnlocked(path: string, options?: { recursive?: boolean }) {
        this.assertWritable('mkdir', path);
        path = '/' + normalizePath(path).join("/");

        const segments = normalizePath(path);
        let currentInode = await this.loadInode(this.rootInodeId);

        if (segments.length === 0) throwVFSError(ErrorCodes.ALREADY_EXISTS, 'mkdir', path);

        for (let i = 0; i < segments.length; i++) {
            const name = segments[i];
            const dir = await this.loadDirTable(currentInode.id);

            if (!dir[name]) {
                if (!options?.recursive && i !== segments.length - 1)
                    throwVFSError(ErrorCodes.PATH_NOT_FOUND, 'mkdir', path);

                const parentInode = await this.loadInode(currentInode.id);
                const inode = await this.allocateInode("dir");
                const now = Date.now();
                dir[name] = inode.id;
                await this.saveDirTable(currentInode.id, dir);

                // Update parent dir inode
                parentInode.mtime = now;
                parentInode.ctime = now;
                await this.saveInode(parentInode);

                currentInode = inode;
            } else {
                if (i === segments.length - 1)
                    throwVFSError(ErrorCodes.ALREADY_EXISTS, 'mkdir', path);

                const inode = await this.loadInode(dir[name]);
                if (inode.type !== "dir")
                    throwVFSError(ErrorCodes.NOT_A_DIRECTORY, 'mkdir', path);

                currentInode = inode;
            }
        }
        this.emit('create', path);
    }

    private async removeInodeRecursive(inodeId: number) {
        // Delete children before their parent without growing the JavaScript
        // call stack for deeply nested directory trees.  Yield periodically so
        // a large `rd /s` does not monopolize the UI event loop.
        const pending: Array<{ inodeId: number; removeDirectory?: boolean }> = [{ inodeId }];
        let removed = 0;

        while (pending.length > 0) {
            const next = pending.pop()!;
            let removedInThisStep = false;
            if (next.removeDirectory) {
                await this.driver.delete(`dir:${next.inodeId}`);
                await this.driver.delete(`inode:${next.inodeId}`);
                removed++;
                removedInThisStep = true;
            } else {
                const inode = await this.loadInode(next.inodeId);
                if (inode.type === "dir") {
                    const dir = await this.loadDirTable(next.inodeId);
                    pending.push({ inodeId: next.inodeId, removeDirectory: true });
                    for (const child of Object.values(dir)) {
                        pending.push({ inodeId: child });
                    }
                } else {
                    await this.driver.delete(`data:${next.inodeId}`);
                    await this.driver.delete(`inode:${next.inodeId}`);
                    removed++;
                    removedInThisStep = true;
                }
            }

            if (removedInThisStep && removed % 64 === 0) {
                await new Promise<void>(resolve => setTimeout(resolve, 0));
            }
        }
    }

    async rmdir(path: string, options?: { recursive?: boolean }) {
        return this.serializeMutation(() => this.rmdirUnlocked(path, options));
    }

    private async rmdirUnlocked(path: string, options?: { recursive?: boolean }) {
        this.assertWritable('rmdir', path);
        path = '/' + normalizePath(path).join("/");

        const { parentId, name, inodeId } = await this.resolveExisting(path, 'rmdir');
        if (parentId === null || name === null) throwVFSError(ErrorCodes.ACCESS_DENIED, 'rmdir', path);

        const parentInode = await this.loadInode(parentId);
        if (parentInode.type !== "dir")
            throwVFSError(ErrorCodes.NOT_A_DIRECTORY, 'rmdir', path);
        const targetInode = await this.loadInode(inodeId);
        if (targetInode.type !== 'dir') throwVFSError(ErrorCodes.RMDIR_NOTDIR, 'rmdir', path);
        const dir = await this.loadDirTable(inodeId);
        if (!options?.recursive && Object.keys(dir).length > 0)
            throwVFSError(ErrorCodes.DIRECTORY_NOT_EMPTY, 'rmdir', path);

        await this.removeInodeRecursive(inodeId);

        const parentDir = await this.loadDirTable(parentId);
        const now = Date.now();
        delete parentDir[name];
        await this.saveDirTable(parentId, parentDir);

        parentInode.mtime = now;
        parentInode.ctime = now;
        await this.saveInode(parentInode);
        this.invalidateFileURLs(path, true);
        this.emit('delete', path);
    }

    async readdir(path: string): Promise<string[]> {
        path = '/' + normalizePath(path).join("/");

        const { inodeId } = await this.resolveExisting(path, 'readdir');
        const inode = await this.loadInode(inodeId);

        if (inode.type !== "dir")
            throw { error: ErrorCodes.NOT_A_DIRECTORY, inodeId: inode.id };

        const dir = await this.loadDirTable(inode.id);
        return Object.keys(dir);
    }

    async walk(
        path: string,
        callback: (path: string, inode: GenericInode) => void
    ) {
        path = '/' + normalizePath(path).join("/");

        const { inodeId } = await this.resolveExisting(path, 'walk');
        const inode = await this.loadInode(inodeId);
        const dfs = async (inode: GenericInode, currentPath: string) => {
            callback(currentPath, inode);

            if (inode.type !== "dir") return;

            const dir = await this.loadDirTable(inode.id);
            for (const [name, childId] of Object.entries(dir)) {
                const child = await this.loadInode(childId);
                await dfs(child, '/' + normalizePath(`${currentPath}/${name}`).join("/"));
            }
        };

        await dfs(inode, path);
    }

    async exists(path: string): Promise<boolean> {
        path = '/' + normalizePath(path).join("/");

        try {
            await this.resolveExisting(path, 'exists');
            return true;
        } catch (e) {
            if (e instanceof VFSError && e.code === ErrorCodes.PATH_NOT_FOUND) {
                return false;
            }
            throw e;
        }
    }

    async stats(path: string): Promise<Partial<GenericInode>> {
        path = '/' + normalizePath(path).join("/");

        const { inodeId } = await this.resolveExisting(path, 'stats');
        const inode = await this.loadInode(inodeId);
        return {
            type: inode.type,
            size: inode.size,
            atime: inode.atime,
            mtime: inode.mtime,
            ctime: inode.ctime,
            btime: inode.btime,
            links: inode.links
        }
    }

    addEventListener(event: string, listener: (event: any) => void) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(listener);
    }

    removeEventListener(event: string, listener: (event: any) => void) {
        this.listeners.get(event)?.delete(listener);
    }
}

/**
 * A wrapper around VFS that provides relative path support.
 * Each instance maintains its own current working directory.
 */
export class FS {
    private vfs: VFS;
    private cwd: string = "/";
    private readonly volumeId: string;

    constructor(vfs: VFS, cwd: string = "/", volumeId: string) {
        this.vfs = vfs;
        this.volumeId = volumeId.toUpperCase();
        this.cwd = cwd.startsWith('/') ? this.vfs.resolvePath(cwd) : this.resolveInternal(cwd);
    }

    /** Converts only at the public API boundary; VFS itself never sees C:/. */
    resolveInternal(path: string, cwd = this.cwd): string {
        if (path.startsWith('/')) return this.vfs.resolvePath(path, cwd);
        const base = formatVolumePath(this.volumeId, cwd);
        const resolved = resolveVolumePath(path, base);
        if (resolved.volumeId !== this.volumeId) throw new Error(`Path belongs to ${resolved.volumeId}:, not ${this.volumeId}:`);
        return resolved.path;
    }

    /** Set the process working directory without an I/O check. */
    setCwd(path: string) {
        this.cwd = this.resolveInternal(path);
    }

    /**
     * Change the current working directory
     */
    async chdir(path: string) {
        const absolutePath = this.resolveInternal(path);
        // Verify the path exists and is a directory
        const stats = await this.vfs.stats(absolutePath);
        if (stats.type !== "dir") {
            throw new Error(`ENOTDIR: Not a directory '${path}'`);
        }
        this.cwd = absolutePath;
    }

    /**
     * Get the current working directory
     */
    getcwd(): string {
        return formatVolumePath(this.volumeId, this.cwd);
    }

    /**
     * Write data to a file (supports relative paths)
     */
    async write(path: string, data: Uint8Array) {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.write(absolutePath, data);
    }

    async writeBlob(path: string, data: Blob | ArrayBuffer | Uint8Array | string) {
        return this.vfs.writeBlob(this.resolveInternal(path), data);
    }

    /**
     * Read data from a file (supports relative paths)
     */
    async read(path: string): Promise<Uint8Array> {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.read(absolutePath);
    }

    async readBlob(path: string, type = ''): Promise<Blob> {
        return this.vfs.readBlob(this.resolveInternal(path), type);
    }

    async readText(path: string): Promise<string> {
        return this.vfs.readText(this.resolveInternal(path));
    }

    async getFileURL(path: string, type = ''): Promise<string> {
        return this.vfs.getFileURL(this.resolveInternal(path), type);
    }

    resolvePath(path: string, cwd: string = this.getcwd()): string {
        const internalCwd = cwd.startsWith('/') ? cwd : this.resolveInternal(cwd);
        return formatVolumePath(this.volumeId, this.resolveInternal(path, internalCwd));
    }

    /**
     * Delete a file (supports relative paths)
     */
    async delete(path: string) {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.delete(absolutePath);
    }

    /**
     * Create a directory (supports relative paths)
     */
    async mkdir(path: string, options?: { recursive?: boolean }) {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.mkdir(absolutePath, options);
    }

    async ensureDirectory(path: string) {
        return this.vfs.ensureDirectory(this.resolveInternal(path));
    }

    /**
     * Remove a directory (supports relative paths)
     */
    async rmdir(path: string, options?: { recursive?: boolean }) {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.rmdir(absolutePath, options);
    }

    /**
     * Read directory contents (supports relative paths)
     */
    async readdir(path: string): Promise<string[]> {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.readdir(absolutePath);
    }

    /**
     * Walk through directory tree (supports relative paths)
     */
    async walk(path: string, callback: (path: string, inode: GenericInode) => void) {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.walk(absolutePath, (entryPath, inode) => callback(formatVolumePath(this.volumeId, entryPath), inode));
    }

    /**
     * Check if path exists (supports relative paths)
     */
    async exists(path: string): Promise<boolean> {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.exists(absolutePath);
    }

    /**
     * Get file/directory stats (supports relative paths)
     */
    async stats(path: string): Promise<Partial<GenericInode>> {
        const absolutePath = this.resolveInternal(path);
        return this.vfs.stats(absolutePath);
    }

    /**
     * Initialize the underlying VFS
     */
    async init() {
        return this.vfs.init();
    }

    /**
     * Get the underlying VFS instance
     */
    getVFS(): VFS {
        return this.vfs;
    }
}
