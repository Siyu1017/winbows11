import { Driver, RawData, DriverOptions, DriverState } from "./driver";

const dbName = "winbows_fs";

function openDB(dbName: string, version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = request.result;
            console.info(
                `Upgrading DB ${dbName}: ${event.oldVersion} to ${event.newVersion}`
            );
        };
    });
}

async function ensureStore(
    dbName: string,
    db: IDBDatabase,
    storeName: string
): Promise<IDBDatabase> {
    if (db.objectStoreNames.contains(storeName)) {
        return db;
    }

    db.close();
    const newVersion = db.version + 1;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, newVersion);

        request.onupgradeneeded = () => {
            const db2 = request.result;
            console.info(`Creating store: ${storeName}`);
            const store = db2.createObjectStore(storeName, { keyPath: "k" });
            store.createIndex("k", "k", { unique: true });
        };

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function tx<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    executor: (store: IDBObjectStore) => void
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        let result: T;

        try {
            executor(store);
        } catch (err) {
            reject(err);
        }

        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);

        (transaction as any)._setResult = (v: T) => (result = v);
    });
}

const _label = Symbol("IDBDriver.label");
const _state = Symbol("IDBDriver.state");
const _db = Symbol("IDBDriver.db");
const _storeName = Symbol("IDBDriver.storeName");
const _capacity = Symbol("IDBDriver.capacity");

export class IndexedDBDriver extends Driver {
    private [_label]: string = "IndexedDB Driver";
    private [_state]: DriverState = DriverState.Uninitialized;
    private [_db]: IDBDatabase | null = null;
    private [_storeName]: string = 'files';
    private [_capacity] = {
        used: 0,
        total: undefined
    }

    readonly capabilities = {
        writable: true,
        deletable: true,
        persistent: true
    };
    get volume() {
        return {
            label: this[_label],
            capacity: this[_capacity]
        }
    }
    get state(): DriverState {
        return this[_state];
    }

    constructor(opts: DriverOptions) {
        super(opts);
    }

    async init() {
        if (this[_state] === DriverState.Initializing) return;
        this[_state] = DriverState.Initializing;

        try {
            this[_db] = await openDB(dbName);
            this[_db] = await ensureStore(dbName, this[_db], this[_storeName]);
            this[_db].onversionchange = () => { this[_db]?.close() };
            this[_state] = DriverState.Operational;
        } catch (err) {
            this[_state] = DriverState.Error;
            console.error("Failed to initialize IndexedDBDriver: ", err);
            throw err;
        }
    }

    async dispose() {
        this[_db]?.close();
        this[_db] = null;
        this[_state] = DriverState.Closed;
    }

    async read(key: string) {
        if (this[_db] === null || this[_state] !== DriverState.Operational) throw new Error("The driver is not available");
        return tx<RawData | null>(this[_db], this[_storeName], "readonly", (store) => {
            const req = store.get(key);
            req.onsuccess = () => {
                (store.transaction as any)._setResult(req.result?.v);
            };
        });
    }

    async write(key: string, data: RawData) {
        if (this[_db] === null || this[_state] !== DriverState.Operational) throw new Error("The driver is not available");
        await tx<void>(this[_db], this[_storeName], "readwrite", (store) => {
            store.put({ k: key, v: data });
        });
    }

    async delete(key: string) {
        if (this[_db] === null || this[_state] !== DriverState.Operational) throw new Error("The driver is not available");
        await tx<void>(this[_db], this[_storeName], "readwrite", (store) => {
            store.delete(key);
        });
    }

    async exists(key: string) {
        if (this[_db] === null || this[_state] !== DriverState.Operational) throw new Error("The driver is not available");
        return tx<boolean>(this[_db], this[_storeName], "readonly", (store) => {
            const req = store.getKey(key);
            req.onsuccess = () => {
                (store.transaction as any)._setResult(req.result !== undefined);
            }
            req.onerror = () => {
                throw req.error;
            }
        });
    }

    async clear() {
        if (this[_db] === null || this[_state] !== DriverState.Operational) throw new Error("The driver is not available");
        await tx<void>(this[_db], this[_storeName], "readwrite", (store) => {
            store.clear();
        });
    }

    async getCapacity() {
        return this[_capacity];
    }
}
