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
    footerProfileUsername.innerHTML = window.utils.replaceHTMLTags('Admin');

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

    !(async () => {
        // Start Menu
        var pinnedList = [
            [{
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
            }],
            [{
                name: 'Task Manager',
                app: 'taskmgr'
            }, /*{
                name: 'Settings',
                app: 'settings'
            }, */{
                name: 'FPS Meter',
                app: 'fpsmeter'
            }, {
                name: 'Photos',
                app: 'photos'
            }],
            []
        ];
        pinnedList.forEach(pinneds => {
            var row = document.createElement('div');
            row.className = 'start-menu-pinned-row';
            pinneds.forEach(pinned => {
                var info = window.appRegistry.getInfo(pinned.app);
                var item = document.createElement('div');
                var itemIcon = document.createElement('div');
                var itemName = document.createElement('div');
                item.className = 'start-menu-pinned-app';
                itemIcon.className = 'start-menu-pinned-app-icon';
                itemName.className = 'start-menu-pinned-app-name';

                itemName.innerHTML = window.utils.replaceHTMLTags(pinned.name);
                fs.getFileURL(info.icon).then(url => {
                    itemIcon.style.backgroundImage = `url(${url})`;
                })

                item.addEventListener('click', (e) => {
                    new Process(info.script, 'user').start();
                    iconRepository.start.hide();
                })

                row.appendChild(item);
                item.appendChild(itemIcon);
                item.appendChild(itemName);
            });
            pinnedApps.appendChild(row);
        })
    })();

    // Status
    var focused = null;         // For all
    var lastClicked = null;     // For all
    var activeWindows = [];     // Only for apps, not for items
    var iconRepository = {};
    var idDatas = {};
    var maxIndex = 0;

    function getID(app) {
        var arr = [];
        Object.keys(idDatas).forEach(key => {
            if (idDatas[key] == app) {
                arr.push(key);
            }
        })
        return arr;
    }

    function updateStatus() {
        Object.values(iconRepository).forEach(icon => {
            if (icon.type == 'item') {
                icon.blur();
            } else if (!Object.values(idDatas).includes(icon.owner)) {
                icon._hide();
            } else if (!getID(icon.owner).includes(activeWindows[activeWindows.length - 1]) || focused != null) {
                icon.blur();
            }
        })
        if (focused) {
            iconRepository[idDatas[focused]]._show(focused);
        } else if (activeWindows.length > 0) {
            iconRepository[idDatas[activeWindows[activeWindows.length - 1]]].focus([activeWindows[activeWindows.length - 1]]);
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
        if (getID(owner).includes(activeWindows[activeWindows.length - 1]) || lastClicked == owner) {
            return true;
        } else {
            return false;
        }
    }

    function getThumbnailWindowRatio(parent, pt = false) {
        return {
            x: pt == true ? parent.offsetWidth / thumbnailSetting.maxWidth : thumbnailSetting.maxWidth / parent.offsetWidth,
            y: pt == true ? parent.offsetHeight / thumbnailSetting.maxHeight : thumbnailSetting.maxHeight / parent.offsetHeight
        }
    }

    var thumbnailContainer = document.createElement("div");
    var thumbnailSetting = {
        maxWidth: 192,
        maxHeight: 108,
        padding: {
            top: 8,
            bottom: 8,
            left: 8,
            right: 8
        }
    }
    var currentThumbnail = {};
    var overThumbnailWindow = false;

    thumbnailContainer.className = "thumbnail-container";
    window.Winbows.Screen.appendChild(thumbnailContainer);

    function createThumbnailWindow(app, id) {
        var thumbnailWindow = document.createElement("div");
        var thumbnailBar = document.createElement("div");
        var thumbnailIcon = document.createElement("div");
        var thumbnailTitle = document.createElement("div");
        var thumbnailView = document.createElement("div");
        var thumbnailCloseButton = document.createElement("div");

        thumbnailWindow.className = "thumbnail-window";
        thumbnailView.className = "thumbnail-window-view";
        thumbnailBar.className = "thumbnail-window-bar";
        thumbnailIcon.className = "thumbnail-window-icon";
        thumbnailTitle.className = "thumbnail-window-title";
        thumbnailCloseButton.className = "thumbnail-window-close-button";
        thumbnailCloseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        thumbnailContainer.appendChild(thumbnailWindow);
        thumbnailWindow.appendChild(thumbnailBar);
        thumbnailWindow.appendChild(thumbnailView);
        thumbnailBar.appendChild(thumbnailIcon);
        thumbnailBar.appendChild(thumbnailTitle);
        thumbnailBar.appendChild(thumbnailCloseButton);

        // Thumbnail info
        thumbnailIcon.style.backgroundImage = `url(${app.icon})`;
        thumbnailTitle.innerHTML = app.title;

        // Thumbnail styles
        thumbnailWindow.style.padding = `${thumbnailSetting.padding.top}px ${thumbnailSetting.padding.right}px ${thumbnailSetting.padding.bottom}px ${thumbnailSetting.padding.left}px`;
        thumbnailWindow.style.maxWidth = `${thumbnailSetting.padding.right + thumbnailSetting.padding.left + thumbnailSetting.maxWidth}px`
        thumbnailView.style.maxWidth = thumbnailSetting.maxWidth + "px";
        thumbnailView.style.maxHeight = thumbnailSetting.maxHeight + "px";
        thumbnailView.style.width = '999px';
        thumbnailView.style.height = '999px';

        thumbnailWindow.addEventListener("pointerover", () => {
            overThumbnailWindow = true;
        })

        thumbnailWindow.addEventListener("pointerleave", () => {
            overThumbnailWindow = false;
            setTimeout(() => {
                hideThumbnailWindow();
            }, 200);
        })

        thumbnailCloseButton.addEventListener("click", () => {
            currentThumbnail.close(id);
            thumbnailWindow.remove();
            updateThumbnailPosition();
            if (Object.values(currentThumbnail.getRegistry()).length == 0) {
                overThumbnailWindow = false;
                hideThumbnailWindow();
            }
        });

        thumbnailWindow.addEventListener("click", (e) => {
            if (e.target == thumbnailCloseButton || thumbnailCloseButton.contains(e.target)) return;
            currentThumbnail.show(id);
            hideThumbnailWindow(true);
        })
    }

    function updateThumbnailPosition() {
        if (!currentThumbnail) return;
        var item = currentThumbnail.item;
        var left = utils.getPosition(item).x + item.offsetWidth / 2 - thumbnailContainer.offsetWidth / 2;
        if (left < 8) {
            left = 8;
        } else if (left + thumbnailContainer.offsetWidth > window.innerWidth - 8) {
            left = window.innerWidth - thumbnailContainer.offsetWidth - 8;
        }
        thumbnailContainer.style.left = left + "px";
    }

    function showThumbnailWindow(app) {
        /*
        var ratio = getThumbnailWindowRatio(app.elements.window, true);
        var scale = getThumbnailWindowRatio(app.elements.window).x;
        if (ratio.x < ratio.y) {
            scale = getThumbnailWindowRatio(app.elements.window).y;
        }
        var cloneNode = app.elements.window.cloneNode(true);
        cloneNode.style.position = "static";
        cloneNode.style.transform = `scale(${scale})`;
        cloneNode.style.opacity = "1";
        thumbnailView.appendChild(cloneNode);

        thumbnailView.style.maxWidth = thumbnailSetting.maxWidth + "px";
        thumbnailView.style.maxHeight = thumbnailSetting.maxHeight + "px";
        thumbnailView.style.width = cloneNode.offsetWidth * scale + "px";
        thumbnailView.style.height = cloneNode.offsetHeight * scale + "px";
        thumbnailWindow.style.maxWidth = cloneNode.offsetWidth * scale + thumbnailSetting.padding.left + thumbnailSetting.padding.right + "px";
        */
        if (!app) return;

        currentThumbnail = app;
        thumbnailContainer.innerHTML = '';

        var registry = app.getRegistry();

        Object.keys(registry).forEach(id => {
            createThumbnailWindow(registry[id], id)
        })

        updateThumbnailPosition();

        thumbnailContainer.classList.add('active');
    }

    function hideThumbnailWindow(force = false) {
        if (overThumbnailWindow == true && force == false) return;
        overThumbnailWindow = false;
        thumbnailContainer.classList.remove('active');
        thumbnailContainer.innerHTML = '';
    }

    Object.defineProperty(window, 'Taskbar', {
        value: {}
    })
    Object.defineProperties(window.Taskbar, {
        'pinnedApps': {
            value: ['C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.js', 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.js']
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
                return window.Taskbar.pinnedApps.includes(path);
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
                    getRegistry,
                    _show, _hide,
                    changeIcon, changeTitle,
                    setMaxZIndex, getMaxZIndex
                }

                function getRegistry() {
                    return registry;
                }

                function getMaxZIndex() {
                    return maxIndex;
                }

                function setMaxZIndex(value) {
                    maxIndex = value;
                }

                function open(obj) {
                    var id = '';
                    if (type != 'item') {
                        try {
                            var exist = false;
                            id = generateID();
                            Object.values(registry).forEach((item, i) => {
                                if (item.browserWindow == obj.browserWindow) {
                                    exist = true;
                                }
                            })
                            if (exist == false) {
                                registry[id] = {
                                    pid: obj.pid,
                                    browserWindow: obj.browserWindow,
                                    shadowRoot: obj.shadowRoot,
                                    opened: true,
                                    show: true,
                                    focused: true,
                                    icon: icon.icon,
                                    owner: owner,
                                    title: icon.title || 'App'
                                };
                            }
                            maxIndex++;
                            registry[id].browserWindow.style.zIndex = maxIndex;
                            status.opened = true;
                            lastClicked = owner;
                            item.setAttribute('data-opened', status.opened);
                            idDatas[id] = owner;
                            show(id);
                            activeWindows = activeWindows.filter(item => item !== id);
                            if (type != 'item') {
                                activeWindows.push(id);
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
                        const pid = registry[id].pid;
                        const isLast = Object.values(registry).length == 1;
                        if (isLast == true) {
                            status.opened = false;
                            activeWindows = activeWindows.filter(item => item !== id);
                            item.setAttribute('data-opened', status.opened);
                        }
                        blur(id);
                        // close window
                        browserWindow.classList.remove('active');
                        if (!window.Taskbar.isPinned(owner) && isLast == true) {
                            item.classList.add('hide');
                        }
                        lastClicked = owner;
                        console.log(registry, id)
                        delete registry[id];
                        delete idDatas[id];
                        if (!window.Taskbar.isPinned(owner) && Object.values(registry).length == 0) {
                            delete iconRepository[owner];
                        }
                        setTimeout(() => {
                            // remove window element
                            browserWindow.remove();
                            if (!window.Taskbar.isPinned(owner) && Object.values(registry).length == 0) {
                                item.remove();
                            }
                            window.System.processes[pid]._exit_Window();
                        }, 300);
                    }
                    triggerEvent('close', {
                        type: 'close'
                    });
                    updateStatus();
                }

                function changeIcon(id, icon) {
                    registry[id].icon = icon;
                }

                function changeTitle(id, title) {
                    registry[id].title = title;
                }

                function show(id) {
                    _show(id);
                    triggerEvent('show', {
                        type: 'show'
                    });
                    updateStatus();
                }

                function hide(id) {
                    _hide(id);
                    triggerEvent('hide', {
                        type: 'hide'
                    });
                    updateStatus();
                }

                function focus(id) {
                    if (!id) {
                        id = Object.keys(registry)[0];
                    }
                    Object.values(iconRepository).filter(icon => icon != properties).forEach(icon => {
                        icon.blur();
                    })
                    activeWindows = activeWindows.filter(item => item !== id);
                    activeWindows.push(id);
                    focused = id;
                    status.focused = true;
                    item.setAttribute('data-focused', true);
                    updateWindowStatus(registry[id], 'focus');
                    triggerEvent('focus', {
                        type: 'focus', id
                    });
                }

                function blur(id) {
                    focused = activeWindows[activeWindows.length - 1];
                    status.focused = false;
                    item.setAttribute('data-focused', false);
                    triggerEvent('blur', {
                        type: 'blur', id
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

                function _show(id) {
                    if (!id) {
                        id = Object.keys(registry)[0];
                    }
                    if (!isSelf(owner)) {
                        item.removeAttribute('data-toggle');
                    }
                    status.show = true;
                    activeWindows = activeWindows.filter(item => item !== id);
                    if (type != 'item') {
                        activeWindows.push(id);
                        focused = id;
                    }
                    item.setAttribute('data-show', status.show);
                    updateWindowStatus(registry[id], 'show');
                    focus(id);
                }

                function _hide(id) {
                    if (!isSelf(owner)) {
                        item.removeAttribute('data-toggle');
                    }
                    status.show = false;
                    activeWindows = activeWindows.filter(item => item !== id);
                    focused = activeWindows[activeWindows.length - 1];
                    item.setAttribute('data-show', status.show);
                    updateWindowStatus(registry[id], 'hide');
                    blur(id);
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
                    item.addEventListener("pointerover", () => {
                        if (Object.values(registry).length == 0) return;
                        overThumbnailWindow = true;
                        showThumbnailWindow(properties);
                    })

                    item.addEventListener("pointerout", () => {
                        overThumbnailWindow = false;
                        setTimeout(() => {
                            hideThumbnailWindow();
                        }, 200)
                    })

                    item.setAttribute('data-openable', icon.openable);
                    item.addEventListener('click', (e) => {
                        if (status.opened == false) {
                            callback({});
                            return;
                        }
                        if (Object.keys(registry).length > 1) {
                            overThumbnailWindow = true;
                            showThumbnailWindow(properties);
                            return;
                        }
                        if (isSelf(owner) == true) {
                            item.setAttribute('data-toggle', 'self');
                            if (status.show == true) {
                                hide(Object.keys(registry)[0]);
                            } else {
                                show(Object.keys(registry)[0]);
                            }
                        } else {
                            item.removeAttribute('data-toggle');
                            show(Object.keys(registry)[0]);
                        }
                        lastClicked = owner;
                    })
                    taskbarApps.appendChild(item);
                }

                iconRepository[owner] = properties;

                return properties;
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
                        var url = await fs.getFileURL(window.appRegistry.getApp(window.Taskbar.pinnedApps[i]).icon);
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
                        var app = window.appRegistry.getApp(window.Taskbar.pinnedApps[i]);
                        var name = app.name;
                        var script = app.script;
                        await window.Taskbar.createIcon({
                            title: name[0].toUpperCase() + name.slice(1),
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

    window.loadedKernel();
})();