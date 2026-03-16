export function serialize(obj: any): Uint8Array {
    return new TextEncoder().encode(
        JSON.stringify(obj, (_, v) =>
            v instanceof Map ? { __map__: [...v] } : v
        )
    );
}

export function deserialize<T>(raw: Uint8Array): T {
    return JSON.parse(
        new TextDecoder().decode(raw),
        (_, v) => (v?.__map__ ? new Map(v.__map__) : v)
    );
}
