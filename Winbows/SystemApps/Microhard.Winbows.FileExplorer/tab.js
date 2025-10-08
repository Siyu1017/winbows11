// "null" refers to the group separator
const fsUtils = path;
const caches = {};
const pageDatas = [
    {
        title: 'Home',
        path: 'pages://home',
        icon: './icons/home.ico'
    }, {
        title: 'Gallery',
        path: 'pages://gallery',
        icon: './icons/gallery.ico'
    }, null, {
        title: 'Desktop',
        path: 'C:/User/Desktop',
        icon: './icons/desktop.ico'
    }, {
        title: 'Downloads',
        path: 'C:/User/Downloads',
        icon: './icons/downloads.ico'
    }, {
        title: 'Documents',
        path: 'C:/User/Documents',
        icon: './icons/documents.ico'
    }, {
        title: 'Pictures',
        path: 'C:/User/Pictures',
        icon: './icons/pictures.ico'
    }, {
        title: 'Music',
        path: 'C:/User/Music',
        icon: './icons/music.ico'
    }, {
        title: 'Videos',
        path: 'C:/User/Videos',
        icon: './icons/videos.ico'
    }, null, {
        title: 'This PC',
        path: 'pages://this_pc',
        icon: './icons/monitor.ico'
    }, {
        title: 'Network',
        path: 'pages://network',
        icon: './icons/network.ico'
    }
];

function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function canvasClarifier(canvas, ctx, width, height) {
    const originalSize = {
        width: (width ? width : canvas.offsetWidth),
        height: (height ? height : canvas.offsetHeight)
    }
    var ratio = window.devicePixelRatio || 1;
    canvas.width = originalSize.width * ratio;
    canvas.height = originalSize.height * ratio;
    ctx.scale(ratio, ratio);
    if (originalSize.width != canvas.offsetWidth || originalSize.height != canvas.offsetHeight) {
        canvas.style.width = originalSize.width + 'px';
        canvas.style.height = originalSize.height + 'px';
    }
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function hasParentFolder(fullPath) {
    if (fullPath.startsWith('pages://')) return false;
    const { path } = fsUtils.parsePath(fullPath);
    return path.split('/').filter(i => i.trim().length > 0).length > 0;
}

function getParentPath(fullPath) {
    const { disk, path } = fsUtils.parsePath(fullPath);
    const parts = path.split('/').filter(p => p.trim().length > 0);
    if (parts.length <= 0) return null;
    parts.pop();
    return `${disk}:/${parts.join('/')}`;
}

async function getImageURL(image) {
    if (caches[image]) {
        return caches[image]
    } else {
        var url = await fs.getFileURL(image);
        caches[image] = url;
        return url;
    }
}

function getData(path) {
    for (let i in pageDatas) {
        var item = pageDatas[i];
        if (item != null && item.path == path) {
            return {
                title: item.title,
                icon: item.icon,
                active: item.active
            }
        }
    }
    return {
        title: capitalizeFirstLetter(fsUtils.basename(path)),
        icon: 'C:/Winbows/icons/folders/folder.ico',
        active: pageDatas.filter(t => t != null).find(t => t.path == 'pages://this_pc').active
    }
}

async function setupTab(browserWindow, tab, page = 'pages://home') {
    // Path
    var pathStrip = document.createElement('div');
    var pathStripActions = document.createElement('div');
    var pathStripActionBack = document.createElement('button');
    var pathStripActionNext = document.createElement('button');
    var pathStripActionUp = document.createElement('button');
    var pathStripActionRefresh = document.createElement('button');
    var pathStripPath = document.createElement('div');
    var pathStripPathProtocol = document.createElement('div');
    var pathStripPathText = document.createElement('div');
    var pathStripSearch = document.createElement('input');

    pathStrip.className = 'explorer-pathstrip';
    pathStripActions.className = 'explorer-pathstrip-actions';
    pathStripActionBack.className = 'explorer-pathstrip-action back';
    pathStripActionNext.className = 'explorer-pathstrip-action next';
    pathStripActionUp.className = 'explorer-pathstrip-action up';
    pathStripActionRefresh.className = 'explorer-pathstrip-action refresh';
    pathStripPath.className = 'explorer-pathstrip-path';
    pathStripPathProtocol.className = 'explorer-pathstrip-path-protocol';
    pathStripPathText.className = 'explorer-pathstrip-path-text';
    pathStripSearch.className = 'explorer-pathstrip-search';

    pathStripSearch.placeholder = 'Search...'

    pathStrip.appendChild(pathStripActions);
    pathStrip.appendChild(pathStripPath);
    pathStrip.appendChild(pathStripSearch);
    pathStripActions.appendChild(pathStripActionBack);
    pathStripActions.appendChild(pathStripActionNext);
    pathStripActions.appendChild(pathStripActionUp);
    pathStripActions.appendChild(pathStripActionRefresh);
    // pathStripPath.appendChild(pathStripPathProtocol);
    pathStripPath.appendChild(pathStripPathText);

    pathStripPathProtocol.setAttribute('data-protocol', 'this_pc');

    const actionbar = document.createElement('div');
    const actionbarCreate = document.createElement('div');
    const actionbarCreateButton = document.createElement('button');
    const actionbarQuickActions = document.createElement('div');
    const content = document.createElement('div');
    const sidebar = document.createElement('div');
    const viewerContainer = document.createElement('div');
    //const viewer = document.createElement('div');
    //var viewerContent = document.createElement('div');
    const footer = document.createElement('div');
    const footerLeft = document.createElement('div');
    const footerRight = document.createElement('div');
    const footerPageItems = document.createElement('div');
    const footerPageSize = document.createElement('div');
    const footerSelectedItems = document.createElement('div');

    // Selection canvas
    const canvas = document.createElement('canvas');

    actionbar.className = 'explorer-actionbar';
    actionbarCreate.className = 'explorer-actionbar-group';
    actionbarCreateButton.className = 'explorer-actionbar-button create';
    actionbarQuickActions.className = 'explorer-actionbar-group';
    content.className = 'explorer-content';
    sidebar.className = 'explorer-sidebar';
    viewerContainer.className = 'explorer-viewer-container';
    //viewer.className = 'explorer-viewer';
    //viewerContent.className = 'explorer-viewer-content';
    footer.className = 'explorer-footer';
    footerLeft.className = 'explorer-footer-left';
    footerRight.className = 'explorer-footer-right';
    footerPageItems.className = 'explorer-footer-page-items';
    footerPageSize.className = 'explorer-footer-page-size';
    footerSelectedItems.className = 'explorer-footer-selected-items';

    tab.tabviewItem.appendChild(pathStrip);
    tab.tabviewItem.appendChild(actionbar);
    actionbar.appendChild(actionbarCreate);
    actionbar.appendChild(actionbarQuickActions);
    //actionbarCreate.appendChild(actionbarCreateButton);
    tab.tabviewItem.appendChild(content);
    tab.tabviewItem.appendChild(footer);
    content.appendChild(sidebar);
    content.appendChild(viewerContainer);
    //viewerContainer.appendChild(viewer);
    //viewer.appendChild(viewerContent);
    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);
    footerLeft.appendChild(footerPageItems);
    footerLeft.appendChild(footerPageSize);
    footerLeft.appendChild(footerSelectedItems);

    var actionButtons = {};
    //var currentPage = page || 'pages://home';

    /*
    getData(currentPage).then(pageData => {
        tab.changeHeader(pageData.title);
        tab.changeIcon(pageData.icon);
    });
    getPage(currentPage);
    addToHistory(currentPage);
    */

    setSidebar(true);

    const router = (await requireAsync('./_router.js'))(tab.id);
    let pageContents = {};

    async function updatePage(e) {
        const path = e.path.includes('?') ? e.path.slice(e.path.indexOf('?')) : e.path;
        //const pageItem = Object.values(pageListItems).filter(item => item.path === path);
        //if (pageItem.length == 0) return;
        if (path == '/') {
            return router.replace('pages://home');
        }

        pathStripPathText.innerHTML = path;

        if (router.historyIndex <= 0) {
            pathStripActionBack.disabled = true;
        } else {
            pathStripActionBack.disabled = false;
        }
        if (router.history.length > 1 && router.historyIndex < router.history.length - 1) {
            pathStripActionNext.disabled = false;
        } else {
            pathStripActionNext.disabled = true;
        }
        if (hasParentFolder(path)) {
            pathStripActionUp.disabled = false;
        } else {
            pathStripActionUp.disabled = true;
        }

        let pageContent = pageContents[path];
        if (path.startsWith('pages://')) {
            if (path == 'pages://this_pc') {
                const itemViewer = document.createElement('div');
                itemViewer.className = 'explorer-item-viewer';
                footerPageItems.innerHTML = `${fs.disks.length} Items`;
                for (var i = 0; i < fs.disks.length; i++) {
                    const disk = fs.disks[i];
                    const stat = fs.stat(disk + ':/');
                    const itemElement = document.createElement('div');
                    const iconElement = document.createElement('div');
                    const infoElement = document.createElement('div');
                    const diskName = document.createElement('div');
                    const totalSizeBar = document.createElement('div');
                    const usedSizeBar = document.createElement('div');
                    const usedSizeText = document.createElement('div');

                    itemElement.className = 'explorer-viewer-disk-item';
                    iconElement.className = 'explorer-viewer-disk-icon';
                    infoElement.className = 'explorer-viewer-disk-info';
                    diskName.className = 'explorer-viewer-disk-name';
                    totalSizeBar.className = 'explorer-viewer-disk-total-bar';
                    usedSizeBar.className = 'explorer-viewer-disk-used-bar';
                    usedSizeText.className = 'explorer-viewer-disk-used-text';

                    getImageURL('C:/Winbows/icons/devices/drives/Windows 11 Drive Unlocked.ico').then(url => {
                        iconElement.style.backgroundImage = `url(${url})`;
                    })

                    diskName.innerHTML = disk.toUpperCase() + ':';

                    itemViewer.appendChild(itemElement);
                    itemElement.appendChild(iconElement);
                    itemElement.appendChild(infoElement);
                    infoElement.appendChild(diskName);
                    infoElement.appendChild(totalSizeBar);
                    totalSizeBar.appendChild(usedSizeBar);
                    infoElement.appendChild(usedSizeText);

                    itemElement.addEventListener('click', () => {
                        router.push(disk + ':/');
                    })

                    const size = stat.length;

                    navigator.storage.estimate().then(quota => {
                        usedSizeBar.style.width = size / quota.quota * 100 + '%';
                        usedSizeText.innerHTML = `${formatBytes(size)} / ${formatBytes(quota.quota)}`;
                    })

                    footerPageSize.innerHTML = formatBytes(size);
                }
                pageContent = itemViewer;
            } else {
                try {
                    const page = await requireAsync(`./pages/` + path.replace('pages://', '') + '.js');
                    pageContents[path] = page(router);
                    pageContent = pageContents[path] || document.createElement('div');
                } catch (e) {
                    // Page not found
                    const el = document.createElement('div');
                    el.innerHTML = 'Not found!';
                    el.style = "width: 100%;text-align: center;color: var(--label-color);padding: 1rem;display: block;";
                    pageContent = el;
                    console.warn(e);
                }
                if (router.getCurrentRoute() != path) {
                    return;
                }
            }
        } else {
            pageContent = await localPageCrafter(path);
            if (router.getCurrentRoute() != path) {
                return;
            }
        }

        try {
            const pageData = getData(path);
            tab.changeHeader(pageData.title);
            getImageURL(pageData.icon).then(url => {
                tab.changeIcon(url);
            })
            pageData.active();
        } catch (e) { }

        // Remove selected items
        selected = [];

        if (!path.startsWith('pages://')) {
            viewerContainer.replaceChildren(...[pageContent, canvas]);
        } else {
            viewerContainer.replaceChildren(...[pageContent]);
        }
    }

    router.on('change', updatePage);
    router.on('reload', updatePage);

    // Initialize
    router.push(page || 'pages://home');

    pathStripActionBack.disabled = true;
    pathStripActionNext.disabled = true;
    pathStripActionUp.disabled = true;

    pathStripActionBack.addEventListener('click', () => {
        router.back();
    })

    pathStripActionNext.addEventListener('click', () => {
        router.forward();
    })

    pathStripActionUp.addEventListener('click', () => {
        const path = router.getCurrentRoute();
        if (hasParentFolder(router.getCurrentRoute())) {
            router.push(getParentPath(path));
        }
    })

    pathStripActionRefresh.addEventListener('click', () => {
        router.reload();
    })

    function setSidebar(initialize = false) {
        if (initialize) {
            var group = document.createElement('div');
            group.className = 'explorer-sidebar-group';
            pageDatas.forEach(async (item, i) => {
                if (item == null) {
                    sidebar.appendChild(group);
                    group = document.createElement('div');
                    group.className = 'explorer-sidebar-group';
                } else {
                    var itemElement = document.createElement('div');
                    var itemIcon = document.createElement('div');
                    var itemHeader = document.createElement('div');
                    itemElement.className = 'explorer-sidebar-item';
                    itemIcon.className = 'explorer-sidebar-item-icon';
                    itemHeader.className = 'explorer-sidebar-item-header';
                    itemElement.addEventListener('click', () => {
                        sidebar.querySelectorAll('.explorer-sidebar-item.active').forEach(active => {
                            active.classList.remove('active');
                        })
                        // TODO : Set the page of item
                        //currentPage = item.path;
                        router.push(item.path);
                        //addToHistory(currentPage);
                        //getPage(currentPage);
                        itemElement.classList.add('active');
                    })
                    group.appendChild(itemElement);
                    itemElement.appendChild(itemIcon);
                    itemElement.appendChild(itemHeader);
                    getImageURL(item.icon).then(url => {
                        itemIcon.style.backgroundImage = `url(${url})`;
                    })
                    itemHeader.innerHTML = item.title;
                    pageDatas[i].active = function () {
                        sidebar.querySelectorAll('.explorer-sidebar-item.active').forEach(active => {
                            active.classList.remove('active');
                        })
                        itemElement.classList.add('active');
                    }
                }
            })
            if (group.innerHTML != '') {
                sidebar.appendChild(group);
            }
        }
    }

    var selected = [];
    var createdItems = [];

    // Select file / folder
    ; (() => {
        var startXInCanvas = 0;
        var startYInCanvas = 0;
        var startX = 0;
        var startY = 0;
        var pointerXInCanvas = 0;
        var pointerYInCanvas = 0;
        var pointerX = 0;
        var pointerY = 0;
        var selecting = false;
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        })

        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        viewerContainer.appendChild(canvas);

        function selectionStart(e) {
            if (e.button == 2) {
                // Right click
                return;
            }
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            var viewer = viewerContainer.querySelector('.explorer-item-viewer');
            if (!viewer) return;
            selecting = true;

            // For items
            startX = e.pageX;
            startY = e.pageY + viewer.scrollTop;
            pointerX = e.pageX;
            pointerY = e.pageY + viewer.scrollTop;

            // For canvas
            startXInCanvas = e.pageX;
            startYInCanvas = e.pageY + viewer.scrollTop;
            pointerXInCanvas = e.pageX;
            pointerYInCanvas = e.pageY + viewer.scrollTop;

            selected = [];
            createdItems.forEach(item => {
                item.item.classList.remove('active');
            })
        }

        function selectionMove(e) {
            if (selecting == false) return;
            var viewer = viewerContainer.querySelector('.explorer-item-viewer');
            if (!viewer) return;
            document.getSelection().removeAllRanges();
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            pointerX = e.pageX;
            pointerY = e.pageY + viewer.scrollTop;
            pointerXInCanvas = e.pageX;
            pointerYInCanvas = e.pageY;

            render();

            var rectX = startX;
            var rectY = startY;
            var rectWidth = Math.abs(pointerX - startX);
            var rectHeight = Math.abs(pointerY - startY);

            if (pointerX < startX) {
                rectX = pointerX;
            }
            if (pointerY < startY) {
                rectY = pointerY;
            }

            selected = [];
            createdItems.forEach(item => {
                var position = getPosition(item.item);
                var itemWidth = item.item.offsetWidth;
                var itemHeight = item.item.offsetHeight;

                position.y += viewer.scrollTop;

                if (position.x <= rectX && rectX <= position.x + itemWidth && position.y <= rectY && rectY <= position.y + itemHeight) {
                    // Start point in item
                    item.item.classList.add('active');
                    selected.push(item);
                } else if (position.x >= rectX && position.y >= rectY && position.x + itemWidth <= pointerX && position.y + itemHeight <= pointerY) {
                    // Rect in Selection
                    item.item.classList.add('active');
                    selected.push(item);
                } else if (!(position.x + itemWidth < rectX ||
                    position.x > rectX + rectWidth ||
                    position.y + itemHeight < rectY ||
                    position.y > rectY + rectHeight)) {
                    // Overlap
                    item.item.classList.add('active');
                    selected.push(item);
                } else {
                    item.item.classList.remove('active');
                }
            })
        }

        function selectionEnd(e) {
            selecting = false;
            canvasClarifier(canvas, ctx);
        }

        function render() {
            canvasClarifier(canvas, ctx);
            if (selecting == false) return;

            const viewer = viewerContainer.querySelector('.explorer-item-viewer');
            if (!viewer) return;

            const position = getPosition(canvas);

            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#298de547';
            ctx.strokeStyle = '#298de5';
            ctx.lineWidth = .75;
            ctx.fillRect(startXInCanvas - position.x, startYInCanvas - position.y - viewer.scrollTop, pointerXInCanvas - startXInCanvas, pointerYInCanvas + viewer.scrollTop - startYInCanvas);
            ctx.strokeRect(startXInCanvas - position.x, startYInCanvas - position.y - viewer.scrollTop, pointerXInCanvas - startXInCanvas, pointerYInCanvas + viewer.scrollTop - startYInCanvas);
            ctx.closePath();
            ctx.restore();
        }

        const events = {
            "start": ["mousedown", "touchstart", "pointerdown"],
            "move": ["mousemove", "touchmove", "pointermove"],
            "end": ["mouseup", "touchend", "pointerup", "blur"]
        }

        events.start.forEach(event => {
            viewerContainer.addEventListener(event, e => selectionStart(e))
        })
        events.move.forEach(event => {
            window.addEventListener(event, e => selectionMove(e))
        })
        events.end.forEach(event => {
            window.addEventListener(event, e => selectionEnd(e))
        })

        var resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(viewerContainer);
    })();

    // Contextmenu for selected items
    function generateMultipleMenu(e) {
        const selectedItems = selected;
        const menu = WinUI.contextMenu([
            {
                icon: "delete",
                className: "delete",
                text: "Delete",
                action: () => {
                    selectedItems.forEach(item => {
                        fs.rm(item.path, { recursive: true }).then(() => {
                            item.item.remove();
                        });
                    })
                    selected = [];
                    createdItems.forEach(item => {
                        item.item.classList.remove('active');
                    })
                }
            }
        ])
        e.preventDefault();
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            e.pageX = touch.pageX;
            e.pageY = touch.pageY;
        }
        menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        menu.open(e.pageX, e.pageY, 'left-top');
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                menu.close();
            })
        })
    }

    async function createFolderItem(parent, details, path) {
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');

        item.className = 'explorer-viewer-item';
        itemIcon.className = 'explorer-viewer-item-icon';
        itemName.className = 'explorer-viewer-item-name';

        getImageURL('C:/Winbows/icons/folders/folder.ico').then(url => {
            itemIcon.style.backgroundImage = `url(${url})`;
        })
        itemName.innerHTML = details.name;

        // var hasMouse = matchMedia('(pointer:fine)').matches;

        item.addEventListener('click', async () => {
            router.push(path);
        })

        item.addEventListener('contextmenu', async (e) => {
            if (selected.length > 1) {
                return generateMultipleMenu(e);
            }
            const menu = WinUI.contextMenu([
                /*{
                    type: 'label',
                    text: details.name
                }, {
                    type: 'separator'
                }, */{
                    icon: "delete",
                    className: "delete",
                    text: "Delete",
                    action: () => {
                        fs.rm(path, { recursive: true }).then(() => {
                            item.remove();
                        });
                    }
                }
            ])
            e.preventDefault();
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
            menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
            menu.open(e.pageX, e.pageY, 'left-top');
            new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                window.addEventListener(event, (e) => {
                    if (menu.container.contains(e.target)) return;
                    menu.close();
                })
            })
        })

        createdItems.push({
            item, path, type: 'folder', details
        })

        item.appendChild(itemIcon);
        item.appendChild(itemName);
        parent.appendChild(item);
        return item;
    }

    async function createFileItem(parent, details, path) {
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');
        var fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot'];

        item.className = 'explorer-viewer-item';
        itemIcon.className = 'explorer-viewer-item-icon';
        itemName.className = 'explorer-viewer-item-name';

        if (details.type == 'application/winbows-link') {
            fs.readFileAsText(path).then(content => {
                try {
                    const link = JSON.parse(content);
                    itemIcon.style.backgroundImage = `url(${link.icon})`;
                    itemIcon.classList.add('shortcut');
                    itemName.innerHTML = link.name;
                    item.addEventListener('click', (e) => {
                        System.shell.execCommand(link.command);
                    })
                    getImageURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                        itemIcon.style.setProperty('--shortcut-icon', `url(${url})`);
                    })
                } catch (e) {
                    getImageURL(System.fileIcons.getIcon(path)).then(url => {
                        itemIcon.style.backgroundImage = `url(${url})`;
                    })
                    itemName.innerHTML = fsUtils.basename(path);
                    console.error(`An error occurred while parsing file ( ${path} )`)
                }
            })
        } else {
            getImageURL(System.fileIcons.getIcon(path)).then(url => {
                itemIcon.style.backgroundImage = `url(${url})`;
                if (details.type.startsWith('image/')) {
                    try {
                        getImageURL(path).then(url => {
                            itemIcon.style.backgroundImage = `url(${url})`;
                        })
                    } catch (e) {
                        if (window.modes.debug == true) {
                            console.log('Failed to load image.');
                        }
                    }
                }
            })
            itemName.innerHTML = details.name;
            item.addEventListener('click', () => {
                if (['.wrt'].includes(fsUtils.extname(path))) {
                    System.shell.execCommand(path);
                    return;
                }
                var defaultViewer = System.fileViewers.getDefaultViewer(path);
                if (defaultViewer != null) {
                    System.shell.execCommand(`"${defaultViewer.script}" --path=${path}`);
                } else {
                    System.shell.execCommand(`C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt --path=${path}`);
                }
            })
        }

        item.addEventListener('contextmenu', async (e) => {
            if (selected.length > 1) {
                return generateMultipleMenu(e);
            }
            var items = [
                    /*
                    {
                        type: 'label',
                        text: details.name
                    }, {
                        type: 'separator'
                    }, */{
                    className: "open",
                    text: "Open",
                    action: () => {
                        var defaultViewer = System.fileViewers.getDefaultViewer(path);
                        if (defaultViewer != null) {
                            System.shell.execCommand(`"${defaultViewer.script}" --path=${path}`);
                        } else {
                            System.shell.execCommand(`C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt --path=${path}`);
                        }
                    }
                }, {
                    icon: "open-with",
                    className: "open-with",
                    text: "Open with...",
                    action: () => {
                        System.shell.execCommand(`C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt --path=${path}`);
                    }
                }, {
                    icon: "delete",
                    className: "delete",
                    text: "Delete",
                    action: () => {
                        fs.rm(path, { recursive: true }).then(() => {
                            item.remove();
                        });
                    }
                }
            ]
            if (details.type.startsWith('image/')) {
                items.push({
                    className: "set-as-background",
                    text: "Set as background",
                    action: async () => {
                        await Explorer.backgroundImage.set(path);
                    }
                })
            } else if (details.type.search('javascript') > -1 || fsUtils.extname(path) == '.wrt') {
                items.push({
                    className: "run-as-an-app",
                    icon: 'window-snipping',
                    text: "Run as an application",
                    action: async () => {
                        new Process(path).start();
                    }
                })
            } else if (fsUtils.extname(path) == '.wbsf') {
                items.push({
                    icon: 'window-snipping',
                    text: 'Run file',
                    action: async () => {
                        const file = await fs.readFile(path);
                        const script = await file.text();
                        script.split('\n').filter(t => t.trim().length > 0).forEach(line => {
                            window.System.Shell(line.trim());
                        })
                    }
                })
            } else if (fontExtensions.includes(fsUtils.extname(path))) {
                items.push({
                    className: "set-as-default-font",
                    icon: 'font',
                    text: "Set as default font",
                    action: async () => {
                        try {
                            const fontName = 'WINBOWS_FONT_' + [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                            const fontURL = await fs.getFileURL(path);
                            const myFont = new FontFace(fontName, `url(${fontURL})`);
                            await myFont.load();

                            window.document.fonts.add(myFont);
                            window.document.body.style.setProperty('--winbows-font-default', fontName);

                        } catch (error) {
                            if (window.modes.debug == true) {
                                console.error('Failed to load font', error);
                            }
                        }
                        return;
                    }
                })
            }
            const menu = WinUI.contextMenu(items)
            e.preventDefault();
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
            menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
            menu.open(e.pageX, e.pageY, 'left-top');
            new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                window.addEventListener(event, (e) => {
                    if (menu.container.contains(e.target)) return;
                    menu.close();
                })
            })
        })

        createdItems.push({
            item, path, type: 'file', details
        })

        item.appendChild(itemIcon);
        item.appendChild(itemName);
        parent.appendChild(item);
    }

    async function localPageCrafter(path) {
        path = path.endsWith('/') ? path : path + '/';
        if (!fs.exists(path)) {
            const el = document.createElement('span');
            el.style = "width: 100%;text-align: center;color: var(--label-color);padding: 1rem;display: block;";
            el.innerHTML = "This folder can not be found.";
            return el;
        }
        const res = await fs.readdir(path);
        const pageStat = fs.stat(path);
        let dirs = [];
        let files = [];
        let stats = {};

        for (const path of res) {
            const stat = fs.stat(path);
            stats[path] = stat;
            if (stat.isDirectory()) {
                dirs.push(path);
            } else {
                files.push(path);
            }
        }

        const items = dirs.sort((a, b) => {
            try {
                return a.toUpperCase().localeCompare(b.toUpperCase());
            } catch (e) { };
        }).concat(files.sort((a, b) => {
            try {
                return a.toUpperCase().localeCompare(b.toUpperCase());
            } catch (e) { };
        }))
        footerPageItems.innerHTML = `${items.length} Items`;
        footerPageSize.innerHTML = formatBytes(pageStat.length);

        if (items.length == 0) {
            const el = document.createElement('span');
            el.style = "width: 100%;text-align: center;color: var(--label-color);padding: 1rem;display: block;";
            el.innerHTML = "This folder is empty.";
            return el;
        }

        const itemViewer = document.createElement('div');
        itemViewer.className = 'explorer-item-viewer';

        for (let i in items) {
            const path = items[i];
            const stat = stats[path]
            if (stat.isDirectory()) {
                await createFolderItem(itemViewer, {
                    name: fsUtils.basename(path)
                }, path)
            } else {
                if (window.modes.debug == true) {
                    console.log(stat.mimeType)
                }
                await createFileItem(itemViewer, {
                    name: fsUtils.basename(path),
                    type: stat.mimeType
                }, path)
            }
        }
        return itemViewer;
    }

    const dropZone = viewerContainer;
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragenter', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');

        var completed = 0;
        var total = 0;
        var target = router.getCurrentRoute();

        if (target == '' || target.startsWith('pages://')) return;
        if (!target.endsWith('/')) {
            target += '/';
        }

        if (window.modes.debug == true) {
            console.log(currentPage, target)
        }

        const items = event.dataTransfer.items;
        total = items.length;
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                if (item.isFile) {
                    await handleFile(item, "");
                } else if (item.isDirectory) {
                    await handleDirectory(item, item.name);
                }
            }
        }

        async function handleFile(fileEntry, path) {
            return new Promise((resolve, reject) => {
                fileEntry.file(file => {
                    const filePath = (path ? path + "/" : '') + file.name;
                    const reader = new FileReader();
                    reader.onload = async function (event) {
                        const arrayBuffer = event.target.result;
                        const blob = new Blob([arrayBuffer], { type: file.type });
                        const fullPath = `${target}${filePath}`;
                        await fs.writeFile(fullPath, blob).then(() => {
                            completed++;
                            if (window.modes.debug == true) {
                                console.log(`File: ${file.name} (Type: ${file.type}, Size: ${file.size} bytes)`);
                            }
                            if (completed == total) {
                                getPage(currentPage);
                            }
                            resolve({
                                type: 'update',
                                status: 'ok',
                                name: file.name,
                                path: fullPath,
                                message: '',
                                size: blob.size,
                                blob: blob,
                                completed: completed
                            });
                        });
                    };
                    reader.readAsArrayBuffer(file);
                });
            })
        }

        async function handleDirectory(directoryEntry, path) {
            const reader = directoryEntry.createReader();
            const entries = await new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
            completed++;
            total += entries.length;
            for (const entry of entries) {
                if (entry.isFile) {
                    handleFile(entry, path);
                } else if (entry.isDirectory) {
                    await handleDirectory(entry, path + "/" + entry.name);
                }
            }
        }
    });
}

module.exports = { setupTab };