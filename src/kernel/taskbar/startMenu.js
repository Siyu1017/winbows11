import { apis } from "../kernelRuntime.js";
import * as utils from "../../utils.js";
import WinUI from "../../ui/winui.js";
import { on } from "./taskbar.js";

const { fs } = apis;

const startMenuContainer = document.createElement('div');
const startMenu = document.createElement('div');
const startMenuInner = document.createElement('div');
const startMenuSearch = document.createElement('div');
const startMenuSearchIcon = document.createElement('div');
const startMenuSearchInput = document.createElement('input');
const startMenuApps = document.createElement('div');
const startMenuPinned = document.createElement('div');
const startMenuRecommended = document.createElement('div');
const startMenuFooter = document.createElement('div');

startMenuContainer.className = 'start-menu-container';
startMenu.className = 'start-menu';
startMenuInner.className = 'start-menu-inner';
startMenuSearch.className = 'start-menu-search';
startMenuSearchIcon.className = 'start-menu-search-icon';
startMenuSearchInput.className = 'start-menu-search-input';
startMenuApps.className = 'start-menu-apps';
startMenuPinned.className = 'start-menu-pinned';
startMenuRecommended.className = 'start-menu-recommended';
startMenuFooter.className = 'start-menu-footer';

startMenuSearchInput.placeholder = 'Search for apps, settings and documents';

startMenuContainer.appendChild(startMenu);
startMenu.appendChild(startMenuInner);
startMenuInner.appendChild(startMenuSearch);
startMenuSearch.appendChild(startMenuSearchIcon);
startMenuSearch.appendChild(startMenuSearchInput);
startMenuInner.appendChild(startMenuApps)
startMenuApps.appendChild(startMenuPinned);
startMenuApps.appendChild(startMenuRecommended);
startMenu.appendChild(startMenuFooter);

// Pinned
const pinnedHeader = document.createElement('div');
const pinnedTitle = document.createElement('div');
const pinnedExpand = document.createElement('div');
const pinnedAppsContainer = document.createElement('div');
const pinnedApps = document.createElement('div');

pinnedHeader.className = 'start-menu-pinned-header';
pinnedTitle.className = 'start-menu-pinned-title';
pinnedExpand.className = 'start-menu-pinned-expand';
pinnedAppsContainer.className = 'start-menu-pinned-apps-container';
pinnedApps.className = 'start-menu-pinned-apps';

pinnedTitle.innerHTML = 'Pinned';
pinnedExpand.innerHTML = 'All apps'

startMenuPinned.appendChild(pinnedHeader);
startMenuPinned.appendChild(pinnedAppsContainer)
pinnedAppsContainer.appendChild(pinnedApps);
pinnedHeader.appendChild(pinnedTitle);
pinnedHeader.appendChild(pinnedExpand);

// Footer
const footerProfile = document.createElement('div');
const footerPower = document.createElement('div');
const footerProfileAvatar = document.createElement('div');
const footerProfileUsername = document.createElement('div');
const footerPowerButton = document.createElement('div');

footerProfile.className = 'start-menu-footer-profile';
footerPower.className = 'start-menu-footer-power';
footerProfileAvatar.className = 'start-menu-footer-profile-avatar';
footerProfileUsername.className = 'start-menu-footer-profile-username';
footerPowerButton.className = 'start-menu-footer-power-button';

fs.getFileURL('C:/Winbows/icons/user.png').then(url => {
    footerProfileAvatar.style.backgroundImage = `url(${url})`;
})
footerProfileUsername.innerHTML = utils.replaceHTMLTags('Admin');

startMenuFooter.appendChild(footerProfile);
startMenuFooter.appendChild(footerPower);
footerProfile.appendChild(footerProfileAvatar);
footerProfile.appendChild(footerProfileUsername);
footerPower.appendChild(footerPowerButton);

const powerMenu = WinUI.contextMenu([]);
footerPowerButton.addEventListener('click', (e) => {
    powerMenu.setItems([
        {
            icon: "lock",
            text: "Lock",
            action: () => {
                window.Winbows.ShowLockScreen();
            }
        }, {
            icon: "quiet-hours",
            text: "Sleep",
            action: () => {

            },
            disabled: true
        }, {
            icon: "power-button",
            text: "Shut down",
            action: () => {

            },
            disabled: true
        }, {
            icon: "update-restore",
            text: "Restart",
            action: () => {
                location.reload();
            }
        }
    ])
    var position = utils.getPosition(footerPowerButton);
    powerMenu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
    powerMenu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
    powerMenu.open(position.x, window.innerHeight - position.y, 'left-bottom');
})

on('pointerdown', (e) => {
    if (!powerMenu.container.contains(e.target)) {
        powerMenu.close();
    }
})

on('pointerdown', (e) => {
    if (!iconRepository.start) return;
    if (e.target == startMenuContainer || startMenuContainer.contains(e.target) || powerMenu.container.contains(e.target)) return;
    startMenuContainer.classList.remove('active');
})

export default startMenuContainer;