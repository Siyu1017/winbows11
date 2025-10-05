import crashHandler from "./crashHandler.js";
import SystemInformation from "./sysInfo.js";

const Log = (function () {
    let logs = [];
    let startTime = Date.now();
    let lastTime = startTime;
    let version = 1;

    function getType(obj) {
        const type = typeof obj;
        if (obj === null) return 'null';
        if (type === 'string') return 'string';
        if (type === 'boolean') return 'boolean';
        if (type === 'number') return 'number';
        if (type === 'undefined') return 'undefined';
        if (type === 'symbol') return 'symbol';
        if (type === 'function') return 'function';
        if (Array.isArray(obj)) return 'array';
        if ({}.toString.call(obj) === '[object Object]') return 'object';
        if (type === 'object') {
            return {}.toString.call(obj).slice(8, -1).toLowerCase();
        }
    }

    function functionToCode(fn) {
        try {
            return Function.prototype.toString.call(fn);
        } catch (e) { }
        try {
            return fn + '';
        } catch (e) { }
    }

    function isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch (e) {
            return (typeof obj === "object") &&
                (obj.nodeType === 1) && (typeof obj.style === "object") &&
                (typeof obj.ownerDocument === "object");
        }
    }

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    function toJSONstr(data) {
        const seen = new WeakSet();

        function traversal(data) {
            const type = getType(data);
            let res;

            if (type == 'object') {
                if (seen.has(data)) {
                    return '"[Circular]"';
                }
                seen.add(data);
                res = {};
                Reflect.ownKeys(data).forEach(k => {
                    res[k] = traversal(data[k]);
                })
            } else if (type === 'array') {
                res = data.map(traversal);
            } else if (type === 'map') {
                res = {};
                data.keys().forEach((key, i) => {
                    res[i] = {
                        key,
                        value: traversal(data.get(key))
                    }
                })
            } else if (type === 'set') {
                res = {};
                data.values().forEach((value, i) => {
                    res[i] = { value: traversal(value) }
                })
            } else if (type === 'file') {
                const props = ["lastModified", "lastModifiedDate", "name", "size", "type", "webkitRelativePath"];
                res = {};
                props.forEach((prop) => {
                    const value = data[prop];
                    res[prop] = traversal(value);
                })
            } else if (type === 'blob') {
                const props = ["size", "type"];
                res = {};
                props.forEach((prop) => {
                    const value = data[prop];
                    res[prop] = traversal(value);
                })
            } else if (type === 'string') {
                res = data;
            } else if (type == 'function') {
                const fnCode = functionToCode(data);
                const cName = data.constructor?.toString().toLowerCase() || '';
                const isArrow = !data.prototype && !/^(?:async\s+)?function/.test(fnCode);
                const isAsync = cName.includes('async');
                const isGenerator = cName.includes('generator');
                const isClass = (fnCode || '').trim().startsWith('class');
                res = '';
                if (isClass) {
                    res = `class ${data.prototype?.constructor?.name}`;
                } else if (isArrow) {
                    res = `${isAsync ? `async` : ''} () => {}`;
                } else {
                    res += isAsync ? `async ` : '';
                    res += 'ƒ';
                    res += isGenerator ? `*` : '';
                    res += ` ${data.name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? data.name : ''}()`;
                }
            } else if (isElement(data)) {
                const id = data.id;
                const classArr = [...data.classList];
                const className = (classArr.length > 0 ? '.' : '') + classArr.join('.');
                res = data.tagName.toLowerCase() + (id ? `#${id}` : '') + className;
            } else if (type == 'error') {
                res = `Error[${data.message}]`;
            } else if ([
                // Normal types
                'number', 'boolean', 'null', 'undefined', 'symbol',
                // Other types
                'date', 'regexp'
            ].includes(type)) {
                res = String(data);
            } else {
                // Show type only
                res = capitalizeFirstLetter(type);
            }
            return res;
        }

        try {
            return JSON.stringify(traversal(data));
        } catch (e) {
            return String(data);
        }
    }

    function append(log) {
        const now = Date.now();

        const delta = now - lastTime;
        const sum = now - startTime;
        const level = log.level.toUpperCase();

        if (!['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(level)) return;

        lastTime = now;

        const entry = {
            time: new Date().toISOString(),
            sum: Math.round(sum),
            delta: Math.round(delta),
            msg: log.msg,
            module: log.module,
            level,
            data: log.data ? toJSONstr(log.data) : null
        };

        logs.push(entry);

        if (level === 'INFO' || (SystemInformation.mode === 'development' && level === 'DEBUG')) {
            // INFO & DEBUG ( Only shown during development )
            console.log(`%c${entry.time} Σ${entry.sum}ms Δ${entry.delta}ms\n%c[${log.module}]: %c${log.msg}`, 'color: rgb(154 154 154);'
                , 'color: rgb(192 170 251);font-weight:bold;', 'color: unset;font-weight:bold;', log.data ? log.data : '');
        } else if (level === 'WARN') {
            // WARN
            console.warn(`[${log.module}]: ${log.msg}`, log.data ? log.data : '')
        } else if (level === 'ERROR' || level === 'FATAL') {
            // ERROR, FATAL
            console.error(`[${log.module}]: ${log.msg}`, log.data ? log.data : '')
        }

        if (level === 'FATAL') {
            if (typeof log.msg === 'string') {
                crashHandler(new Error(log.msg));
            } else {
                crashHandler(log.msg);
            }
        }
    }

    function exportFile(filename) {
        const content = logs.map(e => JSON.stringify(e)).join("\n");
        const blob = new Blob([`//VERSION=${version},TYPE=NDJSON\n`, content], { type: "application/winbowslog" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || 'debug.log';
        a.click();
        URL.revokeObjectURL(url);
    }

    return {
        export: exportFile,
        append: append
    }
})();

class Logger {
    constructor({
        module
    }) {
        if (!module || typeof module != 'string') return;
        this.module = module;
    }
    debug(msg, data = null) {
        Log.append({
            msg,
            data,
            module: this.module,
            level: 'debug'
        })
    }
    info(msg, data = null) {
        Log.append({
            msg,
            data,
            module: this.module,
            level: 'info'
        })
    }
    warn(msg, data = null) {
        Log.append({
            msg,
            data,
            module: this.module,
            level: 'warn'
        })
    }
    error(msg, data = null) {
        Log.append({
            msg,
            data,
            module: this.module,
            level: 'error'
        })
    }
    fatal(msg, data = null) {
        Log.append({
            msg,
            data,
            module: this.module,
            level: 'fatal'
        })
    }
}

export default Logger;
export const WinbowsDebugLog = Log;