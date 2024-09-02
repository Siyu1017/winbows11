var groups = {
    0: ['home', 'gallery'],
    1: ['desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos'],
    2: ['this_pc', 'network'],
}

var pages = ['home', 'gallery', 'desktop', 'donwloads', 'documents', 'pictures', 'music', 'videos', 'this_pc', 'network'];

var actionbarButtonIcons = {
    copy: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.75 2C9.95507 2 8.5 3.45508 8.5 5.25V23.25C8.5 25.0449 9.95507 26.5 11.75 26.5H23.75C25.5449 26.5 27 25.0449 27 23.25V5.25C27 3.45507 25.5449 2 23.75 2H11.75ZM10.5 5.25C10.5 4.55964 11.0596 4 11.75 4H23.75C24.4404 4 25 4.55964 25 5.25V23.25C25 23.9404 24.4404 24.5 23.75 24.5H11.75C11.0596 24.5 10.5 23.9404 10.5 23.25V5.25ZM7 5.74902C5.82552 6.2388 5 7.39797 5 8.74994V23.4999C5 27.0898 7.91015 29.9999 11.5 29.9999H20.25C21.6021 29.9999 22.7613 29.1743 23.2511 27.9996H20.2786C20.2691 27.9998 20.2596 27.9999 20.25 27.9999H11.5C9.01472 27.9999 7 25.9852 7 23.4999V5.74902Z"/></svg>',
    cut: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1409 9.3415L12.14 9.34286L7.37017 2.3284C7.13725 1.98587 6.67077 1.89702 6.32824 2.12994C5.98572 2.36286 5.89687 2.82934 6.12978 3.17187L11.2606 10.7171L8.86478 14.4605C8.30797 14.1665 7.67342 14.0001 7 14.0001C4.79086 14.0001 3 15.791 3 18.0001C3 20.2093 4.79086 22.0001 7 22.0001C9.20914 22.0001 11 20.2093 11 18.0001C11 17.0089 10.6395 16.1019 10.0424 15.4031L12.178 12.0662L14.2426 15.1024C13.4771 15.831 13 16.8599 13 18.0001C13 20.2093 14.7909 22.0001 17 22.0001C19.2091 22.0001 21 20.2093 21 18.0001C21 15.791 19.2091 14.0001 17 14.0001C16.471 14.0001 15.9659 14.1028 15.5037 14.2894L13.0575 10.692L13.0588 10.69L12.1409 9.3415ZM4.5 18.0001C4.5 16.6194 5.61929 15.5001 7 15.5001C8.38071 15.5001 9.5 16.6194 9.5 18.0001C9.5 19.3808 8.38071 20.5001 7 20.5001C5.61929 20.5001 4.5 19.3808 4.5 18.0001ZM14.5 18.0001C14.5 16.6194 15.6193 15.5001 17 15.5001C18.3807 15.5001 19.5 16.6194 19.5 18.0001C19.5 19.3808 18.3807 20.5001 17 20.5001C15.6193 20.5001 14.5 19.3808 14.5 18.0001ZM13.9381 9.31607L17.8815 3.15438C18.1048 2.8055 18.003 2.34167 17.6541 2.11839C17.3053 1.89511 16.8414 1.99692 16.6181 2.3458L13.0202 7.96756L13.9381 9.31607Z"/></svg>',
    delete: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10.5V11H28V10.5C28 8.29086 26.2091 6.5 24 6.5C21.7909 6.5 20 8.29086 20 10.5ZM17.5 11V10.5C17.5 6.91015 20.4101 4 24 4C27.5899 4 30.5 6.91015 30.5 10.5V11H41.75C42.4404 11 43 11.5596 43 12.25C43 12.9404 42.4404 13.5 41.75 13.5H38.8325L36.8329 37.3556C36.518 41.1117 33.3775 44 29.6082 44H18.3923C14.623 44 11.4825 41.1118 11.1676 37.3557L9.16749 13.5H6.25C5.55964 13.5 5 12.9404 5 12.25C5 11.5596 5.55964 11 6.25 11H17.5ZM13.6589 37.1469C13.8652 39.6077 15.9228 41.5 18.3923 41.5H29.6082C32.0777 41.5 34.1353 39.6077 34.3416 37.1468L36.3238 13.5H11.6763L13.6589 37.1469ZM21.5 20.25C21.5 19.5596 20.9404 19 20.25 19C19.5596 19 19 19.5596 19 20.25V34.75C19 35.4404 19.5596 36 20.25 36C20.9404 36 21.5 35.4404 21.5 34.75V20.25ZM27.75 19C28.4404 19 29 19.5596 29 20.25V34.75C29 35.4404 28.4404 36 27.75 36C27.0596 36 26.5 35.4404 26.5 34.75V20.25C26.5 19.5596 27.0596 19 27.75 19Z"/></svg>',
    paste: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 6H9.17071C9.58254 7.16519 10.6938 8 12 8H18C19.3062 8 20.4175 7.16519 20.8293 6H22.5C23.3284 6 24 6.67157 24 7.5C24 8.05228 24.4477 8.5 25 8.5C25.5523 8.5 26 8.05228 26 7.5C26 5.567 24.433 4 22.5 4H20.8293C20.4175 2.83481 19.3062 2 18 2H12C10.6938 2 9.58254 2.83481 9.17071 4H7.5C5.567 4 4 5.567 4 7.5V26.5C4 28.433 5.567 30 7.5 30H12C12.5523 30 13 29.5523 13 29C13 28.4477 12.5523 28 12 28H7.5C6.67157 28 6 27.3284 6 26.5V7.5C6 6.67157 6.67157 6 7.5 6ZM12 4H18C18.5523 4 19 4.44772 19 5C19 5.55228 18.5523 6 18 6H12C11.4477 6 11 5.55228 11 5C11 4.44772 11.4477 4 12 4ZM17.5 10C15.567 10 14 11.567 14 13.5V26.5C14 28.433 15.567 30 17.5 30H25.5C27.433 30 29 28.433 29 26.5V13.5C29 11.567 27.433 10 25.5 10H17.5ZM16 13.5C16 12.6716 16.6716 12 17.5 12H25.5C26.3284 12 27 12.6716 27 13.5V26.5C27 27.3284 26.3284 28 25.5 28H17.5C16.6716 28 16 27.3284 16 26.5V13.5Z"/></svg>',
    rename: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.75 2C11.3358 2 11 2.33579 11 2.75C11 3.16421 11.3358 3.5 11.75 3.5H13.25V24.5H11.75C11.3358 24.5 11 24.8358 11 25.25C11 25.6642 11.3358 26 11.75 26H16.25C16.6642 26 17 25.6642 17 25.25C17 24.8358 16.6642 24.5 16.25 24.5H14.75V3.5H16.25C16.6642 3.5 17 3.16421 17 2.75C17 2.33579 16.6642 2 16.25 2H11.75ZM6.25 6.01958H12.25V7.51958H6.25C5.2835 7.51958 4.5 8.30308 4.5 9.26958V18.7696C4.5 19.7361 5.2835 20.5196 6.25 20.5196H12.25V22.0196H6.25C4.45507 22.0196 3 20.5645 3 18.7696V9.26958C3 7.47465 4.45507 6.01958 6.25 6.01958ZM21.75 20.5196H15.75V22.0196H21.75C23.5449 22.0196 25 20.5645 25 18.7696V9.26958C25 7.47465 23.5449 6.01958 21.75 6.01958H15.75V7.51958H21.75C22.7165 7.51958 23.5 8.30308 23.5 9.26958V18.7696C23.5 19.7361 22.7165 20.5196 21.75 20.5196Z"/></svg>',
    share: '<svg class="explorer-actionbar-button-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.605 6.83811C31.2415 6.49733 30.7103 6.40497 30.2531 6.60304C29.7959 6.80111 29.5 7.25178 29.5 7.75003V13.2223C29.1425 13.2305 28.7251 13.2514 28.26 13.2944C26.725 13.4362 24.6437 13.8204 22.4841 14.799C18.0824 16.7935 13.5579 21.1728 12.5081 30.3581C12.4493 30.8729 12.7141 31.3706 13.174 31.6094C13.6338 31.8482 14.1932 31.7785 14.5805 31.4343C18.9164 27.5801 22.9778 25.9209 25.9168 25.2155C27.3897 24.862 28.5872 24.7466 29.4032 24.718C29.4361 24.7169 29.4684 24.7158 29.5 24.715V30.25C29.5 30.7483 29.7959 31.1989 30.2531 31.397C30.7103 31.5951 31.2415 31.5027 31.605 31.162L43.605 19.9119C43.857 19.6756 44 19.3455 44 19C44 18.6545 43.857 18.3244 43.605 18.0881L31.605 6.83811ZM30.606 15.7422L30.6257 15.7438L30.6285 15.7441L30.6269 15.7439C30.9779 15.7787 31.3272 15.6635 31.5888 15.4268C31.8506 15.1899 32 14.8532 32 14.5V10.6353L40.9224 19L32 27.3647V23.5C32 22.8696 31.5462 22.34 30.9051 22.2597L30.9036 22.2595L30.902 22.2593L30.8982 22.2588L30.8883 22.2577L30.8597 22.2545C30.8368 22.252 30.8062 22.249 30.768 22.2456C30.6917 22.2389 30.5853 22.2309 30.4506 22.2242C30.1812 22.2109 29.7982 22.2026 29.3156 22.2195C28.3503 22.2534 26.9854 22.3881 25.3333 22.7845C22.6531 23.4278 19.2341 24.7565 15.5547 27.4384C17.0405 21.3588 20.4181 18.4798 23.5159 17.0761C25.3563 16.2422 27.15 15.9076 28.49 15.7838C29.1577 15.7221 29.7057 15.7134 30.081 15.7196C30.2684 15.7227 30.412 15.7295 30.5052 15.7351C30.5517 15.738 30.5856 15.7405 30.606 15.7422ZM12.25 8.00003C8.79822 8.00003 6 10.7983 6 14.25V35.75C6 39.2018 8.79822 42 12.25 42H33.75C37.2018 42 40 39.2018 40 35.75V33.5C40 32.8097 39.4404 32.25 38.75 32.25C38.0596 32.25 37.5 32.8097 37.5 33.5V35.75C37.5 37.8211 35.8211 39.5 33.75 39.5H12.25C10.1789 39.5 8.5 37.8211 8.5 35.75V14.25C8.5 12.179 10.1789 10.5 12.25 10.5H20.5C21.1904 10.5 21.75 9.94039 21.75 9.25003C21.75 8.55967 21.1904 8.00003 20.5 8.00003H12.25Z"/></svg>'
}

var tabView = document.createElement('div');
tabView.className = 'tabview';
document.body.appendChild(tabView);
document.body.classList.add('winui');

var tabStrip = document.createElement('div');
var tabStripTabs = document.createElement('div');
var tabStripCreate = document.createElement('div');
var tabStripCreateButton = document.createElement('button');

tabStrip.className = 'explorer-tabstrip';
tabStripTabs.className = 'explorer-tabstrip-tabs';
tabStripCreate.className = 'explorer-tabstrip-create';
tabStripCreateButton.className = 'explorer-tabstrip-create-button';

browserWindow.toolbar.replaceChild(tabStrip, browserWindow.toolbar.querySelector('.window-toolbar-info'));
tabStrip.appendChild(tabStripTabs);
tabStrip.appendChild(tabStripCreate);
tabStripCreate.appendChild(tabStripCreateButton);

tabStripCreateButton.addEventListener('click', async () => {
    createTab();
})

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

function pageToPath(page) {
    return pages.includes(page) ? getPath(page) : page;
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

var order = [];
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

var tab = createTab();

async function createTab(icon, header, active = true) {
    // Initialize tab
    var tab = document.createElement('div');
    var tabInfo = document.createElement('div');
    var tabIcon = document.createElement('div');
    var tabHeader = document.createElement('div');
    var tabClose = document.createElement('div');
    var tabViewItem = document.createElement('div');

    var id = randomID();
    order.push(id);

    tab.className = 'explorer-tabstrip-tab';
    tabInfo.className = 'explorer-tabstrip-tab-info';
    tabIcon.className = 'explorer-tabstrip-tab-icon';
    tabHeader.className = 'explorer-tabstrip-tab-header';
    tabClose.className = 'explorer-tabstrip-tab-close';
    tabViewItem.className = 'tabview-item';

    tabIcon.style.backgroundImage = `url(${icon})`;
    tabHeader.innerHTML = header;

    if (active == true) {
        tabStrip.querySelectorAll('.active').forEach(tab => {
            tab.classList.remove('active');
        })
        tab.classList.add('active');
    }

    tab.addEventListener('click', (e) => {
        if (tabClose.contains(e.target)) return;
        focus();
    })

    tabClose.addEventListener('click', () => {
        close();
    })

    tab.appendChild(tabInfo);
    tab.appendChild(tabClose);
    tabInfo.appendChild(tabIcon);
    tabInfo.appendChild(tabHeader);
    tabStripTabs.appendChild(tab);
    tabView.appendChild(tabViewItem);

    function focus() {
        Object.values(tabs).forEach(tab => {
            tab.blur();
        })
        tab.classList.add('active');
        tabViewItem.classList.add('active');
    }
    function blur() {
        tab.classList.remove('active');
        tabViewItem.classList.remove('active');
    }
    function close() {
        tab.remove();
        tabViewItem.remove();
        var index = order.indexOf(id);
        delete tabs[id];
        order.splice(index, 1);
        if (Object.keys(tabs).length == 0) {
            return process.exit();
        } else if (order[index]) {
            console.log(tabs[order[index]], '=')
            return tabs[order[index]].focus();
        } else if (order[index - 1]) {
            console.log(tabs[order[index - 1]], '+')
            return tabs[order[index - 1]].focus();
        } else {
            console.log(tabs[order[0]], '0')
            return tabs[order[0]].focus();
        }
    }
    function changeIcon(icon) {
        tabIcon.style.backgroundImage = `url(${icon})`;
    }
    function changeHeader(header) {
        tabHeader.innerHTML = header;
    }

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

    actionbar.className = 'explorer-actionbar';
    content.className = 'explorer-content';
    sidebar.className = 'explorer-sidebar';
    viewerContainer.className = 'explorer-viewer-container';
    viewer.className = 'explorer-viewer';

    tabViewItem.appendChild(pathStrip);
    tabViewItem.appendChild(actionbar);
    tabViewItem.appendChild(content);
    content.appendChild(sidebar);
    content.appendChild(viewerContainer);
    viewerContainer.appendChild(viewer);

    var actionButtons = {};
    var viewHistory = [];
    var currentHistory = -1;
    var currentPage = 'C:/';

    Object.values(actionbarButtonIcons).forEach(icon => {
        var button = document.createElement('button');
        button.className = 'explorer-actionbar-button';
        button.innerHTML = icon;
        button.disabled = true;
        actionbar.appendChild(button);
        actionButtons[icon] = button;
    })

    async function createFolderItem(details, path) {
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');

        item.className = 'explorer-viewer-item';
        itemIcon.className = 'explorer-viewer-item-icon';
        itemName.className = 'explorer-viewer-item-name';

        fs.getFileURL('C:/Winbows/icons/folders/folder.ico').then(url => {
            itemIcon.style.backgroundImage = `url(${url})`;
        })
        itemName.innerHTML = details.name;

        // var hasMouse = matchMedia('(pointer:fine)').matches;

        item.addEventListener('click', async () => {
            currentPage = path;
            addToHistory(currentPage);
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

        fs.getFileURL(details.type.startsWith('image/') ? 'C:/Winbows/icons/files/image.ico' : 'C:/Winbows/icons/files/generic.ico').then(url => {
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
            var viewers = window.System.FileViewers.getViewer(path)
            console.log(viewers[0])
            new Process(viewers[0]).start(`const FILE_PATH="${path}";`);
        })

        item.appendChild(itemIcon);
        item.appendChild(itemName);
        return item;
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

    async function getPage(page) {
        var pageStatus = await getPageStatus(page);
        if (pageStatus == false) return;

        var targetID = randomID();
        currentID = targetID;

        changeIcon(await getIcon(currentPage));
        changeHeader(getHeader(page));

        viewer.innerHTML = '';
        viewer.classList.remove('animation');

        // TODO : Add path select and input
        pathStripPathText.innerHTML = pageToPath(page);
        update();

        if (pageStatus == null) return;

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
                        currentPage = item || getPath(item);
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

    function addToHistory(page) {
        if (page != viewHistory[viewHistory.length - 1]) {
            viewHistory.splice(currentHistory + 1);
            viewHistory.push(page);
            currentHistory = viewHistory.length - 1;
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
            if (pageToPath(currentPage).split('/').slice(-1) != '' && pageToPath(currentPage) != '') {
                pathStripActionUp.disabled = false;
            } else {
                pathStripActionUp.disabled = true;
            }
        } catch (e) { };
    }

    changeIcon(await getIcon(currentPage));
    changeHeader(getHeader(currentPage));
    setSidebar(true);
    getPage(currentPage);
    addToHistory(currentPage);
    focus();

    var properties = { changeHeader, changeIcon, close, focus, blur, tab, id };
    tabs[id] = properties;
    return properties;
}