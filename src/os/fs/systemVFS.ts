import { VFS, VFSCorruptionError } from "./core/vfs";
import { IndexedDBDriver } from "./drivers/IndexedDBDriver";
import { MemoryDriver } from "./drivers/memoryDriver";
import type { Driver } from "./drivers/driver";
import { hasLegacyFilesystem, LegacyFilesystemDetectedError } from './legacyMigration';

/** The boot volume is configured here; no other filesystem layer selects C:. */
export const SYSTEM_VOLUME = Object.freeze({ id: 'C', storeName: 'volume_C' });
let vfs: VFS | null = null;
let initialization: Promise<VFS> | null = null;
let systemDriver: Driver | null = null;
let usingMemoryDriver = false;

export type VolumeInfo = {
    id: string;
    mountPath: string;
    label: string;
    storeName: string;
    persistent: boolean;
    writable: boolean;
    capacity?: { used: number; total?: number };
};

/** The C: volume. All paths passed to this VFS are absolute volume-local paths. */
export function initializeSystemVFS(options: { allowLegacyFilesystem?: boolean } = {}): Promise<VFS> {
    initialization ??= (async () => {
        if (!options.allowLegacyFilesystem && await hasLegacyFilesystem()) throw new LegacyFilesystemDetectedError();
        let driver: Driver;
        try {
            driver = new IndexedDBDriver(SYSTEM_VOLUME);
            await driver.init();
            const indexedDBVFS = new VFS(driver);
            indexedDBVFS.addEventListener('fatal', (e) => {
                reportFilesystemCorruption(e?.path || e)
            });
            await indexedDBVFS.init();
            systemDriver = driver;
            vfs = indexedDBVFS;
            return vfs;
        } catch (error) {
            if (error instanceof VFSCorruptionError) throw error;
            // Safari private browsing may expose indexedDB but reject open() or
            // transactions. Keep the desktop usable with a session-only volume.
            console.warn('IndexedDB is unavailable; using an in-memory filesystem for this session.', error);
            driver = new MemoryDriver(SYSTEM_VOLUME);
            await driver.init();
            usingMemoryDriver = true;
        }
        systemDriver = driver;
        vfs = new VFS(driver);
        vfs.addEventListener('fatal', (e) => {
            reportFilesystemCorruption(e?.path || e)
        });
        await vfs.init();
        return vfs;
    })();
    return initialization;
}

function reportFilesystemCorruption(error: VFSCorruptionError): void {
    void import('../core/crashHandler.js').then(({ default: crashHandler }) => crashHandler(error));
}

/** True when persistence is unavailable and the current volume is session-only. */
export function isUsingMemorySystemFS(): boolean {
    return usingMemoryDriver;
}

export function getSystemVFS() {
    if (!vfs) throw new Error('System VFS has not been initialized');
    return vfs;
}

/** Enumerates mounted Winbows volumes for shell and File Explorer UIs. */
export async function enumerateVolumes(): Promise<VolumeInfo[]> {
    await initializeSystemVFS();
    if (!systemDriver) return [];
    const capacity = await systemDriver.getCapacity?.();
    return [{
        id: systemDriver.id,
        mountPath: `${systemDriver.id}:/`,
        label: systemDriver.volume.label || `Local Disk (${systemDriver.id}:)`,
        storeName: SYSTEM_VOLUME.storeName,
        persistent: systemDriver.capabilities.persistent,
        writable: systemDriver.capabilities.writable,
        capacity
    }];
}
