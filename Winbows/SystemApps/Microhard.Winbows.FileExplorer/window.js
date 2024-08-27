var currentPage = 'C:/';

var groups = {
    0: ['home', 'gallery'],
    1: ['desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos'],
    2: ['this_pc', '[disk]', 'network'],
}

var pages = ['home', 'gallery', 'desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos', 'this_pc', 'network'];

var tabStrip = document.createElement('div');

// Path
var pathStrip = document.createElement('div');
var pathStripActions = document.createElement('div');
var pathStripActionBack = document.createElement('button');
var pathStripActionNext = document.createElement('button');
var pathStripActionUp = document.createElement('button');
var pathStripActionRefresh = document.createElement('button');
var pathStripPath = document.createElement('div');
var pathStripPathText = document.createElement('div');
var pathStripSearch = document.createElement('input');

pathStrip.className = 'explorer-pathstrip';
pathStripActions.className = 'explorer-pathstrip-actions';
pathStripActionBack.className = 'explorer-pathstrip-action back';
pathStripActionNext.className = 'explorer-pathstrip-action next';
pathStripActionUp.className = 'explorer-pathstrip-action up';
pathStripActionRefresh.className = 'explorer-pathstrip-action refresh';
pathStripPath.className = 'explorer-pathstrip-path';
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
pathStripPath.appendChild(pathStripPathText);

var actionbar = document.createElement('div');
var content = document.createElement('div');
var sidebar = document.createElement('div');
var viewerContainer = document.createElement('div');
var viewer = document.createElement('div');

tabStrip.className = 'explorer-tabstrip';
actionbar.className = 'explorer-actionbar';
content.className = 'explorer-content';
sidebar.className = 'explorer-sidebar';
viewerContainer.className = 'explorer-viewer-container';
viewer.className = 'explorer-viewer';

browserWindow.toolbar.replaceChild(tabStrip, browserWindow.toolbar.querySelector('.window-toolbar-info'));
document.body.appendChild(pathStrip);
document.body.appendChild(actionbar);
document.body.appendChild(content);
content.appendChild(sidebar);
content.appendChild(viewerContainer);
viewerContainer.appendChild(viewer);

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

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

async function createFolderItem(details, path) {
    var item = document.createElement('div');
    var itemIcon = document.createElement('div');
    var itemName = document.createElement('div');

    item.className = 'explorer-viewer-item';
    itemIcon.className = 'explorer-viewer-item-icon';
    itemName.className = 'explorer-viewer-item-name';

    itemIcon.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/folders/folder.ico')})`;
    itemName.innerHTML = details.name;

    item.addEventListener('dblclick', async () => {
        currentPage = path;
        viewHistory.splice(currentHistory + 1);
        viewHistory.push(currentPage);
        currentHistory = viewHistory.length - 1;
        getPage(currentPage);
    })

    item.appendChild(itemIcon);
    item.appendChild(itemName);
    return item;
}

async function createFileItem(details, path) {
    var item = document.createElement('div');
    var itemIcon = document.createElement('div');
    var itemName = document.createElement('div');

    item.className = 'explorer-viewer-item';
    itemIcon.className = 'explorer-viewer-item-icon';
    itemName.className = 'explorer-viewer-item-name';

    itemIcon.style.backgroundImage = `url(${await fs.getFileURL(details.type.startsWith('image/') ? 'C:/Winbows/icons/files/image.ico' : 'C:/Winbows/icons/files/generic.ico')})`;
    itemName.innerHTML = details.name;

    item.appendChild(itemIcon);
    item.appendChild(itemName);

    if (details.type.startsWith('image/')) {
        try {
            fs.getFileURL(path).then(url => {
                itemIcon.style.backgroundImage = `url(${url})`;
            })
        } catch (e) {
            console.log('Failed to load image.');
        }
    }
    return item;
}

/*
var backgroundImage = document.createElement('div');
backgroundImage.style.width = '100%';
backgroundImage.style.height = '100%';
backgroundImage.style.backgroundSize = 'cover';
backgroundImage.style.backgroundRepeat = 'no-repeat';
backgroundImage.style.backgroundPosition = 'center';
backgroundImage.style.position = 'absolute';
backgroundImage.style.zIndex = '-1';
backgroundImage.style.backgroundImage = `url(${await fs.getFileURL(window.getBackgroundImage())})`;
document.documentElement.appendChild(backgroundImage)
*/

var tabs = {};

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

var tab = createTab(await getIcon(currentPage), getHeader(currentPage));
var viewHistory = [];
var currentHistory = -1;

async function getPage(page) {
    var pageStatus = await getPageStatus(page);
    if (pageStatus == false) return;

    tab.changeIcon(await getIcon(currentPage));
    tab.changeHeader(getHeader(page));

    viewer.innerHTML = '';
    viewer.classList.remove('animation');

    // TODO : Add path select and input
    pathStripPathText.innerHTML = page;
    update();

    await fs.readdir(page).then(async items => {
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
        for (let i in items) {
            var item = items[i];
            if (item.type == 'directory') {
                viewer.appendChild(await createFolderItem({
                    name: item.path.split('/').slice(-1)
                }, item.path));
            } else {
                console.log(item.mimeType)
                viewer.appendChild(await createFileItem({
                    name: item.path.split('/').slice(-1),
                    type: item.mimeType
                }, item.path));
            }
        }
        viewer.style.animation = "revert-layer";
        viewer.classList.add('animation');
        if (items.length == 0) {
            viewer.innerHTML = 'This folder is empty.';
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
                    currentPage = getPath(item);
                    viewHistory.splice(currentHistory + 1);
                    viewHistory.push(currentPage);
                    currentHistory = viewHistory.length - 1;
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

setSidebar(true);
getPage(currentPage);
viewHistory.push(currentPage);
currentHistory = viewHistory.length - 1;

function createTab(icon, header, active = true) {
    var tab = document.createElement('div');
    var tabInfo = document.createElement('div');
    var tabIcon = document.createElement('div');
    var tabHeader = document.createElement('div');
    var tabClose = document.createElement('div');

    var id = randomID();

    tab.className = 'explorer-tabstrip-tab';
    tabInfo.className = 'explorer-tabstrip-tab-info';
    tabIcon.className = 'explorer-tabstrip-tab-icon';
    tabHeader.className = 'explorer-tabstrip-tab-header';
    tabClose.className = 'explorer-tabstrip-tab-close';

    tabIcon.style.backgroundImage = `url(${icon})`;
    tabHeader.innerHTML = header;

    if (active == true) {
        tabStrip.querySelectorAll('.active').forEach(tab => {
            tab.classList.remove('active');
        })
        tab.classList.add('active');
    }

    tabClose.addEventListener('click', () => {
        close();
    })

    tab.appendChild(tabInfo);
    tab.appendChild(tabClose);
    tabInfo.appendChild(tabIcon);
    tabInfo.appendChild(tabHeader);
    tabStrip.appendChild(tab);

    function close() {
        tab.remove();
        delete tabs[id];
        if (Object.keys(tabs).length == 0) {
            process.exit();
        }
    }

    function changeIcon(icon) {
        tabIcon.style.backgroundImage = `url(${icon})`;
    }

    function changeHeader(header) {
        tabHeader.innerHTML = header;
    }

    tabs[id] = { changeHeader, changeIcon, close, tab };

    return { changeHeader, changeIcon, close, tab };
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
    viewHistory.splice(currentHistory + 1);
    viewHistory.push(currentPage);
    currentHistory = viewHistory.length - 1;
    getPage(currentPage);
})

pathStripActionRefresh.addEventListener('click', () => {
    getPage(currentPage);
})

function update() {
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
    if (currentPage.split('/').slice(-1) != '') {
        pathStripActionUp.disabled = false;
    } else {
        pathStripActionUp.disabled = true;
    }
}