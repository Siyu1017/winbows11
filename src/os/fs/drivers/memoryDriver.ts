import { Driver, RawData, DriverOptions, DriverState } from "./driver";

export class MemoryDriver extends Driver {
    private _storage = new Map<string, RawData>();
    private _label: string = "Memory Driver";
    private _state: DriverState = DriverState.Uninitialized;
    private _capacity = {
        used: 0,
        total: 0
    }

    readonly capabilities = {
        writable: true,
        deletable: true,
        persistent: false
    };
    get volume() {
        return {
            label: this._label,
            capacity: this._capacity
        }
    }
    get state() {
        return this._state;
    }

    constructor(opts: DriverOptions) {
        super(opts);
    }

    async init() {
        this._state = DriverState.Operational;
    }

    async dispose() {
        this._state = DriverState.Closed;
    }

    async read(key: string) {
        if (this._state !== DriverState.Operational) throw new Error("The driver is not available");
        return this._storage.get(key) ?? null;
    }

    async write(key: string, data: RawData) {
        if (this._state !== DriverState.Operational) throw new Error("The driver is not available");
        this._storage.set(key, data);
    }

    async delete(key: string) {
        if (this._state !== DriverState.Operational) throw new Error("The driver is not available");
        this._storage.delete(key);
    }

    async exists(key: string) {
        if (this._state !== DriverState.Operational) throw new Error("The driver is not available");
        return this._storage.has(key);
    }

    async clear() {
        if (this._state !== DriverState.Operational) throw new Error("The driver is not available");
        this._storage.clear();
    }

    async getCapacity() {
        let used = 0;
        for (const value of this._storage.values()) {
            used += value.byteLength;
        }
        return { used, total: used };
    }
}
