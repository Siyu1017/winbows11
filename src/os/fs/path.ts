/** Path helpers for VFS paths. This module intentionally has no storage API. */
function normalize(value = '') {
    const drive = /^([A-Za-z]):[\\/]/.exec(value);
    const absolute = value.startsWith('/') || !!drive;
    const source = drive ? value.slice(drive[0].length) : value;
    const parts: string[] = [];
    for (const part of source.replaceAll('\\', '/').split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    if (drive) return `${drive[1].toUpperCase()}:/${parts.join('/')}`;
    return `${absolute ? '/' : ''}${parts.join('/')}` || (absolute ? '/' : '');
}

const path = {
    sep: '/',
    normalize,
    join: (...values: string[]) => normalize(values.join('/')),
    isAbsolute: (value = '') => value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value),
    resolve: (...values: string[]) => {
        let resolved = '';
        for (let index = values.length - 1; index >= 0; index--) {
            const value = values[index];
            if (!value) continue;
            resolved = `${value}/${resolved}`;
            if (path.isAbsolute(value)) break;
        }
        return normalize(resolved);
    },
    dirname: (value = '') => {
        const normalized = normalize(value);
        const drive = /^([A-Za-z]):\//.exec(normalized);
        const parts = (drive ? normalized.slice(drive[0].length) : normalized).split('/');
        parts.pop();
        if (drive) return `${drive[1].toUpperCase()}:/${parts.filter(Boolean).join('/')}`;
        return parts.length > 1 ? parts.join('/') : '/';
    },
    basename: (value = '', suffix = '') => {
        const name = normalize(value).split('/').pop() || '';
        return suffix && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
    },
    extname: (value = '') => {
        const name = path.basename(value);
        const dot = name.lastIndexOf('.');
        return dot > 0 ? name.slice(dot) : '';
    },
    relative: (from: string, to: string) => {
        const fromParts = path.resolve(from).split('/').filter(Boolean);
        const toParts = path.resolve(to).split('/').filter(Boolean);
        while (fromParts[0] && fromParts[0] === toParts[0]) {
            fromParts.shift();
            toParts.shift();
        }
        return `${'../'.repeat(fromParts.length)}${toParts.join('/')}`;
    },
    parse: (value = '') => {
        const normalized = normalize(value);
        const base = path.basename(normalized);
        const ext = path.extname(base);
        return { root: /^[A-Za-z]:\//.test(normalized) ? normalized.slice(0, 3) : normalized.startsWith('/') ? '/' : '', dir: path.dirname(normalized), base, ext, name: ext ? base.slice(0, -ext.length) : base };
    },
    format: ({ dir = '', root = '', base = '', name = '', ext = '' }: { dir?: string; root?: string; base?: string; name?: string; ext?: string }) => {
        const filename = base || `${name}${ext.startsWith('.') || !ext ? ext : `.${ext}`}`;
        return path.join(dir || root, filename);
    },
    delimiter: ';',
    toNamespacedPath: (value = '') => value,
    parsePath: (value: string) => {
        const normalized = value.replaceAll('\\', '/');
        const match = /^([a-zA-Z]):\//.exec(normalized);
        const disk = match ? match[1].toUpperCase() : 'C';
        return { disk, path: normalize(normalized.replace(/^([a-zA-Z]):/, '')) };
    },
    toDirFormat: (value = '') => value.endsWith('/') ? value : `${value}/`
};

(path as any).posix = path;
(path as any).win32 = path;

// Shell helpers belong to path handling, not a filesystem compatibility layer.
(path as any).resolveEnvPath = (value = '') => value.replace(/%([^%]+)%|\$([A-Za-z_][\w]*)/g, (_: string, win: string, unix: string) => {
    const key = win || unix;
    return (globalThis as any).process?.env?.[key] ?? `%${key}%`;
});
(path as any).isValidAbsolutePath = (value = '') => /^[A-Za-z]:\//.test(value.replaceAll('\\', '/'));

export default path;
