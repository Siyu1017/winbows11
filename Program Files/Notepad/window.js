var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
fs.getFileURL(path.resolve('./window.css')).then(url => {
    style.href = url;
});
document.head.appendChild(style);

var tabview = browserWindow.useTabview();
var tab = new tabview.Tab({
    icon: false
});
setupPage(tab, process.args.path);

document.body.classList.add('winui');

tabview.on('requestCreateTab', (e) => {
    var tab = new tabview.Tab({
        active: e.active || true,
        icon: false
    });
    setupPage(tab);
})

// Simple editor
function createEditor(target) {
    var editor = document.createElement('div');
    var textarea = document.createElement('textarea');
    editor.contentEditable = true;
    editor.className = 'simple-editor';
    target.appendChild(editor);

    var lines = [];

    createLine();

    function createLine() {
        var line = document.createElement('div');
        line.textContent = '';
        line.className = 'simple-editor-line';
        editor.appendChild(line);
        lines.push(line);
        return line;
    }

    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            var line = createLine();
            placeCaretAtEnd(line);
            syncContent();
            scrollToCursor();
        }
        triggerEvent('change', e);
    });

    editor.addEventListener('input', (e) => {
        e.preventDefault();
        syncContent();
        scrollToCursor();
        triggerEvent('change', e);
    });

    function syncContent() {
        var content = '';
        lines.forEach((line, index) => {
            content += line.textContent;
            if (index < lines.length - 1) {
                content += '\n';
            }
        });
        textarea.value = content;
        var contentLines = content.endsWith('\n') ? content.split('\n').push('') : content.split('\n');

        if (contentLines.length < lines.length) {
            while (lines.length > contentLines.length) {
                lines.pop().remove();
            }
        } else if (contentLines.length > lines.length) {
            while (lines.length < contentLines.length) {
                createLine();
            }
        }

        for (var i = 0; i < contentLines.length; i++) {
            lines[i].textContent = contentLines[i];
        }
    }

    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        syncContent();
        scrollToCursor();
        triggerEvent('change', e);
    });

    editor.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    editor.addEventListener('drop', (e) => {
        e.preventDefault();
        var text = (e.dataTransfer.getData('text/plain') || '');
        document.execCommand('insertText', false, text);
        syncContent();
        scrollToCursor();
    });

    var listeners = {};

    function triggerEvent(event, detail) {
        if (listeners[event]) {
            listeners[event].forEach(listener => listener(detail));
        }
    }

    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    }

    function placeCaretAtEnd(el) {
        el.focus();
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function getValue() {
        return textarea.value;
    }

    function setValue(value) {
        textarea.value = value;
        var contentLines = value.endsWith('\n') ? value.split('\n').push('') : value.split('\n');
        if (contentLines.length < lines.length) {
            while (lines.length > contentLines.length) {
                lines.pop().remove();
            }
        } else if (contentLines.length > lines.length) {
            while (lines.length < contentLines.length) {
                createLine();
            }
        }
        for (var i = 0; i < contentLines.length; i++) {
            lines[i].textContent = contentLines[i];
        }
    }

    function scrollToCursor() {
        // TODO
    }

    return { editor, getValue, setValue, on };
}

function createEditor(target) {
    var editor = document.createElement('textarea');
    editor.className = 'simple-editor';
    target.appendChild(editor);

    editor.addEventListener('keydown', (e) => {
        triggerEvent('change', e);
    });

    editor.addEventListener('input', (e) => {
        triggerEvent('change', e);
    });

    editor.addEventListener('paste', (e) => {
        triggerEvent('change', e);
    });

    editor.addEventListener('drop', (e) => {
        triggerEvent('change', e);
    });

    var listeners = {};

    function triggerEvent(event, detail) {
        if (listeners[event]) {
            listeners[event].forEach(listener => listener(detail));
        }
    }

    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    }

    function getValue() {
        return editor.value;
    }

    function setValue(value) {
        editor.value = value;
    }

    return { editor, getValue, setValue, on };
}

async function setupPage(tab, file) {
    tab.changeTitle('Untitled');

    var container = tab.getContainer();
    var menubar = document.createElement('div');
    var menubarItems = document.createElement('div');
    var editorContainer = document.createElement('div');

    menubar.className = 'menubar';
    menubarItems.className = 'menubar-items';
    editorContainer.className = 'editor';

    container.appendChild(menubar);
    container.appendChild(editorContainer);
    menubar.appendChild(menubarItems);

    var filePath = file || '';
    var fileContent = '';
    var editor = createEditor(editorContainer);

    if (filePath != '') {
        await fs.readFile(filePath).then(async res => {
            return res.text();
        }).then(res => {
            fileContent = res;
            editor.setValue(fileContent);
            tab.changeTitle(window.parent.utils.getFileName(filePath));
        })
    }

    editor.on('change', () => {
        if (fileContent != editor.getValue()) {
            tab.changeTitle('● ' + (filePath != '' ? window.parent.utils.getFileName(filePath) : 'Untitled'));
        } else {
            tab.changeTitle(filePath != '' ? window.parent.utils.getFileName(filePath) : 'Untitled');
        }
    })

    var menuItems = [{
        text: 'File',
        menu: [
            {
                text: 'New File',
                action: () => {
                    // Clear content
                    fileContent = '';
                    filePath = '';
                    editor.setValue(fileContent);
                    tab.changeTitle('Untitled');
                }
            }, {
                text: 'Open File...',
                action: async () => {
                    var process = await new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseFile.js').start();
                    process.worker.addEventListener('message', async (e) => {
                        if (e.data.token != process.token) return;
                        if (e.data.type == 'confirm') {
                            filePath = e.data.items[0];
                            process.exit(0);
                            await fs.readFile(filePath).then(async res => {
                                return res.text()
                            }).then(content => {
                                fileContent = content;
                                editor.setValue(fileContent);
                                tab.changeTitle(window.parent.utils.getFileName(filePath));
                            })
                        }
                        if (e.data.type == 'cancel') {
                            process.exit(0);
                        }
                    })
                }
            }, {
                text: 'Save',
                action: async () => {
                    if (filePath != '') {
                        fs.writeFile(filePath, new Blob([editor.getValue()], {
                            type: 'text/plain;charset=utf-8'
                        })).then(() => {
                            tab.changeTitle(filePath != '' ? window.parent.utils.getFileName(filePath) : 'Untitled');
                        })
                    } else {
                        var process = await new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/saveFile.js').start();
                        process.worker.addEventListener('message', (e) => {
                            if (e.data.token != process.token) return;
                            if (e.data.type == 'confirm') {
                                // e.data.items[0];
                                process.exit(0);
                            }
                            if (e.data.type == 'cancel') {
                                process.exit(0);
                            }
                        })
                    }
                }

            }, {
                text: 'Save As...',
                action: async () => {
                    var process = await new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/saveFile.js').start();
                    process.worker.addEventListener('message', (e) => {
                        if (e.data.token != process.token) return;
                        if (e.data.type == 'confirm') {
                            // e.data.items[0];
                            process.exit(0);
                        }
                        if (e.data.type == 'cancel') {
                            process.exit(0);
                        }
                    })
                }
            }, {
                type: 'separator'
            }, {
                text: 'Exit',
                action: () => { tab.close() }
            }
        ]
    }, {
        text: 'Edit',
        menu: [
            {
                text: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                text: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                text: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                text: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                text: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                text: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }
        ]
    }];

    var pointerdown = false;

    menuItems.forEach(item => {
        const menu = WinUI.contextMenu(item.menu, {
            // showIcon: false
        })
        const menubarItem = document.createElement('div');
        menubarItem.className = 'menubar-item';
        menubarItem.innerHTML = item.text;
        menubarItem.addEventListener('click', () => {
            pointerdown = true;
            show();
        })
        function show() {
            menubarItem.classList.add('active');
            var position = window.utils.getPosition(menubarItem);
            menu.container.style.setProperty('--contextmenu-bg', 'rgb(249, 249, 249)');
            menu.open(position.x, position.y + menubarItem.offsetHeight + 4, 'left-top');
        }
        function hide() {
            menu.close();
            menubarItem.classList.remove('active');
        }
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                pointerdown = false;
                hide();
            })
        })
        menu.on('select', () => {
            hide();
        })
        menubarItems.appendChild(menubarItem);
    })
}