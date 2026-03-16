import crashHandler from "./crashHandler.js";
import SystemInformation from "./sysInfo.js";

const flags = {
    disableConsoleOutput: false
}
const Log = (function () {
    let logs = [];
    let startTime = Date.now();
    let lastTime = startTime;
    let version = 2;

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
                // \object{\object_pair{key="",val=""},...}
                // \object{circular=\boolean{"true"}}
                if (seen.has(data)) {
                    return '\\object{circular=\\boolean{\"true\"}}';
                }
                seen.add(data);
                res = `\\object{${Reflect.ownKeys(data).map(k => {
                    return `\\object_pair{key=\"${String(k)}\",val=${traversal(data[k])}}`
                }).join(",")}}`
            } else if (type === 'array') {
                // \array{"",...}
                res = `\\array{${data.map(v => {
                    return traversal(v);
                }).join(",")}}`;
            } else if (type === 'map') {
                // \map{\map_pair{key="",val=""},...}
                res = `\\map{${data.keys().map((key, i) => {
                    return `\\map_pair{key=\"${key}\",val=${traversal(data.get(key))}}`;
                }).join?.(",") || ""}}`;
            } else if (type === 'set') {
                // \set{"",...}
                res = `\\set{${data.values().map((value, i) => {
                    return `${traversal(value)}`;
                }).join?.(",") || ""}}`
            } else if (type === 'file') {
                // \file{lastModified="",lastModifiedDate="",...}
                const props = ["lastModified", "lastModifiedDate", "name", "size", "type", "webkitRelativePath"];
                res = `\\file{${props.map(prop => {
                    return `${prop}=${traversal(value)}`;
                }).join(",")}}`
            } else if (type === 'blob') {
                // \blob{size="",type=""}
                const props = ["size", "type"];
                res = `\\blob{${props.map(prop => {
                    return `${prop}=${traversal(value)}`
                }).join(",")}}}`
            } else if (type === 'string') {
                // "..."
                res = `"${data.replace(/\\comma/, "\\\\comma").replace(/\,/gi, "\\comma")}"`;
            } else if (type == 'function') {
                // \class{name=""}
                // \arrow_func{async=\boolean{""}}
                // \func{async=\boolean{""},generator=\boolean{""},name=""}
                const fnCode = functionToCode(data);
                const cName = data.constructor?.toString().toLowerCase() || '';
                const isArrow = !data.prototype && !/^(?:async\s+)?function/.test(fnCode);
                const isAsync = cName.includes('async');
                const isGenerator = cName.includes('generator');
                const isClass = (fnCode || '').trim().startsWith('class');
                res = '';
                if (isClass) {
                    res = `\\class{name="${data.prototype?.constructor?.name}"}`;
                } else if (isArrow) {
                    res = `\\arrow_func{async=\\boolean{\"${isAsync}\"}}`;
                } else {
                    res = `\\func{async=\\boolean{\"${isAsync}\"},generator=\\boolean{\"${isGenerator}\"},name=\"${data.name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? data.name : ''}\"}`;
                }
            } else if (isElement(data)) {
                // \element{name="",id="",classname=""}
                const id = data.id;
                const classArr = [...data.classList];
                const className = (classArr.length > 0 ? '.' : '') + classArr.join('.');
                res = `\\element{name=\"${data.tagName.toLowerCase()}\",id=\"${id}\",classname=\"${className}\"}`;
            } else if (type == 'error') {
                // \error{name="",message=""}
                res = `\\err{name=\"${data.name}\",message=\"${data.message}\"}`;
            } else if ([
                // Normal types
                'number', 'boolean', 'null', 'undefined', 'symbol',
                // Other types
                'date', 'regexp'
            ].includes(type)) {
                // \<T>{""}
                res = `\\${type}{\"${String(data)}\"}`;
            } else {
                // Show type only
                // \unknown_obj{"T"}
                res = `\\unknown_obj{\"${capitalizeFirstLetter(type)}\"}`;
            }
            return res;
        }

        return traversal(data);

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
            module: log.module,
            level,
            args: log.args.map(toJSONstr)
        };

        logs.push(entry);

        if (level === 'FATAL') {
            if (typeof log.args[0] === 'string') {
                crashHandler(new Error(log.args[0]));
            } else {
                crashHandler(log.args);
            }
        }

        if (flags.disableConsoleOutput) return;

        if (level === 'INFO' || (SystemInformation.mode === 'development' && level === 'DEBUG')) {
            // INFO, DEBUG ( Only shown during development )
            console.log(`%c${entry.time} Σ${entry.sum}ms Δ${entry.delta}ms\n%c[${log.module}]:%c`, 'color: rgb(154 154 154);'
                , 'color: rgb(192 170 251);font-weight:bold;', 'color: unset;font-weight:bold;', ...log.args);
        } else if (level === 'WARN') {
            // WARN
            console.warn(`[${log.module}]:`, ...log.args)
        } else if (level === 'ERROR' || level === 'FATAL') {
            // ERROR, FATAL
            console.error(`[${log.module}]:`, ...log.args)
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
    debug(...args) {
        Log.append({
            args,
            module: this.module,
            level: 'debug'
        })
    }
    info(...args) {
        Log.append({
            args,
            module: this.module,
            level: 'info'
        })
    }
    warn(...args) {
        Log.append({
            args,
            module: this.module,
            level: 'warn'
        })
    }
    error(...args) {
        Log.append({
            args,
            module: this.module,
            level: 'error'
        })
    }
    fatal(...args) {
        Log.append({
            args,
            module: this.module,
            level: 'fatal'
        })
    }
}

export default Logger;
export const WinbowsDebugLog = Log;