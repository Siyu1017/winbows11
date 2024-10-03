function getnodeType(node) {
    if (node.nodeType == 1) return node.tagName.toLowerCase();
    else return node.nodeType;
};
function clean(node) {
    for (var n = 0; n < node.childNodes.length; n++) {
        var child = node.childNodes[n];
        if (
            child.nodeType === 8 ||
            (child.nodeType === 3 && !/\S/.test(child.nodeValue) && child.nodeValue.includes('\n'))
        ) {
            node.removeChild(child);
            n--;
        } else if (child.nodeType === 1) {
            clean(child);
        }
    }
}

function parseHTML(str) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(str, 'text/html');
    clean(doc.body);
    return doc.body;
}

function attrbutesIndex(el) {
    var attributes = {};
    if (el.attributes == undefined) return attributes;
    for (var i = 0, atts = el.attributes, n = atts.length; i < n; i++) {
        attributes[atts[i].name] = atts[i].value;
    }
    return attributes;
}
function patchAttributes(vdom, dom) {
    let vdomAttributes = attrbutesIndex(vdom);
    let domAttributes = attrbutesIndex(dom);
    if (vdomAttributes == domAttributes) return;
    Object.keys(vdomAttributes).forEach((key, i) => {
        //if the attribute is not present in dom then add it
        if (!dom.getAttribute(key)) {
            dom.setAttribute(key, vdomAttributes[key]);
        } //if the atrtribute is present than compare it
        else if (dom.getAttribute(key)) {
            if (vdomAttributes[key] != domAttributes[key]) {
                dom.setAttribute(key, vdomAttributes[key]);
            }
        }
    });
    Object.keys(domAttributes).forEach((key, i) => {
        //if the attribute is not present in vdom than remove it
        if (!vdom.getAttribute(key)) {
            dom.removeAttribute(key);
        }
    });
}

function diff(vdom, dom) {
    //if dom has no childs then append the childs from vdom
    if (dom.hasChildNodes() == false && vdom.hasChildNodes() == true) {
        for (var i = 0; i < vdom.childNodes.length; i++) {
            //appending
            dom.append(vdom.childNodes[i].cloneNode(true));
        }
    } else {
        //if both nodes are equal then no need to compare farther
        if (vdom.isEqualNode(dom)) return;
        //if dom has extra child
        if (dom.childNodes.length > vdom.childNodes.length) {
            let count = dom.childNodes.length - vdom.childNodes.length;
            if (count > 0) {
                for (; count > 0; count--) {
                    dom.childNodes[dom.childNodes.length - count].remove();
                }
            }
        }
        //now comparing all childs
        for (var i = 0; i < vdom.childNodes.length; i++) {
            //if the node is not present in dom append it
            if (dom.childNodes[i] == undefined) {
                dom.append(vdom.childNodes[i].cloneNode(true));
                // console.log("appenidng",vdom.childNodes[i])
            } else if (getnodeType(vdom.childNodes[i]) == getnodeType(dom.childNodes[i])) {
                //if same node type
                //if the nodeType is text
                if (vdom.childNodes[i].nodeType == 3) {
                    //we check if the text content is not same
                    if (vdom.childNodes[i].textContent != dom.childNodes[i].textContent) {
                        //replace the text content
                        dom.childNodes[i].textContent = vdom.childNodes[i].textContent;
                    }
                } else {
                    patchAttributes(vdom.childNodes[i], dom.childNodes[i])
                }
            } else {
                //replace
                dom.childNodes[i].replaceWith(vdom.childNodes[i].cloneNode(true));
            }
            if (vdom.childNodes[i].nodeType != 3) {
                diff(vdom.childNodes[i], dom.childNodes[i])
            }
        }
    }
}

function update(target, updateHTML) {
    var vdom = parseHTML(updateHTML);
    var dom = target;
    clean(dom);
    diff(vdom, dom);
}

window.DOMTool = { diff, clean, parseHTML, update };
Object.freeze(window.DOMTool);

window.loadedKernel();

/*
let vdom = parseHTML(`
<h1 style="color:green">Hello</h1>
<p>This is a page</p>
<p>some more text</p>`);

let dom = document.getElementById('node');
clean(dom);
console.log(vdom)

document.querySelector('button').addEventListener('click', function () {
    diff(vdom, dom);
})
*/