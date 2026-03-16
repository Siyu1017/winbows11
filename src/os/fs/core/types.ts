export type InodeType = "file" | "dir";

export interface GenericInode {
    id: number;
    type: InodeType;
    size: number;
    ctime: number;      // Change time ( metadata change )
    mtime: number;      // Modification time
    atime: number;      // Access time
    btime: number;      // Birth time
    links: number;      // number of hard links
}

export interface FileInode extends GenericInode {
    type: "file";
    size: number;
    blocks: number[];
}

export interface DirInode extends GenericInode {
    type: "dir";
    entries: Map<string, number>;   // name -> inodeId
}

export interface DirTable {
    [name: string]: number; // name -> inodeId
}

export type IParentData = {
    parentId: number;
    name: string;
}

export type IPathData = {
    parents: number[];
    parentId: number;
    inodeId: number;
    name: string;
}

export type IError = {
    code: string;
}
