const startTime = Date.now();
const _stat = {
    running: true
}

export const stat = {
    set(k, v) {
        _stat[k] = v;
    },
    get(k) {
        return _stat[k];
    }
}