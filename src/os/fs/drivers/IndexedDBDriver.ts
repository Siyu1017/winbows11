import { Driver, RawData, DriverOptions, DriverState } from "./driver";

const dbName = "winbows_fs";

function openDB(dbName: string, version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            console.info(`Upgrading DB ${dbName}: ${event.oldVersion} to ${event.newVersion}`);
        };
    });
}

async function ensureStore(dbName: string, db: IDBDatabase, storeName: string): Promise<IDBDatabase> {
    if (db.objectStoreNames.contains(storeName)) return db;

    const newVersion = db.version + 1;
    db.close();

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, newVersion);
        request.onupgradeneeded = () => {
            const db2 = request.result;
            if (!db2.objectStoreNames.contains(storeName)) {
                console.info(`Creating store: ${storeName}`);
                const store = db2.createObjectStore(storeName, { keyPath: "k" });
                store.createIndex("k", "k", { unique: true });
            }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function request<T>(operation: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        operation.onsuccess = () => resolve(operation.result);
        operation.onerror = () => reject(operation.error ?? new Error("IndexedDB request failed"));
    });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    });
}

const _label = Symbol("IDBDriver.label");
const _state = Symbol("IDBDriver.state");
const _db = Symbol("IDBDriver.db");
const _storeName = Symbol("IDBDriver.storeName");
const _capacity = Symbol("IDBDriver.capacity");
const _opening = Symbol("IDBDriver.opening");

export class IndexedDBDriver extends Driver {
    private [_label]: string = "IndexedDB Driver";
    private [_state]: DriverState = DriverState.Uninitialized;
    private [_db]: IDBDatabase | null = null;
    private [_storeName]: string = "files";
    private [_opening]: Promise<IDBDatabase> | null = null;
    private [_capacity]: { used: number; total?: number } = { used: 0, total: undefined };

    readonly capabilities = {
        writable: true,
        deletable: true,
        persistent: true
    };

    get volume() {
        return {
            label: this[_label],
            capacity: this[_capacity]
        };
    }

    get state(): DriverState {
        return this[_state];
    }

    get storeName(): string {
        return this[_storeName];
    }

    constructor(opts: DriverOptions) {
        super(opts);
        this[_storeName] = opts.storeName ?? "files";
        this[_label] = `IndexedDB (${this[_storeName]})`;
    }

    private bindDB(db: IDBDatabase) {
        db.onversionchange = () => {
            if (this[_db] === db) this[_db] = null;
            db.close();
        };

        db.onclose = () => {
            if (this[_db] === db) this[_db] = null;
        };
    }

    private async open(): Promise<IDBDatabase> {
        let db = await openDB(dbName);
        db = await ensureStore(dbName, db, this[_storeName]);
        this.bindDB(db);
        return db;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this[_db]) return this[_db];
        if (this[_opening]) return this[_opening];

        this[_opening] = this.open();

        try {
            const db = await this[_opening];
            this[_db] = db;
            return db;
        } finally {
            this[_opening] = null;
        }
    }

    private async transaction(mode: IDBTransactionMode): Promise<IDBTransaction> {
        if (this[_state] !== DriverState.Operational) throw new Error("The driver is not available");

        let db = await this.getDB();

        try {
            return db.transaction(this[_storeName], mode);
        } catch (err) {
            if (!(err instanceof DOMException) || err.name !== "InvalidStateError") throw err;
            if (this[_db] === db) this[_db] = null;
            db = await this.getDB();
            return db.transaction(this[_storeName], mode);
        }
    }

    async init() {
        if (this[_state] === DriverState.Operational) return;
        if (this[_state] === DriverState.Initializing && this[_opening]) {
            await this[_opening];
            return;
        }

        this[_state] = DriverState.Initializing;

        try {
            this[_db] = await this.getDB();
            this[_state] = DriverState.Operational;
        } catch (err) {
            this[_state] = DriverState.Error;
            console.error("Failed to initialize IndexedDBDriver: ", err);
            throw err;
        }
    }

    async dispose() {
        const db = this[_db];
        this[_db] = null;
        db?.close();
        this[_state] = DriverState.Closed;
    }

    async read(key: string) {
        const transaction = await this.transaction("readonly");
        const done = transactionDone(transaction);
        const entry = await request(transaction.objectStore(this[_storeName]).get(key));
        await done;
        return entry?.v ? new Uint8Array(entry.v) : null;
    }

    async write(key: string, data: RawData) {
        const transaction = await this.transaction("readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore(this[_storeName]).put({ k: key, v: data.slice() });
        await done;
    }

    async delete(key: string) {
        const transaction = await this.transaction("readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore(this[_storeName]).delete(key);
        await done;
    }

    async exists(key: string) {
        const transaction = await this.transaction("readonly");
        const done = transactionDone(transaction);
        const keyValue = await request(transaction.objectStore(this[_storeName]).getKey(key));
        await done;
        return keyValue !== undefined;
    }

    async clear() {
        const transaction = await this.transaction("readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore(this[_storeName]).clear();
        await done;
    }

    async getCapacity() {
        const transaction = await this.transaction("readonly");
        const done = transactionDone(transaction);
        const entries = await request(transaction.objectStore(this[_storeName]).getAll()) as Array<{ v?: ArrayBuffer | Uint8Array }>;
        await done;

        this[_capacity].used = entries.reduce((total, entry) => total + (entry.v?.byteLength ?? 0), 0);
        const estimate = await globalThis.navigator?.storage?.estimate?.();
        this[_capacity].total = estimate?.quota;
        return { ...this[_capacity] };
    }
}