const codes = {
    'CORRUPTED_INSTALLATION': 0
}

const eventManager = (function () {
    const evtLSName = "WINBOWS_EVENTS";
    let evts = [];
    try {
        JSON.parse(localStorage.getItem(evtLSName) || '[]') || [];
        if (typeof evts !== 'array') {
            localStorage.removeItem(evtLSName);
            evts = [];
        }
    } catch (e) {
        console.error(e);
        evts = [];
    }

    /**
     * @typedef {Object} EventParam
     * @property {string} evt
     * @property {string} code
     * @property {string} msg
     * @property {string} [level]
     */

    /**
     * @param {EventParam} param0
     */
    function add({
        evt, code, msg, level
    }) {
        if (typeof evt !== 'string') return;
        if (typeof code !== 'string') return;
        if (typeof msg !== 'string') return;
        if (level) {
            if (typeof level !== 'string' || !['INFO', 'WARN', 'ERROR', 'FATAL'].includes(level.toUpperCase())) {
                level = 'INFO'
            }
        } else {
            level = 'INFO'
        }

        evts.push({ evt, code, msg, ts: Date.now(), level });
        localStorage.setItem(evtLSName, JSON.stringify(evts));
    }

    function list() {
        return evts.map(getEvt);
    }

    function last() {
        return getEvt(evts[evts.length - 1]);
    }

    function getEvt(evt) {
        return {
            mark: function (k, v) {
                evt[k] = v;
            },
            ...evt
        }
    }

    function clear() {
        evts = [];
        localStorage.removeItem(evtLSName);
    }

    return { add, list, last, clear };
})();

export { codes };