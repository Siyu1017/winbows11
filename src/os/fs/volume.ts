/** Public paths are volume-qualified; VFS drivers only receive volume-local paths. */
export type VolumePath = { volumeId: string; path: string };

const DRIVE_PATH = /^([A-Za-z]):(?:\/|$)/;

function normalizeInternal(path: string): string {
    if (!path.startsWith('/')) throw new Error(`Expected an absolute volume path: ${path}`);
    const parts: string[] = [];
    for (const segment of path.replaceAll('\\', '/').split('/')) {
        if (!segment || segment === '.') continue;
        if (segment === '..') parts.pop(); else parts.push(segment);
    }
    return `/${parts.join('/')}`;
}

export function parseVolumePath(path: string): VolumePath {
    const normalized = path.replaceAll('\\', '/');
    const match = DRIVE_PATH.exec(normalized);
    if (!match) throw new Error(`Expected a volume-qualified absolute path: ${path}`);
    return { volumeId: match[1].toUpperCase(), path: normalizeInternal(`/${normalized.slice(match[0].length)}`) };
}

export function formatVolumePath(volumeId: string, path: string): string {
    return `${volumeId.toUpperCase()}:${normalizeInternal(path)}`;
}

export function resolveVolumePath(path: string, cwd: string): VolumePath {
    if (DRIVE_PATH.test(path.replaceAll('\\', '/'))) return parseVolumePath(path);
    const base = parseVolumePath(cwd);
    return { volumeId: base.volumeId, path: normalizeInternal(`${base.path}/${path}`) };
}
