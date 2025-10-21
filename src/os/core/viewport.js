import { EventEmitter } from "../../shared/utils.js";

// Viewport
document.body.innerHTML = '';
document.body.style.background = 'transparent';

// Root element
const root = document.createElement('div');
root.className = 'root';
document.body.appendChild(root);

root.addEventListener('contextmenu', (e) => {
    e.preventDefault();
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
    root.style.setProperty('--viewport-width', root.offsetWidth + 'px');
    root.style.setProperty('--viewport-height', root.offsetHeight + 'px');
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

try {
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

    loadingImage.style.backgroundImage = `url(${canvas.toDataURL()})`;
} catch (e) { }

function text(content) {
    const loadingText = document.createElement('div');
    loadingText.textContent = content;
    loadingText.className = 'winbows-loading-text';
    loadingTextStrip.appendChild(loadingText);
    loadingTextStrip.scrollTo({
        top: loadingTextStrip.scrollHeight,
        behavior: "smooth"
    })
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
const updateProgressId = setInterval(function () {
    progress += Math.random() * 1 + 0.2;
    if (progress > 90) {
        progress = 90;
    }
    loadingProgressBar.style.width = progress + '%';
}, 200);
function setProgress(p) {
    if (p >= 0 && p <= 100) {
        progress = p;
        loadingProgressBar.style.width = progress + '%';
    }
}
function textWithProgress(t, p) {
    if (p >= 0 && p <= 100) {
        progress = p;
        loadingProgressBar.style.width = progress + '%';
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