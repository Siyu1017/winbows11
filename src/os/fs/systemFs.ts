import { FS } from './core/vfs';
import { NodeFS } from './nodeFs';
import { getSystemVFS, initializeSystemVFS, SYSTEM_VOLUME } from './systemVFS';
import { migrateLegacyFilesystem } from './legacyMigration';

/** Creates a Node-style view after boot has mounted the system volume. */
export function getMountedSystemFS(cwd = 'C:/'): NodeFS {
    return new NodeFS(new FS(getSystemVFS(), cwd, SYSTEM_VOLUME.id));
}

/** Use only from an explicit post-boot async entry point. */
export async function createSystemFS(cwd = 'C:/'): Promise<NodeFS> {
    return new NodeFS(new FS(await initializeSystemVFS(), cwd, SYSTEM_VOLUME.id));
}

/** Keeps the migration storage detail behind the same system filesystem facade. */
export async function migrateSystemFilesystem(update: (text: string) => void): Promise<void> {
    await migrateLegacyFilesystem(await initializeSystemVFS({ allowLegacyFilesystem: true }), update);
}
