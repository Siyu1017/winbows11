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
