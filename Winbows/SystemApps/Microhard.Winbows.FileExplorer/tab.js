import { fs } from 'winbows/fs';

// "null" refers to the group separator
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
        path: 'C:/Users/Admin/Desktop',
        icon: './icons/desktop.ico'
    }, {
        title: 'Downloads',
        path: 'C:/Users/Admin/Downloads',
        icon: './icons/downloads.ico'
    }, {
        title: 'Documents',
        path: 'C:/Users/Admin/Documents',
        icon: './icons/documents.ico'
    }, {
        title: 'Pictures',
        path: 'C:/Users/Admin/Pictures',
        icon: './icons/pictures.ico'
    }, {
        title: 'Music',
        path: 'C:/Users/Admin/Music',
        icon: './icons/music.ico'
    }, {
        title: 'Videos',
        path: 'C:/Users/Admin/Videos',
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
const pages = Array.from(pageDatas, p => {
    if (p != null) {
        return p.path;
    }
})

async function getImageURL(image) {
    if (caches[image]) {
        return caches[image]
    } else {
        var url = await fs.getFileURL(image);
        caches[image] = url;
        return url;
    }
}

async function getData(page) {
    for (let i in pageDatas) {
        var item = pageDatas[i];
        if (item != null && item.path == page) {
            return {
                title: item.title,
                icon: await getImageURL(item.icon)
            }
        }
    }
    return {
        title: page.split('/').slice(-1) == '' ? page : page.split('/').slice(-1),
        icon: await getImageURL('C:/Winbows/icons/folders/folder.ico')
    }
}

export async function setupTab(browserWindow, tab, page = 'pages://home') {
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

    var actionbar = document.createElement('div');
    var actionbarCreate = document.createElement('div');
    var actionbarCreateButton = document.createElement('button');
    var actionbarQuickActions = document.createElement('div');
    var content = document.createElement('div');
    var sidebar = document.createElement('div');
    var viewerContainer = document.createElement('div');
    var viewer = document.createElement('div');
    var footer = document.createElement('div');
    var footerLeft = document.createElement('div');
    var footerRight = document.createElement('div');
    var footerPageItems = document.createElement('div');
    var footerPageSize = document.createElement('div');
    var footerSelectedItems = document.createElement('div');

    actionbar.className = 'explorer-actionbar';
    actionbarCreate.className = 'explorer-actionbar-group';
    actionbarCreateButton.className = 'explorer-actionbar-button create';
    actionbarQuickActions.className = 'explorer-actionbar-group';
    content.className = 'explorer-content';
    sidebar.className = 'explorer-sidebar';
    viewerContainer.className = 'explorer-viewer-container';
    viewer.className = 'explorer-viewer';
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
    actionbarCreate.appendChild(actionbarCreateButton);
    tab.tabviewItem.appendChild(content);
    tab.tabviewItem.appendChild(footer);
    content.appendChild(sidebar);
    content.appendChild(viewerContainer);
    viewerContainer.appendChild(viewer);
    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);
    footerLeft.appendChild(footerPageItems);
    footerLeft.appendChild(footerPageSize);
    footerLeft.appendChild(footerSelectedItems);

    var actionButtons = {};
    var viewHistory = [];
    var currentHistory = -1;
    var currentPage = page || 'this_pc';

    getData(currentPage).then(pageData => {
        tab.changeHeader(pageData.title);
        tab.changeIcon(pageData.icon);
    });
    getPage(currentPage);
    addToHistory(currentPage);
    setSidebar(true);

    const module = await browserWindow.import('./_router.js');
    const router = module.router;
    var pageContents = {};
    router.on('change', async (e) => {
        console.log('change', e.path, 'from', tab.id);
        const path = e.path.includes('?') ? e.path.slice(e.path.indexOf('?')) : e.path;
        //const pageItem = Object.values(pageListItems).filter(item => item.path === path);
        //if (pageItem.length == 0) return;
        if (path == '/') {
            return router.replace('pages://');
        }

        let pageContent = pageContents[path];
        if (!pageContents[path]) {
            if (path.startsWith('pages://')) {
                try {
                    const module = await browserWindow.import(`./pages/` + path.replace('pages://', '') + '.js');
                    pageContents[path] = module.default();
                    pageContent = pageContents[path] || document.createElement('div');
                } catch (e) {
                    console.log(e);
                    var el = document.createElement('div');
                    el.innerHTML = 'Not found!';
                    pageContent = el;
                    /*
                    if (path != '/404') {
                        return router.replace('/_404');
                    } else {
                        var el = document.createElement('div');
                        el.innerHTML = 'Not found!';
                        page = el;
                    }
                        */
                }
                if (router.getCurrentRoute() != path) {
                    return;
                }
            }
        }
        console.log(pageContent)
        viewerContainer.replaceChildren([...pageContent]);
    })

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
        var target = getPath(currentPage);

        if (target == '') return;
        if (!target.endsWith('/')) {
            target += '/';
        }

        if (window.debuggerMode == true) {
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
                            if (window.debuggerMode == true) {
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
        const canvas = document.createElement('canvas');
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
                var position = window.utils.getPosition(item.item);
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
            window.utils.canvasClarifier(canvas, ctx);
        }

        function render() {
            window.utils.canvasClarifier(canvas, ctx);

            if (selecting == false) return;

            var position = window.utils.getPosition(canvas);

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

        viewer.addEventListener('scroll', render);

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
                        fs.rm(item.path).then(() => {
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

    async function createFolderItem(details, path) {
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
            currentPage = path;
            addToHistory(currentPage);
            getPage(currentPage);
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
                        fs.rm(path).then(() => {
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
        viewer.appendChild(item);
        return item;
    }

    async function createFileItem(details, path) {
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');
        var fontExtensions = ['ttf', 'otf', 'woff', 'woff2', 'eot'];

        item.className = 'explorer-viewer-item';
        itemIcon.className = 'explorer-viewer-item-icon';
        itemName.className = 'explorer-viewer-item-name';

        if (details.type == 'application/winbows-link') {
            fs.readFile(path).then(async result => {
                const file = await result.text();
                const link = JSON.parse(file);
                itemIcon.style.backgroundImage = `url(${link.icon})`;
                itemIcon.classList.add('shortcut');
                itemName.innerHTML = link.name;
                item.addEventListener('click', (e) => {
                    window.System.Shell(link.command);
                })
            })
            getImageURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                itemIcon.style.setProperty('--shortcut-icon', `url(${url})`);
            })
        } else {
            getImageURL(details.type == 'application/winbows-link' ? '' : window.fileIcons.getIcon(path)).then(url => {
                itemIcon.style.backgroundImage = `url(${url})`;
                if (details.type.startsWith('image/')) {
                    try {
                        getImageURL(path).then(url => {
                            itemIcon.style.backgroundImage = `url(${url})`;
                        })
                    } catch (e) {
                        if (window.debuggerMode == true) {
                            console.log('Failed to load image.');
                        }
                    }
                }
            })
            itemName.innerHTML = details.name;
            item.addEventListener('click', () => {
                var defaultViewer = window.System.FileViewers.getDefaultViewer(path);
                if (defaultViewer != null) {
                    new Process(defaultViewer.script).start(`const FILE_PATH="${path}";`);
                } else {
                    if (window.debuggerMode == true) {
                        console.log('./chooseViewer.js')
                    }
                    new Process('./chooseViewer.js').start(`const FILE_PATH="${path}";`);
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
                        var defaultViewer = window.System.FileViewers.getDefaultViewer(path);
                        if (defaultViewer != null) {
                            new Process(defaultViewer.script).start(`const FILE_PATH="${path}";`);
                        } else {
                            if (window.debuggerMode == true) {
                                console.log('./chooseViewer.js')
                            }
                            new Process('./chooseViewer.js').start(`const FILE_PATH="${path}";`);
                        }
                    }
                }, {
                    icon: "open-with",
                    className: "open-with",
                    text: "Open with...",
                    action: () => {
                        new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js').start(`const FILE_PATH="${path}";`);
                    }
                }, {
                    icon: "delete",
                    className: "delete",
                    text: "Delete",
                    action: () => {
                        fs.rm(path).then(() => {
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
                        await window.setBackgroundImage(path);
                    }
                })
            } else if (details.type.search('javascript') > -1) {
                items.push({
                    className: "run-as-an-app",
                    icon: 'window-snipping',
                    text: "Run as an application",
                    action: async () => {
                        new Process(path).start();
                    }
                })
            } else if (window.utils.getFileExtension(path) == 'wbsf') {
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
            } else if (fontExtensions.includes(window.utils.getFileExtension(path))) {
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
                            if (window.debuggerMode == true) {
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
        viewer.appendChild(item);
    }

    function randomID() {
        var patterns = '0123456789abcdef';
        var id = '_0x';
        for (var i = 0; i < 12; i++) {
            id += patterns.charAt(Math.floor(Math.random() * patterns.length));
        }
        return id;
    }

    var currentID = null;

    async function getSize(path) {
        var items = await fs.readdir(path, true);
        var size = 0;
        items.forEach(item => {
            size += item.size;
        })
        return size;
    }

    async function getPageStatus(page) {
        if (pages.includes(page)) {
            return 'pages';
        }
        var status = await fs.exists(page);
        if (window.debuggerMode == true) {
            console.log(status)
        }
        return status.exists == true ? 'dir' : false;
    }


    async function getPage(page) {
        var pageStatus = await getPageStatus(page);
        if (pageStatus == false) {
            viewer.innerHTML = '';
            viewer.classList.remove('animation');
            viewer.style.animation = "revert-layer";
            viewer.classList.add('animation');
            viewer.innerHTML = '<span style="width:100%;text-align:center;color:var(--label-color);">This folder can not be found.</span>';
            return
        }

        var targetID = randomID();
        var pageData = await getData(currentPage);
        currentID = targetID;

        tab.changeHeader(pageData.title);
        tab.changeIcon(pageData.icon);

        createdItems = [];
        viewer.innerHTML = '';
        viewer.classList.remove('animation');

        // TODO : Add path select and input
        pathStripPathText.innerHTML = page;
        update();

        if (pageStatus == null) return;

        if (page.startsWith('pages://')) {
            return;
        }

        footerPageItems.innerHTML = 'Loading...';
        footerPageSize.innerHTML = '';

        if (page == 'this_pc') {
            const quota = await navigator.storage.estimate();
            footerPageItems.innerHTML = `${fs.disks.length} Items`;
            for (var i = 0; i < fs.disks.length; i++) {
                var disk = fs.disks[i];
                var items = await fs.readdir(disk + ':/', true);
                var itemElement = document.createElement('div');
                var iconElement = document.createElement('div');
                var infoElement = document.createElement('div');
                var diskName = document.createElement('div');
                var totalSizeBar = document.createElement('div');
                var usedSizeBar = document.createElement('div');
                var usedSizeText = document.createElement('div');

                itemElement.className = 'explorer-viewer-disk-item';
                iconElement.className = 'explorer-viewer-disk-icon';
                infoElement.className = 'explorer-viewer-disk-info';
                diskName.className = 'explorer-viewer-disk-name';
                totalSizeBar.className = 'explorer-viewer-disk-total-bar';
                usedSizeBar.className = 'explorer-viewer-disk-used-bar';
                usedSizeText.className = 'explorer-viewer-disk-used-text';

                iconElement.style.backgroundImage = `url(${icons.drive})`;

                diskName.innerHTML = disk.toUpperCase() + ':';

                viewer.appendChild(itemElement);
                itemElement.appendChild(iconElement);
                itemElement.appendChild(infoElement);
                infoElement.appendChild(diskName);
                infoElement.appendChild(totalSizeBar);
                totalSizeBar.appendChild(usedSizeBar);
                infoElement.appendChild(usedSizeText);

                itemElement.addEventListener('click', () => {
                    addToHistory(disk + ':/');
                    getPage(currentPage);
                })

                var size = 0;
                items.forEach(item => {
                    size += item.size;
                    usedSizeBar.style.width = size / quota.quota * 100 + '%';
                    usedSizeText.innerHTML = `${window.utils.formatBytes(size)} / ${window.utils.formatBytes(quota.quota)}`;
                })

                footerPageSize.innerHTML = window.utils.formatBytes(size);
            }
            viewer.style.animation = "revert-layer";
            viewer.classList.add('animation');
            return;
        }

        await fs.readdir(page).then(async items => {
            if (targetID != currentID) return;
            viewer.innerHTML = '';
            var dirs = [];
            var files = [];

            items.forEach(item => {
                if (item.type == 'directory') {
                    dirs.push(item);
                } else {
                    files.push(item);
                }
            })
            var items = dirs.sort((a, b) => {
                try {
                    return a.path.toUpperCase().localeCompare(b.path.toUpperCase());
                } catch (e) { };
            }).concat(files.sort((a, b) => {
                try {
                    return a.path.toUpperCase().localeCompare(b.path.toUpperCase());
                } catch (e) { };
            }))
            footerPageItems.innerHTML = `${items.length} Items`;
            getSize(currentPage).then(size => {
                footerPageSize.innerHTML = window.utils.formatBytes(size);
            })

            for (let i in items) {
                var item = items[i];
                if (item.type == 'directory') {
                    await createFolderItem({
                        name: item.path.split('/').slice(-1)
                    }, item.path)
                } else {
                    if (window.debuggerMode == true) {
                        console.log(item.mimeType)
                    }
                    await createFileItem({
                        name: item.path.split('/').slice(-1),
                        type: item.mimeType
                    }, item.path)
                }
            }
            viewer.style.animation = "revert-layer";
            viewer.classList.add('animation');
            if (items.length == 0) {
                viewer.innerHTML = '<span style="width:100%;text-align:center;color:var(--label-color);">This folder is empty.</span>';
            }
        });
        return
    }

    function setSidebar(initialize = false) {
        if (initialize) {
            var group = document.createElement('div');
            group.className = 'explorer-sidebar-group';
            pageDatas.forEach(async item => {
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
                        currentPage = item.path;
                        router.push(currentPage);
                        addToHistory(currentPage);
                        getPage(currentPage);
                        itemElement.classList.add('active');
                    })
                    group.appendChild(itemElement);
                    itemElement.appendChild(itemIcon);
                    itemElement.appendChild(itemHeader);
                    getImageURL(item.icon).then(url => {
                        itemIcon.style.backgroundImage = `url(${url})`;
                    })
                    itemHeader.innerHTML = item.title;
                }
            })
            if (group.innerHTML != '') {
                sidebar.appendChild(group);
            }
        }
    }

    function addToHistory(page) {
        if (window.debuggerMode == true) {
            console.log(currentPage, page)
        }
        if (page != viewHistory[viewHistory.length - 1] || page != currentPage) {
            viewHistory.splice(currentHistory + 1);
            viewHistory.push(page);
            currentHistory = viewHistory.length - 1;
            currentPage = page;

            pathStripActionNext.disabled = false;
            pathStripActionBack.disabled = true;
        }
    }

    pathStripActionBack.disabled = true;
    pathStripActionNext.disabled = true;
    pathStripActionUp.disabled = true;

    pathStripActionBack.addEventListener('click', () => {
        if (currentHistory > 0) {
            currentHistory--;
            currentPage = viewHistory[currentHistory];
            getPage(currentPage);
            pathStripActionNext.disabled = false;
            if (currentHistory == 0) {
                pathStripActionBack.disabled = true;
            }
        } else {
            return;
        }
    })

    pathStripActionNext.addEventListener('click', () => {
        if (currentHistory < viewHistory.length - 1) {
            currentHistory++;
            currentPage = viewHistory[currentHistory];
            getPage(currentPage);
            pathStripActionBack.disabled = false;
            if (currentHistory == viewHistory.length - 1) {
                pathStripActionNext.disabled = true;
            }
        } else {
            return;
        }
    })

    pathStripActionUp.addEventListener('click', () => {
        var folders = currentPage.split('/');
        if (folders.length > 2) {
            currentPage = folders.slice(0, folders.length - 1).join('/');
        } else {
            currentPage = folders[0] + '/';
        }
        addToHistory(currentPage);
        getPage(currentPage);
    })

    pathStripActionRefresh.addEventListener('click', () => {
        getPage(currentPage);
    })

    function update() {
        try {
            if (currentHistory < viewHistory.length - 1) {
                pathStripActionNext.disabled = false;
            } else {
                pathStripActionNext.disabled = true;
            }
            if (currentHistory > 0) {
                pathStripActionBack.disabled = false;
            } else {
                pathStripActionBack.disabled = true;
            }
            if (currentPage.split('/').slice(-1) != '' && currentPage != '' || currentPage == '') {
                pathStripActionUp.disabled = false;
            } else {
                pathStripActionUp.disabled = true;
            }
        } catch (e) { };
    }
}