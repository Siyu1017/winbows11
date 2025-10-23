import { IDBFS } from "../../../shared/fs.js";
import WinUI from "../../../lib/winui/winui.js";
import * as utils from "../../../shared/utils.js";
import ModuleManager from "../../moduleManager.js";
import { viewport } from "../../core/viewport.js";
import lockScreenObj from "../../core/lockScreen.js";
import timer from "../../core/timer.js";
// import i18n from "../../i18n/i18n.js";

export default function StartMenu(icon) {
    const fs = IDBFS('~EXPLORER');
    const downEvts = ["mousedown", "touchstart", "pointerdown"];

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

    viewport.screenElement.appendChild(startMenuContainer);
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
                text: "Lock", //i18n.t('startmenu.menu.lock'),
                action: () => {
                    lockScreenObj.container.classList.add('active');
                }
            }, {
                icon: "quiet-hours",
                text: "Sleep", //i18n.t('startmenu.menu.sleep'),
                action: () => {

                },
                disabled: true
            }, {
                icon: "power-button",
                text: "Shut down", //i18n.t('startmenu.menu.shutdown'),
                action: () => {

                },
                disabled: true
            }, {
                icon: "update-restore",
                text: "Restart", //i18n.t('startmenu.menu.restart'),
                action: () => {
                    location.reload();
                }
            }
        ])
        const position = utils.getPosition(footerPowerButton);
        powerMenu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        powerMenu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        powerMenu.open(position.x, window.innerHeight - position.y, 'left-bottom');
    })

    downEvts.forEach(event => {
        window.addEventListener(event, (e) => {
            if (!powerMenu.container.contains(e.target)) {
                powerMenu.close();
            }
        })
    })

    let show = false;

    function showStart() {
        startMenuContainer.classList.add('active');
        show = true;
    }

    function hideStart() {
        if (show == false) return;
        startMenuContainer.classList.remove('active');
        show = false;
    }

    icon.on('blur', () => {
        icon.close();
    });

    downEvts.forEach(event => {
        viewport.root.addEventListener(event, (e) => {
            if (
                startMenuContainer.contains(e.target) ||    // Start menu
                powerMenu.container.contains(e.target) ||   // Contextmenu
                icon.iconEl.contains(e.target)              // Taskbar icon
            ) return;

            icon.close(null, true);
        })
    })

    return (async () => {
        // Start Menu
        const System = ModuleManager.get('System');
        const appRegistry = System.appRegistry;
        /*
        const pinnedList = [
            {
                name: 'File Explorer',
                app: 'explorer'
            }, {
                name: 'Edge',
                app: 'edge'
            }, {
                name: 'VSCode',
                app: 'code'
            }, {
                name: 'Command',
                app: 'cmd'
            }, {
                name: 'Info',
                app: 'info'
            }, {
                name: 'Task Manager',
                app: 'taskmgr'
            }, {
                name: 'Settings',
                app: 'settings'
            }
        ];*/

        const pinnedList = [
            {
                name: 'File Explorer',
                app: 'explorer'
            }, {
                name: 'Edge',
                app: 'edge'
            }, {
                name: 'VSCode',
                app: 'code'
            }, {
                name: 'Command',
                app: 'cmd'
            }, {
                name: 'Paint',
                app: 'paint'
            }, {
                name: 'Info',
                app: 'info'
            }, {
                name: 'Task Manager',
                app: 'taskmgr'
            }, {
                name: 'FPS Meter',
                app: 'fpsmeter'
            }, {
                name: 'Photos',
                app: 'photos'
            }, /*{
                name: 'Edge BETA',
                app: 'edgebeta'
            }, */{
                name: 'Network Listener',
                app: 'network-listener'
            }, {
                name: 'JSON Viewer',
                app: 'json-viewer'
            }, {
                name: 'Notepad',
                app: 'notepad'
            }, {
                name: 'Settings',
                app: 'settings'
            }
        ];

        pinnedList.forEach(pinned => {
            const info = appRegistry.getInfo(pinned.app);
            const item = document.createElement('div');
            const itemIcon = document.createElement('div');
            const itemName = document.createElement('div');

            item.className = 'start-menu-pinned-app';
            itemIcon.className = 'start-menu-pinned-app-icon';
            itemName.className = 'start-menu-pinned-app-name';

            itemName.innerHTML = utils.replaceHTMLTags(pinned.name);
            fs.getFileURL(info.icon).then(url => {
                itemIcon.style.backgroundImage = `url(${url})`;
            })
            item.addEventListener('click', (e) => {
                icon.close();
                System.shell.execCommand(`${pinned.app}`);
            })

            pinnedApps.appendChild(item);
            item.appendChild(itemIcon);
            item.appendChild(itemName);
        })

        timer.mark('Start Menu');

        return {
            open: showStart,
            close: hideStart
        }
    })();
}