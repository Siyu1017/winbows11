function isElement(obj) {
    return typeof HTMLElement === "object" ? obj instanceof HTMLElement :
        obj &&                                   // check if element is exist
        typeof obj === "object" &&               // 
        obj !== null &&                          // 
        obj.nodeType === 1 &&                    // check nodeType
        typeof obj.nodeName === "string" &&      // check nodeName
        obj.toString() != "[object Object]"      // check if element is not a Object
}

function getElements(target) {
    if (typeof target === 'string') {
        // A string representing a CSS selector
        return document.querySelectorAll(target);
    } else if (Array.isArray(target)) {
        // An array contained elements or CSS selectors
        var elements = [];
        target.forEach(el => {
            if (typeof el == 'string' ? document.querySelectorAll(el).length > 0 : isElement(el)) {
                typeof el == 'string' ? elements = elements.concat(Array.from(document.querySelectorAll(el))) : elements.push(el);
            }
        })
        return elements;
    } else if (isElement(target)) {
        return [target];
    }
    return [];
}

export function WinbowsAnimation(params = {}) {
    if (typeof params !== 'object' || params.toString() !== '[object Object]') {
        throw new Error('Invalid params. Expected an object.');
    }
    const targets = params.targets ? getElements(params.targets) : [];
    if (targets.length == 0) {
        throw new Error('Invalid targets.');
    }
    // TODO: ???
}
