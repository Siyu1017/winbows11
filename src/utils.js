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

export function getPointerPosition(e) {
    let x = e.clientX;
    let y = e.clientY;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        x = touch.pageX;
        y = touch.pageY;
    }
    return { x: x + window.scrollX, y: y + window.scrollY };
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function loadImage(url) {
    return new Promise(async (resolve, reject) => {
        var img = new Image();
        img.onload = async () => {
            return resolve();
        }
        img.onerror = async (err) => {
            return reject(err);
        }
        img.src = url;
    })
}

export function canvasClarifier(canvas, ctx, width, height) {
    const originalSize = {
        width: (width ? width : canvas.offsetWidth),
        height: (height ? height : canvas.offsetHeight)
    }
    var ratio = window.devicePixelRatio || 1;
    canvas.width = originalSize.width * ratio;
    canvas.height = originalSize.height * ratio;
    ctx.scale(ratio, ratio);
    if (originalSize.width != canvas.offsetWidth || originalSize.height != canvas.offsetHeight) {
        canvas.style.width = originalSize.width + 'px';
        canvas.style.height = originalSize.height + 'px';
    }
}

export function getImageTheme(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;

    let totalBrightness = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (img.width * img.height);

    const threshold = 128;
    if (averageBrightness > threshold) {
        return 'light';
    } else {
        return 'dark';
    }
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}