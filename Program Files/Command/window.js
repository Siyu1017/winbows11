const CMD_VERSION = `11.0.${(Math.random() * performance.now()).toString().slice(-5)}.${(Math.random() * performance.now()).toString().slice(-4)}`;

browserWindow.changeTitle('Command')

Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; };

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

function canvasClarifier(canvas, ctx, width, height) {
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

function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

const events = {
    "start": ["mousedown", "touchstart", "pointerdown"],
    "move": ["mousemove", "touchmove", "pointermove"],
    "end": ["mouseup", "touchend", "pointerup", "blur"]
}

const app = document.createElement('div');
const terminal = document.createElement('div');
const terminalInput = document.createElement('input');
const terminalScroll = document.createElement('div');
const terminalScrollBar = document.createElement('div');
const terminalScrollUpButton = document.createElement('button');
const terminalScrollDownButton = document.createElement('button');
const terminalScrollBarThumb = document.createElement('div');
const terminalScrollBarThumbBar = document.createElement('div');
const terminalViewport = document.createElement('div');
const terminalCursor = document.createElement('div');
const terminalCanvas = document.createElement('canvas');
const ctx = terminalCanvas.getContext('2d');

app.className = 'app';
terminal.className = 'terminal';
terminalInput.className = 'terminal-input';
terminalScroll.className = 'terminal-scroll';
terminalScrollBar.className = 'terminal-scroll-bar';
terminalScrollUpButton.className = 'terminal-scroll-bar-button up';
terminalScrollDownButton.className = 'terminal-scroll-bar-button down';
terminalScrollBarThumb.className = 'terminal-scroll-bar-thumb';
terminalScrollBarThumbBar.className = 'terminal-scroll-bar-thumb-bar';
terminalViewport.className = 'terminal-viewport';
terminalCursor.className = 'terminal-cursor';
terminalCanvas.className = 'terminal-canvas';

document.body.appendChild(app);
app.appendChild(terminal);
app.appendChild(terminalScroll);
terminal.appendChild(terminalInput);
terminalScroll.appendChild(terminalScrollBar);
terminalScrollBar.appendChild(terminalScrollUpButton);
terminalScrollBar.appendChild(terminalScrollBarThumb);
terminalScrollBar.appendChild(terminalScrollDownButton);
terminalScrollBarThumb.appendChild(terminalScrollBarThumbBar);
terminal.appendChild(terminalViewport);
terminalViewport.appendChild(terminalCursor);
terminalViewport.appendChild(terminalCanvas);

var anchor = [0, 0];
var cursor = [0, 0];
var rect = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
]
var pointerDown = false;
var terminalConfig = {
    fontSize: 16,
    fontFamily: 'Consolas, Monaco, monospace',
    lineHeight: 18
}
var terminalScrollTop = 0;
var terminalPath = 'C:/';
var lines = {
    0: {
        text: `Microhard Winbows [Version ${CMD_VERSION}]`
    },
    1: {
        text: `(c) Microhard Corporation. All rights reserved.`
    },
    2: {
        text: ``
    },
    3: {
        text: `Type "help" for available commands.`
    },
    4: {
        text: ``
    }
};
var datas = {};
var typeHistory = [];
var inputData = {};

function recodeData(i, data) {
    datas[i] = data;
}

function getViewport() {
    var range = [];
    Object.values(datas).forEach((data, i) => {
        if (data.endY >= terminalScrollTop && data.startY <= terminalScrollTop + terminalViewport.offsetHeight) {
            range.push(i);
        }
    })
    return [Math.min(range), Math.max(range)];
}

function getLinePosition(i) {
    var positions = Object.values(datas).filter((val, index) => index < i);
    var x = 0;
    var y = 0;
    for (let i = 0; i < positions.length; i++) {
        y += positions[i].height;
    }
    return { x, y };
}

function pointInWhichLine(x, y) {
    var positions = Object.values(datas);
    var lineY = 0;
    var inWhich = -1;
    var i = 0;
    while (inWhich == -1 && i < positions.length) {
        if (lineY <= y && lineY + positions[i].height >= y) {
            inWhich = i;
        }
        lineY += positions[i].height;
        i++;
    }
    return inWhich;
}

function getCursorPosition(x, y) {
    var i = pointInWhichLine(x, y);
    var font = `${terminalConfig.fontSize}px ${terminalConfig.fontFamily}`;

    ctx.font = font;
    ctx.textBaseline = 'middle';

    if (i != -1 && i < Object.values(datas).length && datas[i]) {
        const text = lines[i].text || '';
        const parts = text.split('');
        let line = '';
        let currentY = datas[i].startY;
        let maxWidth = terminalCanvas.offsetWidth;
        let width = 0;
        let resultX = null;

        for (let i = 0; i < parts.length; i++) {
            const testLine = line + parts[i];
            const testWidth = ctx.measureText(testLine).width;

            if (~~(Math.abs(currentY - y) / terminalConfig.lineHeight) == 0) {
                if (width <= x && x <= testWidth) {
                    resultX = width;
                    break;
                }
                width = testWidth;
            }

            if (testWidth > maxWidth && i > 0) {
                // ctx.fillText(line, startX, currentY);
                line = parts[i];
                currentY += terminalConfig.lineHeight;
            } else {
                line = testLine;
            }
        }

        if (resultX == null) {
            var unit = ctx.measureText(' ').width;
            resultX = x - x % unit;
        }

        return { x: resultX, y: y - y % terminalConfig.lineHeight };
    } else {
        var unit = ctx.measureText(' ').width;
        var resultX = x - x % unit;
        var resultY = y - y % terminalConfig.lineHeight;
        return { x: resultX, y: resultY };
    }
}

function updateSelection() {
    var anchorPosition = getCursorPosition(anchor[0], anchor[1]);
    var cursorPosition = getCursorPosition(cursor[0], cursor[1]);

    var anchorRow = ~~(anchor[1] / terminalConfig.lineHeight);
    var cursorRow = ~~(cursor[1] / terminalConfig.lineHeight);

    var startRow = anchorRow > cursorRow ? cursorRow : anchorRow;
    var endRow = anchorRow > cursorRow ? anchorRow : cursorRow;

    var startPosition = anchor[1] > cursor[1] ? cursorPosition : anchorPosition;
    var endPosition = anchor[1] > cursor[1] ? anchorPosition : cursorPosition;

    if (startRow == endRow || startPosition.y == endPosition.y) {
        // One line
        rect[0] = [startPosition.x, startPosition.y, endPosition.x - startPosition.x, terminalConfig.lineHeight]
        rect[1] = [0, 0, 0, 0];
        rect[2] = [0, 0, 0, 0];
    } else if (Math.abs(endRow - startRow) == 1 || Math.abs(endPosition.y - startPosition.y) == terminalConfig.lineHeight) {
        // Two lines
        rect[0] = [startPosition.x, startPosition.y, terminalViewport.offsetWidth - startPosition.x, terminalConfig.lineHeight]
        rect[1] = [0, endPosition.y, endPosition.x, terminalConfig.lineHeight];
        rect[2] = [0, 0, 0, 0];
    } else {
        // More than two lines
        rect[0] = [startPosition.x, startPosition.y, terminalViewport.offsetWidth - startPosition.x, terminalConfig.lineHeight];
        rect[1] = [0, startPosition.y + terminalConfig.lineHeight, terminalViewport.offsetWidth, endPosition.y - (startPosition.y + terminalConfig.lineHeight)];
        rect[2] = [0, endPosition.y, endPosition.x, terminalConfig.lineHeight];
    }

    render();
}

function isValidSelection() {
    return rect[0][2] != 0 || rect[1][2] != 0 || rect[2][2] != 0 || rect[0][3] != 0 || rect[1][3] != 0 || rect[2][3] != 0;
}

function getSelection() {
    return selection;
}

function getCharacterPosition(text, cursor) {
    if (cursor > text.length + 1) return [0, 0];
    var font = `${terminalConfig.fontSize}px ${terminalConfig.fontFamily}`;

    ctx.font = font;
    ctx.textBaseline = 'middle';

    const parts = text.split('').concat([' ']);
    let line = '';
    let currentY = 0;
    let maxWidth = terminalCanvas.offsetWidth;
    let width = 0;
    let resultX = 0;

    for (let i = 0; i < parts.length; i++) {
        const testLine = line + parts[i];
        const testWidth = ctx.measureText(testLine).width;

        if (i == cursor) {
            resultX = width;
            break;
        }

        width = testWidth;

        if (testWidth > maxWidth && i > 0) {
            // ctx.fillText(line, startX, currentY);
            line = parts[i];
            currentY += terminalConfig.lineHeight;
            width = 0;
        } else {
            line = testLine;
        }
    }

    return [resultX, currentY];
}

function render(scrollToBottom = false) {
    canvasClarifier(terminalCanvas, ctx, terminalViewport.offsetWidth, terminalViewport.offsetHeight);
    updateScrollBar();
    var renderY = 0;

    function print(text, i, fill = true) {
        // Datas
        var position = getLinePosition(i);
        var text = lines[i] ? lines[i].text || '' : text || '';
        var font = `${terminalConfig.fontSize}px ${terminalConfig.fontFamily}`;
        var startX = 0;
        var startY = renderY;// position.y || terminalScrollTop + i * 16;
        var endX = startX;
        var endY = startY;
        var width = 0;
        var height = terminalConfig.lineHeight;
        var lineHeight = terminalConfig.lineHeight;

        // Setup
        ctx.font = font;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';

        const parts = text ? text.split('') : []; // text.split(' ');
        let lineWidth = 0;
        let line = '';
        let currentX = startX;
        let currentY = startY;
        let maxWidth = terminalCanvas.offsetWidth;

        var ranges = [];
        var colors = [];
        if (lines[i]) {
            if (lines[i].style) {
                lines[i].style.forEach(style => {
                    ranges.push(style.range);
                    colors.push(style.color);
                })
            }
        }

        // Fill text
        for (let i = 0; i < parts.length; i++) {
            const testLine = line + parts[i]; // line + parts[i] + ' ';
            const testWidth = ctx.measureText(testLine).width;

            var originalWidth = lineWidth;
            lineWidth = testWidth;
            if (lineWidth >= width) {
                width = lineWidth;
            }

            var color = null;
            ranges.forEach(range => {
                if (range[0] <= i && i <= range[1]) {
                    color = colors[i]
                }
            })
            if (color != null) {
                if (fill == true) {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(line, startX, currentY + terminalConfig.lineHeight / 2 - terminalScrollTop);
                }
                startX = originalWidth;
                if (fill == true) {
                    ctx.fillStyle = color;
                    ctx.fillText(parts[i], startX, currentY + terminalConfig.lineHeight / 2 - terminalScrollTop);
                }
                line = '';
                if (testWidth > maxWidth && i > 0) {
                    lineWidth = 0;
                    height += lineHeight;
                    currentY += lineHeight;
                    startX = 0;
                }
                startX = testWidth;
            } else if (testWidth > maxWidth && i > 0) {
                if (fill == true) {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(line, startX, currentY + terminalConfig.lineHeight / 2 - terminalScrollTop);
                }
                line = parts[i]; // parts[i] + ' ';
                lineWidth = 0;
                height += lineHeight;
                currentY += lineHeight;
                startX = 0;
            } else {
                line = testLine;
            }
        }
        if (fill == true) {
            ctx.fillText(line, startX, currentY + terminalConfig.lineHeight / 2 - terminalScrollTop);
        }

        endX = startX + lineWidth;
        endY = currentY + lineHeight;

        renderY += height;

        if (i) {
            recodeData(i, {
                startX, startY, endX, endY, width, height
            });
        } else {
            return { startX, startY, endX, endY, width, height };
        }
    }

    for (var i = 0; i < Object.values(lines).length; i++) {
        print(lines[i], i);
    }

    var text = terminalPath + '>' + terminalInput.value;
    inputData = print(text);
    terminalInput.style.left = inputData.endX + 'px';
    terminalInput.style.top = inputData.endY - terminalConfig.lineHeight - terminalScrollTop + 'px';
    terminalInput.style.height = terminalConfig.lineHeight + 'px';
    terminalInput.style.fontSize = terminalConfig.fontSize + 'px';
    terminalInput.style.fontFamily = terminalConfig.fontFamily;

    var cursorPosition = getCharacterPosition(text, doGetCaretPosition(terminalInput) + terminalPath.length + 1);

    terminalCursor.style.left = cursorPosition[0] + 'px';
    terminalCursor.style.top = inputData.startY + cursorPosition[1] - terminalScrollTop + 'px';
    terminalCursor.style.height = terminalConfig.lineHeight + 'px';
    terminalCursor.style.width = '8px';

    updateScrollBar();

    if (isValidSelection()) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,.3)';
        ctx.fillRect(rect[0][0], rect[0][1] - terminalScrollTop, rect[0][2], rect[0][3]);
        ctx.fillRect(rect[1][0], rect[1][1] - terminalScrollTop, rect[1][2], rect[1][3]);
        ctx.fillRect(rect[2][0], rect[2][1] - terminalScrollTop, rect[2][2], rect[2][3]);
        ctx.restore();
    }

    if (scrollToBottom == true) {
        if (datas[Object.values(datas).length - 1]) {
            const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
            const containerHeight = terminalViewport.offsetHeight;
            const maxScrollTop = contentHeight - containerHeight;
            if (contentHeight > containerHeight) {
                terminalScrollTop = maxScrollTop;
            }
        }
    }
}


function updateScrollBar() {
    if (!datas[Object.values(datas).length - 1]) {
        return terminalScrollBar.style.display = 'none';
    }
    const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
    const containerHeight = terminalViewport.offsetHeight;
    const maxScrollTop = contentHeight - containerHeight;
    const percent = containerHeight / contentHeight;
    const diffHeight = (1 - (percent > 1 ? 1 : percent)) * terminalScrollBarThumb.offsetHeight;

    if (contentHeight <= containerHeight) {
        return terminalScrollBar.style.display = 'none';
    } else {
        terminalScrollBar.style.display = 'revert-layer';
        terminalScrollBarThumbBar.style.height = containerHeight / contentHeight * 100 + '%';
        terminalScrollBarThumbBar.style.top = (terminalScrollTop / maxScrollTop) * diffHeight < 0 ? 0 : (terminalScrollTop / maxScrollTop) * diffHeight + 'px';
    }
}

terminalCanvas.addEventListener('wheel', function (event) {
    if (!datas[Object.values(datas).length - 1]) {
        return terminalScrollBar.style.display = 'none';
    }
    const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
    const containerHeight = terminalViewport.offsetHeight;
    const maxScrollTop = contentHeight - containerHeight;
    var delta = event.deltaY || event.detail || event.wheelDelta;
    if (contentHeight <= containerHeight) {
        return terminalScrollBar.style.display = 'none';
    }
    if (delta < 0) {
        terminalScrollTop -= 50;
    } else {
        terminalScrollTop += 50;
    }
    if (terminalScrollTop < 0) {
        terminalScrollTop = 0;
    }
    if (terminalScrollTop > maxScrollTop) {
        terminalScrollTop = maxScrollTop;
    }
    render();
    if (event.cancelable) {
        event.preventDefault();
    }
}, {
    passive: false
});

terminalScrollUpButton.addEventListener('click', (e) => {
    if (!datas[Object.values(datas).length - 1]) {
        return terminalScrollBar.style.display = 'none';
    }
    const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
    const containerHeight = terminalViewport.offsetHeight;
    if (contentHeight <= containerHeight) {
        return terminalScrollBar.style.display = 'none';
    }
    terminalScrollTop -= 50;
    if (terminalScrollTop < 0) {
        terminalScrollTop = 0;
    }
    render();
})

terminalScrollDownButton.addEventListener('click', (e) => {
    if (!datas[Object.values(datas).length - 1]) {
        return terminalScrollBar.style.display = 'none';
    }
    const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
    const containerHeight = terminalViewport.offsetHeight;
    const maxScrollTop = contentHeight - containerHeight;
    if (contentHeight <= containerHeight) {
        return terminalScrollBar.style.display = 'none';
    }
    terminalScrollTop += 50;
    if (terminalScrollTop > maxScrollTop) {
        terminalScrollTop = maxScrollTop;
    }
    render();
})

!(() => {
    var scrolling = false;
    var pointerY = 0;
    var orginal = 0;

    function startScrolling(e) {
        scrolling = true;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            e.pageX = touch.pageX;
            e.pageY = touch.pageY;
        }
        pointerY = e.pageY;
        orginal = terminalScrollTop;
    }
    function moveScrolling(e) {
        if (scrolling == false) return;
        if (!datas[Object.values(datas).length - 1]) {
            return terminalScrollBar.style.display = 'none';
        }
        const contentHeight = datas[Object.values(datas).length - 1].endY + inputData.height * 2;
        const containerHeight = terminalViewport.offsetHeight;
        const maxScrollTop = contentHeight - containerHeight;
        const percent = containerHeight / contentHeight;
        const diffHeight = (1 - (percent > 1 ? 1 : percent)) * terminalScrollBarThumb.offsetHeight;

        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            e.pageX = touch.pageX;
            e.pageY = touch.pageY;
        }
        try {
            document.getSelection().removeAllRanges();
        } catch (e) { }

        var deltaY = e.pageY - pointerY;
        terminalScrollTop = orginal + deltaY / diffHeight * maxScrollTop;
        terminalScrollTop = terminalScrollTop < 0 ? 0 : terminalScrollTop > maxScrollTop ? maxScrollTop : terminalScrollTop;
        render();
    }
    function endScrolling(e) {
        scrolling = false;
    }

    events.start.forEach(event => {
        terminalScrollBarThumbBar.addEventListener(event, startScrolling);
    })
    events.move.forEach(event => {
        window.addEventListener(event, moveScrolling);
    })
    events.end.forEach(event => {
        window.addEventListener(event, endScrolling);
    })
})();

function doGetCaretPosition(oField) {
    var iCaretPos = 0;
    if (document.selection) {
        oField.focus();
        var oSel = document.selection.createRange();
        oSel.moveStart('character', -oField.value.length);
        iCaretPos = oSel.text.length;
    } else if (oField.selectionStart || oField.selectionStart == '0') {
        iCaretPos = oField.selectionDirection == 'backward' ? oField.selectionStart : oField.selectionEnd;
    }
    return iCaretPos;
}

var selecting = false;
function startSelection(e) {
    if (terminalScroll.contains(e.target)) return;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    var position = getPosition(terminalViewport);
    selecting = true;
    anchor = [e.pageX - position.x, e.pageY - position.y + terminalScrollTop];
    cursor = anchor;
    updateSelection();
}

function moveSelection(e) {
    if (selecting == false) return;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    try {
        document.getSelection().removeAllRanges();
    } catch (e) { }
    var position = getPosition(terminalViewport);
    cursor = [e.pageX - position.x, e.pageY - position.y + terminalScrollTop];
    updateSelection();
}

function endSelection(e) {
    selecting = false;
}

events.start.forEach(event => {
    document.body.addEventListener(event, startSelection);
})
events.move.forEach(event => {
    window.addEventListener(event, moveSelection);
})
events.end.forEach(event => {
    window.addEventListener(event, endSelection);
})

terminalViewport.addEventListener('click', (e) => {
    terminalInput.focus();
})

terminalInput.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        typeHistory.push(terminalInput.value);
        lines[Object.values(lines).length] = {
            text: terminalPath + '>' + terminalInput.value,
            style: [{
                range: [terminalPath.length, terminalInput.value.indexOf(' ') == -1 ? terminalInput.value.length - 1 : terminalInput.value.indexOf(' ')],
                color: '#ffd78e'
            }]
        };
        if (terminalInput.value.trim().length > 0) {
            executeCommand(terminalInput.value.trim().split(" "));
        }
        terminalInput.value = '';

        render(true);
    }
})

terminalInput.addEventListener('keydown', (e) => {
    render();
})

terminalInput.addEventListener('focus', (e) => {
    if (!terminalCursor.classList.contains('focused')) {
        terminalCursor.classList.add('focused');
    }
})
terminalInput.addEventListener('blur', (e) => {
    terminalCursor.classList.remove('focused');
})

terminalInput.addEventListener('keyup', (e) => {
    render();
})

terminalInput.addEventListener('input', (e) => {
    render();
})

const resizeObserver = new ResizeObserver(() => {
    updateSelection();
    render();
});
resizeObserver.observe(document.body);

browserWindow.addEventListener('focus', () => {
    terminalInput.focus();
})

var command_list = {
    package: {
        install: (content, id) => {
            var api = generateResponse(id).createLine(`Unavailable command.`, "red");
            return
            var api = generateResponse(id);
            var mode = "--none";
            content.split(" ").forEach(obj => {
                var temp = obj.match(/--[A-z0-9-]+/gi) || null;
                if (temp != null) {
                    mode = temp[temp.length - 1];
                }
            })
            if (content == "all") {
                // Install all
                pkgs.forEach(pkg => {
                    System.loadSystemApps(pkg.scripts);
                })
                api.createLine(`${pkgs.length} package(s) installed.`, "green");
            } else if (mode.search("--multiple") > -1) {
                // Install multiple packages
                var content = content.replace(mode, "");
                var mode = mode.replace("--multiple", "");
                mode = mode.replace("-", "");
                if (mode != "index" && mode != "name") {
                    return api.createLineFromArray([
                        `The type "${mode}" doesn't exist.`,
                        `Please use "package install <packages> --multiple-<type>" to install multiple packages.`,
                        `<packages> : Use spaces to separate indexes or names`,
                        `<type> : index, name`,
                    ], "red", true);
                }
                var specified = content.trim().split(" ");
                var pkg_count = 0;
                pkgs.forEach((pkg, i) => {
                    console.log(i, ",", specified.includes(i.toString()), ",", specified.includes(pkg.name))
                    if (mode == "index") {
                        if (specified.includes(i.toString())) {
                            pkg_count++;
                            System.loadSystemApps(pkg.scripts, () => {
                                api.createLine(`Package "${i}" installed.`, "green");
                            });
                        }
                    } else if (mode == "name") {
                        if (specified.includes(pkg.name)) {
                            pkg_count++;
                            System.loadSystemApps(pkg.scripts, () => {
                                api.createLine(`Package "${pkg.name}" installed.`, "green");
                            });
                        }
                    }
                })
                if (pkg_count == 0) {
                    api.createLine(`No packages found.`, "red");
                }
            } else if (pkgs[content]) {
                // Install by index
                System.loadSystemApps(pkgs[content].scripts);
                api.createLine(`Package "${content}" installed.`, "green");
            } else {
                var script = null;
                var name = null;
                pkgs.forEach(pkg => {
                    if (pkg.name == content) {
                        script = pkg.scripts;
                        name = pkg.name;
                    }
                })
                if (script != null) {
                    // Install by name
                    return System.loadSystemApps(script, () => {
                        api.createLine(`Package "${name}" installed.`, "green");
                    });
                } else {
                    return api.createLineFromArray([
                        `'${content}' is not a available package.`,
                        `Please use "package install [all|index|name] [--multiple-[index|name]]" to install the packages,`,
                        `and use "package list" to list all the packages.`
                    ], "red");
                }
            }
        },
        list: (content, id) => {
            var api = generateResponse(id).createLine(`Unavailable command.`, "red");
            return;
            var api = generateResponse(id);
            var table = {
                "Name": [],
                "Index": []
            };
            pkgs.forEach((pkg, i) => {
                table["Name"].push(pkg.name)
                table["Index"].push(i)
            })
            api.createTable(table)
            return;
        },
        __err: (content, id, code) => {
            var api = generateResponse(id);
            api.createLineFromArray([
                `'${content}' is not a valid package command.`,
                `Please use "package install [all|index|name] [--multiple-[index|name]]" to install the packages,`,
                `and use "package list" to list all the packages.`
            ], "red");
        }
    },
    color: (content, id) => {
        var api = generateResponse(id);
        var colors = ["red", "yellow", "green", "white", "default"];

        if (!colors[Number(content.trim())] || content.trim().length < 1) {
            api.createLineFromArray([
                `Please use "color <code>" to set the color of the terminal.`,
                `<code> : Displayed as follows.`
            ], "red", true);
            var table = api.createCustomTable();
            var color_col = table.createCol();
            var code_col = table.createCol();

            color_col.createRow("Colors");
            code_col.createRow("Codes");

            colors.forEach((color, i) => {
                color_col.createRow(color, [`terminal-line-${color}`]);
                code_col.createRow(i);
            })
        }
    },
    version: (content, id) => {
        var api = generateResponse(id);
        api.createLineFromArray([`Version: ${CMD_VERSION}`]);
    },
    date: (content, id) => {
        var api = generateResponse(id);
        api.createLineFromArray([new Date(Date.now()).format("yyyy/MM/dd")])
    },
    time: (content, id) => {
        var api = generateResponse(id);
        api.createLineFromArray([new Date(Date.now()).format("hh:mm:ss")])
    },
    help: (content, id) => {
        var api = generateResponse(id);
        api.createLineFromArray(Object.keys(command_list).sort())
    },
    clear: () => {
        lines = {};
        datas = {};
        terminalScrollTop = 0;
        render();
    },
    prank: (content, id) => {
        var api = generateResponse(id);
        var line_length = isCustomNumber(content) ? content : 1000;
        var created = 0;
        function write() {

        }
        write();
    },
    net: {
        open: (content, id) => {
            var api = generateResponse(id);
            api.createLine(`Opened "${content}" successfully.`);
        }
    },
    exit: (content, id) => {
        process.exit();
    },
    run: (content, id) => {
        var api = generateResponse(id);
        api.createLine(window.System.Shell(`run ${content}`).message);
    },
    kill: (content, id) => {
        var api = generateResponse(id);
        if (content.trim().length == 0) {
            api.createLine("Name | Pid");

            Object.values(window.System.processes).forEach(process => {
                api.createLine(`${window.appRegistry.getApp(process.path).name} | ${process.id}`);
            })

            return;
        }
        if (content.trim() == "all") {
            Object.values(window.System.processes).forEach(process => {
                process.exit();
            })
            return;
        }
        if (!window.System.processes[content.trim()]) {
            api.createLine(`Process [ ${content.trim()} ] doesn't exist.`, "red");
            return;
        }
        window.System.processes[content.trim()].exit();
        api.createLine(`Process [ ${content.trim()} ] has been killed.`, "green");
    }
}

function executeCommand(cmd, id, current = command_list) {
    var api = generateResponse(id);
    if (current[cmd[0]]) {
        if (isFunction(current[cmd[0]]) && current[cmd[0]].name.slice(0, 2) != "__") {
            return current[cmd[0]](cmd.slice(1).join(" "), id);
        } else if (cmd.length == 1) {
            var list = Object.keys(current[cmd[0]]);
            if (list.length < 1) {
                if (isFunction(current["__err"])) {
                    current["__err"](current[cmd[0]].name.slice(0, 2) == "__" ? cmd.join(" ") : cmd.slice(1).join(" "), id, "0");
                } else {
                    api.createLineFromArray([
                        `'${cmd.join(" ")}' is not recognized as an internal or external command,`,
                        `operable program or batch file.`,
                        '',
                        `Type "help" for available commands`
                    ], "red")
                }
            } else {
                var command_list = Object.keys(current[cmd[0]]);
                command_list.forEach((command, i) => {
                    if (command.slice(0, 2) == "__") {
                        command_list.splice(i, 1);
                    }
                })
                api.createLineFromArray(command_list);
            }
        } else {
            executeCommand(cmd.slice(1), id, current[cmd[0]]);
        }
    } else {
        if (isFunction(current["__err"])) {
            return current["__err"](Array.isArray(cmd) ? cmd.join(" ") : "", id, "0");
        } else {
            api.createLineFromArray([
                `'${Array.isArray(cmd) ? cmd.join(" ") : ""}' is not recognized as an internal or external command,`,
                `operable program or batch file.`,
                '',
                `Type "help" for available commands`
            ], "red");
        }
    }
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function generateResponse(id) {
    function createLine(content, type = "default", format = false) {
        lines[Object.values(lines).length] = {
            text: content,
            style: [{
                range: [0, content.length - 1],
                color: type === "red" ? "#f1828c" : type === "green" ? "#56ed55" : type === "yellow" ? "#ffd78e" : "#fff"
            }]
        };
        render();
    }
    function createLineFromArray(array, type, format = false) {
        array.forEach(line => {
            createLine(line, type, format);
        })
    }
    function createTable(table) {
        var titles = Object.keys(table);
        var rows = Object.values(table);
        rows.forEach((title, i) => {
            var content = '';
            titles.forEach((title, j) => {
                content += `${row}`;
            })
            lines[Object.values(lines).length] = {
                text: content
            };
        });
    }
    function createCustomTable() {
        return {};
    }
    function exit() {
        waiting = false;
    }
    return { id, parent, createLine, createLineFromArray, createTable, createCustomTable, exit }
}

render();

terminalInput.focus();

/*
function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
    const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
    const fontSize = getCssStyle(el, 'font-size') || 'normal';
    const fontFamily = getCssStyle(el, 'font-family') || 'monospace';

    return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function omitString(org) {
    if (org.length <= 21) return org;
    return org.slice(0, 11) + "…" + org.slice(-9)
}

function formatString(str, omit = false) {
    // console.log(str)
    try {
        if (omit == true) {
            str = omitString(str);
        }
        return str.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    } catch (e) {
        return str;
    }
}

render();



var randomString = function (count, chars) {
    var chars = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
}


function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

var type_history = [""];
var current_index = 0;

Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; };

function initHackPanel() {
    terminal_lines.innerHTML =
        `                                      
<div class="terminal-group">
            <div class="terminal-typed">
                <div class="terminal-line">Microhard Winbows [Version ${CMD_VERSION}]</div>
                <div class="terminal-line">(c) Microhard Corporation. All rights reserved.</div>
                <div class="terminal-line"><br></div>
                <div class="terminal-line">Type "help" for available commands</div>
            </div></div>
`;
}

initHackPanel();

function generateResponse(id) {
    var parent = terminal_lines.querySelector(`[data-id="${id}"]`);
    var createLine = (content, type = "default", format = false) => {
        parent.innerHTML += `<div class="terminal-line terminal-line-${type}">${format == true ? formatString(content) : content}</div>`;
        if (terminal.scrollTop >= terminal.scrollHeight - terminal.offsetHeight * 2) {
            terminal.scrollTop = terminal.scrollHeight;
        }
    }
    var createLineFromArray = (array, type, format = false) => {
        array.forEach(line => {
            createLine(line, type, format);
        })
    }
    var createTable = (table) => {
        var titles = Object.keys(table);
        var rows = Object.values(table);
        var html = "";
        titles.forEach((title, i) => {
            var temp = "";
            rows[i].forEach(row => {
                temp += `<div class="terminal-row">${row}</div>`;
            })
            html += `<div class="terminal-col"><div class="terminal-row">${title}</div>${temp}</div>`;
        });
        parent.innerHTML += `<div class="terminal-table">${html}</div>`;
    }
    var createCustomTable = () => {
        var table = document.createElement("div");
        table.className = "terminal-table";
        var createCol = (classList = []) => {
            var col = document.createElement("div");
            classList.concat(["terminal-col"]).forEach(item => {
                col.classList.add(item);
            })
            table.appendChild(col);
            var createRow = (content, classList = [], format = false) => {
                var row = document.createElement("div");
                classList.concat(["terminal-row"]).forEach(item => {
                    row.classList.add(item);
                })
                row.innerHTML = format == true ? formatString(content) : content;
                col.appendChild(row);
            }
            return { createRow };
        }
        parent.appendChild(table);
        return { table, createCol };
    }
    return { id, parent, createLine, createLineFromArray, createTable, createCustomTable }
}

var isNumber = function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

var isNumberObject = function isNumberObject(n) {
    return (Object.prototype.toString.apply(n) === '[object Number]');
}

var isCustomNumber = function isCustomNumber(n) {
    return isNumber(n) || isNumberObject(n);
}

var command_list = {
    package: {
        install: (content, id) => {
            return generateResponse(id).createLine(`Unavailable command.`, "red");
            var api = generateResponse(id);
            var mode = "--none";
            content.split(" ").forEach(obj => {
                var temp = obj.match(/--[A-z0-9-]+/gi) || null;
                if (temp != null) {
                    mode = temp[temp.length - 1];
                }
            })
            if (content == "all") {
                // Install all
                pkgs.forEach(pkg => {
                    System.loadSystemApps(pkg.scripts);
                })
                api.createLine(`${pkgs.length} package(s) installed.`, "green");
            } else if (mode.search("--multiple") > -1) {
                // Install multiple packages
                var content = content.replace(mode, "");
                var mode = mode.replace("--multiple", "");
                mode = mode.replace("-", "");
                if (mode != "index" && mode != "name") {
                    return api.createLineFromArray([
                        `The type "${mode}" doesn't exist.`,
                        `Please use "package install <packages> --multiple-<type>" to install multiple packages.`,
                        `<packages> : Use spaces to separate indexes or names`,
                        `<type> : index, name`,
                    ], "red", true);
                }
                var specified = content.trim().split(" ");
                var pkg_count = 0;
                pkgs.forEach((pkg, i) => {
                    console.log(i, ",", specified.includes(i.toString()), ",", specified.includes(pkg.name))
                    if (mode == "index") {
                        if (specified.includes(i.toString())) {
                            pkg_count++;
                            System.loadSystemApps(pkg.scripts, () => {
                                api.createLine(`Package "${formatString(i)}" installed.`, "green");
                            });
                        }
                    } else if (mode == "name") {
                        if (specified.includes(pkg.name)) {
                            pkg_count++;
                            System.loadSystemApps(pkg.scripts, () => {
                                api.createLine(`Package "${formatString(pkg.name)}" installed.`, "green");
                            });
                        }
                    }
                })
                if (pkg_count == 0) {
                    api.createLine(`No packages found.`, "red");
                }
            } else if (pkgs[content]) {
                // Install by index
                System.loadSystemApps(pkgs[content].scripts);
                api.createLine(`Package "${content}" installed.`, "green");
            } else {
                var script = null;
                var name = null;
                pkgs.forEach(pkg => {
                    if (pkg.name == content) {
                        script = pkg.scripts;
                        name = pkg.name;
                    }
                })
                if (script != null) {
                    // Install by name
                    return System.loadSystemApps(script, () => {
                        api.createLine(`Package "${formatString(name)}" installed.`, "green");
                    });
                } else {
                    return api.createLineFromArray([
                        `'${formatString(content)}' is not a available package.`,
                        `Please use "package install [all|index|name] [--multiple-[index|name]]" to install the packages,`,
                        `and use "package list" to list all the packages.`
                    ], "red");
                }
            }
        },
        list: (content, id) => {
            return generateResponse(id).createLine(`Unavailable command.`, "red");
            var api = generateResponse(id);
            var table = {
                "Name": [],
                "Index": []
            };
            pkgs.forEach((pkg, i) => {
                table["Name"].push(pkg.name)
                table["Index"].push(i)
            })
            api.createTable(table)
            return;
        },
        __err: (content, id, code) => {
            var api = generateResponse(id);
            return api.createLineFromArray([
                `'${formatString(content)}' is not a valid package command.`,
                `Please use "package install [all|index|name] [--multiple-[index|name]]" to install the packages,`,
                `and use "package list" to list all the packages.`
            ], "red");
        }
    },
    color: (content, id) => {
        var api = generateResponse(id);
        var colors = ["red", "yellow", "green", "white", "default"];

        if (!colors[Number(content.trim())] || content.trim().length < 1) {
            api.createLineFromArray([
                `Please use "color <code>" to set the color of the terminal.`,
                `<code> : Displayed as follows.`
            ], "red", true);
            var table = api.createCustomTable();
            var color_col = table.createCol();
            var code_col = table.createCol();

            color_col.createRow("Colors");
            code_col.createRow("Codes");

            colors.forEach((color, i) => {
                color_col.createRow(color, [`terminal-line-${color}`]);
                code_col.createRow(i);
            })
            return;
        } else {
            if (colors[Number(content.trim())] == "default") {
                document.head.querySelectorAll(`[data-element="terminal-style"]`).forEach(style => {
                    style.remove();
                })
            } else {
                var style = document.createElement("style");
                style.setAttribute("data-element", "terminal-style");
                style.innerHTML = `.terminal * {
                        --terminal-border-color: var(--terminal-color-${colors[Number(content.trim())]});
                        color: var(--terminal-color-${colors[Number(content.trim())]}) !important;
                    }`;
                document.head.appendChild(style);
            }
        }
    },
    version: (content, id) => {
        var api = generateResponse(id);
        return api.createLineFromArray([`Version: ${CMD_VERSION}`])
    },
    date: (content, id) => {
        var api = generateResponse(id);
        return api.createLineFromArray([new Date(Date.now()).format("yyyy/MM/dd")])
    },
    time: (content, id) => {
        var api = generateResponse(id);
        return api.createLineFromArray([new Date(Date.now()).format("hh:mm:ss")])
    },
    help: (content, id) => {
        var api = generateResponse(id);
        return api.createLineFromArray(Object.keys(command_list).sort())
    },
    clear: () => {
        setTimeout(() => {
            initHackPanel();
        }, 500)
    },
    prank: (content, id) => {
        var api = generateResponse(id);
        var line_length = isCustomNumber(content) ? content : 1000;
        var created = 0;
        function write() {
            api.createLine(randomString(terminal_lines.offsetWidth / 7.5));
            created++;
            if (created < line_length) {
                setTimeout(write, 25);
            }
        }
        write();
    },
    net: {
        open: (content, id) => {
            var api = generateResponse(id);
            api.createLine(`Opened "<a href="${content}" target="_blank">${formatString(content)}</a>" successfully.`);
        }
    },
    exit: (content, id) => {
        process.exit();
    },
    run: (content, id) => {
        var command = content.split(" ")[0].split(".");
        var api = generateResponse(id);
        return api.createLine(window.System.Shell(`run ${content}`).message);
    },
    kill: (content, id) => {
        var api = generateResponse(id);
        if (content.trim().length == 0) {
            var table = api.createCustomTable();
            var name_col = table.createCol();
            var pid_col = table.createCol();

            name_col.createRow("Name");
            pid_col.createRow("Pid");

            Object.values(window.System.processes).forEach(process => {
                name_col.createRow(window.appRegistry.getApp(process.path).name);
                pid_col.createRow(process.id);
            })

            return;
        }
        if (content.trim() == "all") {
            Object.values(window.System.processes).forEach(process => {
                process.exit();
            })
        }
        Object.values
        if (!window.System.processes[content.trim()]) {
            return api.createLine(`Process [ ${content.trim()} ] doesn't exist.`, "red");
        }
        window.System.processes[content.trim()].exit();
        return api.createLine(`Process [ ${content.trim()} ] has been killed.`, "green");
    }
}

function cmdParser(cmd, id, current = command_list) {
    console.log(cmd)
    var api = generateResponse(id);
    if (current[cmd[0]]) {
        if (isFunction(current[cmd[0]]) && current[cmd[0]].name.slice(0, 2) != "__") {
            return current[cmd[0]](cmd.slice(1).join(" "), id);
        } else if (cmd.length == 1) {
            var list = Object.keys(current[cmd[0]]);
            if (list.length < 1) {
                if (isFunction(current["__err"])) {
                    current["__err"](current[cmd[0]].name.slice(0, 2) == "__" ? cmd.join(" ") : cmd.slice(1).join(" "), id, "0");
                } else {
                    api.createLineFromArray([
                        `'${formatString(cmd.join(" "))}' is not recognized as an internal or external command,`,
                        `operable program or batch file.`,
                        '',
                        `Type "help" for available commands`
                    ], "red")
                }
            } else {
                var command_list = Object.keys(current[cmd[0]]);
                command_list.forEach((command, i) => {
                    if (command.slice(0, 2) == "__") {
                        command_list.splice(i, 1);
                    }
                })
                api.createLineFromArray(command_list);
            }
        } else {
            cmdParser(cmd.slice(1), id, current[cmd[0]]);
        }
    } else {
        if (isFunction(current["__err"])) {
            return current["__err"](Array.isArray(cmd) ? cmd.join(" ") : "", id, "0");
        } else {
            api.createLineFromArray([
                `'${formatString(Array.isArray(cmd) ? cmd.join(" ") : "")}' is not recognized as an internal or external command,`,
                `operable program or batch file.`,
                '',
                `Type "help" for available commands`
            ], "red");
        }
    }
}

terminal_input.focus();

var focused = true;
var path = 'C:\\Users\\Admin';

terminal.addEventListener("click", () => {
    focused = true;
})

document.addEventListener("click", (e) => {
    if (!document.documentElement.contains(e.target) && e.target != document.documentElement) {
        focused = false;
    }
})

function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}

document.addEventListener("keydown", (e) => {
    if (focused == true) {
        if (e.keyCode == 38) {
            current_index > 0 ? (current_index--) : current_index;
            terminal_input.value = type_history[current_index];
            // terminal_input.selectionStart = terminal_input.value.length;
            e.preventDefault();
            moveCaretToEnd(terminal_input);
        }

        if (e.keyCode == 40) {
            current_index < type_history.length - 1 ? (current_index++) : (current_index = type_history.length - 1);
            terminal_input.value = type_history[current_index];
            // terminal_input.selectionStart = terminal_input.value.length;
            e.preventDefault();
            moveCaretToEnd(terminal_input);
        }

        setTimeout(() => {
            terminal_typein.style.height = "10px";
            terminal_typein.style.height = terminal_input.scrollHeight + 'px';
        }, 100);
    }
    if (focused == true && !e.ctrlKey) {
        terminal_input.focus();
    }
})

var terminal_path = terminal.querySelector(".terminal-typein .terminal-path");
terminal_path.innerHTML = formatString(path + ">");

terminal_input.onpaste = (event) => {
    setTimeout(() => {
        terminal_typein.style.height = "10px";
        terminal_typein.style.height = terminal_input.scrollHeight + 'px';
    }, 100);
    setTimeout(() => {
        terminal.scrollTop = terminal.scrollHeight;
    }, 200)
}

const observer = new ResizeObserver(resizeHandler);
observer.observe(terminal_input);

let isResizing = false;
async function resizeHandler() {
    setTimeout(() => {
        terminal_typein.style.height = terminal_input.scrollHeight + 'px';
    }, 100);

}

var randomString = function (count, chars) {
    var chars = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
}

terminal_input.onkeypress = (e) => {
    // console.log(e.keyCode, e.key, e.which)
    if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        runCommand(terminal_input.value);
    }

    setTimeout(() => {
        terminal_typein.style.height = "10px";
        terminal_typein.style.height = terminal_input.scrollHeight + 'px';
    }, 100);
}

function runCommand(command) {
    var lines = command.split("\n");
    var line_id = randomString(96);
    var html = "";
    lines.forEach((line, i) => {
        if (i == 0) {
            var line = line.split(" ");
            html += `<div class="terminal-line"><span class="terminal-line-yellow">${formatString(line[0])}</span> ${formatString(line.slice(1).join(' '))}</div>`;
        } else {
            html += `<div class="terminal-line">${formatString(line)}</div>`
        }
    })
    terminal_lines.innerHTML += `<div class="terminal-group" style="margin: 0"><span class="terminal-path">${formatString(path + ">")}</span><div class="terminal-typed">${html}</div></div><div class="terminal-group" style="flex-direction: column;" data-id="${line_id}"></div>`;

    if (command.trim().length > 0) {
        cmdParser(command.trim().split(" "), line_id);
    } else {
        terminal_lines.querySelector(`[data-id="${line_id}"]`).remove();
    }

    type_history.push(command)
    terminal_input.value = "";
    setTimeout(() => {
        terminal.scrollTop = terminal.scrollHeight;
    }, 200)
    current_index = type_history.length;
}
    */