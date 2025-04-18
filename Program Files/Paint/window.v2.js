var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

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
                <button class="control" data-role="move" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
                    </svg>
                </button>
                <button class="control" data-role="select" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="control-icon">
                        <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
                        <path d="M5 3a2 2 0 0 0-2 2" />
                        <path d="M19 3a2 2 0 0 1 2 2" />
                        <path d="M5 21a2 2 0 0 1-2-2" />
                        <path d="M9 3h1" />
                        <path d="M9 21h2" />
                        <path d="M14 3h1" />
                        <path d="M3 9v1" />
                        <path d="M21 9v2" />
                        <path d="M3 14v1" />
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
    <canvas data-el="presentation" style="width: 100%;height: 100%;z-index: -1;pointer-events: none;position: fixed;top: 0;left: 0;right: 0;bottom: 0;"></canvas>
    <canvas data-el="canvas" style="width: 100%;height: 100%;z-index: 1;position: fixed;top: 0;left: 0;right: 0;bottom: 0;"></canvas>`;

import getStroke from 'C:/Program Files/Paint/lib.js';

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

const presentation = document.querySelector('[data-el="presentation"]');
const canvas = document.querySelector('[data-el="canvas"]');
const presentationCtx = presentation.getContext('2d');
const ctx = canvas.getContext('2d');
const undoButton = document.querySelector('[data-role="undo"]');
const redoButton = document.querySelector('[data-role="redo"]');
const drawButton = document.querySelector('[data-role="draw"]');
const eraserButton = document.querySelector('[data-role="eraser"]');

let strokeConfig = {
    size: 6,
    thinning: 0.5,
    smoothing: 1,
    streamline: 0.5
}
let color = '#000';
let mode = 'draw';
let isDrawing = false;
let lastPoint = null;
let points = [];
let groups = [];
let currentIndex = 0;

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
drawButton.addEventListener('click', () => {
    mode = 'draw';
    activeButton(drawButton);
})
eraserButton.addEventListener('click', () => {
    mode = 'eraser';
    activeButton(eraserButton);
})

activeButton(drawButton);

window.addEventListener('resize', update)

function activeButton(button) {
    document.querySelectorAll('.control.active').forEach(active => {
        active.classList.remove('active');
    })
    button.classList.add('active');
}

function update() {
    if (currentIndex < groups.length) {
        redoButton.disabled = false;
    } else {
        redoButton.disabled = true;
    }
    if (currentIndex > 0) {
        undoButton.disabled = false;
    } else {
        undoButton.disabled = true;
    }
    canvasClarifier(presentation, presentationCtx);
    groups.forEach((data, i) => {
        if (i >= currentIndex) return;

        presentationCtx.save();
        presentationCtx.beginPath();
        setup(presentationCtx, data.mode, data.color);

        const points = data.points;
        const strokePoints = getStroke(points, strokeConfig);
        if (strokePoints.length > 2) {
            presentationCtx.moveTo(strokePoints[0].x, strokePoints[0].y)
            for (let i = 1; i < strokePoints.length; i++) {
                presentationCtx.lineTo(strokePoints[i][0], strokePoints[i][1])
            }
            presentationCtx.fill();
            presentationCtx.closePath();
            presentationCtx.restore();
        }
    })
}

function setup(ctx, mode, color) {
    if (mode == 'eraser') {
        ctx.strokeStyle = 'black';
        ctx.globalCompositeOperation = 'destination-out';
        strokeConfig.size = 20;
        strokeConfig.thinning = 0;
    } else if (mode == 'draw') {
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        strokeConfig.size = 8;
        strokeConfig.thinning = 0.5;
    } else {
        // Unsupported mode
    }
}

function redo() {
    if (isDrawing == true) return;
    if (currentIndex < groups.length) {
        currentIndex++;
    } else {
        currentIndex = groups.length;
    }
    update();
}

function undo() {
    if (isDrawing == true) return;
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = 0;
    }
    update();
}

function handleStart(e) {
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    isDrawing = true;
    lastPoint = { x: e.pageX, y: e.pageY, pressure: e.pressure };
}
function handleMove(e) {
    if (!isDrawing) return;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }

    const pressure = e.pressure;
    const x = e.pageX;
    const y = e.pageY;

    if (lastPoint) {
        points.push(lastPoint);

        lastPoint = { x, y, pressure };
    }
}
function handleEnd() {
    if (isDrawing == true) {
        points.push(lastPoint);
        groups.splice(currentIndex);
        var data = {
            mode: mode,
            points: points,
            color: color
        }
        groups.push(data);
        currentIndex = groups.length;
        points = [];
        update();
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
    canvas.addEventListener(event, handleStart);
})
events.move.forEach(event => {
    window.addEventListener(event, handleMove);
})
events.end.forEach(event => {
    window.addEventListener(event, handleEnd);
})

window.addEventListener("keydown", (e) => {
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

canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
})

function animate() {
    canvasClarifier(canvas, ctx);

    if (mode == 'eraser') {
        presentation.style.opacity = 0;
        var imageData = presentationCtx.getImageData(0, 0, presentation.width, presentation.height);
        ctx.putImageData(imageData, 0, 0);
    } else {
        presentation.style.opacity = 1;
    }

    ctx.save();
    ctx.beginPath();
    setup(ctx, mode, color);

    const strokePoints = getStroke(points, strokeConfig);
    if (strokePoints.length > 2) {
        ctx.moveTo(strokePoints[0].x, strokePoints[0].y)
        for (let i = 1; i < strokePoints.length; i++) {
            ctx.lineTo(strokePoints[i][0], strokePoints[i][1])
        }
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    requestAnimationFrame(animate);
}

animate();