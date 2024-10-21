var groups = {
    0: ['home', 'gallery'],
    1: ['desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos'],
    2: ['this_pc', 'network'],
}

var pages = ['home', 'gallery', 'desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos', 'this_pc', 'network'];

//browserWindow.container.style.left = '0px';
//browserWindow.container.style.top = '0px';

//browserWindow.toolbar.replaceChild(tabStrip, browserWindow.toolbar.querySelector('.window-toolbar-info'));
//tabStrip.appendChild(tabStripTabs);
//tabStrip.appendChild(tabStripCreate);
//tabStripCreate.appendChild(tabStripCreateButton);

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./chooseFileWindow.css'));
document.head.appendChild(style);

document.documentElement.classList.add('winui');

async function getIcon(page) {
    switch (page) {
        case 'home':
            return await fs.getFileURL(utils.resolvePath('./icons/home.ico'));
        case 'gallery':
            return await fs.getFileURL(utils.resolvePath('./icons/gallery.ico'));
        case 'C:/Users/Admin/Desktop':
        case 'desktop':
            return await fs.getFileURL(utils.resolvePath('./icons/desktop.ico'));
        case 'C:/Users/Admin/Downloads':
        case 'donwloads':
            return await fs.getFileURL(utils.resolvePath('./icons/downloads.ico'));
        case 'C:/Users/Admin/Documents':
        case 'documents':
            return await fs.getFileURL(utils.resolvePath('./icons/documents.ico'));
        case 'C:/Users/Admin/Pictures':
        case 'pictures':
            return await fs.getFileURL(utils.resolvePath('./icons/pictures.ico'));
        case 'C:/Users/Admin/Music':
        case 'music':
            return await fs.getFileURL(utils.resolvePath('./icons/music.ico'));
        case 'C:/Users/Admin/Videos':
        case 'videos':
            return await fs.getFileURL(utils.resolvePath('./icons/videos.ico'));
        case 'this_pc':
            return await fs.getFileURL(utils.resolvePath('./icons/monitor.ico'));
        case 'network':
            return await fs.getFileURL(utils.resolvePath('./icons/network.ico'));
        default:
            return await fs.getFileURL(utils.resolvePath('./icons/folder.ico'));
    }
}

function getHeader(page) {
    switch (page) {
        case 'home':
            return 'Home';
        case 'gallery':
            return 'Gallery';
        case 'desktop':
        case 'C:/Users/Admin/Desktop':
            return 'Desktop';
        case 'C:/Users/Admin/Downloads':
        case 'donwloads':
            return 'Downloads';
        case 'C:/Users/Admin/Documents':
        case 'documents':
            return 'Documents';
        case 'C:/Users/Admin/Pictures':
        case 'pictures':
            return 'Pictures';
        case 'C:/Users/Admin/Music':
        case 'music':
            return 'Music';
        case 'C:/Users/Admin/Videos':
        case 'videos':
            return 'Videos';
        case 'this_pc':
            return 'This PC';
        case 'network':
            return 'Network';
        default:
            return page.split('/').slice(-1) == '' ? page : page.split('/').slice(-1);
    }
}

function getPath(page) {
    switch (page) {
        case 'home':
            return null;
        case 'gallery':
            return null;
        case 'desktop':
            return 'C:/Users/Admin/Desktop';
        case 'donwloads':
            return 'C:/Users/Admin/Downloads';
        case 'documents':
            return 'C:/Users/Admin/Documents';
        case 'pictures':
            return 'C:/Users/Admin/Pictures';
        case 'music':
            return 'C:/Users/Admin/Music';
        case 'videos':
            return 'C:/Users/Admin/Videos';
        case 'this_pc':
            return null;
        case 'network':
            return null;
        default:
            return page;
    }
}

async function getPageStatus(page) {
    if (pages.includes(page)) {
        return 'pages';
    }
    var status = await fs.exists(page);
    console.log(status)
    return status.exists == true ? 'dir' : false;
}

function pageToPath(page) {
    return pages.includes(page) ? getPath(page) : page;
}

function randomID() {
    var patterns = '0123456789abcdef';
    var id = '_';
    for (var i = 0; i < 6; i++) {
        id += patterns.charAt(Math.floor(Math.random() * patterns.length));
    }
    if (tabs[id]) {
        return randomID();
    }
    return id;
}

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
var footerButtonGroup = document.createElement('div');
var footerButtonCancel = document.createElement('button');
var footerButtonConfirm = document.createElement('button');

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
footerButtonGroup.className = 'explorer-footer-button-group';
footerButtonCancel.className = 'explorer-footer-button cancel';
footerButtonConfirm.className = 'explorer-footer-button confirm';

footerButtonCancel.innerHTML = 'Cancel';
footerButtonConfirm.innerHTML = 'Confirm';

document.body.appendChild(pathStrip);
document.body.appendChild(content);
document.body.appendChild(footer);
content.appendChild(sidebar);
content.appendChild(viewerContainer);
viewerContainer.appendChild(viewer);
footer.appendChild(footerButtonGroup);
footerButtonGroup.appendChild(footerButtonCancel);
footerButtonGroup.appendChild(footerButtonConfirm);

footerButtonCancel.addEventListener('click', (e) => {
    browserWindow.worker.postMessage({
        type: 'cancel',
        token: TOKEN,
        items: []
    })
})

var actionButtons = {};
var viewHistory = [];
var currentHistory = -1;
var currentPage = datas.page || 'C:/';

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

    console.log(currentPage, target)

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
                        console.log(`File: ${file.name} (Type: ${file.type}, Size: ${file.size} bytes)`);
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
                selected.push(item.path);
                item.setIsSelected(true);
            } else if (position.x >= rectX && position.y >= rectY && position.x + itemWidth <= pointerX && position.y + itemHeight <= pointerY) {
                // Rect in Selection
                item.item.classList.add('active');
                selected.push(item.path);
                item.setIsSelected(true);
            } else if (!(position.x + itemWidth < rectX ||
                position.x > rectX + rectWidth ||
                position.y + itemHeight < rectY ||
                position.y > rectY + rectHeight)) {
                // Overlap
                item.item.classList.add('active');
                selected.push(item.path);
                item.setIsSelected(true);
            } else {
                item.item.classList.remove('active');
                item.setIsSelected(false);
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
    var isSelected = false;

    item.className = 'explorer-viewer-item';
    itemIcon.className = 'explorer-viewer-item-icon';
    itemName.className = 'explorer-viewer-item-name';

    fs.getFileURL('C:/Winbows/icons/folders/folder.ico').then(url => {
        itemIcon.style.backgroundImage = `url(${url})`;
    })
    itemName.innerHTML = details.name;

    // var hasMouse = matchMedia('(pointer:fine)').matches;

    item.addEventListener('click', async () => {
        if (isSelected == false) {
            isSelected = true;
            item.classList.add('active');
            if (!selected.includes(path)) {
                selected.push(path);
            }
            return;
        }
        item.classList.remove('active');
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

    function setIsSelected(value) {
        isSelected = value;
        item.classList.toggle('active', value);
    }

    createdItems.push({
        item, path, type: 'folder', details, setIsSelected
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
    var isSelected = false;

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
                if (isSelected == false) {
                    isSelected = true;
                    item.classList.add('active');
                    if (!selected.includes(path)) {
                        selected.push(path);
                    }
                    return;
                }
                item.classList.remove('active');
                selected = selected.filter(p => p != path);
                //window.System.Shell(link.command);
            })
        })
        fs.getFileURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
            itemIcon.style.setProperty('--shortcut-icon', `url(${url})`);
        })
    } else {
        fs.getFileURL(details.type == 'application/winbows-link' ? '' : window.fileIcons.getIcon(path)).then(url => {
            itemIcon.style.backgroundImage = `url(${url})`;
            if (details.type.startsWith('image/')) {
                try {
                    fs.getFileURL(path).then(url => {
                        itemIcon.style.backgroundImage = `url(${url})`;
                    })
                } catch (e) {
                    console.log('Failed to load image.');
                }
            }
        })
        itemName.innerHTML = details.name;
        item.addEventListener('click', () => {
            if (isSelected == false) {
                isSelected = true;
                item.classList.add('active');
                if (!selected.includes(path)) {
                    selected.push(path);
                }
                return;
            }
            item.classList.remove('active');
            selected = selected.filter(p => p != path);
            isSelected = false;
            /*
            var defaultViewer = window.System.FileViewers.getDefaultViewer(path);
            if (defaultViewer != null) {
                new Process(defaultViewer.script).start(`const FILE_PATH="${path}";`);
            } else {
                console.log(utils.resolvePath('./chooseViewer.js'))
                new Process(utils.resolvePath('./chooseViewer.js')).start(`const FILE_PATH="${path}";`);
            }*/
        })
    }

    function setIsSelected(value) {
        isSelected = value;
        item.classList.toggle('active', value);
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
                        console.log(utils.resolvePath('./chooseViewer.js'))
                        new Process(utils.resolvePath('./chooseViewer.js')).start(`const FILE_PATH="${path}";`);
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
                        console.error('Failed to load font', error);
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
        item, path, type: 'file', details, setIsSelected
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

async function getPage(page) {
    var pageStatus = await getPageStatus(page);
    if (pageStatus == false) return;

    var targetID = randomID();
    currentID = targetID;

    selected = [];
    createdItems = [];
    viewer.innerHTML = '';
    viewer.classList.remove('animation');

    // TODO : Add path select and input
    pathStripPathText.innerHTML = pageToPath(page);
    update();

    if (pageStatus == null) return;

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

            fs.getFileURL('C:/Winbows/icons/devices/drives/Windows 11 Drive Unlocked.ico').then(url => {
                iconElement.style.backgroundImage = `url(${url})`;
            })

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
                console.log(item.mimeType)
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
        Object.values(groups).forEach(items => {
            var group = document.createElement('div');
            group.className = 'explorer-sidebar-group';
            sidebar.appendChild(group);
            items.forEach(async item => {
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
                    currentPage = getPath(item) || item;
                    addToHistory(currentPage);
                    getPage(currentPage);
                    itemElement.classList.add('active');
                })
                group.appendChild(itemElement);
                itemElement.appendChild(itemIcon);
                itemElement.appendChild(itemHeader);
                itemIcon.style.backgroundImage = `url(${await getIcon(item)})`;
                itemHeader.innerHTML = getHeader(item);
            })
        })
    }
}

footerButtonConfirm.addEventListener('click', (e) => {
    browserWindow.worker.postMessage({
        type: 'confirm',
        token: TOKEN,
        items: selected
    })
})

function addToHistory(page) {
    console.log(currentPage, page)
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
    var folders = pageToPath(currentPage).split('/');
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
        if (pageToPath(currentPage).split('/').slice(-1) != '' && pageToPath(currentPage) != '' || currentPage == '') {
            pathStripActionUp.disabled = false;
        } else {
            pathStripActionUp.disabled = true;
        }
    } catch (e) { };
}

// setSidebar(true);
getPage(currentPage);
addToHistory(currentPage);
focus();