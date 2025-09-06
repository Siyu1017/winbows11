// Initialize System
import { commandRegistry } from './WRT/shell/commandRegistry.js';
import { apis } from './kernelRuntime.js';
import { processes } from './WRT/process.js';
import { WRT, tasklist } from './WRT/kernel.js';
import viewport from './viewport.js';
import * as utils from "../shared/utils.js";
import WinUI from '../lib/winui/winui.js';
import rom from './rom.js';
import { fallbackImage } from './fallback.js';
import { loadingText } from './loading.js';
import SystemInformation from './systemInformationProvider.js';

const { desktopItems, desktop, root } = viewport;

const { fs, process, __dirname, __filename, requireAsync, module, exports, runtimeID, ShellInstance } = apis;
const System = { ...SystemInformation };

System.WRT = WRT;
System.tasklist = tasklist;
System.rom = rom;
System.commandRegistry = commandRegistry;
System.processes = processes;

const listeners = {};
System.addEventListener = (event, listener) => {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event].push(listener);
}
System.removeEventListener = (event, listener) => {
    if (!listeners[event]) {
        return;
    }
    listeners[event].forEach((item, i) => {
        if (item == listener) {
            listeners[event].splice(i, 1);
        }
    })
}
System.triggerEvent = (event, details) => {
    if (listeners[event]) {
        listeners[event].forEach(listener => {
            listener(details);
        })
    }
}

// Theme 
!(function ThemeManager() {
    var theme = localStorage.getItem('WINBOWS_THEME') || 'light';
    var listeners = [];
    System.theme = {
        set: (value) => {
            theme = value != 'dark' ? 'light' : 'dark';
            localStorage.setItem('WINBOWS_THEME', theme);
            if (theme == 'dark') {
                document.body.setAttribute('data-theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
            }
            listeners.forEach(fn => fn(theme));
        },
        get: () => {
            return theme;
        },
        onChange: (listener) => {
            listeners.push(listener);
        }
    }
    if (theme == 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
})();

// Desktop
await (async function Desktop() {
    loadingText('Initializing Desktop...');

    System.desktop = {};
    System.desktop.update = updateDesktop;

    // TODO: complete widget api

    var createdItems = [];
    var originalContent = [];
    var updating = false;
    var fileTransfer = 0;

    var startXInCanvas = 0;
    var startYInCanvas = 0;
    var startX = 0;
    var startY = 0;
    var pointerXInCanvas = 0;
    var pointerYInCanvas = 0;
    var pointerX = 0;
    var pointerY = 0;
    var selected = [];
    var selecting = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
        willReadFrequently: true
    })

    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    desktop.appendChild(canvas);

    function selectionStart(e) {
        if (e.button == 2) {
            // Right click
            return;
        }
        let pageX = e.pageX;
        let pageY = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            pageX = touch.pageX;
            pageY = touch.pageY;
        }
        selecting = true;

        // For items
        startX = pageX + desktopItems.scrollLeft;
        startY = pageY;
        pointerX = pageX + desktopItems.scrollLeft;
        pointerY = pageY;

        // For canvas
        startXInCanvas = pageX + desktopItems.scrollLeft;
        startYInCanvas = pageY;
        pointerXInCanvas = pageX + desktopItems.scrollLeft;
        pointerYInCanvas = pageY;

        selected = [];
        createdItems.forEach(item => {
            item.item.classList.remove('active');
        })
    }

    function selectionMove(e) {
        if (selecting == false) return;
        let pageX = e.pageX;
        let pageY = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            pageX = touch.pageX;
            pageY = touch.pageY;
        }
        pointerX = pageX + desktopItems.scrollLeft;
        pointerY = pageY;
        pointerXInCanvas = pageX;
        pointerYInCanvas = pageY;

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
            var position = utils.getPosition(item.item);
            var itemWidth = item.item.offsetWidth;
            var itemHeight = item.item.offsetHeight;

            position.x += desktopItems.scrollLeft;

            if (position.x <= rectX && rectX <= position.x + itemWidth && position.y <= rectY && rectY <= position.y + itemHeight) {
                // Start point in item
                item.item.classList.add('active');
                selected.push({
                    path: item.getPath(),
                    command: item.getCommand(),
                    action: item.getAction(),
                    remove: item.remove
                });
            } else if (position.x >= rectX && position.y >= rectY && position.x + itemWidth <= pointerX && position.y + itemHeight <= pointerY) {
                // Rect in Selection
                item.item.classList.add('active');
                selected.push({
                    path: item.getPath(),
                    command: item.getCommand(),
                    action: item.getAction(),
                    remove: item.remove
                });
            } else if (!(position.x + itemWidth < rectX ||
                position.x > rectX + rectWidth ||
                position.y + itemHeight < rectY ||
                position.y > rectY + rectHeight)) {
                // Overlap
                item.item.classList.add('active');
                selected.push({
                    path: item.getPath(),
                    command: item.getCommand(),
                    action: item.getAction(),
                    remove: item.remove
                });
            } else {
                item.item.classList.remove('active');
            }
        })
    }

    function selectionEnd(e) {
        selecting = false;
        utils.canvasClarifier(canvas, ctx);
    }

    function render() {
        utils.canvasClarifier(canvas, ctx);

        if (selecting == false) return;

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = '#298de547';
        ctx.strokeStyle = '#298de5';
        ctx.lineWidth = .75;
        ctx.fillRect(startXInCanvas - desktopItems.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItems.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
        ctx.strokeRect(startXInCanvas - desktopItems.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItems.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
        ctx.closePath();
        ctx.restore();
    }

    const events = {
        "start": ["mousedown", "touchstart", "pointerdown"],
        "move": ["mousemove", "touchmove", "pointermove"],
        "end": ["mouseup", "touchend", "pointerup", "blur"]
    }

    events.start.forEach(event => {
        desktop.addEventListener(event, e => selectionStart(e))
    })
    events.move.forEach(event => {
        window.addEventListener(event, e => selectionMove(e))
    })
    events.end.forEach(event => {
        window.addEventListener(event, e => selectionEnd(e))
    })
    desktopItems.addEventListener('scroll', render);

    function generateItem() {
        var item = document.createElement('div');
        var itemIcon = document.createElement('div');
        var itemName = document.createElement('div');
        var action = function () { };
        var name = '';
        var icon = '';
        var file = new Blob([]);
        var command = '';
        var type = 'unknown';
        var path = '';
        var id = [...Array(18)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

        var properties = {
            id, item,
            action, name, icon, file, command, type, path,
            setAction, setName, setIcon, setCommand, setFile, setType, setPath,
            getPath, getCommand, getAction,
            update, remove
        };

        item.className = 'desktop-item';
        itemIcon.className = 'desktop-item-icon';
        itemName.className = 'desktop-item-name';

        desktopItems.appendChild(item);
        item.appendChild(itemIcon);
        item.appendChild(itemName);

        createdItems.push(properties);

        function isFunction(functionToCheck) {
            return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
        }

        function getPath() {
            return path;
        }
        function getCommand() {
            return command;
        }
        function getAction() {
            return action;
        }

        function setName(value) {
            if (name == value) return true;
            itemName.textContent = value;
            name = value;
            return false;
        }
        function setIcon(value) {
            if (icon == value) return true;
            itemIcon.style.backgroundImage = `url('${value}')`;
            icon = value;
            return false;
        }
        function setAction(value) {
            if (action == value || !isFunction(value)) return true;
            action = value;
            return false;
        }
        function setCommand(value) {
            if (command == value) return true;
            command = value;
            return false;
        }
        function setType(value) {
            if (type == value) return true;
            type = value;
            return false;
        }
        function setPath(value) {
            if (path == value) return true;
            path = value;
            return false;
        }
        function setFile(value) {
            if (path == value) return true;
            file = value;
            return false;
        }

        function update(item) {
            itemIcon.style.removeProperty('--item-icon');

            const updateType = item.type;
            const updateIcon = item.icon;
            const updateFile = item.file;
            const updatePath = item.path;
            const updateName = item.name;
            const updateAction = item.action;
            const updateCommand = item.command;

            var sameName = setName(updateName);
            var sameIcon = setIcon(updateIcon);
            var sameAction = setAction(updateAction);
            var sameType = setType(updateType);
            var sameCommand = setCommand(updateCommand);
            var samePath = setPath(updatePath);
            var sameFile = setFile(updateFile);

            if (type == 'shortcut') {
                fs.getFileURL('C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                    itemIcon.style.setProperty('--item-icon', `url(${url})`);
                })
            } else if (type == 'directory') {
                fs.getFileURL('C:/Winbows/icons/folders/folder.ico').then(url => {
                    setIcon(url);
                })
            } else {
                var isImage = file.type.startsWith('image/');
                fs.getFileURL(window.fileIcons.getIcon(path)).then(url => {
                    setIcon(url);
                    if (isImage) {
                        try {
                            fs.getFileURL(path).then(url => {
                                setIcon(url);
                            })
                        } catch (e) { console.log('Failed to load image.'); }
                    }
                })
            }
        }

        function remove() {
            item.remove();
            createdItems = createdItems.filter(item => item.id != id);
        }

        item.addEventListener('click', (e) => {
            if (command) {
                const shell = new ShellInstance(process);
                shell.execCommand(command).then(result => {
                    // console.log(result);
                    shell.dispose();
                }).catch(e => {
                    console.error(e);
                    shell.dispose();
                })
            } else if (action) {
                action();
            }
        })

        item.addEventListener('contextmenu', (e) => {
            var items = [
                {
                    className: "refresh",
                    icon: "refresh",
                    text: "Refresh",
                    action: () => {
                        System.desktop.update();
                    }
                }, {
                    className: 'sort',
                    icon: "sort",
                    text: "Sort by",
                    submenu: [{
                        className: "name",
                        /*icon: "sort_by_name",*/
                        text: "Name",
                        action: () => {
                            System.desktop.update(true, 'name');
                        }
                    },/* {
                            className: "size",
                            icon: "sort_by_size",
                            text: "Size",
                            action: () => { }
                        }, {
                            className: "type",
                            icon: "sort_by_type",
                            text: "Type",
                            action: () => { }
                        }*/]
                }, {
                    type: 'separator'
                }
            ];
            if (selected.length <= 1) {
                items.push({
                    className: "open",
                    text: "Open",
                    action: () => {
                        if (command) {
                            const shell = new ShellInstance(process);
                            shell.execCommand(command).then(result => {
                                // console.log(result);
                                shell.dispose();
                            }).catch(e => {
                                console.error(e);
                                shell.dispose();
                            })
                        } else if (action) {
                            action();
                        }
                    }
                })
                if (type == 'file') {
                    items.push({
                        className: "open-with",
                        icon: 'open-with',
                        text: "Open with...",
                        action: () => {
                            new WRT().runFile('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt')//.start(`const FILE_PATH="${path}";`);
                        }
                    });
                }
                if (type != 'directory') {
                    items.push({
                        text: 'Open file location',
                        icon: 'folder-open',
                        action: () => {
                            const shell = new ShellInstance(process);
                            shell.execCommand('explorer --config=PAGE=\"C:/User/Desktop\"').then(result => {
                                // console.log(result);
                                shell.dispose();
                            }).catch(e => {
                                console.error(e);
                                shell.dispose();
                            })
                        }
                    })
                }
                items.push({
                    className: 'delete',
                    icon: "delete",
                    text: "Delete",
                    action: () => {
                        fs.rm(path, { recursive: true }).then(res => {
                            System.desktop.update();
                        });
                    }
                })
            } else {
                items = items.concat([{
                    lassName: "open",
                    text: "Open",
                    action: () => {
                        selected.forEach(item => {
                            if (item.command) {
                                const shell = new ShellInstance(process);
                                shell.execCommand(item.command).then(result => {
                                    // console.log(result);
                                    shell.dispose();
                                }).catch(e => {
                                    console.error(e);
                                    shell.dispose();
                                })
                            } else if (item.action) {
                                item.action();
                            }
                        })
                        selected = [];
                        createdItems.forEach(item => {
                            item.item.classList.remove('active');
                        })
                    }
                }, {
                    className: 'delete',
                    icon: "delete",
                    text: "Delete",
                    action: async () => {
                        var temp = selected;
                        for (let i = 0; i < temp.length; i++) {
                            var item = temp[i];
                            await fs.rm(item.path, { recursive: true }).then(res => {
                                item.remove();
                            });
                        }
                        System.desktop.update();
                        selected = [];
                        createdItems.forEach(item => {
                            item.item.classList.remove('active');
                        })
                    }
                }])
            }

            if (file instanceof Blob && selected.length <= 1) {
                if (file.type.startsWith('image/')) {
                    // Alternative : item.splice(<position>,0,<item>)
                    items.push({
                        type: 'separator'
                    })
                    items.push({
                        className: "set-as-bacckground",
                        text: "Set as background",
                        action: async () => {
                            await window.setBackgroundImage(path);
                        }
                    })
                } else if (file.type.search('javascript') > -1) {
                    items.push({
                        type: 'separator'
                    })
                    items.push({
                        className: "run-as-an-app",
                        icon: 'window-snipping',
                        text: "Run as an application",
                        action: async () => {
                            new WRT().runFile(path);
                        }
                    })
                } else if (fsUtils.extname(path) == '.wbsf') {
                    items.push({
                        icon: 'window-snipping',
                        text: 'Run file',
                        action: async () => {
                            const file = await fs.readFile(path);
                            const script = await file.text();
                            const shell = new ShellInstance(process);
                            const commands = script.split('\n').filter(t => t.trim().length > 0);
                            try {
                                for (const command of commands) {

                                    await shell.execCommand(command.trim());
                                }
                            } catch (e) { };
                            shell.dispose();
                        }
                    })
                } else if (['.ttf', '.otf', '.woff', '.woff2', '.eot'].includes(fsUtils.extname(path))) {
                    items.push({
                        type: 'separator'
                    })
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
                                root.style.setProperty('--winbows-font-default', fontName);

                            } catch (error) {
                                console.error('Failed to load font', error);
                            }
                            return;
                        }
                    })
                }
            }
            const menu = WinUI.contextMenu(items, {
                // showIcon: false
            })
            e.preventDefault();
            e.stopPropagation();
            let pageX = e.pageX;
            let pageY = e.pageY;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            }
            menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
            menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
            menu.open(pageX, pageY, 'left-top');
            if (utils.getPosition(menu.container).x + menu.container.offsetWidth > window.innerWidth) {
                menu.container.style.left = 'unset';
                menu.container.style.right = '4px';
            }
            if (utils.getPosition(menu.container).y + menu.container.offsetHeight > window.innerHeight - 48) {
                menu.container.style.top = 'unset';
                menu.container.style.bottom = 'calc(var(--taskbar-height) + 4px)';
            }
            new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
                window.addEventListener(event, (e) => {
                    if (menu.container.contains(e.target)) return;
                    menu.close();
                })
            })
        }, false);

        return;
    }

    async function updateDesktop(force = true, sort = 'default') {
        if (window.modes.debug == true) {
            console.log('Updating Desktop', '\nForce : ' + force);
        }
        fs.readdir('C:/User/Desktop').then(async items => {
            if (items == originalContent && force == false || updating == true) return;
            originalContent = items;
            updating = true;
            var results = [];
            var count = Math.abs(items.length - createdItems.length);
            if (createdItems.length < items.length) {
                for (let i = 0; i < count; i++) {
                    generateItem();
                }
            } else if (createdItems.length > items.length) {
                for (let i = 0; i < count; i++) {
                    if (createdItems[i]) {
                        createdItems[i].remove();
                    }
                }
            }
            for (let i = 0; i < items.length; i++) {
                const stat = fs.stat(items[i]);
                results.push({
                    stat,
                    path: items[i],
                    name: fsUtils.basename(items[i]),
                    content: stat.isFile() ? await fs.readFile(items[i]).catch(err => console.error(err)) : new Blob([])
                });
            }
            if (sort == 'name') {
                // TODO
            }
            for (let i = 0; i < results.length; i++) {
                ; await (async (i) => {
                    var { stat, path, name, content } = results[i];
                    var type = fsUtils.extname(path) == '.link' ? 'shortcut' : stat.isFile() ? 'file' : 'directory';
                    var detail = {};
                    try {
                        if (type == 'shortcut') {
                            detail = JSON.parse(await content.text());
                        } else if (type == 'directory') {
                            detail = {
                                name: name,
                                command: `run explorer --config=PAGE=\"${path}\"`
                            };
                        } else {
                            detail = {
                                name: name,
                                action: () => {
                                    var defaultViewer = System.FileViewers.getDefaultViewer(path);
                                    if (defaultViewer != null) {
                                        new WRT().runFile(defaultViewer.script)//.start(`const FILE_PATH="${path}";`);
                                    } else {
                                        if (window.modes.debug == true) {
                                            console.log('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt')
                                        }
                                        new WRT().runFile('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt')//.start(`const FILE_PATH="${path}";`);
                                    }
                                }
                            };
                        }
                    } catch (e) { console.error(e) };
                    detail.path = path;
                    detail.type = type;
                    detail.file = content;
                    function update() {
                        createdItems[i].update(detail);
                        clearTimeout(update);
                    }
                    setTimeout(update, i);
                    return;
                })(i);
            }
            updating = false;
        })
    }

    const target = 'C:/User/Desktop/';
    const dropZone = desktop;

    var checked = false;
    var allowed = false;

    function checkType(event) {
        const items = event.dataTransfer.items;
        let isFileOrFolder = false;
        allowed = false;

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                isFileOrFolder = true;
                allowed = true;
            }
        }

        if (isFileOrFolder) {
            dropZone.classList.add('dragover');
        } else {
            dropZone.classList.remove('dragover');
        }
    }

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();

        if (checked == false) {
            checkType(event);
            checked = true;
        }
    });

    dropZone.addEventListener('dragenter', (event) => {
        event.preventDefault();

        if (checked == false) {
            checkType(event);
            checked = true;
        }
    });

    dropZone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        checked = false;
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        checked = false;
        dropZone.classList.remove('dragover');

        if (allowed == false) return;
        allowed == false;

        function hashURL(url) {
            return crypto.subtle.digest('SHA-256', new TextEncoder().encode(url)).then(buf =>
                Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
            );
        }

        const items = e.dataTransfer.items;
        var processed = 0;
        var current = 'Unknown';
        var title = 'Uploading File to Desktop...';
        var worker;
        var promises = [];

        for (const item of items) {
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
                promises.push(readEntryRecursively(entry, ''));
            } else if (item.kind === 'string' && item.type === 'text/uri-list') {
                // URL
                promises.push(new Promise((resolve, reject) => {
                    item.getAsString(async url => {
                        try {
                            const res = await fetch(url);
                            // Try to get the file name from the header
                            const disposition = res.headers.get('Content-Disposition');
                            let filename = null;

                            if (disposition && disposition.includes('filename=')) {
                                const matches = disposition.match(/filename\*=UTF-8''(.+)$|filename="?([^"]+)"?/);
                                if (matches) {
                                    filename = decodeURIComponent(matches[1] || matches[2]);
                                }
                            }

                            // Get it from url
                            if (!filename) {
                                filename = await hashURL(url);
                            }

                            const blob = await res.blob();

                            return resolve({
                                path: '',
                                file: new File([blob], filename, {
                                    type: blob.type,
                                    lastModified: Date.now()
                                })
                            });
                        } catch (e) {
                            return reject(e);
                        }
                    })
                }));
            } else {
                // Not a file, directory, or URL
            }
        }

        const results = (await Promise.all(promises)).flat();
        const total = results.length;
        console.log(results, total);


        async function readEntryRecursively(entry, path = '') {
            return new Promise(async (resolve, reject) => {
                if (entry.isFile) {
                    entry.file(file => {
                        resolve({ path: path, file });
                    });
                } else if (entry.isDirectory) {
                    const reader = entry.createReader();
                    reader.readEntries(async entries => {
                        const promises = entries.map(e =>
                            readEntryRecursively(e, path + entry.name + '/')
                        );
                        const results = await Promise.all(promises);
                        resolve(results.flat());
                    });
                }
            })
        }

        if (window.modes.debug == true) {
            console.log('run', total, results);
        }
        new WRT().runFile('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js')/*.start()*/.then(async process => {
            fileTransfer++;
            worker = process.worker;

            if (window.modes.debug == true) {
                console.log(results)
            }

            worker.postMessage({
                type: 'init',
                token: process.token
            })

            worker.postMessage({
                type: 'transfer',
                token: process.token,
                files: results, title,
                target: 'C:/User/Desktop/'
            })

            worker.addEventListener('message', async (e) => {
                if (!e.data.token == process.token) return;
                // console.log('MAIN', e.data.type)
                if (e.data.type == 'start') {
                    worker.postMessage({
                        type: 'init',
                        token: process.token
                    })
                }
                if (e.data.type == 'init') {
                    // console.log('init')
                    worker.postMessage({
                        type: 'transfer',
                        token: process.token,
                        files: results, title,
                        target: 'C:/User/Desktop/'
                    })
                }
                if (e.data.type == 'completed') {
                    fileTransfer--;
                    updateDesktop();
                }
            });

            // process.exit();
        });
    });

    desktop.addEventListener('contextmenu', (e) => {
        const menu = WinUI.contextMenu([
            {
                className: "refresh",
                icon: "refresh",
                text: "Refresh",
                action: () => {
                    System.desktop.update();
                }
            }, {
                className: 'sort',
                icon: "sort",
                text: "Sort by",
                submenu: [{
                    className: "name",
                    /*icon: "sort_by_name",*/
                    text: "Name",
                    action: () => {
                        System.desktop.update(true, 'name');
                    }
                }]
            }
        ])
        e.preventDefault();
        let pageX = e.pageX;
        let pageY = e.pageY;
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            pageX = touch.pageX;
            pageY = touch.pageY;
        }
        menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        menu.open(pageX, pageY, 'left-top');
        if (utils.getPosition(menu.container).x + menu.container.offsetWidth > window.innerWidth) {
            menu.container.style.left = 'unset';
            menu.container.style.right = '4px';
        }
        if (utils.getPosition(menu.container).y + menu.container.offsetHeight > window.innerHeight - 48) {
            menu.container.style.top = 'unset';
            menu.container.style.bottom = 'calc(var(--taskbar-height) + 4px)';
        }
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                menu.close();
            })
        })
    })

    var defaultShortcuts = [{
        path: 'C:/User/Desktop/desktop.link',
        content: {
            icon: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico',
            name: 'Desktop',
            command: 'explorer --config=PAGE=\"C:/User/Desktop\"'
        }
    }, {
        path: 'C:/User/Desktop/github.link',
        content: {
            icon: 'C:/Winbows/icons/github.png',
            name: 'Github',
            command: 'start "https://github.com/Siyu1017/winbows11/" --new-window'
        }
    }, {
        path: 'C:/User/Desktop/code.link',
        content: {
            icon: 'C:/Winbows/icons/applications/office/code.ico',
            name: 'VSCode',
            command: 'code'
        }
    }, {
        path: 'C:/User/Desktop/author.link',
        content: {
            icon: 'C:/Winbows/icons/author.ico',
            name: 'Siyu',
            command: 'start "https://siyu1017.github.io/" --new-window'
        }
    }]

    for (let i = 0; i < defaultShortcuts.length; i++) {
        let content = defaultShortcuts[i].content;
        try {
            content.icon = await fs.getFileURL(content.icon);
        } catch (e) {
            content.icon = fallbackImage;
            console.error(e);
        }
        try {
            fs.writeFile(defaultShortcuts[i].path, new Blob([JSON.stringify(content)], {
                type: 'application/winbows-link'
            }));
        } catch (e) {
            console.error('Failed to create shortcut', e);
        }
    }

    var lastTime = Date.now();

    fs.on('change', (e) => {
        if (e.path.search('C:/User/Desktop') > -1 && fileTransfer == 0) {
            var timeout = () => {
                var now = Date.now();
                if (lastTime - now > 1000) {
                    lastTime = now;
                    updateDesktop(false);
                }
                clearTimeout(timeout);
            };
            setTimeout(timeout, 1000);
        }
    });

    desktopItems.addEventListener('wheel', function (event) {
        var delta = event.deltaY || event.detail || event.wheelDelta;
        if (delta < 0) {
            desktopItems.scrollTo({
                behavior: "smooth",
                left: desktopItems.scrollLeft - 300
            })
        } else {
            desktopItems.scrollTo({
                behavior: "smooth",
                left: desktopItems.scrollLeft + 300
            })
        }
        event.preventDefault();
    });
})();

System.FileViewers = {
    // Deprecated Method : System.FileViewers.viewers
    viewers: {
        '*': '',
        '.css': ['code'],
        '.js': ['code'],
        '.html': ['code', 'edge'],
        '.txt': ['code'],
        '.jpg': ['mediaplayer', 'edge', 'photos'],
        '.jpeg': ['mediaplayer', 'edge', 'photos'],
        '.png': ['mediaplayer', 'edge', 'photos'],
        '.gif': ['mediaplayer', 'edge', 'photos'],
        '.webp': ['mediaplayer', 'edge', 'photos'],
        '.bmp': ['mediaplayer', 'edge', 'photos'],
        '.svg': ['mediaplayer', 'edge', 'photos'],
        '.ico': ['mediaplayer', 'edge', 'photos'],
        '.pdf': [],
        '.json': ['code'],
        '.xml': ['code'],
        '.zip': [],
        '.tar': [],
        '.gz': [],
        '.mp3': ['mediaplayer'],
        '.wav': ['mediaplayer'],
        '.ogg': ['mediaplayer'],
        '.mp4': ['mediaplayer'],
        '.webm': ['mediaplayer'],
        '.avi': ['mediaplayer'],
        '.mov': ['mediaplayer'],
        '.link': ['edge']
    },
    defaultViewers: {
        '.css': 'code',
        '.js': 'code',
        '.html': 'edge',
        '.link': 'edge',
        '.json': 'json-viewewr'
    },
    registeredViewers: {
        'code': {
            name: 'Visual Studio Code',
            script: 'C:/Program Files/VSCode/viewer.js',
            accepts: [/*'css', 'js', 'jsx', 'ts', 'ejs', 'html', 'txt', 'json', 'xml', 'py', 'java', 'c', 'h', */'*']
        },
        'edge': {
            name: 'Microhard Edge',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/viewer.js',
            accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
        },
        'edgebeta': {
            name: 'Microhard Edge BETA',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/viewer.js',
            accepts: ['.html', '.pdf', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.bmp', '.ico', '.webp', '.gif']
        },
        'photos': {
            name: 'Photos',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/viewer.js',
            accepts: ['*']
        },
        'mediaplayer': {
            name: 'MediaPlayer',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.MediaPlayer/window.js',
            accepts: ['.mp3', '.wav', '.ogg', '.mp4', '.webm', '.avi', '.mov']
        },
        'json-viewer': {
            name: 'JSON Viewer',
            script: 'C:/Program Files/JSON Viewer/viewer.js',
            accepts: ['.json']
        },
        'notepad': {
            name: 'Notepad',
            script: 'C:/Program Files/Notepad/viewer.js',
            accepts: ['*']
        }
    },
    isRegisterd: (name) => {
        return System.FileViewers.registeredViewers.hasOwnProperty(name);
    },
    updateViewer: (viewer, prop, value) => {
        if (System.FileViewers.isRegisterd(viewer)) {
            System.FileViewers.registeredViewers[viewer][prop] = value;
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(System.FileViewers.registeredViewers));
        }
    },
    registerViewer: (viewer, name, script, accepts) => {
        if (!System.FileViewers.isRegisterd(viewer)) {
            System.FileViewers.registeredViewers[viewer] = {
                name: name,
                script: script,
                accepts: accepts
            };
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(System.FileViewers.registeredViewers));
    },
    unregisterViewer: (viewer) => {
        if (System.FileViewers.isRegisterd(viewer)) {
            delete System.FileViewers.registeredViewers[viewer];
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(System.FileViewers.registeredViewers));
    },
    // Deprecated Method
    setViewer: (extension, app) => {
        if (!System.FileViewers.viewers[extension]) {
            System.FileViewers.viewers[extension] = [];
        }
        System.FileViewers.viewers[extension].push(app);
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(System.FileViewers.viewers));
        console.warn('%cSystem.FileViewers.setViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    // Deprecated Method
    unsetViewer: (extension, app) => {
        var index = System.FileViewers.viewers[extension].indexOf(app);
        if (index != -1) {
            System.FileViewers.viewers[extension].splice(index, 1);
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(System.FileViewers.viewers));
        console.warn('%cSystem.FileViewers.unsetViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    setDefaultViewer: (extension, app) => {
        var exists = false;
        Object.keys(System.FileViewers.registeredViewers).forEach(viewer => {
            if (viewer == app || System.FileViewers.registeredViewers[viewer] == app) {
                exists = viewer;
            }
        })
        if (exists != false) {
            System.FileViewers.defaultViewers[extension] = exists;
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(System.FileViewers.defaultViewers));
    },
    unsetDefaultViewer: (extension, app) => {
        if (System.FileViewers.defaultViewers[extension]) {
            System.FileViewers.defaultViewers.splice(System.FileViewers.defaultViewers.indexOf(app), 1)
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(System.FileViewers.defaultViewers));
    },
    getDefaultViewer: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var viewer = System.FileViewers.defaultViewers[extension];
        if (!viewer) {
            return null;
        } else {
            return System.FileViewers.registeredViewers[viewer];
        }
    },
    getViewers: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var accepted = ['*', extension];
        if (extension == '') {
            accepted = ['*'];
        }
        var viewers = {};
        Object.keys(System.FileViewers.registeredViewers).forEach(viewer => {
            if (window.modes.debug == true) {
                console.log(System.FileViewers.registeredViewers[viewer])
            }
            if (System.FileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                viewers[viewer] = System.FileViewers.registeredViewers[viewer];
            }
        })
        if (window.modes.debug == true) {
            console.log(file, extension, viewers)
        }
        return viewers;
    }
}

if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS') && window.modes.dev == false) {
    System.FileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(System.FileViewers.viewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS') && window.modes.dev == false) {
    System.FileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(System.FileViewers.defaultViewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS') && window.modes.dev == false) {
    System.FileViewers.registeredViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(System.FileViewers.registeredViewers));
}

window.System = System;

export { System };