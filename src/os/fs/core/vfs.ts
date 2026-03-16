import { Driver, DriverState, RawData } from "../drivers/driver";
import { DirInode, DirTable, FileInode, GenericInode, IError, InodeType } from "./types";

function normalizePath(path: string): string[] {
    if (!path.startsWith("/")) {
        throw new Error("Only absolute paths supported");
    }
    return path.split("/").filter(p => p.length > 0 && p !== ".");
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

async function normalizeData(data: any): Promise<RawData> {
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
    } = {
            noatime: false,
            readonly: false
        }

    constructor(driver: Driver) {
        if (driver.state !== DriverState.Operational) throw new Error("Driver is not operational");
        this.driver = driver;
    }

    private async loadInode(id: number): Promise<GenericInode> {
        const raw = await this.driver.read(`inode:${id}`);
        if (!raw) throw new Error(`inode \'${id}\' not found`);
        return decodeJSON(raw) as GenericInode;
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
        if (!raw) throw new Error("dir table not found");
        return decodeJSON(raw) as DirTable;
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
        if (path.startsWith("/")) {
            // Already absolute
            return path;
        }

        // Handle relative path
        let fullPath: string;
        if (cwd === "/") {
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
    }

    /**
     * update_inode=[a]
     */
    async read(path: string): Promise<Uint8Array> {
        path = '/' + normalizePath(path).join("/");

        const { inodeId } = await this.resolveExisting(path, 'read');
        const inode = await this.loadInode(inodeId);
        if (inode.type === "dir") throwVFSError(ErrorCodes.IS_A_DIRECTORY, 'read', path);
        return new Promise(resolve => {
            this.driver.read(`data:${inodeId}`).then(data => {
                if (!data) {
                    throwVFSError(ErrorCodes.PATH_NOT_FOUND, 'read', path);
                }
                resolve(data);
                inode.atime = Date.now();
                this.saveInode(inode);
            });
        })
    }

    /**
     * update_inode=[]
     */
    async delete(path: string) {
        path = '/' + normalizePath(path).join("/");

        const { parentId, inodeId, name } = await this.resolveExisting(path, 'delete');
        if (!parentId || !name) throwVFSError(ErrorCodes.ACCESS_DENIED, 'delete', path);
        const inode = await this.loadInode(inodeId);
        if (inode.type === "dir") throwVFSError(ErrorCodes.IS_A_DIRECTORY, 'delete', path);
        await this.unlink(parentId, name);
        await this.driver.delete(`data:${inodeId}`);
        await this.driver.delete(`inode:${inodeId}`);
    }

    async link(parentInodeId: number, name: string, targetInodeId: number) {
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
    }

    private async removeInodeRecursive(inodeId: number) {
        const inode = await this.loadInode(inodeId);

        if (inode.type === "dir") {
            const dir = await this.loadDirTable(inodeId);
            for (const child of Object.values(dir)) {
                await this.removeInodeRecursive(child);
            }
            await this.driver.delete(`dir:${inodeId}`);
        } else {
            await this.driver.delete(`data:${inodeId}`);
        }

        await this.driver.delete(`inode:${inodeId}`);
    }

    async rmdir(path: string, options?: { recursive?: boolean }) {
        path = '/' + normalizePath(path).join("/");

        const { parentId, name, inodeId } = await this.resolveExisting(path, 'rmdir');
        if (parentId === null || name === null) throwVFSError(ErrorCodes.ACCESS_DENIED, 'rmdir', path);

        const parentInode = await this.loadInode(parentId);
        if (parentInode.type !== "dir")
            throwVFSError(ErrorCodes.NOT_A_DIRECTORY, 'rmdir', path);
        const dir = await this.loadDirTable(parentInode.id);
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

    // TODO: implement event listeners
    addEventListener(event: string, listener: (event: any) => void) {

    }

    removeEventListener(event: string, listener: (event: any) => void) {

    }
}

/**
 * A wrapper around VFS that provides relative path support.
 * Each instance maintains its own current working directory.
 */
export class FS {
    private vfs: VFS;
    private cwd: string = "/";

    constructor(vfs: VFS) {
        this.vfs = vfs;
    }

    /**
     * Change the current working directory
     */
    async chdir(path: string) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
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
        return this.cwd;
    }

    /**
     * Write data to a file (supports relative paths)
     */
    async write(path: string, data: Uint8Array) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.write(absolutePath, data);
    }

    /**
     * Read data from a file (supports relative paths)
     */
    async read(path: string): Promise<Uint8Array> {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.read(absolutePath);
    }

    /**
     * Delete a file (supports relative paths)
     */
    async delete(path: string) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.delete(absolutePath);
    }

    /**
     * Create a directory (supports relative paths)
     */
    async mkdir(path: string, options?: { recursive?: boolean }) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.mkdir(absolutePath, options);
    }

    /**
     * Remove a directory (supports relative paths)
     */
    async rmdir(path: string, options?: { recursive?: boolean }) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.rmdir(absolutePath, options);
    }

    /**
     * Read directory contents (supports relative paths)
     */
    async readdir(path: string): Promise<string[]> {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.readdir(absolutePath);
    }

    /**
     * Walk through directory tree (supports relative paths)
     */
    async walk(path: string, callback: (path: string, inode: GenericInode) => void) {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.walk(absolutePath, callback);
    }

    /**
     * Check if path exists (supports relative paths)
     */
    async exists(path: string): Promise<boolean> {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
        return this.vfs.exists(absolutePath);
    }

    /**
     * Get file/directory stats (supports relative paths)
     */
    async stats(path: string): Promise<Partial<GenericInode>> {
        const absolutePath = this.vfs.resolvePath(path, this.cwd);
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
