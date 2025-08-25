import { root, desktop, desktopItems, backgroundImage } from './viewport.js';
import { fsUtils } from '../lib/fs.js';
import WinUI from '../ui/winui.js';
import { WRT } from './WRT/kernel.js';
import { commandRegistry } from './WRT/shell/commandRegistry.js';
//import BrowserWindow from './browserWindow.js';
import { setWinbows } from './WRT/WApplication.v2.js';
import { kernelRuntime, apis } from './kernelRuntime.js';
import Devtool from './devtool/main.js';
import { processes } from './WRT/process.js';
import * as utils from '../utils.js';
import taskbar from './taskbar/index.js';
import "./lockScreen.js"

//window.WinUI = WinUI;

const { fs, process, __dirname, __filename, requireAsync, module, exports, runtimeID, ShellInstance } = apis;

window.kernelRuntime = kernelRuntime;

// Initialize System
!(() => {
    window.System.WRT = WRT;
    window.System.commandRegistry = commandRegistry;
    window.System.localBuildId = localStorage.getItem('WINBOWS_BUILD_ID') || 'UNKNOWN';
    window.System.listeners = {};
    window.System.processes = processes;
    window.System.addEventListener = (event, listener) => {
        if (!window.System.listeners[event]) {
            window.System.listeners[event] = [];
        }
        window.System.listeners[event].push(listener);
    }
    window.System.removeEventListener = (event, listener) => {
        if (!window.System.listeners[event]) {
            return;
        }
        window.System.listeners[event].forEach((item, i) => {
            if (item == listener) {
                window.System.listeners[event].splice(i, 1);
            }
        })
    }
    window.System.triggerEvent = (event, details) => {
        if (window.System.listeners[event]) {
            window.System.listeners[event].forEach(listener => {
                listener(details);
            })
        }
    }

    // Theme 
    !(function ThemeManager() {
        var theme = localStorage.getItem('WINBOWS_THEME') || 'light';
        var listeners = [];
        window.System.theme = {
            set: (value) => {
                theme = value != 'dark' ? 'light' : 'dark';
                localStorage.setItem('WINBOWS_THEME', theme);
                if (theme == 'dark') {
                    root.setAttribute('data-theme', 'dark');
                } else {
                    root.removeAttribute('data-theme');
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
            root.setAttribute('data-theme', 'dark');
        }
    })();
})();

window.workerModules = {};

// Migration
async function shouldMigrateFromOldDatabase() {
    if (!indexedDB.databases) return false;
    const dbs = await indexedDB.databases();
    return dbs.some(db => db.name === 'winbows11');
}
const needsToMigrate = await shouldMigrateFromOldDatabase();
if (needsToMigrate) {
    console.warn('Needs to migrate from old database...');

    var warning = document.createElement('div');
    var warningWindow = document.createElement('div');
    var warningHeader = document.createElement('div');
    var warningContent = document.createElement('div');
    var warningFooter = document.createElement('div');
    var warningMigrateButton = document.createElement('button');
    var warningSkipButton = document.createElement('button');

    warningHeader.innerHTML = 'Data migration required';
    warningContent.innerHTML = `<div>We have recently updated the IDBFS schema and detected that you previously saved files in Winbows. As the previous schema has been deprecated, we need to migrate your files to the new version to prevent potential data loss or unexpected errors.</div>
        <div>This update replaces the original file path-based storage with a new structure that uses a file table and record IDs, improving access performance and ensuring data consistency.</div>`;
    warningSkipButton.innerHTML = 'Skip';
    warningMigrateButton.innerHTML = 'Continue';

    warning.style = 'position: fixed;top: 0px;left: 0px;width: 100vw;height: var(--winbows-screen-height);display: flex;align-items: center;justify-content: center;background-color: rgba(0, 0, 0, 0.5);z-index: 99999;font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;color:#000;';
    warningWindow.style = 'display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem 4rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px, -2rem + 100vw);width: 100%;max-height: min(calc(var(--winbows-screen-height) * 80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;';
    warningHeader.style = 'font-size: 175%;font-weight: 600;margin: .5rem 0 1.5rem;';
    warningFooter.style = 'display: flex;gap: .5rem;';
    warningSkipButton.style = 'color: rgb(0, 103, 192);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 1px solid rgb(0, 103, 192);margin-top: 1.5rem;font-family: inherit;font-weight: 600;min-width: 8rem;background: #fff;'
    warningMigrateButton.style = 'color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 1px solid rgb(0, 103, 192);margin-top: 1.5rem;font-family: inherit;font-weight: 600;min-width: 8rem;';

    warning.appendChild(warningWindow);
    warningWindow.appendChild(warningHeader);
    warningWindow.appendChild(warningContent);
    warningWindow.appendChild(warningFooter);
    warningFooter.appendChild(warningSkipButton);
    warningFooter.appendChild(warningMigrateButton);
    document.body.appendChild(warning);

    let doMigration = true;

    await (function () {
        return new Promise(resolve => {
            function evtfn() {
                warningWindow.innerHTML = '';
                resolve();
                warningMigrateButton.removeEventListener('click', evtfn);
            }
            warningMigrateButton.addEventListener('click', evtfn);

            function skipFn() {
                doMigration = false;
                warning.remove();
                resolve();
                warningSkipButton.removeEventListener('click', skipFn);
            }
            warningSkipButton.addEventListener('click', skipFn);
        })
    })();

    await (function () {
        return new Promise(async (resolve, reject) => {
            if (doMigration == false) return resolve();

            warningWindow.style.padding = '2rem';

            var taskOrder = ['fetch', 'open', 'read', 'migrate', 'delete'];
            var taskFinished = [];
            var tasks = {
                fetch: {
                    text: 'Fetch manifest'
                },
                open: {
                    text: 'Open old IDBFS'
                },
                read: {
                    text: 'Read old IDBFS'
                },
                migrate: {
                    text: 'Migrate files to new IDBFS'
                },
                delete: {
                    text: 'Delete old IDBFS'
                }
            }

            var called = false;
            function checkIfAllFinished() {
                if (taskFinished.every(x => x == true) && called == false) {
                    called = true;
                    var button = document.createElement('button');
                    button.innerHTML = 'Continue';
                    button.style = 'color: rgb(255, 255, 255);/* margin-bottom: 0.5rem; */padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1rem;font-family: inherit;font-weight: 600;';
                    warningWindow.appendChild(button);
                    button.addEventListener('click', () => {
                        warning.remove();
                        resolve();
                    })
                }
            }

            var rejected = false;
            function handleReject() {
                if (rejected == false) {
                    rejected = true;
                    var buttons = document.createElement('div');
                    var laterBtn = document.createElement('button');
                    var retryBtn = document.createElement('button');

                    buttons.className = 'migrate-buttons';
                    laterBtn.className = 'migrate-button outline';
                    retryBtn.className = 'migrate-button';

                    laterBtn.innerHTML = 'Migrate later';
                    retryBtn.innerHTML = 'Retry';

                    warningWindow.appendChild(buttons);
                    buttons.appendChild(laterBtn);
                    buttons.appendChild(retryBtn);

                    retryBtn.addEventListener('click', () => {
                        location.reload();
                    })
                    laterBtn.addEventListener('click', () => {
                        warning.remove();
                        resolve();
                    })
                }
            }

            var progress = document.createElement('div');
            var task = document.createElement('div');

            progress.className = 'migrate-progress';
            task.className = 'migrate-task';

            warningWindow.appendChild(progress);
            warningWindow.appendChild(task);

            for (const i in taskOrder) {
                !(i => {
                    const key = taskOrder[i];

                    // Progress bar
                    var progressBar = document.createElement('div');
                    progressBar.className = 'migrate-progress-bar';
                    progress.appendChild(progressBar);
                    tasks[key].progressBar = progressBar;

                    // Task name
                    var el = document.createElement('div');
                    el.className = 'migrate-task-item';
                    el.innerHTML = `<div class="migrate-task-icon"><svg class="migrate-loading-spinner" width="16" height="16" viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="7px"></circle></svg></div><div class="migrate-task-item-text">${tasks[key].text}</div>`;
                    task.appendChild(el);

                    taskFinished.push(false);

                    tasks[key].taskItem = el;
                    tasks[key].finished = false;
                    tasks[key].finish = function () {
                        if (taskFinished.slice(0, i).every(x => x == true)) {
                            tasks[key].finished = true;
                            taskFinished[i] = true;
                            progressBar.classList.add('fulfilled');
                            el.classList.add('fulfilled');
                            checkIfAllFinished();
                        }
                    }
                    tasks[key].reject = function () {
                        if (taskFinished.slice(0, i).every(x => x == true)) {
                            tasks[key].finished = false;
                            taskFinished[i] = false;
                            progressBar.classList.add('rejected');
                            el.classList.add('rejected');
                            checkIfAllFinished();
                        }
                    }
                    tasks[key].update = function (content) {
                        el.querySelector('.migrate-task-item-text').innerHTML = content;
                    }
                })(i);
            }

            var updateFiles = null;
            await fetch(`/build.json?timestamp=${new Date().getTime()}`).then(res => {
                return res.json()
            }).then(data => {
                if (data.table) {
                    updateFiles = data.table;
                    tasks.fetch.finish();
                    openDB();
                } else {
                    tasks.fetch.reject();
                    tasks.fetch.update('Failed to fetch manifest, please try again later.');
                    handleReject();
                }
            }).catch(err => {
                tasks.fetch.reject();
                tasks.fetch.update('Failed to fetch manifest, please try again later.');
                handleReject();
            })

            function openDB() {
                // Try to open the old database
                const oldDbRequest = indexedDB.open('winbows11', 1);
                oldDbRequest.onsuccess = async (event) => {
                    const db = event.target.result;

                    tasks.open.finish();

                    async function readFromOldDatabase(path) {
                        return new Promise((resolve, reject) => {
                            const store = db.transaction('C', 'readonly').objectStore('C');
                            const req = store.get(path);

                            req.onsuccess = () => {
                                const entry = req.result;
                                if (entry) {
                                    resolve({
                                        path: `C:/${entry.path}`,
                                        content: entry.content,
                                        type: entry.type
                                    });
                                } else {
                                    reject(new Error(`File not found: ${path}`));
                                }
                            };
                            req.onerror = (event) => {
                                reject(event.target.error);
                            };
                        });
                    }

                    function deleteIDB(name) {
                        return new Promise((resolve, reject) => {
                            const request = indexedDB.deleteDatabase(name);

                            request.onsuccess = () => {
                                console.log(`Database '${name}' deleted successfully.`);
                                resolve();
                            };

                            request.onerror = (event) => {
                                console.warn(`Failed to delete database '${name}':`, event.target.error);
                                reject(event.target.error);
                            };

                            request.onblocked = () => {
                                console.warn(`Deletion of database '${name}' is blocked (likely due to an open tab).`);
                            };
                        });
                    }

                    try {
                        const store = db.transaction('C', 'readonly').objectStore('C');
                        const req = store.index('path').getAllKeys();

                        req.onsuccess = async () => {
                            tasks.read.finish();

                            const keys = req.result;
                            const all = keys.length;
                            let completed = 0;
                            let skipped = 0;

                            // Migrate each key to the new database
                            for (const key of keys) {
                                try {
                                    const entry = await readFromOldDatabase(key);
                                    if (entry.type === 'directory') {
                                        if (!fs.exists(entry.path.endsWith('/') ? entry.path : entry.path + '/')) {
                                            await fs.mkdir(entry.path).catch();
                                        }
                                    } else {
                                        if (updateFiles.includes(entry.path)) {
                                            console.warn(`Skipped file: ${entry.path} (system file)`);
                                            skipped++;
                                        } else {
                                            await fs.writeFile(entry.path, entry.content);
                                        }
                                    }
                                    completed++;
                                    tasks.migrate.update(`Migrated ${completed}/${all}: ${entry.path} (${skipped} files skipped)`);
                                } catch (err) {
                                    console.error(`Failed to migrate ${key}:`, err);
                                }
                            }
                            tasks.migrate.update(`Migrated ${completed}/${all} files to new IDBFS (${skipped} files skipped)`);
                            tasks.migrate.finish();
                            db.close();
                            deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                            tasks.delete.finish();
                        };
                        req.onerror = (event) => {
                            db.close();
                            tasks.read.finish();
                            tasks.migrate.finish();
                            deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                            console.error('Error reading old database:', event.target.error);
                        };
                    } catch (e) {
                        db.close();
                        tasks.open.finish();
                        tasks.read.finish();
                        tasks.migrate.finish();
                        deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                    }
                };
                oldDbRequest.onerror = async (event) => {
                    tasks.open.finish();
                    tasks.read.finish();
                    tasks.migrate.finish();
                    deleteIDB('winbows11').then(tasks.delete.finish).catch(tasks.delete.finish);
                }
            }
        })
    })();
}

try {
    const URLParams = getJsonFromURL();
    fs.writeFile('C:/Winbows/System/.env/location/param.json', new Blob([JSON.stringify(URLParams)], {
        type: 'application/json'
    }))

    if (URLParams['debug']) {

    }

    // Simple console
    if (URLParams['logs'] || URLParams['output']) {

    }
} catch (e) {
    console.error(e);
}

Devtool();

const startLoadingTime = Date.now();

// Loading
const loadingContainer = document.createElement('div');
const loadingImage = document.createElement('div');
const loadingSpinner = window.modes.dev == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
const loadingTextContainer = document.createElement('div');
const loadingTextShadowTop = document.createElement('div');
const loadingTextShadowBottom = document.createElement('div');
const loadingTextStrip = document.createElement('div');
const loadingProgress = document.createElement('div');
const loadingProgressBar = document.createElement('div');

loadingContainer.className = 'winbows-loading active';
loadingImage.className = 'winbows-loading-image';
loadingTextContainer.className = 'winbows-loading-text-container';
loadingTextShadowTop.className = 'winbows-loading-text-shadow-top';
loadingTextShadowBottom.className = 'winbows-loading-text-shadow-bottom';
loadingTextStrip.className = 'winbows-loading-text-strip';
loadingContainer.appendChild(loadingImage);
root.appendChild(loadingContainer);

function loadingText(content) {
    const loadingText = document.createElement('div');
    loadingText.textContent = content;
    loadingText.className = 'winbows-loading-text';
    loadingTextStrip.appendChild(loadingText);
    loadingTextStrip.scrollTo({
        top: loadingTextStrip.scrollHeight,
        behavior: "smooth"
    })
    return loadingText;
}

if (window.modes.dev == false && window.needsUpdate == false) {
    loadingSpinner.setAttribute('class', 'winbows-loading-spinner');
    loadingSpinner.setAttribute('width', 48);
    loadingSpinner.setAttribute('height', 48);
    loadingSpinner.setAttribute('viewBox', "0 0 16 16");
    loadingSpinner.innerHTML = '<circle cx="8px" cy="8px" r="7px"></circle>';
    loadingContainer.appendChild(loadingSpinner);
} else {
    loadingProgress.classList.add('winbows-loading-progress');
    loadingProgressBar.classList.add('winbows-loading-progress-bar');
    loadingContainer.appendChild(loadingTextContainer);
    loadingTextContainer.appendChild(loadingTextShadowTop);
    loadingTextContainer.appendChild(loadingTextShadowBottom);
    loadingTextContainer.appendChild(loadingTextStrip);
    loadingContainer.appendChild(loadingProgress);
    loadingProgress.appendChild(loadingProgressBar);
}

try {
    fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico').then(url => {
        loadingImage.style.backgroundImage = `url(${url})`;
    })
} catch (e) {
    console.error(e);
}

loadingText('Starting Winbows11...');

let progress = 0;
const updateProgressId = setInterval(function () {
    progress += Math.random() * 1 + 0.2;
    if (progress > 90) progress = 90;
    loadingProgressBar.style.width = progress + '%';
}, 200);

// Lock panel


// Functions

function getJsonFromURL(url) {
    if (!url) url = location.search;
    var query = url.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}


window.fileIcons = {
    getIcon: (path = '') => {
        const ext = fsUtils.extname(path);
        if (window.fileIcons.registerd[ext]) {
            return window.fileIcons.registerd[ext];
        } else {
            return window.fileIcons.registerd['*'];
        }
    },
    registerd: {
        // Default
        '*': 'C:/Winbows/icons/files/generic.ico',
        '.jpg': 'C:/Winbows/icons/files/image.ico',
        '.png': 'C:/Winbows/icons/files/image.ico',
        '.gif': 'C:/Winbows/icons/files/image.ico',
        '.svg': 'C:/Winbows/icons/files/image.ico',
        '.webp': 'C:/Winbows/icons/files/image.ico',
        '.jpeg': 'C:/Winbows/icons/files/image.ico',
        '.ico': 'C:/Winbows/icons/files/image.ico',
        '.bmp': 'C:/Winbows/icons/files/image.ico',
        '.mp3': 'C:/Winbows/icons/files/audio.ico',
        '.wav': 'C:/Winbows/icons/files/audio.ico',
        '.ogg': 'C:/Winbows/icons/files/audio.ico',
        '.mp4': 'C:/Winbows/icons/files/video.ico',
        '.webm': 'C:/Winbows/icons/files/video.ico',
        '.avi': 'C:/Winbows/icons/files/video.ico',
        '.mov': 'C:/Winbows/icons/files/video.ico',
        '.txt': 'C:/Winbows/icons/files/text.ico',
        '.exe': 'C:/Winbows/icons/files/program.ico',
        '.zip': 'C:/Winbows/icons/folders/zip.ico',
        '.ttf': 'C:/Winbows/icons/files/font.ico',
        '.otf': 'C:/Winbows/icons/files/font.ico',
        '.woff': 'C:/Winbows/icons/files/font.ico',
        '.woff2': 'C:/Winbows/icons/files/font.ico',
        '.eot': 'C:/Winbows/icons/files/font.ico',
        '.doc': 'C:/Winbows/icons/files/office/worddocument.ico',
        '.docx': 'C:/Winbows/icons/files/office/worddocument.ico',
        '.xls': 'C:/Winbows/icons/files/office/excelsheet.ico',
        '.xlsx': 'C:/Winbows/icons/files/office/excelsheet.ico',
        '.ppt': 'C:/Winbows/icons/files/office/powerpointopen.ico',
        '.pptx': 'C:/Winbows/icons/files/office/powerpointopen.ico',
        // Edge
        '.html': 'C:/Winbows/icons/applications/tools/edge.ico',
        // VSCode
        '.css': 'C:/Program Files/VSCode/File Icons/css.ico',
        '.js': 'C:/Program Files/VSCode/File Icons/javascript.ico',
        '.json': 'C:/Program Files/VSCode/File Icons/json.ico',
        // Winbows script files
        '.wbsf': 'C:/Winbows/icons/files/executable.ico',
        '.wrt': 'C:/Winbows/icons/files/program.ico',
        '.wrt': 'C:/Winbows/icons/files/program.ico',
    },
    register: (ext, icon) => {
        if (ext == '*') return;
        window.fileIcons.registerd[ext] = icon;
    }
}

window.appRegistry = {
    apps: {
        'explorer': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/',
            icon: 'C:/Winbows/icons/folders/explorer.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.wrt',
            configurable: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.wrt'
        },
        'edge': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
            icon: 'C:/Winbows/icons/applications/tools/edge.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.wrt'
        },
        'edgebeta': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
            icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt'
        },
        'store': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
            icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.wrt'
        },
        'cmd': {
            path: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/',
            icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
            script: 'C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt'
        },
        'notepad': {
            path: 'C:/Program Files/Notepad/',
            icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
            script: 'C:/Program Files/Notepad/app.wrt'
        },
        'calculator': {
            path: 'C:/Program Files/Calculator/',
            icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
            script: 'C:/Program Files/Calculator/app.wrt'
        },
        'paint': {
            path: 'C:/Program Files/Paint/',
            icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
            script: 'C:/Program Files/Paint/app.wrt'
        },
        'info': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
            icon: 'C:/Winbows/icons/emblems/info.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.wrt',
            autoExecute: true
        },
        'code': {
            path: 'C:/Program Files/VSCode/',
            icon: 'C:/Winbows/icons/applications/office/code.ico',
            script: 'C:/Program Files/VSCode/app.wrt'
        },
        'taskmgr': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
            icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.wrt'
        },
        'settings': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
            icon: 'C:/Winbows/icons/applications/tools/settings.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.wrt'
        },
        'fpsmeter': {
            path: 'C:/Program Files/FPS Meter/',
            icon: 'C:/Program Files/FPS Meter/favicon.ico',
            script: 'C:/Program Files/FPS Meter/app.wrt'
        },
        'photos': {
            path: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
            icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
            script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.wrt'
        },
        'network-listener': {
            path: 'C:/Program Files/Network Listener/',
            icon: 'C:/Winbows/icons/files/program.ico',
            script: 'C:/Program Files/Network Listener/app.wrt'
        },
        'json-viewer': {
            path: 'C:/Program Files/JSON Viewer/',
            icon: 'C:/Program Files/JSON Viewer/json-viewer.svg',
            script: 'C:/Program Files/JSON Viewer/app.wrt'
        },
        'notepad': {
            path: 'C:/Program Files/Notepad/',
            icon: 'C:/Program Files/Notepad/favicon.ico',
            script: 'C:/Program Files/Notepad/app.wrt'
        }
    },
    install: () => { },
    uninstall: () => { },
    update: () => { },
    getInfo: (name) => {
        if (!window.appRegistry.apps[name]) {
            return {};
        }
        return window.appRegistry.apps[name];
    },
    getIcon: (path) => {
        var icon = 'C:/Winbows/icons/files/program.ico';
        Object.values(window.appRegistry.apps).forEach(app => {
            // console.log(app.path, app.icon);
            if (path.startsWith(app.path)) {
                icon = app.icon || 'C:/Winbows/icons/files/program.ico';
            }
        })
        return icon;
    },
    getApp: (path) => {
        var app = {};
        Object.values(window.appRegistry.apps).forEach((current, i) => {
            // console.log(current.path);
            if (path.startsWith(current.path)) {
                app = current;
                app.name = Object.keys(window.appRegistry.apps)[i];
            }
        })
        return app;
    },
    exists: (name) => {
        return !!window.appRegistry.apps[name] || window.appRegistry.getApp(name) != {};
    }
}

window.Winbows = {};

window.Components = {};
window.Compilers = {};

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
})

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
};

function getMimeType(extension) {
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

var currentBackgroundImage;

window.getBackgroundImage = () => {
    return currentBackgroundImage;
}
window.setBackgroundImage = async (image = '') => {
    if (!image || image == currentBackgroundImage) return;
    var stats = fs.stat(image);
    if (stats.exists != true) {
        await fs.downloadFile(image).catch(err => {
            image = 'C:/Winbows/bg/img0.jpg';
            console.warn(err);
        });
    }
    currentBackgroundImage = image;
    localStorage.setItem('WINBOWS_BACKGROUND_IMAGE', currentBackgroundImage);
    var url = await fs.getFileURL(currentBackgroundImage);
    document.querySelector(':root').style.setProperty('--winbows-mica', `url(${url})`);
    var img = new Image();
    img.src = url;
    img.onload = () => {
        var theme = utils.getImageTheme(img);
        desktop.classList.remove('winui-light', 'winui-dark');
        desktop.classList.add(`winui-${theme}`);
        System.theme.set(theme);
        backgroundImage.style.backgroundImage = `url(${url})`;
        if (window.modes.debug == true) {
            console.log(theme)
        }
    }
}
window.WinbowsUpdate = () => {
    location.href = './install.html';
}

await window.setBackgroundImage(localStorage.getItem('WINBOWS_BACKGROUND_IMAGE') || 'C:/Winbows/bg/img0.jpg');

try {
    if (!fs.exists('C:/User/')) {
        await fs.mkdir('C:/User/');
    }
    if (!fs.exists('C:/User/Desktop/')) {
        await fs.mkdir('C:/User/Desktop/');
    }
    if (!fs.exists('C:/User/Documents/')) {
        await fs.mkdir('C:/User/Documents/');
    }
    if (!fs.exists('C:/User/Downloads/')) {
        await fs.mkdir('C:/User/Downloads/');
    }
    if (!fs.exists('C:/User/Music/')) {
        await fs.mkdir('C:/User/Music/');
    }
    if (!fs.exists('C:/User/Pictures/')) {
        await fs.mkdir('C:/User/Pictures/');
    }
    if (!fs.exists('C:/User/Videos/')) {
        await fs.mkdir('C:/User/Videos/');
    }
    if (!fs.exists('C:/User/AppData/')) {
        await fs.mkdir('C:/User/AppData/');
    }
    if (!fs.exists('C:/User/AppData/Local/')) {
        await fs.mkdir('C:/User/AppData/Local/');
    }
    if (!fs.exists('C:/User/AppData/Local/Temp/')) {
        await fs.mkdir('C:/User/AppData/Local/Temp/');
    }
} catch (e) {
    console.error(e);
}



//await BrowserWindow();
/*
const taskbar = await Taskbar();
Winbows.Screen.appendChild(taskbar.taskbar);
window.Winbows.Screen.appendChild(taskbar.startMenuContainer);*/

taskbar.pinApp('C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt');
//window.Taskbar.pinApp('C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt');
await taskbar.preloadImage();


window.System.CommandParsers = {
    run: (params) => {
        var file = params[0];
        var pathInApp = file ? file.split(':').length > 1 ? file.slice(file.split(':')[0].length + 1) : '' : '';
        var config = [...params].slice(1).join(' ') || '';
        if (config != '') {
            try {
                config = `const ${config.replace('--config=', '')};`;
            } catch (e) {
                config = '';
            };
        }
        if (file == 'all') {
            var message = [];
            Object.values(window.appRegistry.apps).forEach(app => {
                var process = new Process(app.script);
                process.start();
                message.push(process.id);
            })
            return {
                status: 'ok',
                message: message.join('\n')
            }
        }
        file = file.split(':')[0];
        if (window.appRegistry.exists(file)) {
            if (config != '' && window.appRegistry.getInfo(file).configurable) {
                file = window.appRegistry.getInfo(file).configurable;
            } else {
                file = window.appRegistry.getInfo(file).script;
            }
        }
        var wrt = new WRT();
        wrt.runFile(file, { data: pathInApp });
        return {
            status: 'ok',
            message: process.id
        }
    },
    open: async (params) => {
        var path = params[0];
        path = path.replaceAll('"', '');
        if (fs.exists(path) == true) {
            window.System.Shell(`run explorer --config=PAGE=\"${path}\"`);
        } else {
            window.open(path, '_blank');
        }
        return {
            status: 'ok',
            message: `Successfully open ${path}.`
        }
    },
    kill: async (params) => {
        var selector = params[0];
        if (window.System.processes[selector]) {
            window.System.processes[selector].exit();
            return {
                status: 'ok',
                message: `Successfully killed process with ID ${pid}.`
            }
        } else {
            return {
                status: 'error',
                message: `[ERROR] Process with ID ${pid} does not exist.`
            }
        }
    }
};

window.System.Shell = function (command = '') {
    var parsed = command.split(' ').filter(cmd => cmd.length != 0);
    var parser = parsed[0];
    if (!window.System.CommandParsers[parser]) {
        return {
            status: 'error',
            message: `[ERROR] Parser ( ${parser} ) can not be founded.`
        }
    }
    return window.System.CommandParsers[parser](parsed.slice(1));
}

// For desktop
await (async function Desktop() {
    window.System.desktop = {};
    window.System.desktop.update = updateDesktop;

    // TODO: complete widget api
    // Widget API
    var gridWidth = 96;
    var gridHeight = 96;
    var gridGap = 8;
    var widgetIdCounter = 0;
    const maxRows = ~~((desktopItems.offsetWidth - gridGap * 2) / gridWidth);
    const maxCols = ~~((desktopItems.offsetHeight - gridGap * 2) / gridHeight);
    const cellMap = new Map();
    const widgetCells = new Map();

    function canPlace(widget) {
        for (let dy = 0; dy < widget.h; dy++) {
            for (let dx = 0; dx < widget.w; dx++) {
                const key = `${widget.x + dx},${widget.y + dy}`;
                if (cellMap.has(key)) return false;
            }
        }
        return true;
    }

    function occupyWidget(widget) {
        const keys = new Set();
        for (let dy = 0; dy < widget.h; dy++) {
            for (let dx = 0; dx < widget.w; dx++) {
                const key = `${widget.x + dx},${widget.y + dy}`;
                cellMap.set(key, widget.id);
                keys.add(key);
            }
        }
        widgetCells.set(widget.id, keys);
    }

    function clearGrid() {
        cellMap.clear();
        widgetCells.clear();
    }

    function highlightFirstFit(w, h) {
        for (let y = 0; y <= rows - h; y++) {
            for (let x = 0; x <= cols - w; x++) {
                const widget = { x, y, w, h };
                if (canPlace(widget)) {
                    highlightArea(x, y, w, h);
                    return;
                }
            }
        }
        console.warn('No available space for widget');
    }

    window.winbowsWidget = function (x, y, w, h) {
        const id = 'W' + widgetIdCounter++;
        const widget = { id, x, y, w, h };

        if (!canPlace(widget)) {
            console.warn('Cannot place widget here. Try again.');
            return;
        }

        const container = document.createElement('div');
        container.className = 'desktop-widget';
        container.style.transform = `translate(${gridGap * (x + 1) + gridWidth * x}px,${gridGap * (y + 1) + gridHeight * y}px)`;
        container.style.width = `${gridGap * (w - 1) + gridWidth * w}px`;
        container.style.height = `${gridGap * (h - 1) + gridHeight * h}px`;
        desktop.appendChild(container);

        occupyWidget(widget);

        return container;
    }

    // Test
    !(() => {
        return;
        for (let i = 0; i < 100; i++) {
            const container = window.winbowsWidget(~~(Math.random() * maxRows), ~~(Math.random() * maxCols), ~~(Math.random() * 3) + 1, ~~(Math.random() * 3) + 1);
            if (container) {
                container.style.background = '#fff';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.fontSize = '200%';
                container.style.fontWeight = 'bold';
                container.innerHTML = 'Test Widget';
            } else {
                console.warn('Failed to create widget')
            }
        }
    })();

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
                window.System.Shell(command);
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
                        window.System.desktop.update();
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
                            window.System.desktop.update(true, 'name');
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
                            window.System.Shell(command);
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
                            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt').start(`const FILE_PATH="${path}";`);
                        }
                    });
                }
                if (type != 'directory') {
                    items.push({
                        text: 'Open file location',
                        icon: 'folder-open',
                        action: () => {
                            window.System.Shell('run explorer --config=PAGE=\"C:/User/Desktop\"')
                        }
                    })
                }
                items.push({
                    className: 'delete',
                    icon: "delete",
                    text: "Delete",
                    action: () => {
                        fs.rm(path, { recursive: true }).then(res => {
                            window.System.desktop.update();
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
                                window.System.Shell(item.command);
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
                        window.System.desktop.update();
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
                                    var defaultViewer = window.System.FileViewers.getDefaultViewer(path);
                                    if (defaultViewer != null) {
                                        new Process(defaultViewer.script).start(`const FILE_PATH="${path}";`);
                                    } else {
                                        if (window.modes.debug == true) {
                                            console.log('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt')
                                        }
                                        new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.wrt').start(`const FILE_PATH="${path}";`);
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
        new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js').start().then(async process => {
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

    /*
    document.addEventListener('paste', function (event) {
        const clipboardItems = event.clipboardData.items;

        console.log('paste', clipboardItems);

        var files = [];

        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];

            if (item.kind === 'file') {
                console.log(item.webkitGetAsEntry())
                const file = item.getAsFile();
                files.push(file);
            }
        }

        if (files.length == 0) return;

        new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js').start().then(async process => {
            fileTransfer++;
            var worker = process.worker;
            var title = 'Pasting Files to Desktop...';

            console.log(files)

            worker.postMessage({
                type: 'init',
                token: process.token
            })

            worker.postMessage({
                type: 'transfer',
                token: process.token,
                files, title,
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
                        files, title,
                        target: 'C:/User/Desktop/'
                    })
                }
                if (e.data.type == 'completed') {
                    fileTransfer--;
                    updateDesktop();
                }
            });
        });
    });
    */

    desktop.addEventListener('contextmenu', (e) => {
        const menu = WinUI.contextMenu([
            {
                className: "refresh",
                icon: "refresh",
                text: "Refresh",
                action: () => {
                    window.System.desktop.update();
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
                        window.System.desktop.update(true, 'name');
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
            icon: await fs.getFileURL('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico'),
            name: 'Desktop',
            command: 'run explorer --config=PAGE=\"C:/User/Desktop\"'
        }
    }, {
        path: 'C:/User/Desktop/github.link',
        content: {
            icon: await fs.getFileURL('C:/Winbows/icons/github.png'),
            name: 'Github',
            command: 'open "https://github.com/Siyu1017/winbows11/"'
        }
    }, {
        path: 'C:/User/Desktop/code.link',
        content: {
            icon: await fs.getFileURL('C:/Winbows/icons/applications/office/code.ico'),
            name: 'VSCode',
            command: 'run code'
        }
    }, {
        path: 'C:/User/Desktop/author.link',
        content: {
            icon: await fs.getFileURL('C:/Winbows/icons/author.ico'),
            name: 'Siyu',
            command: 'open "https://siyu1017.github.io/"'
        }
    }]

    for (let i = 0; i < defaultShortcuts.length; i++) {
        var content = JSON.stringify(defaultShortcuts[i].content);
        fs.writeFile(defaultShortcuts[i].path, new Blob([content], {
            type: 'application/winbows-link'
        }));
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

window.System.FileViewers = {
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
        '.li.nk': ['edge']
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
        return window.System.FileViewers.registeredViewers.hasOwnProperty(name);
    },
    updateViewer: (viewer, prop, value) => {
        if (window.System.FileViewers.isRegisterd(viewer)) {
            window.System.FileViewers.registeredViewers[viewer][prop] = value;
            localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
        }
    },
    registerViewer: (viewer, name, script, accepts) => {
        if (!window.System.FileViewers.isRegisterd(viewer)) {
            window.System.FileViewers.registeredViewers[viewer] = {
                name: name,
                script: script,
                accepts: accepts
            };
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
    },
    unregisterViewer: (viewer) => {
        if (window.System.FileViewers.isRegisterd(viewer)) {
            delete window.System.FileViewers.registeredViewers[viewer];
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
    },
    // Deprecated Method
    setViewer: (extension, app) => {
        if (!window.System.FileViewers.viewers[extension]) {
            window.System.FileViewers.viewers[extension] = [];
        }
        window.System.FileViewers.viewers[extension].push(app);
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
        console.warn('%cSystem.FileViewers.setViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    // Deprecated Method
    unsetViewer: (extension, app) => {
        var index = window.System.FileViewers.viewers[extension].indexOf(app);
        if (index != -1) {
            window.System.FileViewers.viewers[extension].splice(index, 1);
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
        console.warn('%cSystem.FileViewers.unsetViewer()%c has been deprecated.\nPlease use %cSystem.FileViewers.updateViewer()%c instead', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '', 'font-family:monospace;background:rgb(24,24,24);color:#fff;border-radius:4px;padding:4px 6px;', '')
    },
    setDefaultViewer: (extension, app) => {
        var exists = false;
        Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
            if (viewer == app || window.System.FileViewers.registeredViewers[viewer] == app) {
                exists = viewer;
            }
        })
        if (exists != false) {
            window.System.FileViewers.defaultViewers[extension] = exists;
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
    },
    unsetDefaultViewer: (extension, app) => {
        if (window.System.FileViewers.defaultViewers[extension]) {
            window.System.FileViewers.defaultViewers.splice(window.System.FileViewers.defaultViewers.indexOf(app), 1)
        }
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
    },
    getDefaultViewer: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var viewer = window.System.FileViewers.defaultViewers[extension];
        if (!viewer) {
            return null;
        } else {
            return window.System.FileViewers.registeredViewers[viewer];
        }
    },
    getViewers: (file = '') => {
        var extension = fsUtils.extname(file).toLowerCase();
        var accepted = ['*', extension];
        if (extension == '') {
            accepted = ['*'];
        }
        var viewers = {};
        Object.keys(window.System.FileViewers.registeredViewers).forEach(viewer => {
            if (window.modes.debug == true) {
                console.log(window.System.FileViewers.registeredViewers[viewer])
            }
            if (window.System.FileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                viewers[viewer] = window.System.FileViewers.registeredViewers[viewer];
            }
        })
        if (window.modes.debug == true) {
            console.log(file, extension, viewers)
        }
        return viewers;
    }
}

if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS') && window.modes.dev == false) {
    window.System.FileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS') && window.modes.dev == false) {
    window.System.FileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
}
if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS') && window.modes.dev == false) {
    window.System.FileViewers.registeredViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS'));
} else {
    localStorage.setItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS', JSON.stringify(window.System.FileViewers.registeredViewers));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.delay = delay;

window.System.addEventListener('load', async (e) => {
    // Initialize screen lock 
    var init = true;

    const now = Date.now();
    if (now - startLoadingTime < 1000) {
        await delay(1000 - (now - startLoadingTime));
    }

    clearInterval(updateProgressId);
    loadingProgressBar.style.width = '100%';

    window.System.desktop.update();

    // await delay(1000);

    // Remove loading 
    loadingContainer.classList.remove('active');

    async function initTaskbar() {
        await delay(200);

        // Initialize Taskbar
        window.Taskbar.init();

        // Run terminal app test
        !(async () => {
            const wrt = new WRT();
            console.log(`wrt-terminal-app-demo started`);
            try {
                const result = await wrt.runFile('C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt');
                console.log(result.evaluation != null
                    ? 'Executed with evaluation: ' + result.evaluation
                    : 'No evaluation returned');
                console.log(`wrt-terminal-app-demo exit with code`, result.exitCode);
            } catch (err) {
                console.error('RunFile failed:', err);
            }
        })();

        // For Debugging
        // Test App For iPhone
        // new Process("C:/dev/app.iPhoneOS.18.5/app.wrt").start();
        // new Process("C:/dev/windowThemeTest/app.wrt").start();
    }

    // Run module test
    !(async () => {
        const wrt = new WRT();
        console.log(`Process [ ${wrt.process.pid} ] started`);
        try {
            const result = await wrt.runFile('C:/User/Documents/sdk-v1/examples/wrt-module-demo/app.wrt');
            console.log(result.evaluation != null
                ? 'Executed with evaluation: ' + result.evaluation
                : 'No evaluation returned');
            console.log(`Process [ ${wrt.process.pid} ] exit with code`, result.exitCode);
        } catch (err) {
            console.error('RunFile failed:', err);
        }
    })();

    console.log(kernelRuntime, window.System, window.Winbows)

    // Run shell test
    !(async () => {
        const wrt = new WRT();
        console.log(`Process [ ${wrt.process.pid} ] started`);
        try {
            const result = await wrt.runFile('C:/User/Documents/sdk-v1/examples/wrt-shell-demo/app.wrt');
            console.log(result.evaluation != null
                ? 'Executed with evaluation: ' + result.evaluation
                : 'No evaluation returned');
            console.log(`Process [ ${wrt.process.pid} ] exit with code`, result.exitCode);
        } catch (err) {
            console.error('RunFile failed:', err);
        }
    })();
})

loadingText(`Almost done!`);

await (async () => {
    try {
        const fontName = 'WINBOWS_FONT_' + [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        const fontURL = await fs.getFileURL('C:/Winbows/fonts/Segoe Fluent Icons.ttf');
        const myFont = new FontFace(fontName, `url(${fontURL})`);
        await myFont.load();

        document.fonts.add(myFont);
        document.querySelector(':root').style.setProperty('--winbows-font-icon', fontName);

    } catch (error) {
        console.error('Failed to load font', error);
    }
    return;
})();


window.System.triggerEvent('load');