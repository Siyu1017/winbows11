import { viewport } from "../../core/viewport.js";

const { appWrapper } = viewport;

// Desktop 
const desktop = document.createElement('div');
const desktopItems = document.createElement('div');
desktop.className = 'desktop winui-no-background';
desktopItems.className = 'desktop-items';
appWrapper.appendChild(desktop);
desktop.appendChild(desktopItems);

export const desktopEl = desktop;
export const desktopItemsEl = desktopItems;