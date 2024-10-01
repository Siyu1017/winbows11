!(async () => {
    const snapPreview = document.createElement('div');
    snapPreview.className = 'browser-window-snap-preview';
    window.Winbows.AppWrapper.appendChild(snapPreview);

    Object.defineProperty(window.workerModules, 'browserWindow', {
        value: async (path = {}, config = {}, pid) => {
            console.log(path)

            const ICON = await window.Taskbar.createIcon({
                title: config.title || 'App',
                name: path.caller,
                icon: await fs.getFileURL(window.appRegistry.getIcon(path.callee)),
                openable: true,
                category: 'app',
                status: {
                    active: true,
                    opened: true
                }
            })

            const appWrapper = window.Winbows.AppWrapper;
            const events = {
                "start": ["mousedown", "touchstart", "pointerdown"],
                "move": ["mousemove", "touchmove", "pointermove"],
                "end": ["mouseup", "touchend", "pointerup", "blur"]
            }
            const parent = config.showOnTop == true ? window.Winbows.Screen : appWrapper;

            var resizerConfig = {
                'browser-window-resizer-top': 'vertical',
                'browser-window-resizer-bottom': 'vertical',
                'browser-window-resizer-left': 'horizontal',
                'browser-window-resizer-right': 'horizontal',
                'browser-window-resizer-right-top': 'both',
                'browser-window-resizer-right-bottom': 'both',
                'browser-window-resizer-left-bottom': 'both',
                'browser-window-resizer-left-top': 'both'
            }
            var listeners = {};

            var hostElement = document.createElement('div');
            var resizers = document.createElement('div');
            var content = document.createElement('div');
            var shadowRoot = content.attachShadow({ mode: 'open' });
            var windowElement = document.createElement('div');
            var toolbarElement = document.createElement('div');
            var contentElement = document.createElement('div');

            var isMaximized = false;
            var originalWidth = hostElement.offsetWidth;
            var originalHeight = hostElement.offsetHeight;
            var originalLeft = utils.getPosition(hostElement).x;
            var originalTop = utils.getPosition(hostElement).y;
            var originalSnapSide = '';

            console.log(config);

            const toolbarMenu = WinUI.contextMenu([])

            toolbarMenu.container.style.setProperty('--contextmenu-icon-size', '.58rem');
            toolbarMenu.container.style.setProperty('--contextmenu-expand-size', '.58rem');

            toolbarElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    e.pageX = touch.pageX;
                    e.pageY = touch.pageY;
                }
                toolbarMenu.setItems([
                    {
                        className: "restore",
                        icon: "chrome-restore",
                        text: "Restore",
                        disabled: !isMaximized == true,
                        action: () => {
                            unmaximizeWindow();
                        }
                    }, {
                        className: "minimize",
                        icon: "chrome-minimize",
                        text: "Minimize",
                        disabled: config.minimizable == false,
                        action: () => {
                            minimize();
                        },
                    }, {
                        className: "maximize",
                        icon: "chrome-maximize",
                        text: "Maximize",
                        disabled: !(isMaximized == false && !config.maximizable == false),
                        action: () => {
                            maximizeWindow();
                        },
                    }, {
                        type: "separator"
                    }, {
                        className: "close",
                        icon: "chrome-close",
                        text: "Close",
                        action: () => {
                            close();
                        },
                    }
                ]);
                toolbarMenu.open(e.pageX, e.pageY, 'left-top');
            })

            new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                window.addEventListener(event, (e) => {
                    if (toolbarMenu.container.contains(e.target)) return;
                    toolbarMenu.close();
                })
            })

            const windowID = ICON.open({
                browserWindow: hostElement,
                shadowRoot: shadowRoot,
                pid: pid
            });
            console.log('opened', windowID)

            hostElement.className = 'browser-window-container active';
            hostElement.addEventListener('pointerdown', (e) => {
                ICON.focus(windowID);
            })

            if (config.x) {
                hostElement.style.left = config.x + 'px';
            } else {
                hostElement.style.left = (window.innerWidth / 2) - ((config.width ? config.width : 800) / 2) + 'px';
            }
            if (config.y) {
                hostElement.style.top = config.y + 'px';
            } else {
                // Taskbar height : 48
                hostElement.style.top = ((window.innerHeight - 48) / 2) - ((config.height ? config.height : 600) / 2) + 'px';
            }

            ICON.addEventListener('blur', (e) => {
                content.style.pointerEvents = '';
                triggerEvent('blur', {})
            })

            ICON.addEventListener('focus', (e) => {
                if (e.id != windowID) {
                    return content.style.pointerEvents = '';
                }
                content.style.pointerEvents = 'unset';
                triggerEvent('focus', {});
            })

            // Outside
            resizers.className = 'browser-window-resizers';
            content.className = 'browser-window-content';

            // In shadow root
            windowElement.className = 'window';
            toolbarElement.className = 'window-toolbar';
            contentElement.className = 'window-content';

            if (config.showOnTop == true) {
                hostElement.classList.add('show-on-top');
            }
            parent.appendChild(hostElement);
            hostElement.appendChild(resizers);
            hostElement.appendChild(content);
            shadowRoot.appendChild(windowElement);
            windowElement.appendChild(toolbarElement);
            windowElement.appendChild(contentElement);

            if (config.resizable == false) {
                resizers.remove();
            }

            function updateSize() {
                originalWidth = hostElement.offsetWidth;
                originalHeight = hostElement.offsetHeight;
                console.log('size', originalWidth, originalHeight);
            }

            function updatePosition() {
                originalLeft = utils.getPosition(hostElement).x;
                originalTop = utils.getPosition(hostElement).y;
                console.log('position', originalLeft, originalTop);
            }

            Object.keys(resizerConfig).forEach(key => {
                var allowed = resizerConfig[key];
                var pointerDown = false;
                var pointerPosition = [];
                var resizer = document.createElement('div');
                var originalPosition = {};
                var originalSize = {};
                resizer.className = key;

                function handleStartResizing(e) {
                    if (isMaximized == true) return;
                    if (e.type.startsWith('touch')) {
                        var touch = e.touches[0] || e.changedTouches[0];
                        e.pageX = touch.pageX;
                        e.pageY = touch.pageY;
                    }
                    var position = utils.getPosition(hostElement);
                    pointerPosition = [e.pageX, e.pageY];
                    originalPosition = {
                        x: position.x,
                        y: position.y
                    }
                    originalSize = {
                        width: hostElement.offsetWidth,
                        height: hostElement.offsetHeight
                    }
                    appWrapper.classList.add('moving');
                    pointerDown = true;
                }

                function handleMoveResizing(e) {
                    if (pointerDown == true) {
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                            e.pageY = touch.pageY;
                        }
                        var diffX = e.pageX - pointerPosition[0];
                        var diffY = e.pageY - pointerPosition[1];
                        var width = originalSize.width;
                        var height = originalSize.height;
                        if (allowed == 'vertical') {
                            diffX = 0;
                        } else if (allowed == 'horizontal') {
                            diffY = 0;
                        }
                        // For vertical resize
                        if (key.search('top') > -1) {
                            // Fixate bottom
                            hostElement.style.top = originalPosition.y + diffY + 'px';
                            windowElement.style.height = height - diffY + 'px';
                        } else if (key.search('bottom') > -1) {
                            // Fixate top
                            windowElement.style.height = height + diffY + 'px';
                        }

                        // For horizontal resize
                        if (key.search('left') > -1) {
                            // Fixate right
                            hostElement.style.left = originalPosition.x + diffX + 'px';
                            windowElement.style.width = width - diffX + 'px';
                        } else {
                            // Fixate left
                            windowElement.style.width = width + diffX + 'px';
                        }
                    }
                }

                function handleEndResizing(e) {
                    if (pointerDown == false) return;
                    pointerDown = false;
                    appWrapper.classList.remove('moving');
                    updateSize();
                    updatePosition();
                }

                events.start.forEach(event => {
                    resizer.addEventListener(event, e => handleStartResizing(e));
                })
                events.move.forEach(event => {
                    window.addEventListener(event, e => handleMoveResizing(e));
                })
                events.end.forEach(event => {
                    window.addEventListener(event, e => handleEndResizing(e));
                })

                resizers.appendChild(resizer);
            })

            // Default toolbar
            var toolbarInfo = document.createElement('div');
            var toolbarIcon = document.createElement('div');
            var toolbarTitle = document.createElement('div');
            var toolbarButtons = document.createElement('div');

            toolbarInfo.className = 'window-toolbar-info';
            toolbarIcon.className = 'window-toolbar-icon';
            toolbarTitle.className = 'window-toolbar-title';
            toolbarButtons.className = 'window-toolbar-buttons';

            var icon = config.icon || window.appRegistry.getIcon(path.callee);
            var title = config.title || 'App';

            toolbarTitle.innerHTML = window.utils.replaceHTMLTags(title);

            await (async () => {
                var url = URL.createObjectURL(await window.fs.downloadFile('C:/Winbows/System/styles/app.css'));
                var style = document.createElement('link');
                style.rel = 'stylesheet';
                style.type = 'text/css';
                style.href = url;
                shadowRoot.appendChild(style);
                return;
            })();

            (async () => {
                var url = await window.fs.getFileURL(icon);
                await loadImage(url);
                toolbarIcon.style.backgroundImage = `url(${url})`;
            })();

            function changeTitle(title = '') {
                if (!title) return;
                config.title = title;
                toolbarTitle.innerHTML = window.utils.replaceHTMLTags(title);
                ICON.changeTitle(windowID, title);
            }

            function changeIcon(url = '') {
                if (!url) return;
                config.icon = url;
                toolbarIcon.style.backgroundImage = `url(${url})`;
                ICON.changeIcon(windowID, url);
            }

            var minimizeButton = document.createElement('div');
            var maximizeButton = document.createElement('div');
            var closeButton = document.createElement('div');

            minimizeButton.className = 'window-toolbar-button';
            maximizeButton.className = 'window-toolbar-button';
            closeButton.className = 'window-toolbar-button close';

            minimizeButton.addEventListener('click', minimize);
            closeButton.addEventListener('click', close);

            var icons = ['C:/Winbows/icons/controls/minimize.png', 'C:/Winbows/icons/controls/maxmin.png', 'C:/Winbows/icons/controls/maximize.png', 'C:/Winbows/icons/controls/close.png'];

            // var iconStyle = document.createElement('style');
            // iconStyle.innerHTML = `.window{--close-icon:url(${await window.fs.getFileURL(icons[0])});--maximize-icon:url(${await window.fs.getFileURL(icons[1])});--minimize-icon:url(${await window.fs.getFileURL(icons[2])});--maxmin-icon:url(${await window.fs.getFileURL(icons[3])});}`;
            // shadowRoot.appendChild(iconStyle);

            var minimizeImage = document.createElement('div');
            minimizeImage.className = 'window-toolbar-button-icon';
            minimizeImage.style.backgroundImage = `url(${await window.fs.getFileURL(icons[0])}`;
            minimizeButton.appendChild(minimizeImage);

            var maximizeImage = document.createElement('div');
            maximizeImage.className = 'window-toolbar-button-icon';
            maximizeImage.style.backgroundImage = `url(${await window.fs.getFileURL(icons[1])})`;
            maximizeButton.appendChild(maximizeImage);

            var closeImage = document.createElement('div');
            closeImage.className = 'window-toolbar-button-icon';
            closeImage.style.backgroundImage = `url(${await window.fs.getFileURL(icons[3])})`;
            closeButton.appendChild(closeImage)

            toolbarButtons.appendChild(minimizeButton);
            toolbarButtons.appendChild(maximizeButton);
            toolbarButtons.appendChild(closeButton);

            toolbarInfo.appendChild(toolbarIcon);
            toolbarInfo.appendChild(toolbarTitle);

            toolbarElement.appendChild(toolbarInfo);
            toolbarElement.appendChild(toolbarButtons);

            async function unmaximizeWindow(animation = true) {
                isMaximized = false;
                hostElement.removeAttribute('data-maximized');
                hostElement.style.left = originalLeft + 'px';
                hostElement.style.top = originalTop + 'px';
                // hostElement.style.width = originalWidth + 'px';
                // hostElement.style.height = originalHeight + 'px';

                if (animation == true) {
                    hostElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    setTimeout(() => {
                        hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                        windowElement.style.transition = 'none';
                    }, 200)
                } else {
                    hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }

                windowElement.style.width = originalWidth + 'px';
                windowElement.style.height = originalHeight + 'px';
                windowElement.style.borderRadius = 'revert-layer';
                maximizeImage.style.backgroundImage = `url(${await window.fs.getFileURL(icons[1])})`;

                console.log(originalWidth, originalHeight);
            }

            async function maximizeWindow(animation = true) {
                /*
                originalWidth = hostElement.offsetWidth;
                originalHeight = hostElement.offsetHeight;
                originalLeft = utils.getPosition(hostElement).x;
                originalTop = utils.getPosition(hostElement).y;
                */

                isMaximized = true;
                hostElement.setAttribute('data-maximized', 'true');
                hostElement.style.left = '0';
                hostElement.style.top = '0';
                // hostElement.style.width = '100vw';
                // hostElement.style.height = 'calc(100vh - var(--taskbar-height))';

                if (animation == true) {
                    hostElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    setTimeout(() => {
                        hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                        windowElement.style.transition = 'none';
                    }, 200)
                } else {
                    hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }

                windowElement.style.width = '100vw';
                windowElement.style.height = 'calc(100vh - var(--taskbar-height))';
                windowElement.style.borderRadius = '0';
                maximizeImage.style.backgroundImage = `url(${await window.fs.getFileURL(icons[2])})`;
            }


            maximizeButton.addEventListener('click', () => {
                if (isMaximized == false) {
                    maximizeWindow();
                } else {
                    unmaximizeWindow();
                }
            });

            function minimize() {
                ICON.hide(windowID);
            }

            function close() {
                console.log('close', windowID)
                ICON.close(windowID);
                window.System.processes[pid]._exit_Window();
            }

            if (config.fullscreenable == false) {
                maximizeButton.remove();
            }
            if (config.minimizable == false) {
                minimizeButton.remove();
            }
            if (config.maximizable == false) {
                maximizeButton.remove();
            }
            if (config.closable == false) {
                closeButton.remove();
            }

            var showSnapPreview = false;
            var snapMargin = 12;
            var pointerDown = false;
            var pointerPosition = [];
            var originalPosition = {};
            var immovableElements = [];
            var snapSide = '';

            function getSnapSide(x, y) {
                var side = '';
                if (y >= appWrapper.offsetHeight - snapMargin) {
                    side += 'b';
                } else if (y <= snapMargin) {
                    side += 't';
                }
                if (x >= appWrapper.offsetWidth - snapMargin) {
                    side += 'r';
                } else if (x <= snapMargin) {
                    side += 'l';
                }
                if (side.length == 1) {
                    side += 'f';
                }
                if (side.includes('b') && side.includes('f')) {
                    return '';
                }
                return side;
            }

            function getSnapSize(side) {
                var width = '100vw';
                var height = 'calc(100vh - var(--taskbar-height))';
                if (side.includes('l') || side.includes('r')) {
                    width = 'calc(100vw / 2)';
                }
                if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                    height = 'calc((100vh - var(--taskbar-height)) / 2)';
                }
                return {
                    width: width,
                    height: height
                }
            }

            function getSnapPosition(side) {
                var left = '0';
                var top = '0';
                if (side.includes('r')) {
                    left = 'calc(100vw / 2)';
                }
                if (side.includes('b')) {
                    top = 'calc((100vh - var(--taskbar-height)) / 2)';
                }
                return {
                    left: left,
                    top: top
                }
            }

            function getSnapPreviewSize(side) {
                var width = appWrapper.offsetWidth - snapMargin * 2;
                var height = appWrapper.offsetHeight - snapMargin * 2;
                if (side.includes('l') || side.includes('r')) {
                    width = appWrapper.offsetWidth / 2 - snapMargin * 2;
                }
                if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                    height = appWrapper.offsetHeight / 2 - snapMargin * 2;
                }
                return {
                    width: width,
                    height: height
                }
            }

            function getSnapPreviewPosition(side) {
                var left = snapMargin;
                var top = snapMargin;
                if (side.includes('r')) {
                    left = appWrapper.offsetWidth / 2 + snapMargin;
                }
                if (side.includes('b')) {
                    top = appWrapper.offsetHeight / 2 + snapMargin;
                }
                return {
                    left: left,
                    top: top
                }
            }

            function handleStartMoving(e) {
                if (toolbarButtons.contains(e.target)) return;
                var prevent = false;
                immovableElements.forEach(element => {
                    if (element == e.target) {
                        prevent = true;
                    }
                })
                if (prevent == true) return;
                let pageX = e.pageX;
                let pageY = e.pageY;
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    pageX = touch.pageX;
                    pageY = touch.pageY;
                }
                if (pageX < 0) {
                    pageX = 0;
                } else if (pageX > window.innerWidth) {
                    pageX = window.innerWidth;
                }
                if (pageY < 0) {
                    pageY = 0;
                } else if (pageY > parent.offsetHeight) {
                    pageY = parent.offsetHeight;
                }
                pointerDown = true;
                var position = utils.getPosition(hostElement);
                pointerPosition = [pageX, pageY];
                originalPosition = {
                    x: position.x,
                    y: position.y
                }
                triggerEvent('dragstart', {
                    preventDefault: () => {
                        handleEndMoving({}, 'preventDefault');
                    },
                    type: e.type,
                    target: e.target
                })
            }

            function handleMoveMoving(e) {
                if (pointerDown) {
                    if (originalSnapSide != '' || isMaximized == true) {
                        originalSnapSide = '';
                        isMaximized = false;
                        hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                        windowElement.style.transition = 'none';
                        hostElement.removeAttribute('data-maximized');
                        // hostElement.style.width = originalWidth + 'px';
                        // hostElement.style.height = originalHeight + 'px';
                        windowElement.style.width = originalWidth + 'px';
                        windowElement.style.height = originalHeight + 'px';
                        windowElement.style.borderRadius = 'revert-layer';
                        window.fs.getFileURL(icons[1]).then(url => {
                            maximizeImage.style.backgroundImage = `url(${url})`;
                        })
                    }
                    let pageX = e.pageX;
                    let pageY = e.pageY;
                    if (e.type.startsWith('touch')) {
                        var touch = e.touches[0] || e.changedTouches[0];
                        pageX = touch.pageX;
                        pageY = touch.pageY;
                    }
                    if (pageX < 0) {
                        pageX = 0;
                    } else if (pageX > window.innerWidth) {
                        pageX = window.innerWidth;
                    }
                    if (pageY < 0) {
                        pageY = 0;
                    } else if (pageY > parent.offsetHeight) {
                        pageY = parent.offsetHeight;
                    }
                    const side = getSnapSide(pageX, pageY);
                    appWrapper.classList.add('moving');
                    hostElement.style.left = originalPosition.x + pageX - pointerPosition[0] + 'px';
                    hostElement.style.top = originalPosition.y + pageY - pointerPosition[1] + 'px';
                    if (config.snappable == false) {
                        snapSide = '';
                    } else {
                        if (side != '') {
                            snapPreview.style.position = 'fixed';
                            if (!showSnapPreview == true) {
                                snapPreview.style.width = hostElement.offsetWidth + 'px';
                                snapPreview.style.height = hostElement.offsetHeight + 'px';
                                snapPreview.style.left = window.utils.getPosition(hostElement).x + 'px';
                                snapPreview.style.top = window.utils.getPosition(hostElement).y + 'px';
                                snapPreview.classList.add('active');
                            }
                            var size = getSnapPreviewSize(side);
                            var position = getSnapPreviewPosition(side);
                            snapPreview.style.transition = 'all .15s ease-in-out';
                            snapPreview.style.zIndex = hostElement.style.zIndex || ICON.getMaxZIndex();
                            snapPreview.style.left = position.left + 'px';
                            snapPreview.style.top = position.top + 'px';
                            snapPreview.style.width = size.width + 'px';
                            snapPreview.style.height = size.height + 'px';
                            showSnapPreview = true;
                        } else {
                            if (showSnapPreview == true) {
                                snapPreview.style.width = hostElement.offsetWidth + 'px';
                                snapPreview.style.height = hostElement.offsetHeight + 'px';
                                snapPreview.style.left = window.utils.getPosition(hostElement).x + 'px';
                                snapPreview.style.top = window.utils.getPosition(hostElement).y + 'px';
                                setTimeout(() => {
                                    if (showSnapPreview == true) return;
                                    snapPreview.style.transition = 'none';
                                    snapPreview.classList.remove('active');
                                }, 150)
                            }
                            showSnapPreview = false;
                        }
                        snapSide = side;
                    }
                    triggerEvent('dragging', {
                        preventDefault: () => {
                            handleEndMoving({}, 'preventDefault');
                        },
                        type: e.type,
                        target: e.target
                    })
                }
            }

            function handleEndMoving(e, type = 'user') {
                if (pointerDown == false) return;
                if (type == 'user') {
                    originalWidth = hostElement.offsetWidth;
                    originalHeight = hostElement.offsetHeight;
                }
                pointerDown = false;
                showSnapPreview = false;
                snapPreview.style.width = hostElement.offsetWidth + 'px';
                snapPreview.style.height = hostElement.offsetHeight + 'px';
                snapPreview.style.left = window.utils.getPosition(hostElement).x + 'px';
                snapPreview.style.top = window.utils.getPosition(hostElement).y + 'px';
                setTimeout(() => {
                    snapPreview.style.transition = 'none';
                    snapPreview.classList.remove('active');
                }, 150)
                appWrapper.classList.remove('moving');
                if (snapSide != '') {
                    if (snapSide.includes('t') && snapSide.includes('f')) {
                        maximizeWindow();
                    }
                    var position = getSnapPosition(snapSide);
                    var size = getSnapSize(snapSide);
                    hostElement.style.left = position.left;
                    hostElement.style.top = position.top;

                    hostElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                    setTimeout(() => {
                        hostElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                        windowElement.style.transition = 'none';
                    }, 200)

                    windowElement.style.width = size.width;
                    windowElement.style.height = size.height;
                    windowElement.style.borderRadius = 0;
                } else if (type == 'user') {
                    updatePosition();
                }
                originalSnapSide = snapSide;
                snapSide = '';
                triggerEvent('dragend', {
                    preventDefault: () => {

                    },
                    type: e.type,
                    target: e.target
                })
            }

            function setSnappable(value) {
                config.snappable = value == true;
            }

            function setMovable(element) {
                events.start.forEach(event => {
                    element.addEventListener(event, e => handleStartMoving(e));
                })
            }

            function unsetMovable(element) {
                events.start.forEach(event => {
                    element.removeEventListener(event, handleStartMoving);
                })
            }

            function setImmovable(element) {
                if (!immovableElements.includes(element)) {
                    immovableElements.push(element);
                }
            }

            function unsetImmovable(element) {
                if (immovableElements.includes(element)) {
                    immovableElements.splice(immovableElements.indexOf(element), 1);
                }
            }

            function triggerEvent(event, details) {
                if (listeners.hasOwnProperty(event)) {
                    listeners[event].forEach(listener => listener(details));
                }
            }

            function addEventListener(event, listener) {
                if (!listeners.hasOwnProperty(event)) {
                    listeners[event] = [];
                }
                listeners[event].push(listener);
            }

            events.start.forEach(event => {
                toolbarElement.addEventListener(event, e => handleStartMoving(e));
            })
            events.move.forEach(event => {
                window.addEventListener(event, e => handleMoveMoving(e));
            })
            events.end.forEach(event => {
                window.addEventListener(event, e => handleEndMoving(e));
            })

            hostElement.addEventListener('pointerdown', (e) => {
                ICON.focus(windowID);
            })

            ICON.focus(windowID);

            updatePosition();
            updateSize();

            return {
                shadowRoot, container: hostElement, window: windowElement, toolbar: toolbarElement, content: contentElement,
                close, addEventListener, setMovable, unsetMovable, setImmovable, unsetImmovable, changeTitle, changeIcon,
                setSnappable
            };
        },
        writable: false,
        configurable: false
    })

    window.loadedKernel();
})();