export function getJsonFromURL(url: string): Record<string, any> {
    if (!url) url = location.search;
    var query = url.substr(1);
    var result: Record<string, any> = {};
    query.split("&").forEach(function (part) {
        const i = part.indexOf('=');
        if (i === -1) {
            result[part] = true;
        } else {
            try {
                result[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1));
            } catch (e) {
                result[part.slice(0, i)] = part.slice(i + 1);
            }
        }
    });
    return result;
}

export function getType(val: any): string {
    return Object.prototype.toString.call(val);
}

export function randomID(count: number, chars: string): string {
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
        stack = (error as Error).stack || '';
    }

    stack = stack.split('\n').map(function (line) { return line.trim(); });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
}

export function parseKeyValueArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const arg of args) {
        const [key, value] = arg.split("=", 2);
        if (key && value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

export function isElement(obj: any): boolean {
    try {
        return obj instanceof HTMLElement;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

export function isString(val: any): boolean {
    return getType(val) === '[object String]';
}

export function isJSON(item: any): boolean {
    let value = typeof item !== "string" ? JSON.stringify(item) : item;
    try {
        value = JSON.parse(value);
    } catch (e) {
        return false;
    }

    return typeof value === "object" && value !== null;
}

export function isObject(obj: any): boolean {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

export function isNumber(value: any): boolean {
    return typeof value === 'number' && isFinite(value);
}

export function isFunction(fn: any): boolean {
    return typeof fn === 'function';
}

/**
 * Find the distance of an element from the upper left corner of the document
 * @param {Element} element 
 * @returns {Object}
 */
export function getPosition(element: Element): { x: number, y: number } {
    function offset(el: Element) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

export function capitalizeFirstLetter(val: any): string {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function replaceHTMLTags(content: string = ''): string {
    return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function toNumber(val: any): number {
    if (isNumber(val)) return val;

    const temp = isFunction(val?.valueOf) ? val.valueOf() : val;
    val = isObject(temp) ? temp + '' : temp;

    return +val;
}

export function getPointerPosition(e: MouseEvent | TouchEvent | PointerEvent): { x: number, y: number } {
    let x = (e as PointerEvent).pageX;
    let y = (e as PointerEvent).pageY;
    if (e.type.startsWith('touch')) {
        var touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
        x = touch.pageX;
        y = touch.pageY;
    }
    return { x: x + window.scrollX, y: y + window.scrollY };
}

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function loadImage(url: string) {
    return new Promise(async (resolve, reject) => {
        var img = new Image();
        img.onload = async () => {
            return resolve(void 0);
        }
        img.onerror = async (err) => {
            return reject(err);
        }
        img.src = url;
    })
}

export function canvasClarifier(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width?: number, height?: number) {
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

export function getImageTheme(img: HTMLCanvasElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas): 'light' | 'dark' {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
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
    return 'light';
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function safeEscape(html: string): string {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class EventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    constructor() { }

    on(eventName: string, handler: Function) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        (this.listeners.get(eventName) as Function[]).push(handler);
    }

    off(eventName: string, handler: Function) {
        if (!this.listeners.has(eventName)) return;
        const index = (this.listeners.get(eventName) as Function[]).indexOf(handler);
        if (index === -1) return;
        (this.listeners.get(eventName) as Function[]).splice(index, 1);
    }

    once(eventName: string, handler: Function) {
        const onceHandler = (...args: any[]) => {
            this.off(eventName, onceHandler);
            handler(...args);
        };
        this.on(eventName, onceHandler);
    }

    protected emit = this._emit;

    protected _emit(eventName: string, ...args: any[]) {
        const handlers = this.listeners.get(eventName);
        if (handlers) {
            for (const fn of handlers.slice()) {
                try {
                    fn(...args);
                } catch (e) {
                    console.error(`Error in handler for ${eventName}:`, e);
                }
            }
        }
    }

    _list(eventName: string): Function[] {
        const ls = this.listeners.get(eventName);
        return ls ? [...ls] : [];
    }
}