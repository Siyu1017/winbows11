(async () => {
    var items = {
        start: {
            display: true,
            icon: 'C:/Winbows/icons/applications/tools/start.ico'
        },
        search: {
            display: true,
            icon: 'C:/Winbows/icons/applications/tools/search.ico'
        },
        taskview: {
            display: true,
            icon: 'C:/Winbows/icons/applications/tools/taskview.ico'
        },
        widgets: {
            display: false,
            icon: 'C:/Winbows/icons/applications/tools/widgets.ico'
        }
    }

    var taskbar = document.createElement('div');
    var taskbarIcons = document.createElement('div');
    var taskbarItems = document.createElement('div');
    var taskbarApps = document.createElement('div');

    taskbar.className = 'taskbar';
    taskbarIcons.className = 'taskbar-group icons';
    taskbarItems.className = 'taskbar-items';
    taskbarApps.className = 'taskbar-apps';

    window.Winbows.Screen.appendChild(taskbar);
    taskbar.appendChild(taskbarIcons);
    taskbarIcons.appendChild(taskbarItems);
    taskbarIcons.appendChild(taskbarApps);

    var startMenuContainer = document.createElement('div');
    var startMenu = document.createElement('div');
    var startMenuInner = document.createElement('div');
    var startMenuSearch = document.createElement('div');
    var startMenuSearchIcon = document.createElement('div');
    var startMenuSearchInput = document.createElement('input');
    var startMenuPinned = document.createElement('div');
    var startMenuRecommended = document.createElement('div');
    var startMenuFooter = document.createElement('div');

    startMenuContainer.className = 'start-menu-container';
    startMenu.className = 'start-menu';
    startMenuInner.className = 'start-menu-inner';
    startMenuSearch.className = 'start-menu-search';
    startMenuSearchIcon.className = 'start-menu-search-icon';
    startMenuSearchInput.className = 'start-menu-search-input';
    startMenuPinned.className = 'start-menu-pinned';
    startMenuRecommended.className = 'start-menu-recommended';
    startMenuFooter.className = 'start-menu-footer';

    startMenuSearchInput.placeholder = 'Search for apps, settings and documents'

    window.Winbows.Screen.appendChild(startMenuContainer);
    startMenuContainer.appendChild(startMenu);
    startMenu.appendChild(startMenuInner);
    startMenuInner.appendChild(startMenuSearch);
    startMenuSearch.appendChild(startMenuSearchIcon);
    startMenuSearch.appendChild(startMenuSearchInput);
    startMenuInner.appendChild(startMenuPinned);
    startMenuInner.appendChild(startMenuRecommended);
    startMenu.appendChild(startMenuFooter);

    // Pinned
    var pinnedHeader = document.createElement('div');
    var pinnedTitle = document.createElement('div');
    var pinnedExpand = document.createElement('div');
    var pinnedApps = document.createElement('div');

    pinnedHeader.className = 'start-menu-pinned-header';
    pinnedTitle.className = 'start-menu-pinned-title';
    pinnedExpand.className = 'start-menu-pinned-expand';
    pinnedApps.className = 'start-menu-pinned-apps';

    pinnedTitle.innerHTML = 'Pinned';
    pinnedExpand.innerHTML = 'All apps'

    startMenuPinned.appendChild(pinnedHeader);
    startMenuPinned.appendChild(pinnedApps);
    pinnedHeader.appendChild(pinnedTitle);
    pinnedHeader.appendChild(pinnedExpand);

    // Footer
    var footerProfile = document.createElement('div');
    var footerPower = document.createElement('div');
    var footerProfileAvatar = document.createElement('div');
    var footerProfileUsername = document.createElement('div');
    var footerPowerButton = document.createElement('div');

    footerProfile.className = 'start-menu-footer-profile';
    footerPower.className = 'start-menu-footer-power';
    footerProfileAvatar.className = 'start-menu-footer-profile-avatar';
    footerProfileUsername.className = 'start-menu-footer-profile-username';
    footerPowerButton.className = 'start-menu-footer-power-button';

    footerProfileAvatar.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/user.png')})`;
    footerProfileUsername.innerHTML = window.replaceHTMLTags('Admin');

    startMenuFooter.appendChild(footerProfile);
    startMenuFooter.appendChild(footerPower);
    footerProfile.appendChild(footerProfileAvatar);
    footerProfile.appendChild(footerProfileUsername);
    footerPower.appendChild(footerPowerButton);

    document.addEventListener('pointerdown', e => {
        if (!iconRepository.start) return;
        if (e.target == startMenuContainer || startMenuContainer.contains(e.target) || iconRepository.start.item.contains(e.target)) return;
        iconRepository.start.hide();
    })

    // Status
    var focused = null;
    var lastClicked = null;
    var activeWindows = [];
    var iconRepository = {};
    var maxIndex = 0;

    function updateStatus() {
        Object.values(iconRepository).forEach(icon => {
            if (icon.type == 'item') {
                icon.blur();
            } else if (!activeWindows.includes(icon.owner)) {
                icon._hide();
            } else if (activeWindows.indexOf(icon.owner) != activeWindows.length - 1 || focused != null) {
                icon.blur();
            }
        })
        if (focused) {
            iconRepository[focused]._show();
        } else if (activeWindows.length > 0) {
            iconRepository[activeWindows[activeWindows.length - 1]].focus();
        }
    }

    function runItem(name, e = {}) {
        if (e.type == 'hide') {
            if (name == 'start') {
                startMenuContainer.classList.remove('active');
            } else if (name == 'search') {

            } else if (name == 'taskview') {

            }
        } else {
            if (name == 'start') {
                startMenuContainer.classList.toggle('active');
            } else if (name == 'search') {

            } else if (name == 'taskview') {

            }
        }
    }

    function isSelf(owner) {
        if (activeWindows[activeWindows.length - 1] == owner || lastClicked == owner) {
            return true;
        } else {
            return false;
        }
    }

    Object.defineProperty(window, 'Taskbar', {
        value: {}
    })
    Object.defineProperties(window.Taskbar, {
        'pinnedApps': {
            value: ['explorer', 'edge', 'store']
        },
        'pinApp': {
            value: (name) => {
                if (window.appRegistry.exists(name) && !window.Taskbar.pinnedApps.includes(name)) {
                    window.Taskbar.pinnedApps.push(name);
                }
            },
            writable: false,
            configurable: false
        },
        'unpinApp': {
            value: (name) => {
                if (window.Taskbar.pinnedApps.includes(name)) {
                    window.Taskbar.pinnedApps.splice(window.Taskbar.pinnedApps.indexOf(name), 1);
                }
            },
            writable: false,
            configurable: false
        },
        'isPinned': {
            value: (path) => {
                var app = window.appRegistry.getApp(path);
                // console.log(app.name, app)
                return window.Taskbar.pinnedApps.includes(app.name);
            },
            writable: false,
            configurable: false
        },
        'createIcon': {
            value: async (icon, callback = () => { }, init = false) => {
                var type = icon.category == 'item' ? 'item' : 'app';
                var owner = icon.name;
                var registry = {};

                icon.status = icon.status || {};

                if (iconRepository.hasOwnProperty(owner)) {
                    return iconRepository[owner];
                }

                var status = {
                    opened: icon.status.opened || false,    // Window opened
                    show: icon.status.show || false,        // Whether to show the window 
                    focused: icon.status.focused || true    // Window is focused
                }
                var listeners = {};
                var item = document.createElement('div');
                var itemImage = document.createElement('img');
                item.className = 'taskbar-item';
                itemImage.className = 'taskbar-icon';
                itemImage.src = icon.icon;
                item.appendChild(itemImage);

                var properties = {
                    status, type, owner, icon, item, itemImage,
                    open, close, show, hide, addEventListener, focus, blur, updateWindowStatus,
                    _show, _hide
                }

                function open(obj) {
                    var id = '';
                    if (type != 'item') {
                        try {
                            var exist = false;
                            id = generateID();
                            Object.values(registry).forEach((item, i) => {
                                if (item == obj) {
                                    exist = true;
                                }
                            })
                            if (exist == false) {
                                registry[id] = obj;
                            }
                            maxIndex++;
                            obj.browserWindow.style.zIndex = maxIndex;
                            status.opened = true;
                            lastClicked = owner;
                            item.setAttribute('data-opened', status.opened);
                            show();
                            activeWindows = activeWindows.filter(item => item !== owner);
                            if (type != 'item') {
                                activeWindows.push(owner);
                            }
                        } catch (e) { 
                            console.log(e);
                        };
                    }
                    triggerEvent('open', {
                        type: 'open'
                    });
                    updateStatus();
                    return id;
                }

                function close(id) {
                    if (!registry.hasOwnProperty(id)) return console.log(`WINDOW ID [ ${id} ] NOT FOUND`);
                    item.removeAttribute('data-toggle');
                    if (type != 'item') {
                        const browserWindow = registry[id].browserWindow;

                        status.opened = false;
                        activeWindows = activeWindows.filter(item => item !== owner);
                        item.setAttribute('data-opened', status.opened);
                        blur();
                        // close window
                        browserWindow.classList.remove('active');
                        if (!window.Taskbar.isPinned(owner)) {
                            item.classList.add('hide');
                        }
                        lastClicked = null;
                        delete registry[id];
                        setTimeout(() => {
                            // remove window element
                            browserWindow.remove();
                            if (!window.Taskbar.isPinned(owner) && Object.values(registry).length == 0) {
                                item.remove();
                                delete iconRepository[owner];
                            }
                        }, 300);
                    }
                    triggerEvent('close', {
                        type: 'close'
                    });
                    updateStatus();
                }

                function show() {
                    _show();
                    triggerEvent('show', {
                        type: 'show'
                    });
                    updateStatus();
                }

                function hide() {
                    _hide();
                    triggerEvent('hide', {
                        type: 'hide'
                    });
                    updateStatus();
                }

                function focus() {
                    Object.values(iconRepository).filter(icon => icon != properties).forEach(icon => {
                        icon.blur();
                    })
                    activeWindows = activeWindows.filter(item => item !== owner);
                    activeWindows.push(owner);
                    focused = owner;
                    status.focused = true;
                    lastClicked = owner;
                    item.setAttribute('data-focused', true);
                    updateWindowStatus(Object.values(registry)[0], 'focus');
                    triggerEvent('focus', {
                        type: 'focus'
                    });
                }

                function blur() {
                    focused = activeWindows[activeWindows.length - 1];
                    status.focused = false;
                    lastClicked = null;
                    item.setAttribute('data-focused', false);
                    triggerEvent('blur', {
                        type: 'blur'
                    });
                }

                function generateID() {
                    var id = "";
                    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    for (let i = 0; i < 16; i++) {
                        id += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    if (registry.hasOwnProperty(id)) {
                        return generateID();
                    }
                    return id;
                }

                function addEventListener(event, listener) {
                    if (!listeners.hasOwnProperty(event)) {
                        listeners[event] = [];
                    }
                    listeners[event].push(listener);
                }

                function triggerEvent(event, details) {
                    if (listeners.hasOwnProperty(event)) {
                        listeners[event].forEach(listener => {
                            listener(details);
                        });
                    }
                }

                function _show() {
                    if (!isSelf(owner)) {
                        item.removeAttribute('data-toggle');
                    }
                    status.show = true;
                    activeWindows = activeWindows.filter(item => item !== owner);
                    if (type != 'item') {
                        activeWindows.push(owner);
                        focused = owner;
                    }
                    item.setAttribute('data-show', status.show);
                    updateWindowStatus(Object.values(registry)[0], 'show');
                    focus();
                }

                function _hide() {
                    if (!isSelf(owner)) {
                        item.removeAttribute('data-toggle');
                    }
                    status.show = false;
                    activeWindows = activeWindows.filter(item => item !== owner);
                    focused = activeWindows[activeWindows.length - 1];
                    item.setAttribute('data-show', status.show);
                    updateWindowStatus(Object.values(registry)[0], 'hide');
                    blur();
                }

                function updateWindowStatus(obj, type) {
                    try {
                        if (!obj) return;
                        if (type == 'focus') {
                            if (obj.browserWindow.style.zIndex != maxIndex) {
                                maxIndex++;
                                obj.browserWindow.style.zIndex = maxIndex;
                            }
                        } else if (type == 'show') {
                            obj.browserWindow.classList.add('active');
                        } else if (type == 'hide') {
                            obj.browserWindow.classList.remove('active');
                        } else if (type == 'toggle') {
                            obj.browserWindow.classList.toggle('active');
                        }
                    } catch (e) { console.log(e); }
                }

                if (type == 'item') {
                    // openable : false
                    // opened : false
                    // show : true | false
                    item.setAttribute('data-openable', false);
                    item.addEventListener('click', (e) => {
                        if (status.show == true) {
                            hide();
                        } else {
                            show();
                        }
                        lastClicked = owner;
                    })
                    taskbarItems.appendChild(item);
                } else {
                    item.setAttribute('data-openable', icon.openable);
                    item.addEventListener('click', (e) => {
                        if (status.opened == false) {
                            callback({});
                            return;
                        }
                        if (isSelf(owner) == true) {
                            item.setAttribute('data-toggle', 'self');
                            if (status.show == true) {
                                hide();
                            } else {
                                show();
                            }
                        } else {
                            item.removeAttribute('data-toggle');
                            show();
                        }
                        lastClicked = owner;
                    })
                    taskbarApps.appendChild(item);
                }

                iconRepository[owner] = properties;

                return properties;

                var opened = false;
                var itemElement = document.createElement('div');
                var iconElement = document.createElement('img');
                itemElement.className = 'taskbar-item';
                iconElement.className = 'taskbar-icon';
                console.log(item)
                iconElement.src = item.icon;
                itemElement.appendChild(iconElement);
                itemElement.setAttribute('data-openable', item.openable);
                itemElement.addEventListener('click', () => {
                    if (item.openable == true) {
                        if (opened == false) {
                            opened = true;
                            callback({
                                type: 'open'
                            });
                            itemElement.setAttribute('data-opened', true);
                            itemElement.setAttribute('data-show', true);
                        }
                        var active = itemElement.getAttribute('data-show');
                        taskbar.querySelectorAll('.taskbar-item[data-show="true"]').forEach(item => {
                            item.setAttribute('data-show', false);
                        })
                        var bindedWindow = document.createElement('div');
                        if (lastClicked == icon) {
                            itemElement.setAttribute('data-toggle', 'self');
                            itemElement.setAttribute('data-show', active == 'true' ? false : true);
                            if (active == 'true') {
                                bindedWindow.classList.remove('active');
                            } else {
                                bindedWindow.classList.add('active');
                            }
                        } else {
                            itemElement.removeAttribute('data-toggle');
                            itemElement.setAttribute('data-show', true);
                            currentZIndex++;
                            bindedWindow.classList.add('active');
                            bindedWindow.style.zIndex = currentZIndex;
                        }
                        lastClicked = item;
                    } else if (item.category == 'item') {
                        taskbar.querySelectorAll('.taskbar-item[data-show="true"]').forEach(item => {
                            item.setAttribute('data-show', false);
                        })
                        itemElement.setAttribute('data-show', true);
                        callback({
                            type: 'open'
                        });
                    }
                })
                if (item.category == 'item') {
                    taskbarItems.appendChild(itemElement);
                } else {
                    taskbarApps.appendChild(itemElement);
                }
                var d = {
                    icon: itemElement,
                    close: () => {
                        if (Object.keys(taskbarItems).includes(icon.name) || taskbarPinnedApps.includes(icon.name)) {
                            itemElement.removeAttribute('data-opened');
                            itemElement.removeAttribute('data-toggle');
                            itemElement.removeAttribute('data-show');
                            lastClicked = '';
                            opened = false;
                        } else {
                            itemElement.classList.add('hide');
                        }
                    }
                }
                // console.log(parseInt(window.Winbows.Screen.style.getPropertyValue('--taskbar-item-translateX')))
                // window.Winbows.Screen.style.setProperty('--taskbar-item-translateX',  + itemElement.offsetWidth + 'px');
                return;
            },
            writable: false,
            configurable: false
        },
        'preloadImage': {
            value: async () => {
                await (async () => {
                    for (let i in Object.values(items)) {
                        var url = await fs.getFileURL(Object.values(items)[i].icon);
                        await window.loadImage(url);
                        Object.values(items)[i].icon = url;
                    }
                    return;
                })();

                await (async () => {
                    for (let i in window.Taskbar.pinnedApps) {
                        var url = await fs.getFileURL(window.appRegistry.apps[window.Taskbar.pinnedApps[i]].icon);
                        await window.loadImage(url);
                    }
                    return;
                })();

                return;
            },
            writable: false,
            configurable: false
        },
        'init': {
            value: async () => {
                var appCount = Object.values(items).filter(item => item.display == true).concat(window.Taskbar.pinnedApps).length;
                taskbarIcons.style.width = appCount * 40 + (appCount - 1) * 4 + 'px';

                // Taskbar items
                for (let i in Object.keys(items)) {
                    await (async (i) => {
                        var key = Object.keys(items)[i];
                        if (items[key].display == true || key == 'start') {
                            var item = await window.Taskbar.createIcon({
                                name: key,
                                icon: items[key].icon,
                                openable: false,
                                category: 'item'
                            })
                            item.addEventListener('show', () => {
                                runItem(key, {
                                    type: 'show'
                                });
                            })
                            item.addEventListener('hide', () => {
                                runItem(key, {
                                    type: 'hide'
                                });
                            })
                        }
                        await delay(25);
                        return;
                    })(i)
                }

                // Taskbar pinned apps
                for (let i in window.Taskbar.pinnedApps) {
                    await (async (i) => {
                        var app = window.appRegistry.apps[window.Taskbar.pinnedApps[i]];
                        var name = window.Taskbar.pinnedApps[i];
                        var script = app.script;
                        await window.Taskbar.createIcon({
                            name: app.script,
                            icon: await fs.getFileURL(app.icon),
                            openable: true,
                            category: 'app'
                        }, (e) => {
                            new Process(script, 'user', e.id).start();
                        })
                        await delay(25);
                        return;
                    })(i)
                }

                Object.values(window.appRegistry.apps).forEach(app => {
                    if (app.autoExecute == true) {
                        new Process(app.script, 'user').start();
                    }
                })

                taskbarIcons.style.width = 'revert-layer';
            },
            writable: false,
            configurable: false
        }
    })
    Object.freeze(window.Taskbar);
})();