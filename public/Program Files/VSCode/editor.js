let workspaceFolder = null;
let activeEditor = null;
const editorInstances = new Set();
let setiTheme = null;

// The theme maps common languages by language id (as preview.html shows),
// while its fileExtensions section covers more specific filename patterns.
const setiLanguageByExtension = {
    'c': 'c', 'cc': 'cpp', 'cpp': 'cpp', 'cxx': 'cpp', 'cs': 'csharp',
    'css': 'css', 'go': 'go', 'htm': 'html', 'html': 'html', 'jade': 'jade',
    'java': 'java', 'js': 'javascript', 'cjs': 'javascript', 'mjs': 'javascript', 'wrt': 'javascript',
    'json': 'json', 'less': 'less', 'md': 'markdown', 'php': 'php', 'ps1': 'powershell',
    'py': 'python', 'jsx': 'javascriptreact', 'tsx': 'typescriptreact', 'rb': 'ruby',
    'sass': 'sass', 'scss': 'scss', 'sh': 'shellscript', 'bash': 'shellscript',
    'sql': 'sql', 'ts': 'typescript', 'vue': 'vue', 'xml': 'xml', 'yml': 'yaml', 'yaml': 'yaml'
};

const setiThemePromise = Promise.all([
    fs.readFile(path.resolve('./icons/vs-seti-icon-theme.json'), 'utf-8'),
    fs.getFileURL(path.resolve('./icons/seti.woff'))
])
    .then(async ([themeSource, fontURL]) => {
        const font = new FontFace('seti', `url("${fontURL}")`);
        await font.load();
        document.fonts.add(font);
        setiTheme = JSON.parse(themeSource);
    })
    .catch(error => console.error('Unable to load Seti icon theme:', error));

function applySetiFileIcon(element, filePath) {
    if (!setiTheme) return;

    const name = path.basename(filePath).toLowerCase();
    const { fileNames = {}, fileExtensions = {}, languageIds = {}, file: defaultIcon } = setiTheme;
    const extension = Object.keys(fileExtensions)
        .sort((left, right) => right.length - left.length)
        .find(candidate => name === candidate || name.endsWith(`.${candidate}`));
    const simpleExtension = path.extname(name).slice(1);
    const iconId = fileNames[name]
        || (extension && fileExtensions[extension])
        || languageIds[setiLanguageByExtension[simpleExtension]]
        || defaultIcon;
    const definition = setiTheme.iconDefinitions[iconId];
    if (!definition) return;

    element.classList.add('seti-file-icon');
    element.textContent = String.fromCodePoint(parseInt(definition.fontCharacter.replace(/^\\/, ''), 16));
    element.style.color = definition.fontColor;
}

// Public extension surface.  Extensions can register contributions at any
// time; the default UI is rendered from the same registry.
const extensionRegistry = {
    commands: new Map(),
    menus: new Map(),
    activities: new Map(),
    statusBarItems: new Map(),
    editorActions: new Map()
};

function disposable(remove) {
    let disposed = false;
    return {
        dispose() {
            if (disposed) return;
            disposed = true;
            remove();
        }
    };
}

function refreshMenu(menuId) {
    // Menu buttons read their items when opened, so contributions added
    // after startup are immediately available without rebuilding the UI.
}

function renderActivity(activity) {
    const list = document.querySelector('.monaco-sidebar-list');
    if (!list || document.querySelector(`[data-vscode-activity="${activity.id}"]`)) return;

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'monaco-sidebar-item';
    item.dataset.vscodeActivity = activity.id;
    item.setAttribute('aria-label', activity.title);
    item.title = activity.title;
    if (activity.icon) item.append(activity.icon.cloneNode(true));
    item.addEventListener('click', () => showActivity(activity.id));
    list.appendChild(item);
}

function showActivity(activityId) {
    const activity = extensionRegistry.activities.get(activityId);
    if (!activity) return;
    const content = document.getElementById('sidebar-content');
    const activeItem = document.querySelector(`[data-vscode-activity="${activityId}"]`);

    // Clicking the selected activity again follows VS Code's sidebar toggle
    // behavior without changing the layout or the activity's view.
    if (activeItem?.classList.contains('active') && content.classList.contains('active')) {
        activeItem.classList.remove('active');
        content.classList.remove('active');
        return;
    }

    document.querySelectorAll('.monaco-sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.vscodeActivity === activityId);
    });
    content.replaceChildren(activity.createView());
    content.classList.add('active');
}

function renderStatusBarItem(item) {
    const container = document.getElementById(`status-bar-${item.alignment || 'left'}`);
    if (!container || document.querySelector(`[data-vscode-status="${item.id}"]`)) return;
    const element = document.createElement('div');
    element.className = 'monaco-footer-item';
    element.dataset.vscodeStatus = item.id;
    element.textContent = item.text;
    if (item.tooltip) element.title = item.tooltip;
    if (item.command) element.addEventListener('click', () => executeCommand(item.command));
    container.appendChild(element);
}

async function executeCommand(commandId, ...args) {
    const command = extensionRegistry.commands.get(commandId);
    if (!command) throw new Error(`Unknown VSCode command: ${commandId}`);
    return command(...args);
}

function attachEditorAction(instance, item) {
    if (instance.actions.has(item.id)) return;
    const action = instance.editor.addAction({
        id: item.id,
        label: item.label || item.id,
        keybindings: item.keybindings,
        contextMenuGroupId: item.contextMenuGroupId,
        contextMenuOrder: item.contextMenuOrder,
        run: () => item.run({
            editor: instance.editor,
            filePath: instance.filePath,
            workspaceFolder
        })
    });
    instance.actions.set(item.id, action);
}

window.WinbowsVSCode = Object.freeze({
    registerCommand(id, handler) {
        if (typeof id !== 'string' || !id || typeof handler !== 'function') {
            throw new TypeError('registerCommand expects a command id and function handler.');
        }
        if (extensionRegistry.commands.has(id)) throw new Error(`Command already registered: ${id}`);
        extensionRegistry.commands.set(id, handler);
        return disposable(() => extensionRegistry.commands.delete(id));
    },
    registerMenuItem(menuId, item) {
        if (!item?.label || !item.command) throw new TypeError('A menu item needs label and command.');
        const items = extensionRegistry.menus.get(menuId) || [];
        items.push(item);
        extensionRegistry.menus.set(menuId, items);
        refreshMenu(menuId);
        return disposable(() => {
            extensionRegistry.menus.set(menuId, items.filter(candidate => candidate !== item));
            refreshMenu(menuId);
        });
    },
    registerActivity(item) {
        if (!item?.id || !item.title || typeof item.createView !== 'function') {
            throw new TypeError('An activity needs id, title, and createView.');
        }
        if (extensionRegistry.activities.has(item.id)) throw new Error(`Activity already registered: ${item.id}`);
        extensionRegistry.activities.set(item.id, item);
        renderActivity(item);
        return disposable(() => {
            document.querySelector(`[data-vscode-activity="${item.id}"]`)?.remove();
            extensionRegistry.activities.delete(item.id);
        });
    },
    registerStatusBarItem(item) {
        if (!item?.id || typeof item.text !== 'string') throw new TypeError('A status item needs id and text.');
        if (extensionRegistry.statusBarItems.has(item.id)) throw new Error(`Status item already registered: ${item.id}`);
        extensionRegistry.statusBarItems.set(item.id, item);
        renderStatusBarItem(item);
        return disposable(() => {
            document.querySelector(`[data-vscode-status="${item.id}"]`)?.remove();
            extensionRegistry.statusBarItems.delete(item.id);
        });
    },
    registerEditorAction(item) {
        if (!item?.id || typeof item.run !== 'function') throw new TypeError('An editor action needs id and run.');
        if (extensionRegistry.editorActions.has(item.id)) throw new Error(`Editor action already registered: ${item.id}`);
        extensionRegistry.editorActions.set(item.id, item);
        editorInstances.forEach(instance => attachEditorAction(instance, item));
        return disposable(() => {
            extensionRegistry.editorActions.delete(item.id);
            editorInstances.forEach(instance => {
                instance.actions.get(item.id)?.dispose();
                instance.actions.delete(item.id);
            });
        });
    },
    executeCommand,
    get activeEditor() { return activeEditor?.editor || null; },
    get workspaceFolder() { return workspaceFolder; }
});

function getLanguage(extension) {
    switch (extension) {
        case '.js':
        case '.cjs':
        case '.mjs':
        case '.wrt':
            return 'javascript';
        case '.ts':
            return 'typescript';
        case '.md':
            return 'markdown'
        case '.htm':
        case '.html':
            return 'html';
        case '.css':
            return 'css';
        case '.json':
            return 'json';
        default:
            return 'plaintext';
    }
}

let toolbarTitle;
function setWindowTitle(title) {
    browserWindow.changeTitle(title);
    toolbarTitle.textContent = title;
}

function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

function setupToolbar() {
    const toolbarInfo = document.querySelector('.window-toolbar-info');
    const container = document.createElement('div');
    const menuBar = document.createElement('div');
    toolbarTitle = document.createElement('div');
    container.className = 'vscode-toolbar';
    menuBar.className = 'vscode-menubar';
    toolbarTitle.className = 'vscode-toolbar-title';

    const menu = document.createElement('div');
    menu.className = 'vscode-menu';
    document.body.appendChild(menu);

    const menuBarItems = [
        ['file', 'File'], ['edit', 'Edit'], ['selection', 'Selection'], ['view', 'View'],
        ['go', 'Go'], ['run', 'Run'], ['terminal', 'Terminal'], ['help', 'Help']
    ];

    for (const [menuId, label] of menuBarItems) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'vscode-menubar-item';
        item.dataset.vscodeMenu = menuId;
        item.textContent = label;
        item.addEventListener('click', () => {
            const subMenuItems = extensionRegistry.menus.get(menuId) || [];
            if (!subMenuItems.length) return;
            const pos = getPosition(item);
            const windowPos = getPosition(document.documentElement);
            menu.replaceChildren();
            for (const subMenuItem of subMenuItems) {
                const subItem = document.createElement('button');
                subItem.type = 'button';
                subItem.className = 'vscode-menu-item'
                subItem.textContent = subMenuItem.label;
                subItem.addEventListener('click', async () => {
                    menu.style.visibility = 'hidden';
                    await executeCommand(subMenuItem.command, ...(subMenuItem.arguments || []));
                });
                menu.appendChild(subItem);
            }
            menu.style.left = `${pos.x - windowPos.x}px`;
            menu.style.top = `${pos.y + item.clientHeight + 8 - windowPos.y}px`;
            menu.style.position = 'fixed';
            menu.style.visibility = 'visible';
            menu.style.zIndex = '10';
        })
        menuBar.appendChild(item);
    }

    container.append(menuBar, toolbarTitle);
    toolbarInfo.replaceChild(container, document.querySelector('.window-toolbar-title'));

    browserWindow.setImmovable(menuBar);

    document.documentElement.addEventListener('click', (e) => {
        if (menuBar.contains(e.target)) return;
        menu.style.visibility = 'hidden';
        menu.style.zIndex = '-1';
        menu.innerHTML = '';
    })
}

async function openFolder(folder) {
    if (!folder) return;

    workspaceFolder = folder;
    await setiThemePromise;
    const page = document.querySelector('.monaco-sidebar-page');
    page.replaceChildren();
    const folderPath = document.createElement('div');
    folderPath.className = 'vscode-workspace-path';
    folderPath.textContent = folder;
    page.appendChild(folderPath);

    await renderFolderEntries(folder, page, 0);
    setWindowTitle(`${path.basename(folder)} - Visual Studio Code`);

    fs.writeFile('./vs-state.json', new Blob([JSON.stringify({
        lastOpenedType: 'dir',
        lastOpenedPath: folder
    })]))
}

async function renderFolderEntries(folder, target, depth) {
    let entries = await fs.readdir(folder);
    entries = [...entries].sort((left, right) => left.localeCompare(right));

    for (const entry of entries) {
        const item = document.createElement('div');
        const icon = document.createElement('div');
        const label = document.createElement('div');
        const fullPath = path.join(folder, entry);
        const stat = await fs.stat(fullPath);
        item.className = 'vscode-workspace-item';
        item.style.paddingLeft = `${1 + depth}rem`;
        icon.className = `vscode-workspace-item-icon ${stat.isDirectory() ? 'folder' : 'file'}`;
        if (stat.isFile()) applySetiFileIcon(icon, fullPath);
        label.className = 'vscode-workspace-item-label';
        label.textContent = path.basename(entry);
        target.appendChild(item);
        item.appendChild(icon);
        item.appendChild(label);

        if (stat.isDirectory()) {
            const children = document.createElement('div');
            children.hidden = true;
            let loaded = false;
            item.setAttribute('aria-expanded', 'false');
            item.addEventListener('click', async () => {
                if (!loaded) {
                    try {
                        await renderFolderEntries(fullPath, children, depth + 1);
                        loaded = true;
                    } catch (error) {
                        console.error(`Unable to read folder: ${fullPath}`, error);
                        return;
                    }
                }
                children.hidden = !children.hidden;
                item.setAttribute('aria-expanded', String(!children.hidden));
            });
            target.appendChild(children);
        } else {
            item.addEventListener('click', () => createEditor(fullPath));
        }
    }
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1).toLowerCase();
}

function getLanguageMode(editor) {
    return capitalizeFirstLetter(editor?.getModel()?.getLanguageId() || 'txt');
}

function updateLanguageMode(editorInstance) {
    document.getElementById('language-mode').textContent = getLanguageMode(editorInstance?.editor);
}

// Core features are registered through the same surface exposed to
// extensions. This keeps their lifecycle and behavior consistent.
WinbowsVSCode.registerCommand('vscode.newWindow', async () => {
    await System.shell.execCommand('code');
});
WinbowsVSCode.registerCommand('vscode.openFolder', async () => {
    const selected = await Explorer.FilePicker({ multiple: false });
    for (const candidate of selected) {
        try {
            if ((await fs.stat(candidate)).isDirectory()) {
                await openFolder(candidate);
                return;
            }
        } catch { /* Ignore paths that cannot be inspected. */ }
    }
});
WinbowsVSCode.registerMenuItem('file', { label: 'New Window', command: 'vscode.newWindow' });
WinbowsVSCode.registerMenuItem('file', { label: 'Open Folder', command: 'vscode.openFolder' });
WinbowsVSCode.registerActivity({
    id: 'explorer',
    title: 'Explorer',
    createView: () => {
        const view = document.createDocumentFragment();
        const content = document.getElementById('sidebar-content');
        while (content.firstChild) view.appendChild(content.firstChild);
        return view;
    }
});

setupToolbar();

document.querySelectorAll('.monaco-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.vscodeActivity && extensionRegistry.activities.has(item.dataset.vscodeActivity)) {
            showActivity(item.dataset.vscodeActivity);
            return;
        }
        if (!item.classList.contains('active')) {
            document.querySelectorAll('.monaco-sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            item.classList.add('active');
            document.querySelector('.monaco-sidebar-content').classList.add('active');
        } else {
            item.classList.remove('active');
            document.querySelector('.monaco-sidebar-content').classList.remove('active');
        }
    })
})

async function createEditor(filePath) {
    let fileContent = await fs.readFile(filePath, 'utf-8');
    const container = document.createElement('div');
    const tab = document.createElement('div');
    const tabLabel = document.createElement('div');
    const tabIcon = document.createElement('div');
    const tabHeader = document.createElement('div');
    const tabClose = document.createElement('div');
    const tabCloseButton = document.createElement('button');

    container.className = 'monaco-editor';
    tab.className = 'monaco-tab active';
    tabLabel.className = 'monaco-tab-label';
    tabIcon.className = 'monaco-tab-icon';
    tabHeader.className = 'monaco-tab-header';
    tabClose.className = 'monaco-tab-close';
    tabCloseButton.className = 'monaco-tab-close-button';

    document.querySelector('.monaco-editors').appendChild(container);
    document.querySelector('.monaco-tabs').appendChild(tab);
    tab.appendChild(tabLabel);
    tabLabel.appendChild(tabIcon);
    tabLabel.appendChild(tabHeader);
    tab.appendChild(tabClose);
    tabClose.appendChild(tabCloseButton);

    tabHeader.textContent = 'Untitled';
    const editor = monaco.editor.create(container, {
        value: '',
        language: '',
        theme: 'vs-dark',
        automaticLayout: true,
        "semanticHighlighting.enabled": true
    });
    const editorInstance = {
        editor,
        filePath,
        container,
        tab,
        actions: new Map()
    };
    editorInstances.add(editorInstance);
    extensionRegistry.editorActions.forEach(action => attachEditorAction(editorInstance, action));

    document.addEventListener('keydown', async function (e) {
        if (activeEditor !== editorInstance) return;
        if (e.ctrlKey && e.key.toLocaleLowerCase() == 's') {
            e.preventDefault();

            console.log('Save file');

            const content = editor.getValue();
            await fs.writeFile(filePath, new Blob([content])).then(() => {
                console.log('File saved');
                tab.classList.remove('changed');
                setWindowTitle(path.basename(filePath) + ' - Visual Studio Code');
                fileContent = content;
            });
        }
    });

    tab.addEventListener('click', () => {
        document.querySelectorAll('.monaco-tab.active').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.monaco-editors > .monaco-editor').forEach(el => {
            el.style.visibility = 'hidden';
        });
        container.style.visibility = 'visible';
        activeEditor = editorInstance;
        updateLanguageMode(editorInstance);
    })

    tabCloseButton.addEventListener('click', (event) => {
        event.stopPropagation();
        editorInstances.delete(editorInstance);
        editorInstance.actions.forEach(action => action.dispose());
        editor.dispose();
        container.remove();
        tab.remove();
        if (activeEditor === editorInstance) {
            activeEditor = null;
            const nextEditor = editorInstances.values().next().value;
            if (nextEditor) {
                nextEditor.tab.click();
            } else {
                updateLanguageMode(null);
            }
        }
    })

    window.onresize = function () {
        editor.layout();
    };

    try {
        editor.setValue(fileContent);
        monaco.editor.setModelLanguage(editor.getModel(), getLanguage(path.extname(filePath)));

        tabHeader.textContent = path.basename(filePath);
        updateLanguageMode(editorInstance);

        setWindowTitle(path.basename(filePath) + ' - Visual Studio Code');

        editor.onDidChangeModelContent(function () {
            const currentContent = editor.getValue();

            if (currentContent !== fileContent) {
                tab.classList.add('changed');
                setWindowTitle('● ' + path.basename(filePath) + ' - Visual Studio Code');
            } else {
                tab.classList.remove('changed');
                setWindowTitle(path.basename(filePath) + ' - Visual Studio Code');
            }
        });
    } catch (error) {
        console.error('Error loading file:', error);
    }
    editor.layout();
    tab.click();
    return { editor, container, tabHeader, tab };
}

async function loadWrtTypes() {
    const declarationPath = 'C:/Program Files/VSCode/wrt.d.ts';
    const source = await fs.readFile(declarationPath, 'utf-8');
    const defaults = [
        monaco.languages.typescript.javascriptDefaults,
        monaco.languages.typescript.typescriptDefaults
    ];

    const uri = encodeURI(`file:///${declarationPath}`);
    for (const languageDefaults of defaults) languageDefaults.addExtraLib(source, uri);
}

async function initEditor() {
    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' } });
    require(['vs/editor/editor.main'], async function () {
        await loadWrtTypes();

        if (process.args.path) {
            await createEditor(process.args.path);
        } else if (process.args.folder) {
            openFolder(process.args.folder);
        } else if (await fs.exists('./vs-state.json')) {
            try {
                const state = JSON.parse(await fs.readFile('./vs-state.json', 'utf-8'));
                if (state.lastOpenedType === 'dir') {
                    openFolder(state.lastOpenedPath);
                }
            } catch (e) { };
        }

        document.getElementById('loading').remove();
    });
}

initEditor().catch(error => {
    console.error('Failed to initialize Visual Studio Code:', error);
    document.getElementById('loading')?.remove();
});
