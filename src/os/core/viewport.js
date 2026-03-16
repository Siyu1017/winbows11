import { EventEmitter, getJsonFromURL } from "../../shared/utils.ts";

// Viewport
document.body.innerHTML = '';
document.body.style.background = 'transparent';

// Root element
const noStretch = !!getJsonFromURL()['no-stretch'];
const res = [1920, 1080];
const root = document.createElement('div');
root.className = 'root';
document.body.appendChild(root);

if (noStretch) {
    document.body.style.background = '#000';
    root.style.setProperty('--viewport-width', res[0] + 'px');
    root.style.setProperty('--viewport-height', res[1] + 'px');
    root.style.transformOrigin = 'center';
    root.style.transform = `translate(-50%, -50%) scale(${Math.min(root.offsetWidth / res[0], root.offsetHeight / res[1])})`;
    root.style.left = '50%';
    root.style.top = '50%';
    root.style.overflow = 'hidden';
    root.style.width = 'var(--viewport-width)';
    root.style.height = 'var(--viewport-height)';
}

window.addEventListener('contextmenu', (e) => {
    if (root.contains(e.target)) {
        e.preventDefault();
    }
})

// Screen of winbows
const screenElement = document.createElement('div');
const appWrapper = document.createElement('div');
screenElement.className = 'screen';
appWrapper.className = 'app-wrapper';
root.appendChild(screenElement);
screenElement.appendChild(appWrapper);

const viewportEventEmitter = new EventEmitter();
function updateScreenSize() {
    if (!noStretch) {
        root.style.setProperty('--viewport-width', root.offsetWidth + 'px');
        root.style.setProperty('--viewport-height', root.offsetHeight + 'px');
    } else {
        root.style.transform = `translate(-50%, -50%) scale(${Math.min(document.body.offsetWidth / res[0], document.body.offsetHeight / res[1])})`;
    }

    viewportEventEmitter._emit('resize', {
        width: root.offsetWidth,
        height: root.offsetHeight
    })
}
window.addEventListener('resize', updateScreenSize);
window.addEventListener('load', updateScreenSize);

const observer = new ResizeObserver(updateScreenSize);
observer.observe(root);

export const viewport = {
    root,
    screenElement,
    appWrapper,
    get width() {
        return root.offsetWidth;
    },
    get height() {
        return root.offsetHeight;
    },
    onResize(cb) {
        viewportEventEmitter.on('resize', cb);
    }
}

// Loading
const startLoadingTime = Date.now();
const loadingContainer = document.createElement('div');
const loadingImage = document.createElement('div');
const loadingSpinner = window.modes?.dev == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
const loadingTextContainer = document.createElement('div');
const loadingTextShadowTop = document.createElement('div');
const loadingTextShadowBottom = document.createElement('div');
const loadingTextStrip = document.createElement('div');
const loadingProgress = document.createElement('div');
const loadingProgressBar = document.createElement('div');

loadingContainer.className = 'winbows-loading active';
loadingImage.className = 'winbows-loading-image';
loadingTextContainer.className = 'winbows-loading-text-container';
loadingTextShadowTop.className = 'winbows-loading-text-shadow-top';
loadingTextShadowBottom.className = 'winbows-loading-text-shadow-bottom';
loadingTextStrip.className = 'winbows-loading-text-strip';
loadingContainer.appendChild(loadingImage);
viewport.root.appendChild(loadingContainer);

export const winbowsIcon = (function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 300;
    const gap = size / 32;
    const cellSize = (size - gap * 3) / 2;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#0067c0';
    ctx.fillRect(gap, gap, cellSize, cellSize);
    ctx.fillRect(gap, cellSize + gap * 2, cellSize, cellSize);
    ctx.fillRect(cellSize + gap * 2, gap, cellSize, cellSize);
    ctx.fillRect(cellSize + gap * 2, cellSize + gap * 2, cellSize, cellSize);

    return canvas.toDataURL();
})();

loadingImage.style.backgroundImage = `url(${winbowsIcon})`;

function text(content) {
    const loadingText = document.createElement('div');
    loadingText.textContent = content;
    loadingText.className = 'winbows-loading-text';
    loadingTextStrip.appendChild(loadingText);
    loadingTextStrip.style.transform = `translateY(-${loadingTextStrip.offsetHeight - 24}px)`;
    // loadingTextStrip.scrollTo({
    //     top: loadingTextStrip.scrollHeight,
    //     behavior: "smooth"
    // })
    return loadingText;
}

if (window.modes?.dev == false && window.needsUpdate == false) {
    loadingSpinner.setAttribute('class', 'winbows-loading-spinner');
    loadingSpinner.setAttribute('width', 48);
    loadingSpinner.setAttribute('height', 48);
    loadingSpinner.setAttribute('viewBox', "0 0 16 16");
    loadingSpinner.innerHTML = '<circle cx="8px" cy="8px" r="7px"></circle>';
    loadingContainer.appendChild(loadingSpinner);
} else {
    loadingProgress.classList.add('winbows-loading-progress');
    loadingProgressBar.classList.add('winbows-loading-progress-bar');
    loadingContainer.appendChild(loadingTextContainer);
    loadingTextContainer.appendChild(loadingTextShadowTop);
    loadingTextContainer.appendChild(loadingTextShadowBottom);
    loadingTextContainer.appendChild(loadingTextStrip);
    loadingContainer.appendChild(loadingProgress);
    loadingProgress.appendChild(loadingProgressBar);
}

text('Starting Winbows11...');

let progress = 0;
let current = 0;
let target = 0;
const easeFn = t => t;
const easeDuration = 50;

let isRunning = false;
let startRenderTime = 0;
function render() {
    startRenderTime = Date.now();
    if (isRunning === true) return;
    renderer();
}

function renderer() {
    const n = Date.now();
    const p = (n - startRenderTime) / easeDuration;
    const v = easeFn(p);

    progress = current + (target - current) * (v < 0 ? 0 : v > 1 ? 1 : v)
    loadingProgressBar.style.width = progress + '%';

    if (p < 1) {
        requestAnimationFrame(renderer);
    }
}

const updateProgressId = setInterval(function () {
    current = progress;
    target += Math.random() * .2 + .2;
    if (target > 99) {
        target = 99;
    }
    render();

}, 200);
function setProgress(p) {
    if (p >= 0 && p <= 100) {
        current = progress;
        target = p;
        render();
        // loadingProgressBar.style.width = progress + '%';
    }
}
function textWithProgress(t, p) {
    if (p >= 0 && p <= 100) {
        current = progress;
        target = p;
        render();
        // loadingProgressBar.style.width = progress + '%';
    }
    text(t);
}

export const loading = {
    container: loadingContainer,
    image: loadingImage,
    progressBar: loadingProgressBar,
    text,
    textWithProgress,
    startLoadingTime,
    updateProgressId,
    setProgress,
    hide() {
        loadingContainer.classList.remove('active');
    }
}