'use strict';

const symbols = {
    ellipsis: '…',
    function: 'ƒ'
};

function functionToCode(fn) {
    try {
        return Function.prototype.toString.call(fn);
    } catch (e) { }
    try {
        return fn + '';
    } catch (e) { }
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

function isJSON(item) {
    let value = typeof item !== "string" ? JSON.stringify(item) : item;
    try {
        value = JSON.parse(value);
    } catch (e) {
        return false;
    }

    return typeof value === "object" && value !== null;
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

function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

function parseJSON(val) {
    const seen = new WeakSet();

    function parse(val) {
        if (isObject(val)) {
            if (seen.has(val)) return '[Circular]';
            seen.add(val);
        }
        if (typeof val === 'string') {
            try {
                val = JSON.parse(val);
            } catch (e) {
                return '';
            }
        }
        if (Array.isArray(val)) {
            return val.map(t => parse(t));
        } else if (isObject(val)) {
            const result = {};
            Object.keys(val).forEach(key => {
                result[key] = parse(val[key]);
            })
            return result;
        } else {
            return val;
        }
    }

    return parse(val);
}

function expandable(obj) {
    const type = getType(obj);
    if (['map', 'set'].includes(type)) {
        return true;
    } else if (Array.isArray(obj)) {
        if (obj.length > 0) {
            return true;
        }
        return false;
    } else if (isObject(obj)) {
        if (Object.keys(obj).length > 0) {
            return true;
        }
        return false;
    } else {
        return false;
    }
}

function setAttribute(element, value) {
    if (expandable(value)) {
        element.setAttribute('data-expandable', true);
    } else {
        element.setAttribute('data-expandable', false);
    }
}

function getClassName(value) {
    var type = typeof value;
    switch (type) {
        case 'string':
            return 'obj-viewer-value-string';
        case 'number':
            return 'obj-viewer-value-number';
        case 'boolean':
            return 'obj-viewer-value-symbol';
        case 'object':
            if (value === null) {
                return 'obj-viewer-value-empty';
            } else if (Array.isArray(value)) {
                return 'obj-viewer-value-generic';
            } else {
                return 'obj-viewer-value-generic';
            }
        case 'undefined':
            return 'obj-viewer-value-empty';
        default:
            return 'obj-viewer-value-generic';
    }
}

function getStackTrace() {
    var stack;

    try {
        throw new Error('');
    } catch (error) {
        stack = error.stack || '';
    }

    stack = stack.split('\n').map(function (line) { return line.trim(); });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
}

/*
function getType(value) {
    var type = typeof value;
    switch (type) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'object':
            if (value === null) {
                return 'null';
            } else if (Array.isArray(value)) {
                return 'array';
            } else if (isObject(value)) {
                return 'object';
            } else {
                return 'object?';
            }
        case 'undefined':
            return 'undefined';
        default:
            return 'unknown';
    }
}*/

function isRegularType(obj) {
    return ['string', 'boolean', 'number', 'undefined', 'null', 'function', 'symbol', 'array', 'object'].includes(obj);
}

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

function getBracket(value, type) {
    if (type == 'array') {
        return `[${value}]`;
    } else if (type == 'object') {
        return `{${value}}`;
    } else {
        return value;
    }
}

function wrapKey(key) {
    return `<span class="obj-viewer-key-preview obj-viewer-key">${key.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`;
}

/**
 * Wrap value with span tag
 * @param {*} val 
 * @param {('array'|'object'|'null'|'undefined'|'number'|'boolean'|'symbol'|'function'|'string')} type 
 * @returns 
 */
function wrapValue(val, type) {
    return `<span class="obj-viewer-value-preview obj-viewer-value-${type}">${val}</span>`;
}

/**
 * getPreview
 * @param {any} data 
 * @param {Number} level 
 * @returns {String}
 */
function getPreview(data, level = 0) {
    const seen = new WeakSet();

    function traversal(data, level) {
        const type = getType(data);
        const showDetail = level == 0;
        let res = '';

        if (type == 'object') {
            if (seen.has(data)) {
                return '[Circular]';
            }
            seen.add(data);
        }

        if (level > 2) return symbols.ellipsis;
        if (type == 'array') {
            const len = data.length;
            if (showDetail) {
                res = data.slice(0, 100).map(t => traversal(t, level + 1)).join(', ');
                if (len > 100) {
                    res += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`${len > 1 ? `<span class="obj-viewer-value-desc">(${len})</span>` : ''} [${res}]`, 'array');
            } else {
                res = wrapValue(`Array(${len})`, 'array');
            }
        } else if (type == 'object') {
            if (showDetail) {
                const keys = Object.keys(data);
                res = keys.slice(0, 5).map(k => {
                    const t = data[k];
                    return `${wrapKey(k)}: ${wrapValue(traversal(t, level + 1), getType(t))}`;
                }).join(', ');
                if (keys.length > 5) {
                    res += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`{${res}}`, 'object');
            } else {
                res = wrapValue(`{${symbols.ellipsis}}`, 'object');
            }
        } else if (type == 'string') {
            res = wrapValue(`\'${data.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}\'`, 'string');
        } else if (type == 'number') {
            res = wrapValue(data, 'number');
        } else if (type == 'boolean') {
            res = wrapValue(data, 'boolean');
        } else if (type == 'null') {
            res = wrapValue('null', 'null');
        } else if (type == 'undefined') {
            res = wrapValue('undefined', 'undefined');
        } else if (type == 'symbol') {
            res = wrapValue(String(data), 'symbol');
        } else if (type == 'function') {
            if (showDetail) {
                const fnCode = functionToCode(data);
                const cName = data.constructor?.toString().toLowerCase() || '';
                const isArrow = !data.prototype && !/^(?:async\s+)?function/.test(fnCode);
                const isAsync = cName.includes('async');
                const isGenerator = cName.includes('generator');
                const isClass = (fnCode || '').trim().startsWith('class');
                if (isClass) {
                    res = wrapValue(`<span style="color: #ff8b1c;">class</span> ${data.prototype?.constructor?.name}`, 'function');
                } else if (isArrow) {
                    res = wrapValue(`${isAsync ? `<span style="color: #ff8b1c;">async</span>` : ''} () => {}`, 'function');
                } else {
                    res += isAsync ? `<span style="color: #ff8b1c;">async</span>` : '';
                    res += `<span style="color: #ff8b1c;">${isAsync ? ' ' : ''}${symbols.function}</span>`;
                    res += isGenerator ? `<span style="color: #ff8b1c;">*</span>` : '';
                    res += ` ${data.name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? data.name : ''}()`;
                    res = wrapValue(res, 'function');
                }
            } else {
                res = wrapValue(symbols.function, 'function');
            }
        } else if (isElement(data)) {
            const id = data.id;
            const classArr = [...data.classList];
            const className = (classArr.length > 0 ? '.' : '') + classArr.join('.');
            res = wrapValue(`<span style="color: #659fff;">${data.tagName.toLowerCase()}</span><span style="color: #ff8f26;">${id ? '#' + id : ''}</span><span style="color: #a6d2ff;">${className}</span>`, 'generic');
        } else if (type == "map") {
            if (showDetail) {
                const keys = [...data.keys()];
                res = keys.slice(0, 5).map(k => {
                    const t = data.get(k);
                    return `${wrapValue(`\'${k}\'`, 'string')} => ${traversal(t, level + 1)}`;
                }).join(', ');
                if (keys.length > 5) {
                    res += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`<span class="obj-viewer-value-desc">Map(${data.size})</span> {${res}}`, 'map');
            } else {
                res = wrapValue(`Map(${data.size})`, 'map');
            }
        } else if (type == "set") {
            if (showDetail) {
                const keys = [...data.keys()];
                res = keys.slice(0, 5).map(k => {
                    return `${traversal(k, level + 1)}`;
                }).join(', ');
                if (keys.length > 5) {
                    res += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`<span class="obj-viewer-value-desc">Set(${data.size})</span> {${res}}`, 'set');
            } else {
                res = wrapValue(`Set(${data.size})`, 'set');
            }
        } else if (['date', 'regexp'].includes(type)) {
            // Always show text content
            res = wrapValue(String(data).replaceAll("<", "&lt;").replaceAll(">", "&gt;"), type);
        } else {
            res = wrapValue(capitalizeFirstLetter(type).replaceAll("<", "&lt;").replaceAll(">", "&gt;"), type);
        }
        return res;
    }

    level = isNumber(level) ? level : 0;

    return traversal(data, level);
}

const triggerEvent = Symbol('triggerEvent');
const listeners = Symbol('listeners');

class Viewer {
    constructor(obj, options = {
        shallow: false
    }) {
        this.options = isObject(options) ? options : {
            shallow: false
        };
        this.container = document.createElement('div');
        this.overview = document.createElement('div');
        this.overviewExpand = document.createElement('div');
        this.overviewContent = document.createElement('div');
        this.content = document.createElement('div');

        this.container.className = 'obj-viewer-container';
        this.overview.className = 'obj-viewer-overview';
        this.overviewExpand.className = 'obj-viewer-expand';
        this.overviewContent.className = 'obj-viewer-overview-content';
        this.content.className = 'obj-viewer-content';

        this.container.appendChild(this.overview);
        this.container.appendChild(this.content);
        this.overview.appendChild(this.overviewExpand);
        this.overview.appendChild(this.overviewContent);

        setAttribute(this.overview, obj);

        var expanded = false;
        var appended = false;
        /*
        Object.keys(parsed).forEach(key1 => {
            if (isObject(parsed[key1])) {
                parsed[key1].forEach(key2 => {
                    if (isObject(parsed[key1][key2])) {
                        parsed[key1][key2].forEach(key3 => {
                            overviewText += parsed[key1][key2][key3];
                        })
                    }
                })
            }
        })
            */

        if (!expandable(obj)) {
            this.container.innerHTML = this.getPreview(obj, this.options.shallow ? 1 : 0);
            return;
        } else {
            this.overviewContent.innerHTML = this.getPreview(obj, this.options.shallow ? 1 : 0);
        }

        this.overview.addEventListener('click', () => {
            expanded = !expanded;
            this.overview.setAttribute('data-expand', expanded);
            this.content.innerHTML = '';
            this.getLevel(obj, this.content);
        })
        this.overview.addEventListener('pointerenter', () => {
            this[triggerEvent]('pointerChange', {
                type: getType(obj),
                levels: [{
                    type: getType(obj),
                    key: '…',
                    item: this.overview
                }],
                value: obj
            })
        })

        this[triggerEvent] = (event, details) => {
            if (this[listeners][event]) {
                this[listeners][event].forEach(listener => {
                    listener(details);
                })
            }
        }
        this[listeners] = {};

        return this;
    }
    on(event, listener) {
        if (!this[listeners][event]) {
            this[listeners][event] = [];
        }
        this[listeners][event].push(listener);
    }
    getLevel(data, parent, parentData = {
        levels: [],
        type: 'generic',
        start: 0,
        parentVLevels: undefined
    }) {
        const type = getType(data);
        const parentLevels = [...parentData.levels];

        if (type == 'array') {
            const len = data.length
            let start = parentData.start || 0;
            const parentVLevels = parentData.parentVLevels;
            if (len > 100 || parentVLevels > 1 && len == 100) {
                // Large Array
                const vLevels = parentVLevels ? parentVLevels - 1 : ~~(Math.log10(len - 1) / 2);
                const chunkSize = Math.pow(100, vLevels);
                const n = len / chunkSize;

                for (let i = 0; i < n; i++) (i => {
                    var item = document.createElement('div');
                    var line = document.createElement('div');
                    var next = document.createElement('div');
                    var expanded = false;
                    var append = false;

                    var value = data.slice(i * chunkSize, (i + 1) * chunkSize);
                    var range = [start + i * chunkSize, start + (i + 1) * chunkSize - 1];

                    if (range[1] > len - 1 && start == 0) {
                        range[1] = len - 1;
                    }
                    if (range[0] == range[1]) {
                        value = value[0];
                    }

                    item.className = 'obj-viewer-item';
                    line.className = 'obj-viewer-line';
                    next.className = 'obj-viewer-next';
                    line.innerHTML = `<div class="obj-viewer-expand"></div>${range[0] == range[1] ?
                        `<div class="obj-viewer-key">${range[0]}</div>: <div class="obj-viewer-value obj-viewer-value-array">${this.getPreview(value)}</div>` :
                        `<div class="obj-viewer-value obj-viewer-value-array">[${range[0]} ${symbols.ellipsis} ${range[1]}]</div>`}</div>`;

                    line.setAttribute('data-expandable', expandable(value));
                    line.setAttribute('data-expand', expanded);
                    line.addEventListener('click', () => {
                        if (expandable(value)) {
                            expanded = !expanded;
                            line.setAttribute('data-expand', expanded);
                            next.innerHTML = '';
                            this.getLevel(value, next, {
                                type: 'array',
                                levels: parentLevels,
                                item: line,
                                parentVLevels: vLevels,
                                start: range[0]
                            });
                        }
                    })
                    line.addEventListener('pointerenter', () => {
                        this[triggerEvent]('pointerChange', {
                            type: 'array',
                            levels: parentLevels,
                            value,
                            item: line
                        })
                    })
                    item.appendChild(line);
                    item.appendChild(next);
                    parent.appendChild(item);
                })(i);
            } else {
                for (let i = 0; i < len; i++) (i => {
                    var item = document.createElement('div');
                    var line = document.createElement('div');
                    var next = document.createElement('div');
                    var expanded = false;
                    var append = false;

                    var value = data[i];
                    var key = i;

                    item.className = 'obj-viewer-item';
                    line.className = 'obj-viewer-line';
                    next.className = 'obj-viewer-next';
                    line.innerHTML = `<div class="obj-viewer-expand"></div><div class="obj-viewer-key">${start ? start + i : i}</div>: <div class="obj-viewer-value obj-viewer-value-${type}">${this.getPreview(value)}</div>`;

                    line.setAttribute('data-expandable', expandable(value));
                    line.setAttribute('data-expand', expanded);
                    line.addEventListener('click', () => {
                        expanded = !expanded;
                        line.setAttribute('data-expand', expanded);
                        next.innerHTML = '';
                        this.getLevel(value, next, {
                            type: 'array',
                            levels: parentLevels,
                            item: line
                        });
                    })
                    line.addEventListener('pointerenter', () => {
                        this[triggerEvent]('pointerChange', {
                            type: 'array',
                            levels: parentLevels,
                            value,
                            item: line
                        })
                    })
                    item.appendChild(line);
                    item.appendChild(next);
                    parent.appendChild(item);
                })(i);
            }
        } else if (type == 'object') {
            const commonKeys = Object.keys(data).sort();
            const propertyKeys = Object.getOwnPropertyNames(data).filter(t => !commonKeys.includes(t)).sort();
            const el = (key, t) => {
                var item = document.createElement('div');
                var line = document.createElement('div');
                var next = document.createElement('div');
                var expanded = false;
                var append = false;
                var value = data[key];
                var type = getType(value);
                item.className = 'obj-viewer-item';
                line.className = 'obj-viewer-line';
                next.className = 'obj-viewer-next';
                line.innerHTML = `<div class="obj-viewer-expand"></div><div class="obj-viewer-key" ${t == 'pk' ? 'style="opacity:.6"' : ''}>${key}</div>: <div class="obj-viewer-value obj-viewer-value-${type}">${this.getPreview(value)}</div>`;

                line.setAttribute('data-expandable', expandable(value));
                line.setAttribute('data-expand', expanded);
                line.addEventListener('click', () => {
                    if (expandable(value) == true) {
                        expanded = !expanded;
                        line.setAttribute('data-expand', expanded);
                        next.innerHTML = '';
                        this.getLevel(value, next, {
                            type,
                            levels: parentLevels.concat([{
                                type,
                                key: key,
                                item: line
                            }])
                        });
                    }
                })
                line.addEventListener('pointerenter', () => {
                    this[triggerEvent]('pointerChange', {
                        type: getType(value),
                        levels: parentLevels.concat([{
                            type,
                            key: key,
                            item: line
                        }]),
                        value
                    })
                })
                item.appendChild(line);
                item.appendChild(next);
                parent.appendChild(item);
            }
            commonKeys.forEach(key => {
                el(key, 'ck');
            });
            propertyKeys.forEach(key => {
                el(key, 'pk');
            });
        } else if (type == 'map') {
            data.keys().forEach((key, i) => {
                var item = document.createElement('div');
                var line = document.createElement('div');
                var next = document.createElement('div');
                var expanded = false;
                var append = false;
                var value = data.get(key);
                var type = getType(value);
                item.className = 'obj-viewer-item';
                line.className = 'obj-viewer-line';
                next.className = 'obj-viewer-next';
                line.innerHTML = `<div class="obj-viewer-expand"></div><div class="obj-viewer-key">${i}</div>: <div class="obj-viewer-value obj-viewer-value-object obj-viewer-value-styleless">{\'${key}\' => ${this.getPreview(value, 1)}}</div>`;

                line.setAttribute('data-expandable', true);
                line.setAttribute('data-expand', expanded);
                line.addEventListener('click', () => {
                    expanded = !expanded;
                    line.setAttribute('data-expand', expanded);
                    next.innerHTML = '';
                    this.getLevel({
                        key,
                        value
                    }, next, {
                        type,
                        levels: parentLevels.concat([{
                            type,
                            key: i,
                            item: line
                        }])
                    });
                })
                line.addEventListener('pointerenter', () => {
                    this[triggerEvent]('pointerChange', {
                        type,
                        levels: parentLevels.concat([{
                            type,
                            key: i,
                            item: line
                        }]),
                        value
                    })
                })
                item.appendChild(line);
                item.appendChild(next);
                parent.appendChild(item);
            });
        } else if (type == 'set') {
            data.keys().forEach((value, i) => {
                var item = document.createElement('div');
                var line = document.createElement('div');
                var next = document.createElement('div');
                var expanded = false;
                var append = false;
                var type = getType(value);
                item.className = 'obj-viewer-item';
                line.className = 'obj-viewer-line';
                next.className = 'obj-viewer-next';
                line.innerHTML = `<div class="obj-viewer-expand"></div><div class="obj-viewer-key">${i}</div>: <div class="obj-viewer-value obj-viewer-value-object obj-viewer-value-styleless">${this.getPreview(value, 1)}</div>`;

                line.setAttribute('data-expandable', true);
                line.setAttribute('data-expand', expanded);
                line.addEventListener('click', () => {
                    expanded = !expanded;
                    line.setAttribute('data-expand', expanded);
                    next.innerHTML = '';
                    this.getLevel({
                        value
                    }, next, {
                        type,
                        levels: parentLevels.concat([{
                            type,
                            key: i,
                            item: line
                        }])
                    });
                })
                line.addEventListener('pointerenter', () => {
                    this[triggerEvent]('pointerChange', {
                        type,
                        levels: parentLevels.concat([{
                            type,
                            key: i,
                            item: line
                        }]),
                        value
                    })
                })
                item.appendChild(line);
                item.appendChild(next);
                parent.appendChild(item);
            });
        }
    }
    getPreview = getPreview
}

Viewer.utils = { isJSON, isObject, isElement, isFinite, isNaN, getType, getClassName, expandable, parseJSON, getPreview }

export default Viewer;