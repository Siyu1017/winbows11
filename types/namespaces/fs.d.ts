declare namespace fs {
  function exists(path: string): boolean;
  function mkdir(path: string): Promise<any>;
  function mv(src: string, dest: string, options?: { overwrite?: boolean }): Promise<any>;
  function readdir(path: string, options?: { recursive?: boolean }): Promise<string[]>;
  function readFile(path: string): Promise<Blob>;
  function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<any>;
  function stat(path: string): Promise<{
    isFile: Function;
    isDirectory: Function;
    length: number;
    exists: boolean;
    type: 'file' | 'directory' | null;
    changeTime: number | null;
    createdTime: number | null;
    lastModifiedTime: number | null;
    mimeType: string | null;
  }>;
  function writeFile(path: string, data: Blob): Promise<any>;
  function proxy(method: string, param: any[]): Promise<any>;
  function downloadFile(path: string, responseType?: string): Promise<Blob | string>;
  function getFileURL(path: string): Promise<string>;
  function readFileAsText(path: string): Promise<string>;
}
