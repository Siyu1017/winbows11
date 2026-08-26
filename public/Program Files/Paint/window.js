var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(path.resolve('./window.css'));
document.head.appendChild(style);

let currentTheme = System.theme.get();
browserWindow.setTheme(currentTheme);
if (currentTheme == 'dark') {
    document.documentElement.classList.add('winui-dark');
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('winui-dark');
    document.documentElement.classList.remove('dark');
}

System.theme.onChange(theme => {
    currentTheme = theme;
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
        document.documentElement.classList.remove('dark');
    }
    renderStatic();
})

document.body.innerHTML = `<div class="controls-container">
        <div class="controls">
            <div class="controls-group">
                <button class="control" data-role="undo" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M9 14 4 9l5-5" />
                        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                    </svg>
                </button>
                <button class="control" data-role="redo" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="m15 14 5-5-5-5" />
                        <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
                    </svg>
                </button>
            </div>
            <div class="controls-group">
                <button class="control" data-role="move">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M12 2v20"/>
                        <path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/>
                        <path d="M2 12h20"/><path d="m5 9-3 3 3 3"/>
                        <path d="m9 5 3-3 3 3"/>
                    </svg>
                </button>
                <button class="control" data-role="select" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
                    </svg>
                </button>
                <button class="control" data-role="draw">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                    </svg>
                </button>
                <button class="control" data-role="eraser">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                        <path d="M22 21H7" />
                        <path d="m5 11 9 9" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    </div>
    <canvas data-el="static" style="width: 100%;height: 100%;z-index: 0;pointer-events: none;position: fixed;top: 0;left: 0;right: 0;bottom: 0;"></canvas>
    <canvas data-el="paint" style="width: 100%;height: 100%;z-index: 1;position: fixed;top: 0;left: 0;right: 0;bottom: 0;"></canvas>
    <canvas data-el="interactive" style="width: 100%;height: 100%;z-index: 2;position: fixed;top: 0;left: 0;right: 0;bottom: 0;pointer-events: none;"></canvas>`;

const { getStroke } = await requireAsync('./lib.js');

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

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    s /= 100; l /= 100; h /= 360;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function toDarkModeColor(r, g, b) {
    let [h, s, l] = rgbToHsl(r, g, b);

    if (l < 10) l = 95;
    else if (l > 90) l = 10;
    else l = Math.max(20, l * 0.5);

    return hslToRgb(h, s, l);
}

const eventEmitter = (() => {
    const listeners = {};
    return {
        on(event, listener) {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
        },
        off(event, listener) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(l => l !== listener);
            }
        },
        _emit(event, detail) {
            if (listeners[event]) {
                listeners[event].forEach(listener => listener(detail));
            }
        }
    }
})();
const staticCanvas = document.querySelector('[data-el="static"]');
const paintCanvas = document.querySelector('[data-el="paint"]');
const interactiveCanvas = document.querySelector('[data-el="interactive"]');
const staticCtx = staticCanvas.getContext('2d', {
    willReadFrequently: true
});
const paintCtx = paintCanvas.getContext('2d');
const interactiveCtx = interactiveCanvas.getContext('2d');

const undoButton = document.querySelector('[data-role="undo"]');
const redoButton = document.querySelector('[data-role="redo"]');
const moveButton = document.querySelector('[data-role="move"]');
const drawButton = document.querySelector('[data-role="draw"]');
const eraserButton = document.querySelector('[data-role="eraser"]');

let strokeConfig = {
    size: 6,
    thinning: 0.5,
    smoothing: .8,
    streamline: 1
}
let mode = 'draw';
let tiles = {};

// Draw
let color = [0, 0, 0];
let isDrawing = false;
let lastPoint = null;
let points = [];
let objs = [];

// Render
let currentIndex = 0;
let position = [0, 0];
let scale = 1;
let range = {
    x: [0, 0],
    y: [0, 0]
}

// Size
let originalSize = [paintCanvas.offsetWidth, paintCanvas.offsetHeight];
let currentSize = [paintCanvas.offsetWidth, paintCanvas.offsetHeight];

// Move
let originalPointerPosition = { x: 0, y: 0 }
let originalPosition = [...position];

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
moveButton.addEventListener('click', () => switchMode('move'));
drawButton.addEventListener('click', () => switchMode('draw'));
eraserButton.addEventListener('click', () => switchMode('eraser'));
activeButton(drawButton);

function getViewport() {
    const w = paintCanvas.offsetWidth * scale,
        h = paintCanvas.offsetHeight * scale;
    return {
        x: [position[0] - w / 2, position[0] + w / 2],
        y: [position[1] - h / 2, position[1] + h / 2],
        w, h
    }
}

function shouldRender(x, y, w, h) {
    const viewport = getViewport();
    if (
        x + w < viewport.x[0] ||
        x > viewport.x[1] ||
        y + h < viewport.y[0] ||
        y > viewport.y[1]
    ) {
        return false;
    }
    return true;
}

function redo() {
    if (isDrawing == true) return;
    if (currentIndex < objs.length) {
        currentIndex++;
    } else {
        currentIndex = objs.length;
    }
    update({
        type: 'redo'
    });
}

function undo() {
    if (isDrawing == true) return;
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = 0;
    }
    update({
        type: 'undo'
    });
}

function activeButton(button) {
    document.querySelectorAll('.control.active').forEach(active => {
        active.classList.remove('active');
    })
    button.classList.add('active');
}

function switchMode(targetMode) {
    if (targetMode === 'draw') {
        mode = targetMode;
        activeButton(drawButton);
    } else if (targetMode === 'eraser') {
        mode = targetMode;
        const imageData = staticCtx.getImageData(0, 0, staticCanvas.width, staticCanvas.height);
        paintCtx.putImageData(imageData, 0, 0);
        activeButton(eraserButton);
    } else if (targetMode === 'move') {
        mode = targetMode;
        activeButton(moveButton);
    }
}

function throttle(fn) {
    let timeout = null;

    return function (...args) {
        const throttler = () => {
            timeout = null;
            fn.apply(this, args);
        };

        if (!timeout) timeout = setTimeout(throttler, 16);
    };
}

const observer = new ResizeObserver(throttle(() => {
    originalSize = [...currentSize];
    currentSize = [paintCanvas.offsetWidth, paintCanvas.offsetHeight];

    renderStatic();
    renderCanvas();
    renderEraser();
}));
observer.observe(document.documentElement);

function toCanvasPosition(xP, yP) {
    const viewport = getViewport();
    const baseX = viewport.x[0],
        baseY = viewport.y[0];
    return {
        x: baseX + xP * viewport.w,
        y: baseY + yP * viewport.h
    }
}

function renderObject(ctx, obj) {
    if (!shouldRender(obj.x, obj.y, obj.w, obj.h)) return;

    ctx.save();
    ctx.beginPath();

    const viewport = getViewport();
    const config = {
        size: 6,
        thinning: 0.5,
        smoothing: .8,
        streamline: 1
    };
    let color = [...obj.color];
    if (obj.type == 'eraser') {
        ctx.strokeStyle = 'black';
        ctx.globalCompositeOperation = 'destination-out';
        config.size = 20;
        config.thinning = 0;
        config.smoothing = 0;
    } else if (obj.type == 'draw') {
        if (currentTheme == 'dark') {
            color = toDarkModeColor(...color);
        }
        ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.globalCompositeOperation = 'source-over';
        config.size = 6;
        config.thinning = 0.5;
        config.smoothing = .8;
    }

    const points = obj.points;
    const strokePoints = getStroke(points, config);
    if (strokePoints.length > 2) {
        ctx.moveTo(strokePoints[0].x - viewport.x[0], strokePoints[0].y - viewport.y[0])
        for (let i = 1; i < strokePoints.length; i++) {
            ctx.lineTo(strokePoints[i][0] - viewport.x[0], strokePoints[i][1] - viewport.y[0])
        }
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

function renderStatic() {
    if (currentIndex < objs.length) {
        redoButton.disabled = false;
    } else {
        redoButton.disabled = true;
    }
    if (currentIndex > 0) {
        undoButton.disabled = false;
    } else {
        undoButton.disabled = true;
    }
    canvasClarifier(staticCanvas, staticCtx);
    objs.forEach((obj, i) => {
        if (i >= currentIndex) return;
        renderObject(staticCtx, obj);
    })
}

function renderCanvas(end = false) {
    if (mode == 'eraser' && isDrawing && end == false) {
        staticCanvas.style.opacity = 0;
        if (originalSize[0] != currentSize[0] || originalSize[1] != currentSize[1]) {
            const imageData = staticCtx.getImageData(0, 0, staticCanvas.width, staticCanvas.height);
            paintCtx.putImageData(imageData, 0, 0);
            originalSize = [...currentSize];
        }
    } else {
        canvasClarifier(paintCanvas, paintCtx);
        staticCanvas.style.opacity = 1;
    }

    renderObject(paintCtx, {
        type: mode,
        points: points,
        color: color,
        x: range.x[0],
        y: range.y[0],
        w: range.x[1] - range.x[0],
        h: range.y[1] - range.y[0]
    })
}

function renderEraser(position) {
    canvasClarifier(interactiveCanvas, interactiveCtx);
    if (!position) return;
    const { x, y } = position;
    interactiveCtx.save();
    interactiveCtx.beginPath();
    if (currentTheme == 'dark') {
        interactiveCtx.strokeStyle = 'rgb(225,225,225)';
    } else {
        interactiveCtx.strokeStyle = 'rgb(60,60,60)';
    }
    interactiveCtx.arc(x, y, 20 / 2, 0, 2 * Math.PI);
    interactiveCtx.stroke();
    interactiveCtx.closePath();
    interactiveCtx.restore();
}

function handleStart(e) {
    const elPosition = getPosition(document.documentElement);
    const w = paintCanvas.offsetWidth;
    const h = paintCanvas.offsetHeight;
    let x = e.pageX;
    let y = e.pageY;
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        x = touch.pageX;
        y = touch.pageY;
    }
    isDrawing = true;

    if (mode == 'move') {
        originalPointerPosition = { x, y };
        originalPosition = [...position];
        paintCanvas.style.opacity = 0;
        return;
    }

    const aPos = toCanvasPosition((x - elPosition.x) / w, (y - elPosition.y) / h);
    x = aPos.x;
    y = aPos.y;
    eventEmitter._emit('pointerdown', { x, y });

    if (mode == 'eraser') {
        staticCanvas.style.opacity = 0;
        const imageData = staticCtx.getImageData(0, 0, staticCanvas.width, staticCanvas.height);
        paintCtx.putImageData(imageData, 0, 0);
    } else {
        staticCanvas.style.opacity = 1;
    }
    paintCanvas.style.opacity = 1;

    lastPoint = { x, y, pressure: e.pressure };
    range = {
        x: [x, x],
        y: [y, y]
    }
    renderCanvas();
}

function handleMove(e) {
    if (!isDrawing) return;
    const elPosition = getPosition(document.documentElement);
    const w = paintCanvas.offsetWidth;
    const h = paintCanvas.offsetHeight;
    let x = e.pageX;
    let y = e.pageY;
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        x = touch.pageX;
        y = touch.pageY;
    }

    if (mode == 'move') {
        // Use pointer position
        position[0] = originalPosition[0] + (originalPointerPosition.x - x);
        position[1] = originalPosition[1] + (originalPointerPosition.y - y);
        renderStatic();
        return;
    }

    const aPos = toCanvasPosition((x - elPosition.x) / w, (y - elPosition.y) / h);
    x = aPos.x;
    y = aPos.y;
    eventEmitter._emit('pointermove', { x, y });

    if (x > range.x[1]) range.x[1] = x;
    if (x < range.x[0]) range.x[0] = x;
    if (y > range.y[1]) range.y[1] = y;
    if (y < range.y[0]) range.y[0] = y;

    const pressure = e.pressure;
    if (lastPoint) {
        points.push(lastPoint);
        lastPoint = { x, y, pressure };
    }
    renderCanvas();
}

function handleEnd(e) {
    console.log(position)
    if (isDrawing == true && mode != 'move') {
        points.push(lastPoint);
        objs.splice(currentIndex);
        const data = {
            type: mode,
            points: points,
            color: color,
            x: range.x[0],
            y: range.y[0],
            w: range.x[1] - range.x[0],
            h: range.y[1] - range.y[0]
        }
        objs.push(data);
        currentIndex = objs.length;
        points = [];
        const elPosition = getPosition(document.documentElement);
        const w = paintCanvas.offsetWidth;
        const h = paintCanvas.offsetHeight;
        let x = e.pageX;
        let y = e.pageY;
        if (e.type.startsWith('touch')) {
            const touch = e.touches[0] || e.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        }
        const aPos = toCanvasPosition((x - elPosition.x) / w, (y - elPosition.y) / h);
        x = aPos.x;
        y = aPos.y;
        eventEmitter._emit('pointerup', { x, y });
        renderStatic();
        renderCanvas(true);
    }
    isDrawing = false;
    lastPoint = null;
}

const events = {
    "start": ["mousedown", "touchstart", "pointerdown"],
    "move": ["mousemove", "touchmove", "pointermove"],
    "end": ["mouseup", "touchend", "pointerup", "blur"]
}

events.start.forEach(event => {
    paintCanvas.addEventListener(event, handleStart);
})
events.move.forEach(event => {
    window.addEventListener(event, handleMove);
    window.addEventListener(event, (e) => {
        if (mode == 'eraser') {
            const position = getPosition(document.documentElement);
            let x = e.pageX;
            let y = e.pageY;
            if (e.type.startsWith('touch')) {
                const touch = e.touches[0] || e.changedTouches[0];
                x = touch.pageX;
                y = touch.pageY;
            }
            x -= position.x;
            y -= position.y;
            renderEraser({ x, y });
        }
    })
})
events.end.forEach(event => {
    window.addEventListener(event, handleEnd);
})

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && isDrawing == false) {
        e.preventDefault();
        if (e.key.toLocaleUpperCase() == "Z") {
            return undo();
        } else if (e.key.toLocaleUpperCase() == "Y") {
            return redo();
        } else if (e.key.toLocaleUpperCase() == "S") {
            return download();
        }
    }
})

paintCanvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
})

function update({ type }) {
    if (type == 'undo' || type == 'redo') {
        staticCanvas.opacity = 1;
        paintCanvas.opacity = 0;
        renderStatic();
    } else if (type == 'eraser') {
        staticCanvas.opacity = 0;
        paintCanvas.opacity = 1;
        renderCanvas();
    } else if (type == 'draw') {
        staticCanvas.opacity = 1;
        paintCanvas.opacity = 1;
        renderCanvas();
    }
}