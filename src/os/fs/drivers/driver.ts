export type RawData = Uint8Array;
export type DriverOptions = {
    id: string;
}
export const enum DriverState {
    Uninitialized = 0,
    Initializing = 1,
    Operational = 2,
    Error = 3,
    Closed = 4
}
export interface DriverCapabilities {
    readonly writable: boolean;
    readonly deletable: boolean;
    readonly persistent: boolean;
}
export interface VolumeDescriptor {
    readonly id: string;            // same as driver.id
    readonly label?: string;
    readonly persistent: boolean;   // same as driver.capabilities.persistent
    readonly capacity?: {
        total?: number;
        used?: number;
    };
}
export interface VolumeOverrides {
    readonly label: string;
    readonly capacity: {
        total?: number;
        used?: number;
    };
}

export abstract class Driver {
    readonly id!: string;

    protected constructor(opts: DriverOptions) {
        this.id = opts.id;
    }

    abstract readonly capabilities: DriverCapabilities;
    abstract readonly state: DriverState;
    abstract readonly volume: Partial<VolumeOverrides>;

    abstract init(): Promise<void>;
    abstract dispose(): Promise<void>;

    abstract read(key: string): Promise<RawData | null>;
    abstract write(key: string, data: RawData): Promise<void>;
    abstract delete(key: string): Promise<void>;
    abstract exists(key: string): Promise<boolean>;
    abstract clear(): Promise<void>;

    getCapacity?(): Promise<{ used: number; total?: number }>;
    healthCheck?(): Promise<"ok" | "error">;

    public get volumeDescriptor(): VolumeDescriptor {
        return {
            id: this.id,
            persistent: this.capabilities.persistent,
            label: this.volume.label,
            capacity: this.volume.capacity
        }
    }
}
