document.body.innerHTML = '';
document.body.style.background = 'transparent';

// Root element
const root = document.createElement('div');
root.className = 'root';
document.body.appendChild(root);

// Screen of winbows
const screenElement = document.createElement('div');
const background = document.createElement('div');
const backgroundImage = document.createElement('div');
const appWrapper = document.createElement('div');

screenElement.className = 'screen';
background.className = 'background';
backgroundImage.className = 'background-image';
appWrapper.className = 'app-wrapper';

root.appendChild(screenElement);
screenElement.appendChild(background);
screenElement.appendChild(appWrapper);
background.appendChild(backgroundImage);

// Desktop 
const desktop = document.createElement('div');
const desktopItems = document.createElement('div');

desktop.className = 'desktop winui-no-background';
desktopItems.className = 'desktop-items';

appWrapper.appendChild(desktop);
desktop.appendChild(desktopItems);

function updateScreenSize() {
    root.style.setProperty('--viewport-width', root.offsetWidth + 'px');
    root.style.setProperty('--viewport-height', root.offsetHeight + 'px');
}

window.addEventListener('resize', updateScreenSize);
window.addEventListener('load', updateScreenSize);

const observer = new ResizeObserver(updateScreenSize);
observer.observe(root);

export default {
    root,
    screenElement,
    background,
    backgroundImage,
    appWrapper,
    desktop,
    desktopItems,
    get width() {
        return root.offsetWidth;
    },
    get height() {
        return root.offsetHeight;
    }
}