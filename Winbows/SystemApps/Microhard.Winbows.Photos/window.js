var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

var photoPath = datas.file;

var supportedExtensions = ["jpeg", "png", "gif", "webp", "bmp", "svg", "ico"];
var supportedMimeTypes = {
    'image/jpeg': 'jpg',
    'image/jpeg': 'jpeg',
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

if (photoPath) {
    var photoBlob = await fs.readFile(photoPath);
    var photoBlobType = mineTypeToExtension(photoBlob ? photoBlob.type : '');
    var photoExtension = photoBlobType ? photoBlobType : window.fs.getFileExtension(photoPath);
    var photoURL = URL.createObjectURL(photoBlob);
    if (!supportedExtensions.includes(photoExtension)) {
        content.innerHTML = `<div>Unsupported file type ( ${photoPath} )</div>`;
        return;
    }

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

    viewerActionbarInfoResolution.textContent = `0 x 0`;
    viewerActionbarInfoSize.textContent = `Loading...`;
    viewerActionbarZoomInput.value = 100;
    viewerActionbarZoomIn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="viewer-actionbar-control-button-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;
    viewerActionbarZoomOut.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="viewer-actionbar-control-button-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;

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

    var x = 0;
    var y = 0;
    var tempX = 0;
    var tempY = 0;
    var scale = 1;
    var isDragging = false;
    var pointerX = 0;
    var pointerY = 0;

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

    var scaleStages = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
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

    viewerCanvas.addEventListener('wheel', function (event) {
        event.preventDefault();

        if (!event.ctrlKey) return;
        if (event.deltaY < 0) {
            // Zoom in
            scale = getStage(scale, 'in');
        } else {
            // Zoom out
            scale = getStage(scale, 'out');
        }
        viewerActionbarZoomInput.value = ~~(scale * 100);
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
        }
    });
    viewerCanvas.addEventListener('touchend', function () {
        initialDistance = 0;
    });

    viewerActionbarZoomIn.addEventListener('click', function () {
        scale = getStage(scale, 'in');
        viewerActionbarZoomInput.value = ~~(scale * 100);
    });

    viewerActionbarZoomOut.addEventListener('click', function () {
        scale = getStage(scale, 'out');
        viewerActionbarZoomInput.value = ~~(scale * 100);
    });

    viewerActionbarZoomInput.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
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
        }
    })

    function getSizeString(size) {
        if (size < 0) return '';
        if (size < 1024) {
            // size < 1KB
            return `${size} bytes`;
        } else if (size < 1024 * 1024) {
            // size < 1MB
            return `${(size / 1024).toFixed(2)} KB`;
        } else if (size < 1024 * 1024 * 1024) {
            // size < 1GB
            return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            // size >= 1GB
            return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    }


    var image = new Image();
    image.src = photoURL;
    image.onload = () => {
        x = viewerCanvas.offsetWidth / 2 - image.width / 2;
        y = viewerCanvas.offsetHeight / 2 - image.height / 2;
        viewerActionbarInfoResolution.textContent = `${image.naturalWidth} x ${image.naturalHeight}`;
        viewerActionbarInfoSize.textContent = getSizeString(photoBlob.size);
        render();
    }
    image.onerror = () => {
        content.innerHTML = `<div>Failed to load image ( ${photoPath} )</div>`;
    }

    function render() {
        canvasClarifier(viewerCanvas, ctx);
        ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
        requestAnimationFrame(render);
    }
} else {

}