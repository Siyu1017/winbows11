import { VFS } from './core/vfs';

const LEGACY_DATABASE = 'WINBOWS_STORAGE';

export class LegacyFilesystemDetectedError extends Error {
    constructor() {
        super('A legacy Winbows filesystem requires migration before VFS can start.');
        this.name = 'LegacyFilesystemDetectedError';
    }
}

/** This check runs before a new VFS driver or object store is opened. */
export async function hasLegacyFilesystem(): Promise<boolean> {
    try {
        const databases = (indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> }).databases;
        if (!databases) return false;
        return (await databases.call(indexedDB)).some(database => database.name === LEGACY_DATABASE);
    } catch {
        // Private browsing can expose IndexedDB but reject every operation.
        // Migration is impossible there, so let the system mount its ephemeral disk.
        return false;
    }
}

export async function migrateLegacyFilesystem(target: VFS, update: (text: string) => void): Promise<void> {
    update('Opening previous filesystem…');
    const { IDBFS } = await import('../../shared/fs.js');
    const legacy: any = IDBFS('~VFS-MIGRATION');
    try {
        update('Reading previous filesystem…');
        if (legacy.exists('C:/')) {
            const paths: string[] = await legacy.readdir('C:/', { recursive: true });
            paths.sort((a, b) => a.split('/').length - b.split('/').length);
            const records = paths.map(source => {
                const entry = legacy.stat(source);
                return {
                    source,
                    entry,
                    path: `/${source.slice(3)}`.replace(/\/$/, '') || '/',
                    isDirectory: entry.isDirectory?.() === true || entry.type === 'directory',
                    isFile: entry.isFile?.() === true || entry.type === 'file'
                };
            });
            // Older IDBFS versions could leave both `name` and `name/` records.
            // They map to one VFS path; a directory must win over the invalid file.
            const directoryPaths = new Set(records.filter(record => record.isDirectory).map(record => record.path));
            let completed = 0;
            let skippedConflicts = 0;
            update(`Migrating ${completed}/${records.length} files…`);
            for (const record of records) {
                if (record.isDirectory) await target.ensureDirectory(record.path);
                else if (record.isFile) {
                    if (directoryPaths.has(record.path)) {
                        skippedConflicts++;
                    } else if (await target.exists(record.path) && (await target.stats(record.path)).type === 'dir') {
                        skippedConflicts++;
                    } else {
                        try {
                            const path = record.path;
                            await target.ensureDirectory(path.slice(0, path.lastIndexOf('/')) || '/');
                            await target.writeBlob(path, await legacy.readFile(record.source));
                        } catch (e) {
                            console.warn(e);
                            skippedConflicts++;
                        }
                    }
                }
                completed++;
                update(`Migrating ${completed}/${records.length} files${skippedConflicts ? ` (${skippedConflicts} conflicting records skipped)` : ''}…`);
            }
        }
        update('Removing previous filesystem…');
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(LEGACY_DATABASE);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('Close other Winbows tabs before migration can finish.'));
        });
    } finally {
        legacy.quit?.();
    }
}

/** A deliberately blocking pre-boot UI. No kernel code runs behind this screen. */
export async function showMigrationUI(runMigration: (update: (text: string) => void) => Promise<void>): Promise<void> {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    const title = document.createElement('div');
    const content = document.createElement('div');
    const button = document.createElement('button');
    const buttonStyle = 'color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1.5rem;font-family: inherit;font-weight: 600;';
    overlay.style.cssText = 'position: fixed;top: 0px;left: 0px;width: 100vw;height: var(--winbows-screen-height);display: flex;align-items: center;justify-content: center;background-color: rgba(0, 0, 0, 0.5);z-index: 99999;font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;';
    dialog.style.cssText = 'display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem 4rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px, -2rem + 100vw);width: 100%;max-height: min(calc(var(--winbows-screen-height) * 80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;color:#000;';
    title.style.cssText = 'font-size: 175%;font-weight: 600;margin: .5rem 0 1.5rem;';
    title.textContent = 'Data migration required';
    content.innerHTML = '<div>We detected files saved with a previous version of the Winbows filesystem. They must be migrated before Winbows can start, preventing data loss and inconsistent file records.</div><div style="margin-top:1rem">This update replaces path-based storage with a file table and record IDs for more reliable access.</div>';
    button.textContent = 'Continue';
    button.style.cssText = buttonStyle;
    dialog.append(title, content, button);
    overlay.append(dialog);
    document.body.append(overlay);

    await new Promise<void>(resolve => button.addEventListener('click', () => resolve(), { once: true }));
    dialog.replaceChildren();
    dialog.style.padding = '2rem';
    const progress = document.createElement('div');
    const tasks = document.createElement('div');
    progress.className = 'migrate-progress';
    tasks.className = 'migrate-task';
    dialog.append(progress, tasks);

    const phases = [
        ['open', 'Open previous filesystem', 'Failed to open previous filesystem'],
        ['read', 'Read previous filesystem', 'Failed to read previous filesystem'],
        ['migrate', 'Migrate files to the new filesystem', 'Failed to migrate'],
        ['delete', 'Remove previous filesystem', 'Failed to remove previous filesystem']
    ] as const;
    const rows = new Map<string, { bar: HTMLDivElement; row: HTMLDivElement; text: HTMLDivElement; finish: () => void; reject: () => void }>();
    for (const [key, label] of phases) {
        const bar = document.createElement('div');
        const row = document.createElement('div');
        const text = document.createElement('div');
        bar.className = 'migrate-progress-bar';
        row.className = 'migrate-task-item';
        row.innerHTML = '<div class="migrate-task-icon"><svg class="migrate-loading-spinner" width="16" height="16" viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="7px"></circle></svg></div>';
        text.className = 'migrate-task-item-text';
        text.textContent = label;
        row.append(text); progress.append(bar); tasks.append(row);
        rows.set(key, {
            bar, row, text,
            finish: () => {
                bar.classList.remove('rejected');
                bar.classList.add('fulfilled');
                row.classList.remove('rejected');
                row.classList.add('fulfilled');
            },
            reject: () => {
                bar.classList.add('rejected');
                row.classList.add('rejected');
            }
        });
    }
    let active = 0;
    const update = (message: string) => {
        const next = message.startsWith('Opening') ? 0 : message.startsWith('Reading') ? 1 : message.startsWith('Migrating') ? 2 : 3;
        while (active < next) rows.get(phases[active++][0])!.finish();
        rows.get(phases[next][0])!.text.textContent = message;
        active = next;
    };

    const run = async (): Promise<void> => {
        try {
            await runMigration(update);
            phases.forEach(([key]) => rows.get(key)!.finish());
            const continueButton = document.createElement('button');
            continueButton.textContent = 'Continue';
            continueButton.style.cssText = 'color: rgb(255, 255, 255);padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1rem;font-family: inherit;font-weight: 600;';
            dialog.append(continueButton);
            await new Promise<void>(resolve => continueButton.addEventListener('click', () => location.reload(), { once: true }));
            overlay.remove();
        } catch (error) {
            console.error(error)
            rows.get(phases[active][0])!.reject();
            rows.get(phases[active][0])!.text.textContent = `${phases[active][2]}: ${error instanceof Error ? error.message : (error as any)?.message || String(error)}`;
            const buttons = document.createElement('div');
            const laterBtn = document.createElement('button');
            const retryBtn = document.createElement('button');

            buttons.className = 'migrate-buttons';
            laterBtn.className = 'migrate-button outline';
            retryBtn.className = 'migrate-button';

            laterBtn.innerHTML = 'Migrate later';
            retryBtn.innerHTML = 'Retry';

            dialog.appendChild(buttons);
            buttons.append(laterBtn, retryBtn);

            return new Promise(resolve => {
                retryBtn.addEventListener('click', () => {
                    location.reload();
                })
                laterBtn.addEventListener('click', () => {
                    overlay.remove();
                    resolve();
                })
            })
        }
    };
    await run();
}
