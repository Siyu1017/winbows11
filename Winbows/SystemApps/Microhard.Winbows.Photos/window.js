var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

var photoPath = datas.file;

var supportedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico"];
var supportedMimeTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico'
};

function mineTypeToExtension(type) {
    if (Object.keys(supportedMimeTypes).hasOwnProperty(type)) {
        return supportedMimeTypes[type];
    }
    return '';
}

var container = document.createElement('div');
var content = document.createElement('div');

container.className = 'container';
content.className = 'content';

document.body.appendChild(container);
container.appendChild(content);

if (!photoPath) {
    content.innerHTML = `<div style="
    display: inline-flex;
    width: -webkit-fill-available;
    height: -webkit-fill-available;
    align-items: center;
    justify-content: center;
">Select an image file from <span data-bind="run" style="text-decoration: underline;margin: 0 4px;cursor: pointer;">File Explorer</span> and open with Photos to view the file</div>`;

    await(async () => {
        return new Promise((resolve, reject) => {
            document.querySelector('[data-bind="run"]').addEventListener('click', async function () {
                var process = await new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseFile.js').start();
                process.worker.addEventListener('message', (e) => {
                    if (e.data.token != process.token) return;
                    if (e.data.type == 'confirm') {
                        photoPath = e.data.items[0];
                        process.exit(0);
                        content.innerHTML = '';
                        resolve();
                    }
                    if (e.data.type == 'cancel') {
                        process.exit(0);
                    }
                    console.log(e.data.type, e.data.items);
                })
                //window.System.Shell('run explorer');
            });
        })
    })();
}

console.log(photoPath)

var photoBlob = await fs.readFile(photoPath);
var photoBlobType = mineTypeToExtension(photoBlob ? photoBlob.type : '');
var photoExtension = photoBlobType ? photoBlobType : window.fs.getFileExtension(photoPath);
var photoURL = URL.createObjectURL(photoBlob);
if (!supportedExtensions.includes(photoExtension)) {
    content.innerHTML = `<div>Unsupported file type ( ${photoPath} )</div>`;
    return;
}

var debuggerMode = false;
var x = 0;
var y = 0;
var tempX = 0;
var tempY = 0;
var scale = 1;
var isDragging = false;
var pointerX = 0;
var pointerY = 0;
var animate = false;

browserWindow.changeTitle(photoPath.split('/').slice(-1)[0]);

var viewer = document.createElement('div');
var viewerCanvas = document.createElement('canvas');
var viewerActionbar = document.createElement('div');
var viewerActionbarInfo = document.createElement('div');
var viewerActionbarInfoResolution = document.createElement('div');
var viewerActionbarInfoSize = document.createElement('div');
var viewerActionbarControls = document.createElement('div');
var viewerActionbarZoomOut = document.createElement('button');
var viewerActionbarZoomInput = document.createElement('input')
var viewerActionbarZoomIn = document.createElement('button');
var viewerActionbarDebugger = document.createElement('div');
viewer.className = 'viewer';
viewerCanvas.className = 'viewer-canvas';
viewerActionbar.className = 'viewer-actionbar';
viewerActionbarInfo.className = 'viewer-actionbar-info';
viewerActionbarInfoResolution.className = 'viewer-actionbar-info-resolution';
viewerActionbarInfoSize.className = 'viewer-actionbar-info-size';
viewerActionbarControls.className = 'viewer-actionbar-controls';
viewerActionbarZoomOut.className = 'viewer-actionbar-control-button';
viewerActionbarZoomInput.className = 'viewer-actionbar-control-input';
viewerActionbarZoomIn.className = 'viewer-actionbar-control-button';
viewerActionbarDebugger.className = 'viewer-actionbar-control-button';
content.appendChild(viewer);
viewer.appendChild(viewerCanvas);
viewer.appendChild(viewerActionbar);
viewerActionbar.appendChild(viewerActionbarInfo);
viewerActionbarInfo.appendChild(viewerActionbarInfoResolution);
viewerActionbarInfo.appendChild(viewerActionbarInfoSize);
viewerActionbar.appendChild(viewerActionbarControls);
viewerActionbarControls.appendChild(viewerActionbarZoomOut);
viewerActionbarControls.appendChild(viewerActionbarZoomInput);
viewerActionbarControls.appendChild(viewerActionbarZoomIn);
viewerActionbarControls.appendChild(viewerActionbarDebugger);

viewerActionbarInfoResolution.textContent = `0 x 0`;
viewerActionbarInfoSize.textContent = `Loading...`;
viewerActionbarZoomInput.value = 100;
viewerActionbarZoomIn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="viewer-actionbar-control-button-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;
viewerActionbarZoomOut.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="viewer-actionbar-control-button-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;
viewerActionbarDebugger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="viewer-actionbar-control-button-icon"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`;

viewerActionbarDebugger.addEventListener('click', () => {
    debuggerMode = !debuggerMode == true;
    if (debuggerMode == true) {
        viewerActionbarDebugger.classList.add('active');
    } else {
        viewerActionbarDebugger.classList.remove('active');
    }
    animate = false;
    render();
})

const ctx = viewerCanvas.getContext('2d', {
    willReadFrequently: true
});
const events = {
    "start": ["mousedown", "touchstart", "pointerdown"],
    "move": ["mousemove", "touchmove", "pointermove"],
    "end": ["mouseup", "touchend", "pointerup", "blur"]
};

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

CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius, config = {}) {
    this.save();
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    this.fillStyle = config.background || "#fff";
    this.strokeStyle = config.border || "#fff";

    this.stroke();
    if (config.shadow) {
        this.shadowColor = config.shadow[4];
        this.shadowBlur = config.shadow[2];
        this.shadowOffsetX = config.shadow[0];
        this.shadowOffsetY = config.shadow[1];
    }
    this.fill();
    this.restore();
}
CanvasRenderingContext2D.prototype.autoPosition = function (x, y, width, height, margin = 8) {
    var translateX = 0;
    var translateY = 0;
    if (x + width + margin > this.canvas.offsetWidth) {
        translateX = x - (((x - width - margin) > this.canvas.offsetWidth - width - margin ? this.canvas.offsetWidth : x) - width - margin);
    }
    if (x - margin < 0) {
        translateX = x - margin;
    }
    if (y + height + margin > this.canvas.offsetHeight) {
        translateY = y - (((y - height - margin) > this.canvas.offsetHeight - height - margin ? this.canvas.offsetHeight : y) - height - margin);
    }
    if (y - margin < 0) {
        translateY = y - margin;
    }
    this.translate(-translateX, -translateY);
}
CanvasRenderingContext2D.prototype.textBlock = function (text, x, y, padding, radius, config = {}) {
    this.save();
    this.beginPath();
    this.font = `${config.fontSize}px ${config.fontFamily}`;
    this.textBaseline = 'middle';
    const textMetrics = this.measureText(text);
    const width = textMetrics.width;
    const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    const rectSize = {
        width: width + padding.left + padding.right,
        height: height + padding.top + padding.bottom
    }
    if (config.color) {
        this.fillStyle = config.color;
    }
    if (config.align == 'center') {
        this.autoPosition(x - rectSize.width / 2, y, rectSize.width, rectSize.height, config.margin || 8);
        this.roundRect(x - rectSize.width / 2, y, rectSize.width, rectSize.height, radius, config);
        this.textAlign = 'center';
        this.fillText(text, x, y + (height + padding.top + padding.bottom) / 2);
    } else if (config.align == 'right') {
        this.autoPosition(x - rectSize.width, y, rectSize.width, rectSize.height, config.margin || 8);
        this.roundRect(x - rectSize.width, y, rectSize.width, rectSize.height, radius, config);
        this.fillText(text, x - rectSize.width + padding.left, y + (height + padding.top + padding.bottom) / 2);
    } else {
        this.autoPosition(x, y, rectSize.width, rectSize.height, config.margin || 8);
        this.roundRect(x, y, width + padding.left + padding.right, height + padding.top + padding.bottom, radius, config);
        this.fillText(text, x + padding.left, y + (height + padding.top + padding.bottom) / 2);
    }
    this.restore();
}

var devfunction = () => {
    var pointerX = viewerCanvas.offsetWidth / 2;
    var pointerY = viewerCanvas.offsetHeight / 2;

    ctx.save();
    ctx.fillStyle = '#9783F7';
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 4, 0, Math.PI * 2);
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#9783F7';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + image.height * scale);
    ctx.lineTo(x + image.width * scale, y + image.height * scale);
    ctx.lineTo(x + image.width * scale, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#9783F7';
    ctx.beginPath();
    ctx.moveTo(pointerX, pointerY);
    ctx.lineTo(x, pointerY);
    ctx.moveTo(pointerX, y + pointerY - y);
    ctx.lineTo(pointerX, y);
    ctx.stroke();
    ctx.restore();

    ctx.textBlock(`(${~~x}, ${~~y})`, 8, 8, {
        left: 8,
        right: 8,
        top: 6,
        bottom: 6
    }, 6, {
        fontSize: 14,
        fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
        background: '#fff',
        border: '#fff',
        align: 'left'
    });

    ctx.textBlock(~~Math.abs(pointerY - y),
        pointerX + 8 < 8 ? 8 : pointerX + 8,
        y + (pointerY - y - 22) / 2 < 8 ? 8 : y + (pointerY - y - 22) / 2, {
        left: 8,
        right: 8,
        top: 6,
        bottom: 6
    }, 6, {
        fontSize: 14,
        fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
        background: '#9783F7',
        border: '#9783F7',
        align: 'left',
        color: '#fff'
    });

    ctx.textBlock(~~Math.abs(pointerX - x),
        x + (pointerX - x) / 2 < 8 ? 8 : x + (pointerX - x) / 2,
        pointerY + 8 < 8 ? 8 : pointerY + 8, {
        left: 8,
        right: 8,
        top: 6,
        bottom: 6
    }, 6, {
        fontSize: 14,
        fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
        background: '#9783F7',
        border: '#9783F7',
        align: 'center',
        color: '#fff'
    });
};

function handleStartDragging(e) {
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    isDragging = true;
    pointerX = e.pageX;
    pointerY = e.pageY;
    tempX = x;
    tempY = y;
    animate = true;
    render();
}

function handleMoveDragging(e) {
    if (!isDragging) return;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }
    x = tempX + e.pageX - pointerX;
    y = tempY + e.pageY - pointerY;
}

function handleEndDragging(e) {
    isDragging = false;
    animate = false;
}

events.start.forEach(event => {
    viewerCanvas.addEventListener(event, handleStartDragging);
})
events.move.forEach(event => {
    window.addEventListener(event, handleMoveDragging);
})
events.end.forEach(event => {
    window.addEventListener(event, handleEndDragging);
})

var scaleStages = [0.01, 0.02, 0.05, 0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 7.5, 10];
function getStage(scale, zoom = 'in') {
    if (zoom == 'in') {
        return scaleStages[scaleStages.findIndex(stage => stage > scale)] || scaleStages[scaleStages.length - 1];
    } else {
        var result = scaleStages[0];
        scaleStages.forEach(stage => {
            if (stage < scale) {
                result = stage;
            }
        })
        return result;
    }
}

viewerCanvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
    }

    var canvasPosition = window.utils.getPosition(viewerCanvas);
    var pointerX = e.pageX - canvasPosition.x;
    var pointerY = e.pageY - canvasPosition.y;

    var ratio = (window.devicePixelRatio || 1);
    var original = scale;
    var diffX = pointerX - x;
    var diffY = pointerY - y;

    if (!e.ctrlKey) return;
    if (e.deltaY < 0) {
        // Zoom in
        scale = getStage(scale, 'in');
    } else {
        // Zoom out
        scale = getStage(scale, 'out');
    }

    x = x + diffX * (1 - scale / original);
    y = y + diffY * (1 - scale / original);

    devfunction = () => {
        ctx.save();
        ctx.fillStyle = '#9783F7';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 4, 0, Math.PI * 2);
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#9783F7';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + image.height * scale);
        ctx.lineTo(x + image.width * scale, y + image.height * scale);
        ctx.lineTo(x + image.width * scale, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#9783F7';
        ctx.beginPath();
        ctx.moveTo(pointerX, pointerY);
        ctx.lineTo(x, pointerY);
        ctx.moveTo(pointerX, y + pointerY - y);
        ctx.lineTo(pointerX, y);
        ctx.stroke();
        ctx.restore();

        ctx.textBlock(`(${~~x}, ${~~y})`, 8, 8, {
            left: 8,
            right: 8,
            top: 6,
            bottom: 6
        }, 6, {
            fontSize: 14,
            fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
            background: '#fff',
            border: '#fff',
            align: 'left'
        });

        ctx.textBlock(~~Math.abs(pointerY - y),
            pointerX + 8 < 8 ? 8 : pointerX + 8,
            y + (pointerY - y - 22) / 2 < 8 ? 8 : y + (pointerY - y - 22) / 2, {
            left: 8,
            right: 8,
            top: 6,
            bottom: 6
        }, 6, {
            fontSize: 14,
            fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
            background: '#9783F7',
            border: '#9783F7',
            align: 'left',
            color: '#fff'
        });

        ctx.textBlock(~~Math.abs(pointerX - x),
            x + (pointerX - x) / 2 < 8 ? 8 : x + (pointerX - x) / 2,
            pointerY + 8 < 8 ? 8 : pointerY + 8, {
            left: 8,
            right: 8,
            top: 6,
            bottom: 6
        }, 6, {
            fontSize: 14,
            fontFamily: 'var(--winbows-font-default)var(--winbows-font-default)',
            background: '#9783F7',
            border: '#9783F7',
            align: 'center',
            color: '#fff'
        });
    };

    viewerActionbarZoomInput.value = ~~(scale * 100);
    render();
});

function getDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch2.pageX - touch1.pageX;
    const dy = touch2.pageY - touch1.pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

let initialDistance = 0;
viewerCanvas.addEventListener('touchmove', function (event) {
    if (event.touches.length === 2) {
        const newDistance = getDistance(event.touches);
        if (initialDistance) {
            const scaleFactor = newDistance / initialDistance;
            scale *= scaleFactor;
        }
        initialDistance = newDistance;
        viewerActionbarZoomInput.value = ~~(scale * 100);
        render();
    }
});
viewerCanvas.addEventListener('touchend', function () {
    initialDistance = 0;
});

viewerActionbarZoomIn.addEventListener('click', function () {
    var original = scale;
    var diffX = viewerCanvas.offsetWidth / 2 - x;
    var diffY = viewerCanvas.offsetHeight / 2 - y;
    scale = getStage(scale, 'in');
    x = x + diffX * (1 - scale / original);
    y = y + diffY * (1 - scale / original);
    viewerActionbarZoomInput.value = ~~(scale * 100);
    render();
});

viewerActionbarZoomOut.addEventListener('click', function () {
    var original = scale;
    var diffX = viewerCanvas.offsetWidth / 2 - x;
    var diffY = viewerCanvas.offsetHeight / 2 - y;
    scale = getStage(scale, 'out');
    x = x + diffX * (1 - scale / original);
    y = y + diffY * (1 - scale / original);
    viewerActionbarZoomInput.value = ~~(scale * 100);
    render();
});

viewerActionbarZoomInput.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        var original = scale;
        var diffX = viewerCanvas.offsetWidth / 2 - x;
        var diffY = viewerCanvas.offsetHeight / 2 - y;
        var value = parseFloat(viewerActionbarZoomInput.value) / 100;
        if (value < scaleStages[0]) {
            scale = scaleStages[0];
            viewerActionbarZoomInput.value = ~~(scale * 100);
        } else if (value > scaleStages[scaleStages.length - 1]) {
            scale = scaleStages[scaleStages.length - 1];
            viewerActionbarZoomInput.value = ~~(scale * 100);
        } else {
            scale = value;
        }
        x = x + diffX * (1 - scale / original);
        y = y + diffY * (1 - scale / original);
        render();
    }
})

var image = new Image();
image.src = photoURL;
image.onload = () => {
    x = viewerCanvas.offsetWidth / 2 - image.width / 2;
    y = viewerCanvas.offsetHeight / 2 - image.height / 2;
    viewerActionbarInfoResolution.textContent = `${image.naturalWidth} x ${image.naturalHeight}`;
    viewerActionbarInfoSize.textContent = window.utils.formatBytes(photoBlob.size);
    render();
    animate = false;

    const resizeObserver = new ResizeObserver((entries) => {
        render();
        animate = false;
    });
    resizeObserver.observe(viewerCanvas);
}

image.onerror = () => {
    content.innerHTML = `<div style="
    display: inline-flex;
    width: -webkit-fill-available;
    height: -webkit-fill-available;
    align-items: center;
    justify-content: center;
">Failed to load image ( ${photoPath} )</div>`;
}

function render() {
    canvasClarifier(viewerCanvas, ctx);
    ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
    if (debuggerMode == true) {
        devfunction();
    }
    if (animate == true) {
        requestAnimationFrame(render);
    } else {
        cancelAnimationFrame(render);
    }
}