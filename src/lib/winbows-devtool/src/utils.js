export function getJsonFromURL(url) {
    if (!url) url = location.search;
    var query = url.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

export function getType(val) {
    return Object.prototype.toString.call(val);
}

export function randomID(count, chars) {
    var chars = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
};

export function getStackTrace() {
    var stack;

    try {
        throw new Error('');
    } catch (error) {
        stack = error.stack || '';
    }

    stack = stack.split('\n').map(function (line) { return line.trim(); });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
}

/**
 * Parse the args like ["FOO=1", "BAR=test"] to { FOO: "1", BAR: "test" }
 * @param {string[]} args
 * @returns {Record<string, string>}
 */
export function parseKeyValueArgs(args) {
    const result = {};
    for (const arg of args) {
        const [key, value] = arg.split("=", 2);
        if (key && value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

export function isElement(obj) {
    try {
        return obj instanceof HTMLElement;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

export function isArray(val) {
    return Array.isArray(val);
}

export function isString(val) {
    return getType(val) === '[object String]';
}

export function isJSON(item) {
    let value = typeof item !== "string" ? JSON.stringify(item) : item;
    try {
        value = JSON.parse(value);
    } catch (e) {
        return false;
    }

    return typeof value === "object" && value !== null;
}

export function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

export function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

export function isFunction(fn) {
    return typeof fn === 'function';
}

/**
 * Find the distance of an element from the upper left corner of the document
 * @param {Element} element 
 * @returns {Object}
 */
export function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

export function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function replaceHTMLTags(content = '') {
    return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function toNumber(val) {
    if (isNumber(val)) return val;

    const temp = isFunction(val?.valueOf) ? val.valueOf() : val;
    val = isObject(temp) ? temp + '' : temp;

    return +val;
}

export function functionToCode(fn) {
    try {
        return Function.prototype.toString.call(fn);
    } catch (e) { }
    try {
        return fn + '';
    } catch (e) { }
}

export function safeEscape(html) {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function detectCycle(obj) {
    const seen = new WeakSet();
    function detect(val) {
        if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) return true;
            seen.add(val);
            for (let key in val) {
                if (detect(val[key])) return true;
            }
        }
        return false;
    }
    return detect(obj);
}

export function throttle(fn) {
    let timeout = null;

    return function (...args) {
        const throttler = () => {
            timeout = null;
            fn.apply(this, args);
        };

        if (!timeout) timeout = setTimeout(throttler, 16);
    };
}