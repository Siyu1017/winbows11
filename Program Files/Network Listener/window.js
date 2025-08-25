/**
 * Devtool for Winbows11
 * Copyright 2023 - 2024 (c) Siyu1017
 * All rights reserved.
 */

'use strict';

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(path.resolve('./window.css'));
document.head.appendChild(style);

var requests = [];

'use strict';

function isJSON(item) {
    let value = typeof item !== "string" ? JSON.stringify(item) : item;
    try {
        value = JSON.parse(value);
    } catch (e) {
        return false;
    }

    return typeof value === "object" && value !== null;
}

function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

function expandable(obj) {
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            return true;
        }
        return false;
    } else if (isObject(obj)) {
        if (Object.values(obj).length > 0) {
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

function parseJSON(json, self = false) {
    try {
        if (self == false) {
            json = JSON.parse(json);
        }
        var result = json;
        if (Array.isArray(json)) {
            result = [];
            json.forEach(obj => {
                result.push(parseJSON(obj, true))
            })
            return result;
        } else if (isObject(json)) {
            result = {};
            Object.keys(json).forEach(key => {
                result[key] = parseJSON(json[key], true);
            })
            return result;
        } else {
            return result;
        }
    } catch (e) { }
}

function isLargeArray(array) {
    if (array.length > 100) {
        return true;
    }
    return false;
}

function getClassName(value) {
    var type = typeof value;
    switch (type) {
        case 'string':
            return 'json-viewer-value-string';
        case 'number':
            return 'json-viewer-value-number';
        case 'boolean':
            return 'json-viewer-value-symbol';
        case 'object':
            if (value === null) {
                return 'json-viewer-value-empty';
            } else if (Array.isArray(value)) {
                return 'json-viewer-value-generic';
            } else {
                return 'json-viewer-value-generic';
            }
        case 'undefined':
            return 'json-viewer-value-empty';
        default:
            return 'json-viewer-value-generic';
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

class Viewer {
    constructor(json) {
        this.container = document.createElement('div');
        this.path = document.createElement('div');
        this.overview = document.createElement('div');
        this.overviewExpand = document.createElement('div');
        this.overviewContent = document.createElement('div');
        this.content = document.createElement('div');

        this.container.className = 'json-viewer-container';
        this.path.className = 'json-viewer-path';
        this.overview.className = 'json-viewer-overview';
        this.overviewExpand.className = 'json-viewer-expand';
        this.overviewContent.className = 'json-viewer-overview-content';
        this.content.className = 'json-viewer-content';

        this.container.appendChild(this.path);
        this.container.appendChild(this.overview);
        this.container.appendChild(this.content);
        this.overview.appendChild(this.overviewExpand);
        this.overview.appendChild(this.overviewContent);

        if (typeof json != 'string') {
            try {
                json = JSON.stringify(json);
            } catch (e) { }
        }

        if (isJSON(json) == false || !json || json == null) {
            try {
                this.container.innerHTML = json.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            } catch (e) {
                this.container.innerHTML = json;
            }
            return this;
        }

        this.json = typeof json != 'string' ? parseJSON(JSON.stringify(json)) : parseJSON(json);

        setAttribute(this.overview, this.json);

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

        this.isJson = expandable(this.json);

        this.overviewContent.innerHTML = expandable(this.json) == true ? this._getOverview(this.json).replaceAll("<", "&lt;").replaceAll(">", "&gt;") : this._formatValue(this.json).replaceAll("<", "&lt;").replaceAll(">", "&gt;");

        this.overview.addEventListener('click', () => {
            expanded = !expanded;
            this.overview.setAttribute('data-expand', expanded);
            if (appended == false) {
                this._getLevel(this.json, this.content);
                appended = true;
            }
        })

        return this;
    }
    _getLevel(level, parent) {
        if (getType(level) == 'array') {
            if (isLargeArray(level)) {
                var groups = level.length % 100 == 0 ? Math.floor(level.length / 100) : Math.floor(level.length / 100) + 1
                for (let i = 0; i < groups; i++) {
                    (() => {
                        var item = document.createElement('div');
                        var line = document.createElement('div');
                        var next = document.createElement('div');
                        var expanded = false;
                        var append = false;
                        var value = level.slice(i * 100, (i + 1) * 100);
                        var type = getClassName(value);
                        item.className = 'json-viewer-item';
                        line.className = 'json-viewer-line';
                        next.className = 'json-viewer-next';
                        line.innerHTML = `<div class="json-viewer-expand"></div><div class="json-viewer-key" data-type="large-array"></div><div class="json-viewer-value ${type}">[${i * 100} … ${99 > value.length ? i * 100 + value.length - 1 : i * 100 + 99}]</div>`;

                        var temp = {};
                        Object.keys(value).forEach(key => {
                            temp[i * 100 + +key] = value[key];
                        })
                        value = temp;

                        line.setAttribute('data-expandable', expandable(value));
                        line.setAttribute('data-expand', expanded);
                        line.addEventListener('click', () => {
                            if (expandable(value) == true) {
                                expanded = !expanded;
                                line.setAttribute('data-expand', expanded);
                                if (append == false) {
                                    this._getLevel(value, next);
                                    append = true;
                                }
                            }
                        })
                        item.appendChild(line);
                        item.appendChild(next);
                        parent.appendChild(item);

                    })();
                }
                return;
            }
        }
        var temp = level;
        level = Object.keys(temp).sort().reduce(
            (obj, key) => {
                obj[key] = temp[key];
                return obj;
            },
            {}
        );
        Object.keys(level).forEach(key => {
            var item = document.createElement('div');
            var line = document.createElement('div');
            var next = document.createElement('div');
            var expanded = false;
            var append = false;
            var type = getClassName(level[key]);
            item.className = 'json-viewer-item';
            line.className = 'json-viewer-line';
            next.className = 'json-viewer-next';
            line.innerHTML = `<div class="json-viewer-expand"></div><div class="json-viewer-key">${key}</div><div class="json-viewer-value ${type}">${getType(this._formatValue(level[key])) == 'string' ? this._formatValue(level[key]).replaceAll("<", "&lt;").replaceAll(">", "&gt;") : this._formatValue(level[key])}</div>`;

            line.setAttribute('data-expandable', expandable(level[key]));
            line.setAttribute('data-expand', expanded);
            line.addEventListener('click', () => {
                if (expandable(level[key]) == true) {
                    expanded = !expanded;
                    line.setAttribute('data-expand', expanded);
                    if (append == false) {
                        this._getLevel(level[key], next);
                        append = true;
                    }
                }
            })
            item.appendChild(line);
            item.appendChild(next);
            parent.appendChild(item);
        })
    }
    _getOverview(level, current = 0, type) {
        if (current > 3) {
            return '…';
        }
        if (!type) {
            type = getType(level);
        }
        var overview = '';
        var allow = true;
        Object.keys(level).forEach((key, i) => {
            if (allow == false) {
                return;
            }
            var itemType = getType(level[key]);
            if (itemType == 'array') {
                var next = getBracket(this._getOverview(level[key], current + 1, itemType));
                if (type == 'array') {
                    overview += next;
                } else {
                    overview += `${key}: ${next}`;
                }
            } else if (itemType == 'object') {
                var next = getBracket(this._getOverview(level[key], current + 1, itemType));
                if (type == 'array') {
                    overview += next;
                } else {
                    overview += `${key}: ${next}`;
                }
            } else {
                if (type == 'array') {
                    overview += `${this._formatValue(level[key])}`;
                } else {
                    overview += `${key}: ${this._formatValue(level[key])}`;
                }
            }
            if (Object.keys(level)[i + 1]) {
                if (overview.length > 50) {
                    overview += ',';
                    allow = false;
                } else {
                    overview += ', ';
                }
            }
            if (overview.length > 50) {
                allow = false;
            }
        })
        if (allow == false) {
            overview += '…';
        }
        return getBracket(overview, getType(level));
    }
    _formatValue(value) {
        if (expandable(value)) {
            return this._getOverview(value);
        }
        if (getType(value) === 'string') {
            return `\"${value}\"`;
        } else if (getType(value) === 'array') {
            return '[]';
        } else if (getType(value) === 'object') {
            return '{}';
        } else {
            return value;
        }
    }
}

var icons = {
    "document": "<svg viewBox=\"0 0 20 20\"  width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 7.5h8V6H6v1.5ZM6 14h6v-1.5H6V14Zm0-3.25h8v-1.5H6v1.5ZM4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/></svg>",
    "fetch": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.412 0-.766-.147-1.06-.44A1.445 1.445 0 0 1 3 15.5v-11c0-.412.147-.766.44-1.06.294-.293.648-.44 1.06-.44H13l4 4v8.5c0 .412-.147.766-.44 1.06-.294.293-.647.44-1.06.44h-11Zm0-1.5h11V8H12V4.5H4.5v11Z\" fill=\"currentColor\"/></svg>",
    "xhr": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.412 0-.766-.147-1.06-.44A1.445 1.445 0 0 1 3 15.5v-11c0-.412.147-.766.44-1.06.294-.293.648-.44 1.06-.44H13l4 4v8.5c0 .412-.147.766-.44 1.06-.294.293-.647.44-1.06.44h-11Zm0-1.5h11V8H12V4.5H4.5v11Z\" fill=\"currentColor\"/></svg>",
    "font": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/><path d=\"M13 6H7v1.5h2.25V14h1.5V7.5H13V6Z\" fill=\"currentColor\"/></svg>",
    "generic": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/></svg>",
    "image": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.417 0-.77-.15-1.062-.448A1.456 1.456 0 0 1 3 15.5v-11c0-.403.146-.753.438-1.052A1.428 1.428 0 0 1 4.5 3h11c.417 0 .77.15 1.062.448.292.299.438.65.438 1.052v11c0 .403-.146.753-.438 1.052A1.428 1.428 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Zm1-1.5h9l-3-4-2.25 3-1.5-2-2.25 3Z\" fill=\"currentColor\"/></svg>",
    "json": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 16v-1.5h1.75c.213 0 .39-.072.534-.216a.726.726 0 0 0 .216-.534v-1.5c0-.57.191-1.059.573-1.469.382-.41.858-.65 1.427-.719V9.98a2.601 2.601 0 0 1-1.427-.77A2.043 2.043 0 0 1 14.5 7.75v-1.5a.726.726 0 0 0-.216-.534.726.726 0 0 0-.534-.216H12V4h1.75a2.17 2.17 0 0 1 1.594.656c.437.438.656.969.656 1.594v1.5c0 .213.072.39.216.534a.726.726 0 0 0 .534.216H18v3h-1.25a.726.726 0 0 0-.534.216.726.726 0 0 0-.216.534v1.5a2.17 2.17 0 0 1-.656 1.594A2.17 2.17 0 0 1 13.75 16H12Zm-5.75 0a2.17 2.17 0 0 1-1.594-.656A2.17 2.17 0 0 1 4 13.75v-1.5a.726.726 0 0 0-.216-.534.726.726 0 0 0-.534-.216H2v-3h1.25c.212 0 .39-.072.534-.216A.726.726 0 0 0 4 7.75v-1.5c0-.625.219-1.156.656-1.594A2.17 2.17 0 0 1 6.25 4H8v1.5H6.25a.726.726 0 0 0-.534.216.726.726 0 0 0-.216.534v1.5c0 .583-.191 1.08-.573 1.49-.382.41-.858.649-1.427.718v.087c.57.053 1.045.288 1.427.705.382.417.573.917.573 1.5v1.5c0 .213.072.39.216.534a.726.726 0 0 0 .534.216H8V16H6.25ZM9.193 10.35h1.952v1.587l-1.149 2.245h-1.26l.457-2.245V10.35Zm0-4.079h1.952v2.14H9.193V6.27Z\" fill=\"currentColor\"/></svg>",
    "manifest": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6.746 7.5c.21 0 .39-.071.535-.214a.714.714 0 0 0 .219-.532.736.736 0 0 0-.214-.535A.714.714 0 0 0 6.754 6a.736.736 0 0 0-.535.214.714.714 0 0 0-.219.532c0 .21.071.39.214.535.143.146.32.219.532.219Zm0 3.25c.21 0 .39-.072.535-.214a.714.714 0 0 0 .219-.532.736.736 0 0 0-.214-.535.714.714 0 0 0-.532-.219.736.736 0 0 0-.535.214.714.714 0 0 0-.219.532c0 .21.071.39.214.535.143.146.32.219.532.219Zm0 3.25c.21 0 .39-.072.535-.214a.714.714 0 0 0 .219-.532.736.736 0 0 0-.214-.535.714.714 0 0 0-.532-.219.736.736 0 0 0-.535.214.714.714 0 0 0-.219.532c0 .21.071.39.214.535.143.146.32.219.532.219ZM4.5 17c-.412 0-.766-.147-1.06-.44A1.445 1.445 0 0 1 3 15.5v-11c0-.412.147-.766.44-1.06.294-.293.648-.44 1.06-.44H13l4 4v8.5c0 .412-.147.766-.44 1.06-.294.293-.647.44-1.06.44h-11Zm0-1.5h11V8H12V4.5H4.5v11Z\" fill=\"currentColor\"/></svg>",
    "media": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m8 13.5 5.5-3.5L8 6.5v7ZM4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/></svg>",
    "script": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m8 12.5 1.062-1.062L7.625 10l1.437-1.438L8 7.5 5.5 10 8 12.5Zm4 0 2.5-2.5L12 7.5l-1.062 1.062L12.375 10l-1.437 1.438L12 12.5ZM4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/></svg>",
    "snippet": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.5 6H9v1h2V6h1.5v1H14v1.5h-1.5v3H14V13h-1.5v1H11v-1H9v1H7.5v-1H6v-1.5h1.5v-3H6V7h1.5V6ZM9 11.5v-3h2v3H9Z\" fill=\"currentColor\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/></svg>",
    "stylesheet": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4.5 17c-.417 0-.77-.146-1.062-.438A1.444 1.444 0 0 1 3 15.5v-11c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 4.5 3h11c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v11c0 .417-.146.77-.438 1.062A1.444 1.444 0 0 1 15.5 17h-11Zm0-1.5h11v-11h-11v11Z\" fill=\"currentColor\"/><path d=\"M7.598 13.862a2.08 2.08 0 0 1-.972-.235 2.278 2.278 0 0 1-.764-.638.945.945 0 0 0 .609-.264.794.794 0 0 0 .253-.598c0-.368.126-.677.38-.926.252-.249.563-.373.93-.373.36 0 .665.126.914.38.25.252.374.558.374.918 0 .483-.167.894-.5 1.23a1.657 1.657 0 0 1-1.224.506Zm2.712-2.724L9.138 9.966l3.667-3.667a.533.533 0 0 1 .39-.161c.154 0 .284.053.391.16l.391.391a.526.526 0 0 1 .161.386c0 .149-.053.277-.16.385l-3.668 3.678Z\" fill=\"currentColor\"/></svg>",
    "wasm": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M13.163 4.5a3.5 3.5 0 0 1-6.326 0H4.5v11h11v-11h-2.337ZM12 3a2 2 0 1 1-4 0H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 3H12Z\" fill=\"currentColor\"/><path d=\"M10 13.5V10H9v3h-.613v-2h-.782v2H7v-3H6v3.5c0 .142.048.26.144.356A.484.484 0 0 0 6.5 14h3c.142 0 .26-.048.356-.144A.484.484 0 0 0 10 13.5Z\" fill=\"currentColor\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M12 13v1h-1v-3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V14h-1v-1h-1Zm0-1v-1h1v1h-1Z\" fill=\"currentColor\"/></svg>",
    "websocket": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m7 16-3-3 3-3 1.063 1.063-1.188 1.187H10v1.5H6.875l1.188 1.188L7 16Zm5.254-2.25a.736.736 0 0 1-.535-.214.714.714 0 0 1-.219-.532c0-.21.072-.39.214-.535a.714.714 0 0 1 .532-.219c.21 0 .39.072.535.214.146.143.219.32.219.532 0 .21-.072.39-.214.535a.714.714 0 0 1-.532.219Zm3 0a.736.736 0 0 1-.535-.214.714.714 0 0 1-.219-.532c0-.21.072-.39.214-.535a.714.714 0 0 1 .532-.219c.21 0 .39.072.535.214.146.143.219.32.219.532 0 .21-.072.39-.214.535a.714.714 0 0 1-.532.219ZM14 10l-1.063-1.063 1.188-1.187H11v-1.5h3.125l-1.188-1.188L14 4l3 3-3 3ZM5.754 7.75a.736.736 0 0 1-.535-.214A.714.714 0 0 1 5 7.004c0-.21.071-.39.214-.535a.714.714 0 0 1 .532-.219c.21 0 .39.071.535.214.146.143.219.32.219.532 0 .21-.071.39-.214.535a.714.714 0 0 1-.532.219Zm3 0a.736.736 0 0 1-.535-.214A.714.714 0 0 1 8 7.004c0-.21.071-.39.214-.535a.714.714 0 0 1 .532-.219c.21 0 .39.071.535.214.146.143.219.32.219.532 0 .21-.071.39-.214.535a.714.714 0 0 1-.532.219Z\" fill=\"currentColor\"/></svg>",
    "error": "<svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7.062 14 10 11.062 12.938 14 14 12.938 11.062 10 14 7.062 12.938 6 10 8.938 7.062 6 6 7.062 8.938 10 6 12.938 7.062 14ZM10 18a7.794 7.794 0 0 1-3.104-.625 8.067 8.067 0 0 1-2.552-1.719 8.065 8.065 0 0 1-1.719-2.552A7.795 7.795 0 0 1 2 10c0-1.111.208-2.15.625-3.115a8.066 8.066 0 0 1 4.271-4.26A7.795 7.795 0 0 1 10 2c1.111 0 2.15.208 3.115.625a8.1 8.1 0 0 1 4.26 4.26C17.792 7.85 18 8.889 18 10a7.794 7.794 0 0 1-.625 3.104 8.066 8.066 0 0 1-4.26 4.271A7.775 7.775 0 0 1 10 18Z\" fill=\"currentColor\"/></svg>"
}

class Network {
    constructor(target = document.body) {
        this.target = target;
        this.container = document.createElement('div');
        this.resizer = document.createElement('div');
        this.timeLine = document.createElement('div');
        this.detail = document.createElement('div');
        this.timeLineHeader = document.createElement('div');
        this.timeLineList = document.createElement('div');
        this.timeLineBackground = document.createElement('div');
        this.detailNavbar = document.createElement('div');
        this.detailClose = document.createElement('div');
        this.detailURL = document.createElement('div');
        this.detailContent = document.createElement('div');

        this.headers = ['Name', 'Status', 'Method', 'Type', 'Initiator', 'Time'];

        this.container.className = 'extension-devtool-network-container';
        this.resizer.className = 'extension-devtool-network-resizer';
        this.timeLine.className = 'extension-devtool-network-timeline';
        this.detail.className = 'extension-devtool-network-detail';
        this.timeLineHeader.className = 'extension-devtool-network-header';
        this.timeLineList.className = 'extension-devtool-network-list';
        this.timeLineBackground.className = 'extension-devtool-network-lines';
        this.detailNavbar.className = 'extension-devtool-network-detail-navbar';
        this.detailClose.className = 'extension-devtool-network-detail-close';
        this.detailURL.className = 'extension-devtool-network-detail-url';
        this.detailContent.className = 'extension-devtool-network-detail-content';

        this.detailClose.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="extension-devtool-network-detail-close-icon"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>`

        this.target.appendChild(this.container);
        // this.container.appendChild(this.resizer); Disable resizing
        this.container.appendChild(this.timeLine);
        this.container.appendChild(this.detail);
        this.timeLine.appendChild(this.timeLineHeader);
        this.timeLine.appendChild(this.timeLineList);
        this.timeLineList.appendChild(this.timeLineBackground);
        this.detail.appendChild(this.detailNavbar);
        this.detailNavbar.appendChild(this.detailClose);
        this.detailNavbar.appendChild(this.detailURL);
        this.detail.appendChild(this.detailContent);

        this.resizeListeners = [];

        this.detailClose.addEventListener("click", () => {
            this._hideDetail();
        })

        this.headers.forEach(header => {
            var headerElement = document.createElement('div');
            headerElement.className = 'extension-devtool-network-cell';
            headerElement.innerText = header;
            this.timeLineHeader.appendChild(headerElement);
        })

        for (let i = 0; i < this.headers.length; i++) {
            var line = document.createElement('div');
            line.className = 'extension-devtool-network-cell';
            this.timeLineBackground.appendChild(line);
        }

        var pointerDown = false;
        var pointerY = [];

        this.resizer.addEventListener('pointerdown', (e) => {
            pointerDown = true;
            pointerY = e.pageY;
        })

        window.addEventListener('pointermove', (e) => {
            if (pointerDown == true) {
                var height = this.container.offsetHeight + pointerY - e.pageY;
                this.container.style.height = height < 28 ? 28 : height > window.innerHeight ? window.innerHeight : height + 'px';
                pointerY = e.pageY;
                try {
                    this.resizeListeners.forEach(listener => {
                        listener(height)
                    })
                } catch (e) { }
            }
        })
        window.addEventListener('pointerup', (e) => { pointerDown = false; });
        window.addEventListener('blur', () => { pointerDown = false; });

        this.selfChange = false;

        this.timeLine.addEventListener('scroll', (e) => {
            this._updateViewport();
        })

        this.timeLine.addEventListener('pointermove', (e) => {
            this._updateViewport();
        })

        this.timeLine.addEventListener('click', (e) => {
            this._updateViewport();
        })

        const resizeObserver = new ResizeObserver((entries) => {
            this._updateViewport();
        });
        resizeObserver.observe(this.container);

        this.requests = {};
        this.order = [];
        return this;
    }
    addRequest(request) {
        var id = this._uniqueID();
        this.order.push(id);
        this.requests[id] = request;
        this._getItem(id);
        this._updateViewport();
        return id;
    }
    updateRequest(id, content) {
        var request = this.requests[id];
        if (!request) return;

        var elements = request.elements;
        this.requests[id] = content;
        this.requests[id].elements = elements;

        var inViewport = this._nearViewport(this.order.indexOf(id) * 26, 26);

        if (inViewport == true) {
            var cells = {
                'url': request.url,
                'status': [request.status, request.statusCode],
                'method': request.method,
                'type': request.type,
                'trace': request.trace,
                'duration': request.duration
            }

            if (request.status == 'blocked') {
                request.elements.item.classList.add('blocked');
            }

            Object.keys(cells).forEach((cell, i) => {
                this._getCell(cell, cells[cell], request.elements.cells[cell], request);
            })
        }
        this._updateViewport();
    }
    _updateViewport() {
        if (this.selfChange == true) {
            return this.selfChange = false;
        }
        this.selfChange = true;
        Object.keys(this.requests).forEach(key => {
            var inViewport = this._nearViewport(this.order.indexOf(key) * 26, 26);
            if (inViewport == true) {
                this._getItem(key, true);
            } else {
                this._uninstall(key);
            }
            this.requests[key].inViewport = inViewport;
        })
    }
    async _showDetail(id) {
        var request = this.requests[id];
        if (!request) return;

        this.container.classList.add('show-detail');
        this.detailURL.innerText = request.url;

        var requestHeaderHTML = '';
        var responseHeaderHTML = '';
        var traceHTML = '';

        if (request.requestHeaders) {
            Object.keys(request.requestHeaders).forEach(key => {
                requestHeaderHTML += `<div class="extension-devtool-network-detail-header"><span class="extension-devtool-network-detail-header-key">${key}:</span> ${request.requestHeaders[key]}</div>`;
            })
        }

        if (request.responseHeaders) {
            Object.keys(request.responseHeaders).forEach(key => {
                responseHeaderHTML += `<div class="extension-devtool-network-detail-header"><span class="extension-devtool-network-detail-header-key">${key}:</span> ${request.responseHeaders[key]}</div>`;
            })
        }

        request.trace.forEach(trace => {
            traceHTML += `<div class="extension-devtool-network-detail-trace">${trace.replace('at', '').trim()}</div>`;
        })

        if (requestHeaderHTML == '') {
            requestHeaderHTML = 'Request Headers : Null';
        } else {
            requestHeaderHTML = `Request Headers : <div class="extension-devtool-network-detail-headers">${requestHeaderHTML}</div>`
        }

        if (responseHeaderHTML == '') {
            responseHeaderHTML = 'Response Headers : Null';
        } else {
            responseHeaderHTML = `Response Headers : <div class="extension-devtool-network-detail-headers">${responseHeaderHTML}</div>`
        }

        var details = `<div class="extension-devtool-network-detail-group">
                        <div class="extension-devtool-network-detail-title">General</div>
                        <div class="extension-devtool-network-detail-items">
                            <div class="extension-devtool-network-detail-item">
                                Request URL :
                                <a href="${request.url}" target="_blank"
                                    class="extension-devtool-network-detail-link">${request.url}</a>
                            </div>
                            <div class="extension-devtool-network-detail-item">Request Method : ${request.method}</div>
                            <div class="extension-devtool-network-detail-item">Status Code : ${request.statusCode}</div>
                        </div>
                    </div>
                    <div class="extension-devtool-network-detail-group">
                        <div class="extension-devtool-network-detail-title">Headers</div>
                        <div class="extension-devtool-network-detail-items">
                            <div class="extension-devtool-network-detail-item">${requestHeaderHTML}</div>
                            <div class="extension-devtool-network-detail-item">${responseHeaderHTML}</div>
                        </div>
                        <div class="extension-devtool-network-detail-group">
                        <div class="extension-devtool-network-detail-title">Payloads</div>
                        <div class="extension-devtool-network-detail-items">
                            <div class="extension-devtool-network-detail-item" data-element='network-payload'></div>
                        </div>
                        <div class="extension-devtool-network-detail-group">
                            <div class="extension-devtool-network-detail-title">Responses</div>
                            <div class="extension-devtool-network-detail-items">
                                <div class="extension-devtool-network-detail-item" data-element='network-response'></div>
                            </div>
                        </div>
                        <div class="extension-devtool-network-detail-group">
                            <div class="extension-devtool-network-detail-title">Initiator</div>
                            <div class="extension-devtool-network-detail-items">
                                <div class="extension-devtool-network-detail-item">Request call stack:
                                    ${traceHTML}
                                </div>
                            </div>
                        </div>
                    </div>`

        this.detailContent.innerHTML = details;

        var payloadViewer = new Viewer(request.body);
        var responseViewer = new Viewer(await request.response.clone().text());
        if (this._getType(request.responseHeaders['content-type']) == 'image') {
            responseViewer = {
                container: document.createElement('img')
            };
            responseViewer.container.src = URL.createObjectURL(await request.response.clone().blob());
        }
        this.detailContent.querySelector('[data-element="network-payload"]').appendChild(payloadViewer.container);
        this.detailContent.querySelector('[data-element="network-response"]').appendChild(responseViewer.container);

        if (payloadViewer.isJson == true) {
            var url = path.resolve(`./saved/payloads/${[...Array(72)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}.json`);
            var openWith = document.createElement('button');
            openWith.className = 'btn';
            openWith.innerHTML = `Open with JSON Viewer<!--span style="font-size: 12px;
            scale: 0.8;
            transform-origin: center center;
            display: inline-block;
            color: rgb(255, 255, 255);
            margin-left: 4px;
            background: rgb(61, 101, 255);
            border-radius: 1000px;
            padding: 2px 6px;">New</span-->`;
            openWith.onclick = async () => {
                document.body.style.cursor = 'progress';
                await fs.writeFile(url, new Blob([request.body], {
                    type: 'application/json'
                })).then((result) => {
                    new Process('C:/Program Files/JSON Viewer/viewer.js').start(`const FILE_PATH="${url}";`);
                    document.body.style.cursor = 'auto';
                })
            }
            this.detailContent.querySelector('[data-element="network-payload"]').appendChild(openWith);
        }
        if (responseViewer.isJson == true) {
            var url = path.resolve(`./saved/responses/${[...Array(72)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}.json`);
            var openWith = document.createElement('button');
            openWith.className = 'btn';
            openWith.innerHTML = `Open with JSON Viewer<!--span style="font-size: 12px;
            scale: 0.8;
            transform-origin: center center;
            display: inline-block;
            color: rgb(255, 255, 255);
            margin-left: 4px;
            background: rgb(61, 101, 255);
            border-radius: 1000px;
            padding: 2px 6px;">New</span-->`;
            openWith.onclick = async () => {
                document.body.style.cursor = 'progress';
                await fs.writeFile(url, new Blob([await request.response.clone().text()], {
                    type: 'application/json'
                })).then((result) => {
                    new Process('C:/Program Files/JSON Viewer/viewer.js').start(`const FILE_PATH="${url}";`);
                    document.body.style.cursor = 'auto';
                })
            }
            this.detailContent.querySelector('[data-element="network-response"]').appendChild(openWith);
        }
    }
    _hideDetail() {
        this.container.classList.remove('show-detail');
    }
    _getType(contentType, type) {
        if (!contentType) return 'generic';
        if (contentType.includes('json')) return 'json';
        if (contentType.includes('javascript')) return 'script';
        if (contentType.includes('image/')) return 'image';
        if (contentType.includes('video/') || contentType.includes('audio/')) return 'media';
        if (contentType.includes('css')) return 'stylesheet';
        if (contentType.includes('font/')) return 'font';
        if (contentType.includes('application/wasm')) return 'wasm';
        if (contentType.includes('application/manifest+json')) return 'manifest';
        if (contentType.includes('application/ws')) return 'websocket';
        if (contentType.includes('xhr')) return 'xhr';
        if (contentType.includes('fetch')) return 'fetch';
        if (contentType.includes('text/plain')) return type || 'generic';
        return 'generic';
    }
    _uninstall(id) {
        if (!id || !this.requests.hasOwnProperty(id)) {
            return;
        }
        var request = this.requests[id];
        var item = request.elements.item;
        item.innerHTML = '';
    }
    _getItem(id, created = false) {
        if (!id || !this.requests.hasOwnProperty(id)) {
            return;
        }
        var request = this.requests[id];
        var item;
        if (created == false) {
            item = document.createElement('div');
            item.className = 'extension-devtool-network-item';
            this.timeLineList.appendChild(item);
        } else {
            item = request.elements.item;
        }

        if (request.inViewport == true) {
            return;
        }

        var inViewport = this._nearViewport(this.order.indexOf(id) * 26, 26);

        var cells = {
            'url': request.url,
            'status': [request.status, request.statusCode],
            'method': request.method,
            'type': request.type,
            'trace': request.trace,
            'duration': request.duration
        }

        request.elements = {
            item: item,
            cells: {}
        }
        request.inViewport = inViewport;

        if (inViewport == true) {
            Object.keys(cells).forEach((cell, i) => {
                var cellElement = document.createElement('div');
                cellElement.className = 'extension-devtool-network-cell';
                this._getCell(cell, cells[cell], cellElement, request);
                request.elements.cells[cell] = cellElement;
                item.appendChild(cellElement);
            })

            request.elements.cells['url'].addEventListener('click', (e) => {
                this.container.querySelectorAll('.selected').forEach(selected => {
                    selected.classList.remove('selected');
                })
                item.classList.add('selected');
                this._showDetail(id);
            })
        }

        if (this.timeLine.scrollTop + this.timeLine.offsetHeight > this.timeLine.scrollHeight - this.timeLine.offsetHeight && inViewport == true && created == false) {
            this.timeLine.scrollTop = this.timeLine.scrollHeight;
        }
        if (request.status == 'blocked') {
            item.classList.add('blocked');
        }
    }
    _getCell(key, value, element, request) {
        if (key == 'url') {
            var url = value;
            var text = url.substring(url.lastIndexOf('/') + 1)
            text = (text.trim().length > 0 ? text : url).replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            var type = 'generic';
            if (request.responseHeaders) {
                if (request.responseHeaders['content-type']) {
                    type = this._getType(request.responseHeaders['content-type'], request.type);
                } else if (request.type) {
                    type = this._getType(request.type, request.type);
                }
            } else if (request.type) {
                type = this._getType(request.type, request.type);
            }
            if (request.status == 'blocked') {
                type = 'error';
            }
            var className = type;
            var html = `<div class="extension-devtool-network-cell-icon ${className}">${icons[type] || icons['generic']}</div>${text}`;
            element.classList.add('icon');
            element.innerHTML = html;
        } else if (key == 'status') {
            var status = value[0];
            var statusCode = value[1];
            if (status == 'pending') {
                element.innerHTML = '<span style="color: #9a9a9a">(pending)</span>';
            } else if (status == 'blocked') {
                element.innerText = 'Blocked';
            } else if (statusCode != 0) {
                element.innerText = statusCode;
            } else if (status == 'loaded') {
                element.innerText = 'Loaded';
            } else {
                element.innerText = statusCode;
            }
        } else if (key == 'trace') {
            var trace = value || [];
            trace = trace[1] || '';
            trace = trace.replace('at', '').trim();
            var res = '';
            trace.replace(/\((.*)\)/gm, (match, p1) => {
                res = p1;
            })
            if (res == '') {
                res = trace
            }
            element.innerText = res;
        } else if (key == 'duration') {
            if (value >= 0) {
                if (value > 1000 * 60) {
                    element.innerText = `${(value / 1000 / 60).toFixed(2)} m`;
                } else if (value > 1000) {
                    element.innerText = `${(value / 1000).toFixed(2)} s`;
                } else {
                    element.innerText = `${Math.floor(value)} ms`
                }
            } else {
                element.innerHTML = '<span style="color: #9a9a9a">Pending</span>';
            }
        } else {
            element.innerText = value;
        }
    }
    _uniqueID() {
        var id = this._randomString(96);
        if (this.requests[id]) {
            return this._uniqueID();
        }
        return id;
    }
    _randomString(length) {
        if (!length) return console.warn('Option Invalid');
        var characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'Q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '2', '3', '4', '5', '6', '7', '8', '9'],
            str = '';
        for (let i = 0; i < length; i++) {
            str += characters[Math.floor(Math.random() * characters.length)];
        }
        return str;
    }
    _getViewport() {
        return {
            from: this.timeLine.scrollTop,
            to: this.timeLine.scrollTop + this.timeLine.offsetHeight
        }
    }
    _nearViewport(y, height = 26) {
        var viewport = this._getViewport();
        return viewport.from - this.timeLine.offsetHeight <= y + height && y <= viewport.to + this.timeLine.offsetHeight;
    }
}

var networkPanel = new Network(document.body);
networkPanel.container.style.height = '100%';

/*
const originalFetch = window.fetch;

window.fetch = function (input, init = {}) {
    const controller = new AbortController();
    init.signal = controller.signal;
    const url = typeof input === 'string' ? input : input.url;

    var startTime = performance.now();

    var id = requests.push({
        type: 'fetch',
        url: url,
        method: (!init.method ? 'GET' : init.method).toLocaleUpperCase(),
        body: init.body || null,
        requestHeaders: init.headers || {},
        startTime: startTime,
        status: 'pending',
        trace: getStackTrace()
    }) - 1;

    var nid = networkPanel.addRequest(requests[id]);

    return originalFetch(input, init).then(async response => {
        try {
            const endTime = performance.now();
            requests[id].endTime = endTime;
            requests[id].duration = endTime - startTime;
            requests[id].status = 'loaded';
            requests[id].statusCode = response.status;
            response.clone().blob().then(res => {
                requests[id].response = res;
            });
            var headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            })
            requests[id].responseHeaders = headers;
        } catch (e) { console.log(e) };
        networkPanel.updateRequest(nid, requests[id])
        return response;
    }).catch(error => {
        try {
            const endTime = performance.now();
            requests[id].endTime = endTime;
            requests[id].duration = endTime - startTime;
            requests[id].status = 'loaded';
            requests[id].statusCode = 0;
            requests[id].responseHeaders = {};
            requests[id].response = new Blob();
        } catch (e) { console.log(e) };
        networkPanel.updateRequest(nid, requests[id])
        return console.log(error);
    });
};

var xhr = window.XMLHttpRequest.prototype;
var originalOpen = xhr.open;
var originalSend = xhr.send;
var originalSetRequestHeader = xhr.setRequestHeader;

Object.defineProperty(xhr, 'send', {
    value: function overrideSend(payload) {
        const xhr = this;
        const originalOnReadyStateChange = xhr.onreadystatechange;
        const startTime = performance.now();
        if (requests[this.id]) {
            requests[this.id].startTime = startTime;
            requests[this.id].body = payload || null;
            requests[this.id].requestHeaders = this._requestHeaders || {};
            requests[this.id].status = 'pending';
            requests[this.id].trace = getStackTrace();
        }

        var nid = networkPanel.addRequest(requests[this.id]);

        function processResult(status) {
            try {
                const endTime = performance.now();
                if (requests[this.id]) {
                    if (requests[this.id].status == 'blocked' || requests[this.id].status == 'loaded') return;
                    requests[this.id].endTime = endTime;
                    requests[this.id].duration = endTime - startTime;
                    requests[this.id].status = status || 'loaded';
                    requests[this.id].statusCode = xhr.status;
                    requests[this.id].response = xhr.response;
                    var responseHeaders = xhr.getAllResponseHeaders();
                    var headers = {};
                    responseHeaders.trim().split('\r\n').filter(text => {
                        return text.length > 0;
                    }).forEach(line => {
                        const [name, value] = line.split(': ');
                        headers[name] = value;
                    });
                    requests[this.id].responseHeaders = headers;
                    networkPanel.updateRequest(nid, requests[this.id]);
                }
            } catch (e) { console.log(e); };
        }

        processResult = processResult.bind(this);

        xhr.responseType = 'blob';
        xhr.addEventListener('loadend', () => { processResult('loaded') });
        xhr.addEventListener('timeout', () => { processResult('timeouted') });
        xhr.addEventListener('abort', () => { processResult('aborted') });

        return originalSend.apply(this, arguments);
    },
    configurable: false,
    writable: false
});
*/

var queue = {};

window.HMGR.on('NIC:REQUEST:SENT', (e) => {
    var startTime = performance.now();
    var headers = {};
    if (e.headers) {
        e.headers.forEach((header) => {
            headers[header[0]] = header[1];
        })
    }
    var index = requests.push({
        type: e.destination == '' ? 'Unknown' : e.destination,
        url: e.url,
        method: (e.method || 'GET').toLocaleUpperCase(),
        body: e.body || null,
        requestHeaders: headers,
        startTime: startTime,
        status: 'pending',
        trace: getStackTrace()
    }) - 1;
    var nid = networkPanel.addRequest(requests[index]);
    queue[e.id] = { index, nid, startTime }
})

window.HMGR.on('NIC:REQUEST:RECEIVED', (e) => {
    if (queue[e.id]) {
        var request = queue[e.id];
        try {
            const endTime = performance.now();
            requests[request.index].endTime = endTime;
            requests[request.index].duration = endTime - request.startTime;
            requests[request.index].status = 'loaded';
            requests[request.index].statusCode = e.status;
            var responseHeaders = {};
            e.headers.forEach((header) => {
                responseHeaders[header[0]] = header[1];
            })
            requests[request.index].responseHeaders = responseHeaders;
            requests[request.index].response = new Response(new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array(e.response));
                    controller.close();
                },
            }), {
                headers: responseHeaders
            });
        } catch (e) { console.log(e) };
        networkPanel.updateRequest(request.nid, requests[request.index])
    }
})