/// <reference path="../../internal/stdio.d.ts" />
/// <reference path="../../internal/eventEmitter.d.ts" />

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
