/** Browser URL helpers intentionally kept outside the Node-style fs surface. */
const urls = new WeakMap<object, Map<string, string>>();

export async function getFileURL(fs: { readFile(path: string): Promise<Uint8Array> }, path: string, type = ''): Promise<string> {
    let cache = urls.get(fs);
    if (!cache) urls.set(fs, cache = new Map());
    const key = `${type}\0${path}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await fs.readFile(path);
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    const url = URL.createObjectURL(new Blob([copy.buffer], { type }));
    cache.set(key, url);
    return url;
}
