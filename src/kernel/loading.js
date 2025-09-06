import { IDBFS } from "../shared/fs.js";
import viewport from "./viewport.js";

const fs = IDBFS("~WRT");

// Loading
const startLoadingTime = Date.now();
const loadingContainer = document.createElement('div');
const loadingImage = document.createElement('div');
const loadingSpinner = window.modes.dev == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

function loadingText(content) {
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

if (window.modes.dev == false && window.needsUpdate == false) {
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

loadingText('Starting Winbows11...');

try {
    await fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico').then(url => {
        loadingImage.style.backgroundImage = `url(${url})`;
    })
    fs.quit();
} catch (e) {
    console.error(e);
}

let progress = 0;
const updateProgressId = setInterval(function () {
    progress += Math.random() * 1 + 0.2;
    if (progress > 90) progress = 90;
    loadingProgressBar.style.width = progress + '%';
}, 200);

export {
    loadingContainer,
    loadingImage,
    loadingProgressBar,
    loadingText,
    startLoadingTime,
    updateProgressId
}