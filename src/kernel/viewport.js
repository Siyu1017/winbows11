// Root element
export const root = document.createElement('div');
root.className = 'root';
document.body.appendChild(root);

// Screen of winbows
export const screenElement = document.createElement('div');
export const background = document.createElement('div');
export const backgroundImage = document.createElement('div');
export const appWrapper = document.createElement('div');

screenElement.className = 'screen';
background.className = 'background';
backgroundImage.className = 'background-image';
appWrapper.className = 'app-wrapper';

root.appendChild(screenElement);
screenElement.appendChild(background);
screenElement.appendChild(appWrapper);
background.appendChild(backgroundImage);

// Desktop 
export const desktop = document.createElement('div');
export const desktopItems = document.createElement('div');

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