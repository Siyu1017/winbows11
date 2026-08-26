import { desktopEl, desktopItemsEl } from "./init.js";
import * as utils from "../../../shared/utils.ts";
import { fallbackImage } from "../../core/fallback.js";
import { getMountedSystemFS } from "../../fs/systemFs.ts";
import { getFileURL } from "../../fs/fileUrl.ts";
import fsUtils from "../../fs/path.ts";
import WinUI from "../../../lib/winui/winui.js";
import ModuleManager from "../../moduleManager.js";
import { viewport } from "../../core/viewport.js";

const desktop = {
    init
};

async function init(wrt) {
    const fs = getMountedSystemFS();
    const System = ModuleManager.get('System');
    const BrowserWindow = ModuleManager.get('BrowserWindow');

    const imageExtnames = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const executableExtnames = [".wrt", ".js"];

    desktop.update = updateDesktop;

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
    desktopEl.appendChild(canvas);

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
        startX = pageX + desktopItemsEl.scrollLeft;
        startY = pageY;
        pointerX = pageX + desktopItemsEl.scrollLeft;
        pointerY = pageY;

        // For canvas
        startXInCanvas = pageX + desktopItemsEl.scrollLeft;
        startYInCanvas = pageY;
        pointerXInCanvas = pageX + desktopItemsEl.scrollLeft;
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
        pointerX = pageX + desktopItemsEl.scrollLeft;
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

            position.x += desktopItemsEl.scrollLeft;

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
        ctx.fillRect(startXInCanvas - desktopItemsEl.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItemsEl.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
        ctx.strokeRect(startXInCanvas - desktopItemsEl.scrollLeft, startYInCanvas, pointerXInCanvas + desktopItemsEl.scrollLeft - startXInCanvas, pointerYInCanvas - startYInCanvas);
        ctx.closePath();
        ctx.restore();
    }

    const events = {
        "start": ["mousedown", "touchstart", "pointerdown"],
        "move": ["mousemove", "touchmove", "pointermove"],
        "end": ["mouseup", "touchend", "pointerup", "blur"]
    }

    events.start.forEach(event => {
        desktopEl.addEventListener(event, e => selectionStart(e))
    })
    events.move.forEach(event => {
        window.addEventListener(event, e => selectionMove(e))
    })
    events.end.forEach(event => {
        window.addEventListener(event, e => selectionEnd(e))
    })
    desktopItemsEl.addEventListener('scroll', render);

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

        desktopItemsEl.appendChild(item);
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
                getFileURL(fs, 'C:/Winbows/icons/emblems/shortcut.ico').then(url => {
                    itemIcon.style.setProperty('--item-icon', `url(${url})`);
                })
            } else if (type == 'directory') {
                getFileURL(fs, 'C:/Winbows/icons/folders/folder.ico').then(url => {
                    setIcon(url);
                })
            } else {
                const isImage = imageExtnames.includes(fsUtils.extname(path));
                getFileURL(fs, System.fileIcons.getIcon(path)).then(url => {
                    setIcon(url);
                    if (isImage) {
                        try {
                            getFileURL(fs, path).then(url => {
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
                System.shell.execCommand(command).catch(e => {
                    console.error(e);
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
                        desktop.update();
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
                            desktop.update(true, 'name');
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
                            System.shell.execCommand(command).catch(e => {
                                console.error(e);
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
                            System.shell.execCommand('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt')//.start(`const FILE_PATH="${path}";`);
                        }
                    });
                }
                if (type != 'directory') {
                    items.push({
                        text: 'Open file location',
                        icon: 'folder-open',
                        action: () => {
                            System.shell.execCommand('explorer --path=\"C:/User/Desktop\"').catch(e => {
                                console.error(e);
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
                            desktop.update();
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
                                System.shell.execCommand(item.command).catch(e => {
                                    console.error(e);
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
                        desktop.update();
                        selected = [];
                        createdItems.forEach(item => {
                            item.item.classList.remove('active');
                        })
                    }
                }])
            }

            if (selected.length <= 1) {
                const extname = fsUtils.extname(path);
                if (imageExtnames.includes(extname)) {
                    // Alternative : item.splice(<position>,0,<item>)
                    items.push({
                        type: 'separator'
                    })
                    items.push({
                        className: "set-as-background",
                        text: "Set as background",
                        action: async () => {
                            await window.setBackgroundImage(path);
                        }
                    })
                } else if (executableExtnames.includes(extname)) {
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
                } else if (extname == '.wbsf') {
                    items.push({
                        icon: 'window-snipping',
                        text: 'Run file',
                        action: async () => {
                            const script = await fs.readFile(path, 'utf-8');
                            const commands = script.split('\n').filter(t => t.trim().length > 0);
                            try {
                                for (const command of commands) {
                                    await System.shell.execCommand(command.trim());
                                }
                            } catch (e) { };
                        }
                    })
                } else if (['.ttf', '.otf', '.woff', '.woff2', '.eot'].includes(extname)) {
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
                                const fontURL = await getFileURL(fs, path);
                                const myFont = new FontFace(fontName, `url(${fontURL})`);
                                await myFont.load();

                                window.document.fonts.add(myFont);
                                viewport.root.style.setProperty('--winbows-font-default', fontName);

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
                const path = fsUtils.join('C:/User/Desktop', items[i]);
                const stat = await fs.stat(path);
                results.push({
                    stat,
                    path,
                    name: fsUtils.basename(path),
                    content: stat.isFile() ? new Blob([await fs.readFile(path)]) : new Blob([])
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
                                command: `explorer --path=\"${path}\"`
                            };
                        } else {
                            detail = {
                                name: name,
                                action: () => {
                                    var defaultViewer = System.fileViewers.getDefaultViewer(path);
                                    if (defaultViewer != null) {
                                        System.shell.execCommand(`"${defaultViewer.script}" --path=\"${path}\"`)//.start(`const FILE_PATH="${path}";`);
                                    } else {
                                        System.shell.execCommand(`C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt --path=\"${path}\"`);
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
    const dropZone = desktopEl;

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

        async function hashURL(url) {
            return crypto.subtle.digest('SHA-256', new TextEncoder().encode(url)).then(buf =>
                Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
            );
        }

        const items = e.dataTransfer.items;
        const promises = [];

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

        const WApplication = wrt.WApplication;
        const { BrowserWindow } = WApplication;
        const id = 'system://explorer-file-transfer/' + utils.randomID(256);
        const channel = System.processAPIs.IPC.listen(id);
        const win = new BrowserWindow({
            x: 0,
            y: 0,
            width: 480,
            height: 250,
            fullscreenable: false,
            maximizable: false,
            snappable: false,
            resizable: false,
            mica: false,
            type: 'popup',
            title: 'File Transfer'
        }, {
            env: {
                pipe: id
            }
        });
        await win.load('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js');

        let state = {
            title: 'Uploading File to Desktop...',
            current: 'Unknown',
            processed: 0,
            total: total,
            updateCurrent(current) {
                this.current = current;
                this.update();
            },
            updateProcessed(processed) {
                this.processed = processed;
                this.update();
            },
            update() {
                channel.send({
                    type: 'update',
                    data: {
                        title: this.title,
                        total: this.total,
                        current: this.current,
                        processed: this.processed
                    }
                })
            }
        };

        state.update();

        async function handleFiles(files) {
            fileTransfer++;
            for (const file of files) {
                await handleFile(file instanceof File ? file : file.file, file.path);
            }
            fileTransfer--;
            win.close();
            if (fileTransfer === 0) {
                updateDesktop();
            }
        }

        async function writeFile(path, blob, exist = 0) {
            return new Promise(async function (resolve, reject) {
                let pathToCheck = path;
                const ext = fsUtils.extname(path);
                if (exist != 0) {
                    pathToCheck = `${path.substring(0, path.length - (ext.length + 1))} (${exist})${ext ? '.' + ext : ''}`;
                }
                if (await fs.exists(pathToCheck) == false) {
                    const dir = fsUtils.dirname(pathToCheck);
                    if (await fs.exists(dir) == false) {
                        await fs.mkdir(dir, { recursive: true })
                    }
                    await fs.writeFile(pathToCheck, blob).then(() => {
                        resolve();
                    })
                } else {
                    resolve(await writeFile(path, blob, exist + 1));
                }
            });
        }

        function handleFile(file, path) {
            return new Promise(function (resolve, reject) {
                state.updateCurrent(file.name);

                const filePath = (path || '') + file.name;
                const reader = new FileReader();
                reader.onload = async function (event) {
                    const arrayBuffer = event.target.result;
                    const blob = new Blob([arrayBuffer], { type: file.type });
                    const fullPath = `${target}${filePath}`;
                    writeFile(fullPath, blob).then(() => {
                        state.updateProcessed(state.processed + 1);
                        resolve();
                    });
                };
                reader.readAsArrayBuffer(file);
            });
        }

        handleFiles(results);
    });

    desktopEl.addEventListener('contextmenu', (e) => {
        const menu = WinUI.contextMenu([
            {
                className: "refresh",
                icon: "refresh",
                text: "Refresh",
                action: () => {
                    desktop.update();
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
                        desktop.update(true, 'name');
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

    const defaultShortcuts = [{
        path: 'C:/User/Desktop/desktop.link',
        content: {
            icon: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico',
            name: 'Desktop',
            command: 'explorer --path=C:/User/Desktop'
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
            content.icon = await getFileURL(fs, content.icon);
        } catch (e) {
            content.icon = fallbackImage;
            console.error(e);
        }
        try {
            await fs.writeFile(defaultShortcuts[i].path, new Blob([JSON.stringify(content)], {
                type: 'application/winbows-link'
            }));
        } catch (e) {
            console.error('Failed to create shortcut', e);
        }
    }
    updateDesktop();

    var lastTime = Date.now();

    const isDevMode = (() => {
        if (typeof location === 'undefined') return false;
        const params = utils.getJsonFromURL();
        return !!(params['dev'] || params['develop'] || params['embed']) || window.needsUpdate || window.modes?.dev == true;
    })();

    fs.watch('C:/User/Desktop', () => {
        if (fileTransfer !== 0 || isDevMode) return;
        setTimeout(() => {
            const now = Date.now();
            if (now - lastTime < 1000) return;
            lastTime = now;
            updateDesktop(false);
        }, 1000);
    });

    desktopItemsEl.addEventListener('wheel', function (event) {
        var delta = event.deltaY || event.detail || event.wheelDelta;
        if (delta < 0) {
            desktopItemsEl.scrollTo({
                behavior: "smooth",
                left: desktopItemsEl.scrollLeft - 300
            })
        } else {
            desktopItemsEl.scrollTo({
                behavior: "smooth",
                left: desktopItemsEl.scrollLeft + 300
            })
        }
        event.preventDefault();
    });
}

export default desktop;
