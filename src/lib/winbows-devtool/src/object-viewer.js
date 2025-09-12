import * as utils from "./utils";
import './object-viewer.css'

const symbols = {
    ellipsis: '…',
    function: 'ƒ'
};

function parseJSON(val) {
    const seen = new WeakSet();

    function parse(val) {
        if (utils.isObject(val)) {
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
        } else if (utils.isObject(val)) {
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
    if (['map', 'set', 'file', 'blob'].includes(type)) {
        return true;
    } else if (Array.isArray(obj)) {
        if (obj.length > 0) {
            return true;
        }
        return false;
    } else if (utils.isObject(obj)) {
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

function safeString(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return utils.safeEscape(str);
}

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

/**
 * 
 * @param {String} key
 * @returns 
 */
function wrapKey(key) {
    return `<span class="obj-viewer-key-preview obj-viewer-key">${safeString(key)}</span>`;
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
                let html = data.slice(0, 100).map(t => traversal(t, level + 1)).join(', ');
                if (len > 100) {
                    html += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`${len > 1 ? `<span class="obj-viewer-value-desc">(${safeString(len)})</span>` : ''} [${html}]`, 'array');
            } else {
                res = wrapValue(`Array(${safeString(len)})`, 'array');
            }
        } else if (type == 'object') {
            if (showDetail) {
                const keys = Reflect.ownKeys(data);
                let html = keys.slice(0, 5).map(k => {
                    const t = data[k];
                    return `${wrapKey(k)}: ${wrapValue(traversal(t, level + 1), getType(t))}`;
                }).join(', ');
                if (keys.length > 5) {
                    html += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`{${html}}`, 'object');
            } else {
                res = wrapValue(`{${symbols.ellipsis}}`, 'object');
            }
        } else if (type == 'string') {
            res = wrapValue(`\'${safeString(data)}\'`, 'string');
        } else if (type == 'function') {
            if (showDetail) {
                const fnCode = utils.functionToCode(data);
                const cName = data.constructor?.toString().toLowerCase() || '';
                const isArrow = !data.prototype && !/^(?:async\s+)?function/.test(fnCode);
                const isAsync = cName.includes('async');
                const isGenerator = cName.includes('generator');
                const isClass = (fnCode || '').trim().startsWith('class');
                if (isClass) {
                    res = wrapValue(`<span style="color: #ff8b1c;">class</span> ${safeString(data.prototype?.constructor?.name)}`, 'function');
                } else if (isArrow) {
                    res = wrapValue(`${isAsync ? `<span style="color: #ff8b1c;">async</span>` : ''} () => {}`, 'function');
                } else {
                    res += isAsync ? `<span style="color: #ff8b1c;">async</span>` : '';
                    res += `<span style="color: #ff8b1c;">${isAsync ? ' ' : ''}${symbols.function}</span>`;
                    res += isGenerator ? `<span style="color: #ff8b1c;">*</span>` : '';
                    res += ` ${data.name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? safeString(data.name) : ''}()`;
                    res = wrapValue(res, 'function');
                }
            } else {
                res = wrapValue(symbols.function, 'function');
            }
        } else if (utils.isElement(data)) {
            const id = data.id;
            const classArr = [...data.classList];
            const className = (classArr.length > 0 ? '.' : '') + classArr.join('.');
            res = wrapValue(`<span style="color: #659fff;">${safeString(data.tagName.toLowerCase())}</span><span style="color: #ff8f26;">${safeString(id ? '#' + id : '')}</span><span style="color: #a6d2ff;">${safeString(className)}</span>`, 'generic');
        } else if (type == "map") {
            if (showDetail) {
                const keys = [...data.keys()];
                let html = keys.slice(0, 5).map(k => {
                    const t = data.get(k);
                    return `${wrapValue(`\'${safeString(k)}\'`, 'string')} => ${traversal(t, level + 1)}`;
                }).join(', ');
                if (keys.length > 5) {
                    html += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`<span class="obj-viewer-value-desc">Map(${safeString(data.size)})</span> {${html}}`, 'map');
            } else {
                res = wrapValue(`Map(${safeString(data.size)})`, 'map');
            }
        } else if (type == "set") {
            if (showDetail) {
                const keys = [...data.keys()];
                let html = keys.slice(0, 5).map(k => {
                    return `${traversal(k, level + 1)}`;
                }).join(', ');
                if (keys.length > 5) {
                    html += ', ' + symbols.ellipsis;
                }
                res = wrapValue(`<span class="obj-viewer-value-desc">Set(${safeString(data.size)})</span> {${html}}`, 'set');
            } else {
                res = wrapValue(`Set(${safeString(data.size)})`, 'set');
            }
        } else if (type == 'error') {
            res = wrapValue('Error: ' + safeString(data.message), 'error');
        } else if ([
            // Normal types
            'number', 'boolean', 'null', 'undefined', 'symbol',
            // Other types
            'date', 'regexp'
        ].includes(type)) {
            // Always show text content
            res = wrapValue(safeString(data), type);
        } else {
            // Show type only
            res = wrapValue(safeString(utils.capitalizeFirstLetter(type)), type);
        }
        return res;
    }

    level = utils.isNumber(level) ? level : 0;

    return traversal(data, level);
}

function createEl({
    key, value, preview, separator, nextFn, type, expandable
}) {
    const item = document.createElement('div');
    const line = document.createElement('div');
    const next = document.createElement('div');
    const expand = document.createElement('div');
    const keyEl = document.createElement('div');
    const separatorEl = document.createTextNode((separator || ':') + ' ');
    const previewEl = document.createElement('div');

    item.className = 'obj-viewer-item';
    line.className = 'obj-viewer-line';
    next.className = 'obj-viewer-next';
    expand.className = 'obj-viewer-expand'

    item.appendChild(line);
    line.appendChild(expand);
    line.setAttribute('data-expandable', expandable == true);
    item.appendChild(next);

    if (expandable == true) {
        let expanded = false;
        line.setAttribute('data-expand', expanded);
        line.addEventListener('click', () => {
            expanded = !expanded;
            line.setAttribute('data-expand', expanded);
            next.innerHTML = '';
            nextFn(value, next);
        })
    }

    if (key && typeof key === 'string') {
        keyEl.className = 'obj-viewer-key';
        keyEl.textContent = key;
        line.appendChild(keyEl);
        line.appendChild(separatorEl);
    }

    previewEl.className = `obj-viewer-value ${type ? 'obj-viewer-value-' + type : ''}`;
    previewEl.innerHTML = preview;
    line.appendChild(previewEl);

    return { item, line, next, key: keyEl, preview: previewEl };
}

function handleArray(arr, parent, nextFn) {
    function getLevel(arr, parent, parentVLevels = 0, startIndex = 0) {
        const len = arr.length;
        const start = startIndex || 0;

        if (len > 100 || parentVLevels > 1 && len == 100) {
            const vLevels = parentVLevels ? parentVLevels - 1 : ~~(Math.log10(len - 1) / 2);
            const chunkSize = Math.pow(100, vLevels);
            const n = len / chunkSize;

            for (let i = 0; i < n; i++) {
                let value = arr.slice(i * chunkSize, (i + 1) * chunkSize);
                let range = [start + i * chunkSize, start + (i + 1) * chunkSize - 1];

                if (range[1] > len - 1 && start == 0) {
                    range[1] = len - 1;
                }
                if (range[0] == range[1]) {
                    value = value[0];
                }

                const { item } = createEl(range[0] == range[1] ? {
                    key: String(range[0]),
                    value,
                    preview: getPreview(value),
                    nextFn,
                    type: getType(value),
                    expandable: expandable(value)
                } : {
                    value,
                    preview: `[${range[0]} ${symbols.ellipsis} ${range[1]}]`,
                    nextFn: (_, next) => {
                        getLevel(value, next, vLevels, range[0]);
                    },
                    type: 'array',
                    expandable: true
                })
                parent.appendChild(item);
            }
        } else {
            for (let i = 0; i < len; i++) {
                const value = arr[i];
                const { item } = createEl({
                    key: String(start ? start + i : i),
                    value,
                    preview: getPreview(value),
                    nextFn,
                    type: getType(value),
                    expandable: expandable(value)
                })
                parent.appendChild(item);
            }
        }
    }

    return getLevel(arr, parent);
}

const triggerEvent = Symbol('triggerEvent');
const listeners = Symbol('listeners');

class ObjectViewer {
    constructor(obj, options = {
        shallow: false
    }) {
        this.options = utils.isObject(options) ? options : {
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

        if (!expandable(obj)) {
            this.container.innerHTML = this.getPreview(obj, this.options.shallow ? 1 : 0);
            return;
        } else {
            this.overviewContent.innerHTML = this.getPreview(obj, this.options.shallow ? 1 : 0);
        }

        this.container.addEventListener('click', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();
        })

        this.overview.addEventListener('click', () => {
            expanded = !expanded;
            this.overview.setAttribute('data-expand', expanded);
            this.content.innerHTML = '';
            this.getLevel(obj, this.content);
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

        if (type == 'array') {
            return handleArray(data, parent, this.getLevel.bind(this));
        } else if (type == 'object') {
            const commonKeys = Object.keys(data).sort();
            const propertyKeys = Object.getOwnPropertyNames(data).filter(t => !commonKeys.includes(t)).sort();
            const symbolKeys = Object.getOwnPropertySymbols(data);

            commonKeys.concat(symbolKeys).forEach(k => {
                const value = data[k];
                const { item, key } = createEl({
                    key: k?.toString(),
                    value,
                    preview: getPreview(value),
                    nextFn: this.getLevel.bind(this),
                    type: getType(value),
                    expandable: expandable(value)
                })
                parent.appendChild(item);
            });

            propertyKeys.forEach(k => {
                const value = data[k];
                const { item, key } = createEl({
                    key: k,
                    value,
                    preview: getPreview(value),
                    nextFn: this.getLevel.bind(this),
                    type: getType(value),
                    expandable: expandable(value)
                })
                parent.appendChild(item);
                key.style.opacity = '.6';
            });
        } else if (type == 'map') {
            data.keys().forEach((key, i) => {
                const value = data.get(key);
                const { item } = createEl({
                    key: String(i),
                    value: { key, value },
                    preview: `{\'${safeString(key)}\' => ${this.getPreview(value, 1)}}`,    // Prevent XSS
                    nextFn: this.getLevel.bind(this),
                    type: 'styleless',
                    expandable: true
                })
                parent.appendChild(item);
            })
        } else if (type == 'set') {
            data.keys().forEach((value, i) => {
                const { item } = createEl({
                    key: String(i),
                    value: { value },
                    preview: this.getPreview(value, 1),
                    nextFn: this.getLevel.bind(this),
                    type: 'styleless',
                    expandable: true
                })
                parent.appendChild(item);
            })
        } else if (type == 'file') {
            const props = ["lastModified", "lastModifiedDate", "name", "size", "type", "webkitRelativePath"];
            props.forEach(prop => {
                const value = data[prop];
                const { item } = createEl({
                    key: prop,
                    value,
                    preview: this.getPreview(value),
                    nextFn: this.getLevel.bind(this),
                    type: getType(value),
                    expandable: false
                })
                parent.appendChild(item);
            })
        } else if (type == 'blob') {
            const props = ["size", "type"];
            props.forEach(prop => {
                const value = data[prop];
                const { item } = createEl({
                    key: prop,
                    value,
                    preview: this.getPreview(value),
                    nextFn: this.getLevel.bind(this),
                    type: getType(value),
                    expandable: false
                })
                parent.appendChild(item);
            })
        } else {
            try {
                const props = Reflect.ownKeys(data);

                props.forEach(k => {
                    const value = data[k];
                    const { item, key } = createEl({
                        key: k?.toString(),
                        value,
                        preview: getPreview(value),
                        nextFn: this.getLevel.bind(this),
                        type: getType(value),
                        expandable: expandable(value)
                    })
                    parent.appendChild(item);
                });
            } catch (e) { }
        }
    }
    getPreview = getPreview
}

ObjectViewer.utils = { isJSON: utils.isJSON, isObject: utils.isObject, isElement: utils.isElement, isFinite, isNaN, getType, getClassName, expandable, parseJSON, getPreview }

export default ObjectViewer;