function isLocalFile(page) {
    var disks = fs.disks;
    var is = false;
    disks.forEach(disk => {
        if (page.split(':')[0].toUpperCase() == disk.toUpperCase()) {
            is = true;
        }
    })
    return is;
}

const caches = {};
async function getImageURL(image) {
    if (caches[image]) {
        return caches[image]
    } else {
        var url = await fs.getFileURL(image);
        caches[image] = url;
        return url;
    }
}

function isWebDomain(url) {
    const link = document.createElement('a');
    link.href = url;
    return {
        valid: link.protocol === "http:" || link.protocol === "https:",
        protocol: link.protocol
    };
}

function isValidURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // Protocol (optional)
        '((([a-zA-Z0-9$_.+!*\',;:&=-]|%[0-9a-fA-F]{2})+)(:([a-zA-Z0-9$_.+!*\',;:&=-]|%[0-9a-fA-F]{2})+)?@)?' + // User and password (optional)
        '([a-zA-Z0-9.-]+|\\[[a-fA-F0-9:]+\\])' + // Domain or IPv6
        '(\\:[0-9]+)?' + // Port (optional)
        '(\\/([a-zA-Z0-9$_.+!*\',;:@&=-]|%[0-9a-fA-F]{2})*)*' + // Path (optional)
        '(\\?([a-zA-Z0-9$_.+!*\',;:@&=-]|%[0-9a-fA-F]{2})*)?' + // Query string (optional)
        '(#([a-zA-Z0-9$_.+!*\',;:@&=-]|%[0-9a-fA-F]{2})*)?$'); // Fragment (optional)

    return !!pattern.test(str);
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

async function getHeader(page) {
    return fetch(page).then(res => {
        return res.text();
    }).then(res => {
        var title = page;
        if (res.match(/<title>.*<\/title>/gi)) {
            title = res.match(/<title>.*<\/title>/gi)[0].replaceAll(/<.?title>/gi, "");
        }
        /*if (res.match(/<link.*rel=('|").*icon.*('|")>/gi)) {
            icon = "https://yt-dler.vercel.app" + res.match(/<link.*rel=('|").*icon.*('|")>/gi)[0].match(/href=('|").*('|")/gi)[0].replace("href=", "").replaceAll(/('|")/gi, "");
        }*/
        return title;
        // browseWindow.changeIcon(icon);
        // console.log(title, icon)
    }).catch(err => {
        console.error(err);
        return page;
    })
}

async function setupTab(browserWindow, tab, page) {
    if (typeof page !== 'string') {
        page = 'edge://home';
    }

    fs.getFileURL('C:/Winbows/icons/applications/tools/edge.ico').then(icon => {
        tab.changeIcon(icon);
    })

    function changeTitle(header) {
        tab.changeTitle(header);
        browserWindow.changeTitle(header);
    }

    const pathStrip = document.createElement('div');
    const pathStripActions = document.createElement('div');
    const pathStripActionBack = document.createElement('button');
    const pathStripActionNext = document.createElement('button');
    const pathStripActionRefresh = document.createElement('button');
    const pathStripSearch = document.createElement('input');
    pathStrip.className = 'explorer-pathstrip';
    pathStripActions.className = 'explorer-pathstrip-actions';
    pathStripActionBack.className = 'explorer-pathstrip-action back';
    pathStripActionNext.className = 'explorer-pathstrip-action next';
    pathStripActionRefresh.className = 'explorer-pathstrip-action refresh';
    pathStripSearch.className = 'explorer-pathstrip-search';
    pathStrip.appendChild(pathStripActions);
    pathStrip.appendChild(pathStripSearch);
    pathStripActions.appendChild(pathStripActionBack);
    pathStripActions.appendChild(pathStripActionNext);
    pathStripActions.appendChild(pathStripActionRefresh);

    pathStripActionBack.addEventListener('click', () => {
        router.back();
    })
    pathStripActionNext.addEventListener('click', () => {
        router.forward();
    })

    pathStripActionRefresh.addEventListener('click', () => {
        router.reload();
    })
    pathStripSearch.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            router.push(pathStripSearch.value);
        }
    })

    const content = document.createElement('div');
    const viewer = document.createElement('div');
    const viewerTitle = document.createElement('div');
    const viewerList = document.createElement('div');
    const iframe = document.createElement('iframe');
    const edgePages = document.createElement('div');
    content.className = 'explorer-content';
    viewer.className = 'explorer-content-viewer';
    viewerTitle.className = 'explorer-content-viewer-title';
    viewerList.className = 'explorer-content-viewer-list';
    iframe.className = 'explorer-content-iframe';
    edgePages.className = 'explorer-content-edgepages';
    tab.tabviewItem.appendChild(pathStrip);
    tab.tabviewItem.appendChild(content);
    content.appendChild(iframe);
    content.appendChild(viewer);
    content.appendChild(edgePages);
    viewer.appendChild(viewerTitle);
    viewer.appendChild(viewerList);

    const router = (await requireAsync('./_router.js'))(tab.id);

    router.on('change', updatePage);
    router.on('reload', updatePage);

    // Initialize
    router.push(page);

    function showIframe() {
        iframe.style.display = 'block';
        viewer.style.display = 'none';
        edgePages.style.display = 'none';
    }

    function showViewer() {
        iframe.style.display = 'none';
        viewer.style.display = 'flex';
        edgePages.style.display = 'none';
    }

    function showEdgePages() {
        iframe.style.display = 'none';
        viewer.style.display = 'none';
        edgePages.style.display = 'flex';
    }

    function update() {
        try {
            if (router.historyIndex < router.history.length - 1) {
                pathStripActionNext.disabled = false;
            } else {
                pathStripActionNext.disabled = true;
            }
            if (router.historyIndex > 0) {
                pathStripActionBack.disabled = false;
            } else {
                pathStripActionBack.disabled = true;
            }
        } catch (e) { };
    }

    edgePages.innerHTML = `<div style="
    width: -webkit-fill-available;
    height: -webkit-fill-available;
    padding: 2rem;
    overflow: auto;
">
    <div style="
    display: flex;
    flex-direction: column;
    padding: 0 2rem;
">
    <div style="
    font-weight: 600;
    font-size: 1.5rem;
    text-align: center;
    margin-bottom: .5rem;
">Microhard Edge</div>
<hr style="
    /* height: 1px; */
    /* background: #000; */
    width: -webkit-fill-available;
    margin-top: 1.5rem;
">
    <div style="
    padding: 1rem 0;
">
        <li data-href="C:/" style="
    text-decoration: underline;
    cursor: pointer;
">View files under C:/</li>
        <li data-href="siyu1017.github.io" style="
    text-decoration: underline;
    cursor: pointer;
">Visit the Winbows11 author's website</li>
<li data-href="https://cznull.github.io/vsbm" style="
    text-decoration: underline;
    cursor: pointer;
">Volume shader</li>
    </div>
    <div style="
    font-weight: 600;
    font-size: 1.25rem;
    margin-bottom: .5rem;
">Note</div>
    <div style="
    padding-left: 1rem;
    padding-top: .25rem;
">A great number of sites will refuse to render due to their X-Frame-Options policy, or they may be using a framekiller. This policy is applied to most significant sites such as Google, so do not expect those to work.</div>
    </div>
    </div>`;

    edgePages.querySelectorAll('[data-href]').forEach(link => {
        link.addEventListener('click', async () => {
            router.push(link.getAttribute('data-href'));
        })
    })

    async function handleLocalURL(page) {
        viewerTitle.innerHTML = '';
        viewerList.innerHTML = '';
        const stat = fs.stat(page);
        changeTitle(page);
        if (!stat.exists) {
            viewerList.innerHTML = 'File not found.';
            showViewer();
        } else {
            if (stat.isDirectory()) {
                viewerTitle.innerHTML = `Index of ${page}`;
                const items = await fs.readdir(page);
                const dirs = [];
                const files = [];
                const stats = {};

                for (const item of items) {
                    const stat = fs.stat(item);
                    if (stat.isDirectory()) {
                        dirs.push(item);
                    } else {
                        files.push(item);
                    }
                    stats[item] = stat;
                }

                /*
                var items = dirs.sort((a, b) => {
                    try {
                        return a.path.toUpperCase().localeCompare(b.path.toUpperCase());
                    } catch (e) { };
                }).concat(files.sort((a, b) => {
                    try {
                        return a.path.toUpperCase().localeCompare(b.path.toUpperCase());
                    } catch (e) { };
                }))
                    */

                items.forEach(item => {
                    const itemElement = document.createElement('div');
                    const itemIcon = document.createElement('div');
                    const itemName = document.createElement('div');
                    itemElement.className = 'edge-file-item';
                    itemIcon.className = 'edge-file-item-icon';
                    itemName.className = 'edge-file-item-name';

                    fs.getFileURL(stats[item].isDirectory() ? 'C:/Winbows/icons/folders/folder.ico' : 'C:/Winbows/icons/files/generic.ico').then(url => {
                        itemIcon.style.backgroundImage = `url(${url})`;
                    })
                    itemName.innerHTML = fsUtils.basename(item);
                    itemElement.addEventListener('click', () => {
                        router.push(item);
                    })
                    viewerList.appendChild(itemElement);
                    itemElement.appendChild(itemIcon);
                    itemElement.appendChild(itemName);
                })

                if (items.length == 0) {
                    viewerList.innerHTML = '<span style="color:var(--label-color);">This folder is empty.</span>';
                }

                showViewer();
            } else {
                const url = await fs.getFileURL(page);
                getHeader(url).then(header => {
                    if (header == url) return;
                    changeTitle(header);
                })
                iframe.src = url;
                showIframe();
            }
        }
    }

    async function updatePage(e) {
        let path = e.path;

        const isLocalFileURL = isLocalFile(path);
        pathStripSearch.value = path;
        update();

        if (path.trim() == '' || path.trim() == 'edge://home') {
            showEdgePages();
            changeTitle('New Tab');
        } else if (isLocalFileURL == true) {
            handleLocalURL(path);
        } else {
            const status = isWebDomain(path);
            /*
            if (!isValidURL(path)) {
                path = `https://winbows11-proxy-api.vercel.app/api/search?q=${encodeURI(path)}`
            } else 
            */
            if (status.valid == true) {
                if (!path.startsWith('https://') && !path.startsWith('http://')) {
                    path = status.protocol + '//' + path;
                } else if (path.startsWith('//')) {
                    path = status.protocol + path;
                }
            }
            /*
            fetch('https://winbows11-proxy-api.vercel.app/api/view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: path }),
            }).then(res => {
                return res.text();
            }).then(res => {
                var blob = new Blob([res], {
                    type: 'text/html'
                })
                var path = URL.createObjectURL(blob);
                try {
                    getHeader(path).then(header => {
                        changeTitle(header);
                    })
                } catch (e) {
                    changeTitle(path);
                }
                iframe.src = path;
                showIframe();
            })
            */
            try {
                changeTitle('New Tab');
                getHeader(path).then(header => {
                    changeTitle(header);
                })
            } catch (e) {
                changeTitle(path);
            }
            iframe.src = path;
            showIframe();
        }
        return;
    }
}

module.exports = { setupTab };