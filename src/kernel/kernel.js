import { fsUtils } from '../lib/fs.js';
import WinUI from '../ui/winui.js';
import { WRT } from './WRT/kernel.js';
import { commandRegistry } from './WRT/shell/commandRegistry.js';
import BrowserWindow from './browserWindow.js';
import Taskbar from './taskbar.js';
import { setWinbows } from './WRT/WApplication.js';
import { kernelRuntime, apis } from './kernelRuntime.js';
import Devtool from './devtool.js';
import { processes } from './WRT/process.js';
import { formatBytes } from '../utils.js';

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
})();

window.workerModules = {};
window.utils = {};
window.debuggers = {
    getStackTrace
}
window.utils.getPosition = getPosition;
window.utils.getJsonFromURL = getJsonFromURL;
window.utils.isElement = isElement;
window.utils.getPointerPosition = getPointerPosition;

Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; }

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

    warningHeader.innerHTML = 'Data migration required';
    warningContent.innerHTML = `<div>We have recently updated the IDBFS schema and detected that you previously saved files in Winbows. As the previous schema has been deprecated, we need to migrate your files to the new version to prevent potential data loss or unexpected errors.</div>
        <div>This update replaces the original file path–based storage with a new structure that uses a file table and record IDs, improving access performance and ensuring data consistency.</div>`;
    warningMigrateButton.innerHTML = 'Continue';

    warning.style = 'position: fixed;top: 0px;left: 0px;width: 100vw;height: var(--winbows-screen-height);display: flex;align-items: center;justify-content: center;background-color: rgba(0, 0, 0, 0.5);z-index: 99999;font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;color:#000;';
    warningWindow.style = 'display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem 4rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px, -2rem + 100vw);width: 100%;max-height: min(calc(var(--winbows-screen-height) * 80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;';
    warningHeader.style = 'font-size: 175%;font-weight: 600;margin: .5rem 0 1.5rem;';
    warningMigrateButton.style = 'color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 0px;margin-top: 1.5rem;font-family: inherit;font-weight: 600;';

    warning.appendChild(warningWindow);
    warningWindow.appendChild(warningHeader);
    warningWindow.appendChild(warningContent);
    warningWindow.appendChild(warningFooter);
    warningFooter.appendChild(warningMigrateButton);
    document.body.appendChild(warning);

    await (function () {
        return new Promise(resolve => {
            function evtfn() {
                warningWindow.innerHTML = '';
                resolve();
                warningMigrateButton.removeEventListener('click', evtfn);
            }
            warningMigrateButton.addEventListener('click', evtfn);
        })
    })();

    await (function () {
        return new Promise(async (resolve, reject) => {
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

const URLParams = getJsonFromURL();
fs.writeFile('C:/Winbows/System/.env/location/param.json', new Blob([JSON.stringify(URLParams)], {
    type: 'application/json'
}))

if (URLParams['debug']) {

}

// Simple console
if (URLParams['logs'] || URLParams['output']) {

}

!(function () {
    Devtool();
    const el = document.createElement('div');
    el.style = `background: #0000004f;color: #fff;position: fixed;right: .5rem;top: .5rem;z-index: 999999999;border-radius: .375rem;padding: .25rem .5rem;pointer-events: none;backdrop-filter:blur(1rem);-webkit-backdrop-filter:blur(1rem);`;
    document.body.appendChild(el);

    let prevTime = Date.now(),
        frames = 0;
    var interval = 1000;
    var scale = 1000 / interval;
    // var time1 = Date.now();
    requestAnimationFrame(function loop() {
        const time = Date.now();
        frames++;
        if (time > prevTime + interval) {
            let fps = Math.round((frames * scale * interval) / (time - prevTime));

            el.style.fontFamily = 'monospace';
            el.style.fontSize = '14px';
            el.innerHTML = `${formatBytes(performance.memory.usedJSHeapSize)} / ${formatBytes(performance.memory.totalJSHeapSize)} ( ${((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100).toFixed(0)}% ), FPS : ${fps}`;

            prevTime = time;
            frames = 0;
        }
        requestAnimationFrame(loop);
    });
})();


var startLoadingTime = Date.now();
var startIssuesTimeout = 10000;
var startedSuccessfully = false;
var startIssuesPrompt = null;

setTimeout(showStartIssuesPrompt, startIssuesTimeout);
function setStartStatus(v) {
    startedSuccessfully = v;
    if (startIssuesPrompt != null) {
        startIssuesPrompt.remove();
    }
}
function showStartIssuesPrompt() {
    if (startedSuccessfully == true) return;
    startIssuesPrompt = document.createElement('div');
    var promptWindow = document.createElement('div');
    var title = document.createElement('div');
    var btnGroup = document.createElement('div');
    var retryBtn = document.createElement('button');
    //var optionsBtn = document.createElement('button');

    title.innerHTML = 'Are there any issues during starting?';
    retryBtn.textContent = 'Retry';
    //optionsBtn.textContent = 'Options';

    startIssuesPrompt.className = 'winbows-start-issues';
    promptWindow.className = 'winbows-start-issues-window';
    title.className = 'winbows-start-issues-title';
    btnGroup.className = 'winbows-start-issues-button-group';
    retryBtn.className = 'winbows-start-issues-button';
    //optionsBtn.className = 'winbows-start-issues-button outline';

    document.body.appendChild(startIssuesPrompt);
    startIssuesPrompt.appendChild(promptWindow);
    promptWindow.appendChild(title);
    promptWindow.appendChild(btnGroup);
    btnGroup.appendChild(retryBtn);
    //btnGroup.appendChild(optionsBtn);

    retryBtn.addEventListener('click', (e) => {
        location.href = './?dev&install';
    })
}

// Loading
var loadingContainer = document.createElement('div');
var loadingImage = document.createElement('div');
var loadingSpinner = window.modes.dev == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
var loadingTextContainer = document.createElement('div');
var loadingTextShadowTop = document.createElement('div');
var loadingTextShadowBottom = document.createElement('div');
var loadingTextStrip = document.createElement('div');
var loadingProgress = document.createElement('div');
var loadingProgressBar = document.createElement('div');

loadingContainer.className = 'winbows-loading active';
loadingImage.className = 'winbows-loading-image';
loadingTextContainer.className = 'winbows-loading-text-container';
loadingTextShadowTop.className = 'winbows-loading-text-shadow-top';
loadingTextShadowBottom.className = 'winbows-loading-text-shadow-bottom';
loadingTextStrip.className = 'winbows-loading-text-strip';
loadingContainer.appendChild(loadingImage);
document.body.appendChild(loadingContainer);

function loadingText(content) {
    var loadingText = document.createElement('div');
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

loadingText('Starting Winbows11...');

// Lock panel
var screenLockContainer = document.createElement('div');
var screenLock = document.createElement('div');
var screenLockBackground = document.createElement('div');
var screenLockMain = document.createElement('div');
var screenLockSignin = document.createElement('div');

screenLockContainer.className = 'screen-lock-container active';
screenLock.className = 'screen-lock';
screenLockBackground.className = 'screen-lock-background';
screenLockMain.className = 'screen-lock-main';
screenLockSignin.className = 'screen-lock-signin';

document.body.appendChild(screenLockContainer);
screenLockContainer.appendChild(screenLock);
screenLock.appendChild(screenLockBackground);
screenLock.appendChild(screenLockMain);
screenLock.appendChild(screenLockSignin);

// Clock on lock panel
var screenLockTime = document.createElement('div');
var screenLockDate = document.createElement('div');

screenLockTime.className = 'screen-lock-time';
screenLockDate.className = 'screen-lock-date';

screenLockMain.appendChild(screenLockTime);
screenLockMain.appendChild(screenLockDate);

// Signin panel
var screenLockSigninAvatar = document.createElement('div');
var screenLockSigninUsername = document.createElement('div');
var screenLockSigninButton = document.createElement('button');

screenLockSigninAvatar.className = 'screen-lock-signin-avatar';
screenLockSigninUsername.className = 'screen-lock-signin-username';
screenLockSigninButton.className = 'screen-lock-signin-button';

screenLockSignin.appendChild(screenLockSigninAvatar);
screenLockSignin.appendChild(screenLockSigninUsername);
screenLockSignin.appendChild(screenLockSigninButton);

// Screen of winbows
var screen = document.createElement('div');
var background = document.createElement('div');
var backgroundImage = document.createElement('div');
var appWrapper = document.createElement('div');

screen.className = 'screen';
background.className = 'background';
backgroundImage.className = 'background-image';
appWrapper.className = 'app-wrapper';

document.body.appendChild(screen);
screen.appendChild(background);
screen.appendChild(appWrapper);
background.appendChild(backgroundImage);

// Desktop 
var desktop = document.createElement('div');
var desktopItems = document.createElement('div');

desktop.className = 'desktop winui-no-background';
desktopItems.className = 'desktop-items';

appWrapper.appendChild(desktop);
desktop.appendChild(desktopItems);

// Functions
window.mainDisk = 'C';

/**
 * Find the distance of an element from the upper left corner of the document
 * @param {Element} element 
 * @returns {Object}
 */
function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

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

function isElement(obj) {
    try {
        return obj instanceof HTMLElement;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

// Equivalent to pageX/Y
function getPointerPosition(e) {
    let x = e.clientX;
    let y = e.clientY;
    if (e.type.startsWith('touch')) {
        var touch = e.touches[0] || e.changedTouches[0];
        x = touch.pageX;
        y = touch.pageY;
    }
    return { x: x + window.scrollX, y: y + window.scrollY };
}

window.fileIcons = {
    getIcon: (path = '') => {
        var ext = utils.getFileExtension(path);
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
window.Winbows.Screen = screen;
window.Winbows.AppWrapper = appWrapper;
window.Winbows.ShowLockScreen = () => {
    screenLock.classList.remove('signin');
    screenLockContainer.classList.add('active');
}

window.Components = {};
window.Compilers = {};

window.utils.replaceHTMLTags = (content = '') => {
    return content.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
window.utils.getFileName = (path = '') => {
    return path.split('/').slice(-1)[0];
}
window.utils.getFileExtension = function (file = '') {
    file = window.utils.getFileName(file);
    if (file.indexOf('.') > -1) {
        return '.' + file.split('.').pop();
    } else {
        return '';
    }
}

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

window.utils.getMimeType = getMimeType;

window.loadImage = loadImage;

// Loading images
try {
    loadingImage.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico')})`;
    screenLockSigninAvatar.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/user.png')})`;
    screenLockBackground.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/bg/img100.jpg')})`;
} catch (e) {
    console.error('Error loading image:', e);
}

window.utils.getImageTheme = function getImageTheme(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;

    let totalBrightness = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (img.width * img.height);

    const threshold = 128;
    if (averageBrightness > threshold) {
        return 'light';
    } else {
        return 'dark';
    }
}

window.utils.canvasClarifier = function canvasClarifier(canvas, ctx, width, height) {
    const originalSize = {
        width: (width ? width : canvas.offsetWidth),
        height: (height ? height : canvas.offsetHeight)
    }
    var ratio = window.devicePixelRatio || 1;
    canvas.width = originalSize.width * ratio;
    canvas.height = originalSize.height * ratio;
    ctx.scale(ratio, ratio);
    if (originalSize.width != canvas.offsetWidth || originalSize.height != canvas.offsetHeight) {
        canvas.style.width = originalSize.width + 'px';
        canvas.style.height = originalSize.height + 'px';
    }
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

screenLockSigninUsername.innerHTML = window.utils.replaceHTMLTags('Admin');
screenLockSigninButton.innerHTML = window.utils.replaceHTMLTags('Sign In');

await (async () => {
    var browserWindowPosition = {};

    const snapPreview = document.createElement('div');
    snapPreview.className = 'browser-window-snap-preview';
    window.Winbows.AppWrapper.appendChild(snapPreview);

    function cubicBezier(p1x, p1y, p2x, p2y) {
        return function (t) {
            const cx = 3 * p1x;
            const bx = 3 * (p2x - p1x) - cx;
            const ax = 1 - cx - bx;

            const cy = 3 * p1y;
            const by = 3 * (p2y - p1y) - cy;
            const ay = 1 - cy - by;

            const x = ((ax * t + bx) * t + cx) * t;
            const y = ((ay * t + by) * t + cy) * t;

            return y;
        };
    }

    const animateProfiles = {
        'window-show': {
            func: cubicBezier(.04, .73, .16, 1),
            duration: 150
        },
        'window-hide': {
            func: cubicBezier(.77, -0.02, .98, .59),
            duration: 150
        },
        'window-open': {
            func: cubicBezier(.42, 0, .58, 1),
            duration: 100
        },
        'window-close': {
            func: cubicBezier(.42, 0, .58, 1),
            duration: 100
        }
    };

    const icons = {
        close: await fs.getFileURL('C:/Winbows/icons/controls/close.png'),
        minimize: await fs.getFileURL('C:/Winbows/icons/controls/minimize.png'),
        maxmin: await fs.getFileURL('C:/Winbows/icons/controls/maxmin.png'),
        maximize: await fs.getFileURL('C:/Winbows/icons/controls/maximize.png')
    }

    window.System.createBrowserWindow = async function createBrowserWindow(path = {}, config = {}, pid) {
        console.log('creating window')
        const ICON = await window.Taskbar.createIcon({
            title: config.title || 'App',
            name: path.caller,
            icon: await fs.getFileURL(window.appRegistry.getIcon(path.callee)),
            openable: true,
            category: 'app',
            status: {
                active: true,
                opened: true
            }
        })

        window.System.processes[pid].title = config.title || 'App';

        const appWrapper = window.Winbows.AppWrapper;
        const events = {
            "start": ["mousedown", "touchstart", "pointerdown"],
            "move": ["mousemove", "touchmove", "pointermove"],
            "end": ["mouseup", "touchend", "pointerup", "blur"]
        }
        const parent = config.showOnTop == true ? window.Winbows.Screen : appWrapper;
        const { width = 800, height = 600 } = config;
        const windowData = {
            width, height,
            x: (window.innerWidth / 2) - width / 2,
            y: ((window.innerHeight - 48) / 2) - height / 2
        }
        const animateData = {
            x: windowData.x,
            y: windowData.y,
            scaleX: .9,
            scaleY: .9,
            opacity: 0,
            __x: windowData.x,
            __y: windowData.y,
            __scaleX: .9,
            __scaleY: .9,
            __opacity: 0,
            __targetTime: Date.now(),
            __startTime: Date.now(),
            __isRunning: false,
            __profile: {
                func: cubicBezier(.42, 0, .58, 1),
                duration: 100
            }
        }

        function decompose2DMatrix(matrixStr) {
            const match = matrixStr.match(/matrix\(([^)]+)\)/);
            if (!match) throw new Error("Not a valid 2D matrix");

            const [a, b, c, d, e, f] = match[1].split(',').map(parseFloat);

            const scaleX = Math.sqrt(a * a + b * b);
            const scaleY = Math.sqrt(c * c + d * d);

            const rotation = Math.atan2(b, a) * (180 / Math.PI);

            const skewX = Math.atan2(a * c + b * d, scaleX * scaleX) * (180 / Math.PI);

            return {
                translateX: e,
                translateY: f,
                scaleX,
                scaleY,
                rotation,
                skewX
            };
        }

        function animate(params, profile) {
            if (profile && typeof profile === 'string' && animateProfiles[profile]) {
                animateData.__profile = animateProfiles[profile];
            }
            Object.keys(params).forEach(CSSKey => {
                if (/[A-z]/gi.test(CSSKey[0])) {
                    animateData[CSSKey] = params[CSSKey];
                }
            })
            var cT = getComputedStyle(containerElement).transform;
            var cO = getComputedStyle(containerElement).opacity;
            var opacity = Number(cO);

            var x = 0, y = 0, scaleX = 1, scaleY = 1;
            if (cT.startsWith("matrix(")) {
                var transform = decompose2DMatrix(cT);
                x = transform.translateX;
                y = transform.translateY;
                scaleX = transform.scaleX;
                scaleY = transform.scaleY;
            }

            if (params.__from) {
                x = params.__from.x || x;
                y = params.__from.y || y;
                scaleX = params.__from.scaleX || scaleX;
                scaleY = params.__from.scaleY || scaleY;
                opacity = params.__from.opacity || opacity;
            }

            animateData.__x = x;
            animateData.__y = y;
            animateData.__scaleX = scaleX;
            animateData.__scaleY = scaleY;
            animateData.__opacity = opacity;
            animateData.__targetTime = Date.now() + animateData.__profile.duration;

            if (animateData.__isRunning == false) {
                animateRunner();
            }
        }

        function animateRunner() {
            animateData.__isRunning = true;
            var now = Date.now();
            var d = animateData.__targetTime - now;
            var t = 1 - (d / animateData.__profile.duration);
            var p = animateData.__profile.func(t > 1 ? 1 : t < 0 ? 0 : t);

            containerElement.style.transform = `translate(
                ${animateData.__x + (animateData.x - animateData.__x) * p}px,
                ${animateData.__y + (animateData.y - animateData.__y) * p}px
                ) scale(${animateData.__scaleX + (animateData.scaleX - animateData.__scaleX) * p},${animateData.__scaleY + (animateData.scaleY - animateData.__scaleY) * p})`;
            containerElement.style.opacity = animateData.__opacity + (animateData.opacity - animateData.__opacity) * p;

            if (now < animateData.__targetTime) {
                requestAnimationFrame(animateRunner);
            } else {
                animateData.__isRunning = false;
            }
        }

        var resizerConfig = {
            'browser-window-resizer-top': 'vertical',
            'browser-window-resizer-bottom': 'vertical',
            'browser-window-resizer-left': 'horizontal',
            'browser-window-resizer-right': 'horizontal',
            'browser-window-resizer-right-top': 'both',
            'browser-window-resizer-right-bottom': 'both',
            'browser-window-resizer-left-bottom': 'both',
            'browser-window-resizer-left-top': 'both'
        }
        var listeners = {};

        if (config.x || config.y) {
            // Taskbar height : 48
            windowData.x = config.x && config.x != 'center' ? parseInt(config.x) : windowData.x;
            windowData.y = config.y && config.y != 'center' ? parseInt(config.y) : windowData.y;
        } else if (browserWindowPosition[path.caller]) {
            // 
            windowData.x = browserWindowPosition[path.caller][0];
            windowData.y = browserWindowPosition[path.caller][1];
        }

        browserWindowPosition[path.caller] = [windowData.x + 20 >= window.innerWidth ? 0 : windowData.x + 20, windowData.y + 20 >= window.innerHeight - 48 ? 0 : windowData.y + 20];

        var containerElement = document.createElement('div');
        var micaElement = document.createElement('div');
        var hostElement = document.createElement('div');
        var resizers = document.createElement('div');
        var content = document.createElement('div');
        var shadowRoot = content.attachShadow({ mode: 'open' });
        var windowElement = document.createElement('div');
        var toolbarElement = document.createElement('div');
        var contentElement = document.createElement('div');

        var isMaximized = false;
        var originalSnapSide = '';

        containerElement.style.transition = 'none';
        containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;

        if (window.modes.debug == true) {
            console.log(config);
        }

        const toolbarMenu = WinUI.contextMenu([])

        toolbarMenu.container.style.setProperty('--contextmenu-icon-size', '.58rem');
        toolbarMenu.container.style.setProperty('--contextmenu-expand-size', '.58rem');

        toolbarElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = utils.getPointerPosition(e);
            toolbarMenu.setItems([
                {
                    className: "restore",
                    icon: "chrome-restore",
                    text: "Restore",
                    disabled: !isMaximized == true,
                    action: () => {
                        unmaximizeWindow();
                    }
                }, {
                    className: "minimize",
                    icon: "chrome-minimize",
                    text: "Minimize",
                    disabled: config.minimizable == false,
                    action: () => {
                        ICON.hide(windowID)
                    },
                }, {
                    className: "maximize",
                    icon: "chrome-maximize",
                    text: "Maximize",
                    disabled: !(isMaximized == false && !config.maximizable == false),
                    action: () => {
                        maximizeWindow();
                    },
                }, {
                    type: "separator"
                }, {
                    className: "close",
                    icon: "chrome-close",
                    text: "Close",
                    action: () => {
                        close();
                    },
                }
            ]);
            toolbarMenu.open(x, y, 'left-top');
        })

        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (toolbarMenu.container.contains(e.target)) return;
                toolbarMenu.close();
            })
        })

        const windowID = ICON.open({
            browserWindow: containerElement,
            shadowRoot: shadowRoot,
            pid: pid,
            mica: config.mica,
            close,
            update: function (type, icon) {

            }
        });

        if (window.modes.debug == true) {
            console.log('opened', windowID)
        }

        containerElement.className = 'browser-window-container active';
        micaElement.className = 'browser-window-mica';
        hostElement.className = 'browser-window';

        // Outside
        resizers.className = 'browser-window-resizers';
        content.className = 'browser-window-content';

        // In shadow root
        windowElement.className = 'window';
        toolbarElement.className = 'window-toolbar';
        contentElement.className = 'window-content';

        containerElement.addEventListener('pointerdown', (e) => {
            ICON.focus(windowID);
        })

        ICON.addEventListener('blur', (e) => {
            content.style.pointerEvents = '';
            triggerEvent('blur', {})
        })

        ICON.addEventListener('focus', (e) => {
            if (e.id != windowID) {
                return content.style.pointerEvents = '';
            }
            content.style.pointerEvents = 'unset';
            triggerEvent('focus', {});
        })

        ICON.addEventListener('_show', (id) => {
            if (id != windowID) return;
            var x = windowData.x,
                y = windowData.y;
            if (originalSnapSide != '') {
                x = 0; y = 0;
                if (originalSnapSide.includes('r')) {
                    x = window.innerWidth / 2;
                }
                if (originalSnapSide.includes('b')) {
                    y = (window.innerHeight - 48) / 2;
                }
            }
            containerElement.style.transition = 'none';
            animate({
                x, y,
                scaleX: 1,
                scaleY: 1,
                opacity: 1
            }, 'window-show');
            return;
            if (id != windowID) return;
            var iconPosition = window.utils.getPosition(ICON.item);

            hostElement.style.transition = 'transform 200ms ease, opacity 100ms ease-in-out, scale 200ms ease';
            hostElement.style.opacity = 1;
            hostElement.style.transformOrigin = 'bottom center'//`bottom ${iconPosition.x < window.innerWidth / 2 ? 'left' : iconPosition.x > window.innerWidth / 2 ? 'right' : 'center'}`;
            hostElement.style.transform = `translate(0, 0)`;
            hostElement.style.scale = 'revert-layer';
        })

        ICON.addEventListener('_hide', (id) => {
            if (id != windowID) return;
            minimize();
            return;
            if (id != windowID) return;
            var iconPosition = window.utils.getPosition(ICON.item);

            hostElement.style.opacity = 1;
            hostElement.style.transition = `transform 200ms cubic-bezier(.9,.1,.87,.5), opacity 100ms ease-in-out, scale 200ms cubic-bezier(.9,.1,.87,.5)`;
            hostElement.style.transformOrigin = 'bottom center'//`bottom ${iconPosition.x < window.innerWidth / 2 ? 'left' : iconPosition.x > window.innerWidth / 2 ? 'right' : 'center'}`;
            hostElement.style.scale = 0;
            setTimeout(function () {
                if (ICON.status.show == false) {
                    hostElement.style.opacity = 0;
                }
                clearTimeout(this);
            }, 100)
        })

        if (config.showOnTop == true) {
            containerElement.classList.add('show-on-top');
        }

        if (config.mica == true) {
            // hostElement.classList.add('mica');
            /*
            function generateMicaImage(canvas, bgImageUrl, width = 400, height = 300) {
                const ctx = canvas.getContext("2d");
                canvas.width = width;
                canvas.height = height;
    
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, width, height);
    
                    for (let i = 0; i < 3; i++) {
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(canvas, -1, 0, width, height);
                        ctx.drawImage(canvas, 1, 0, width, height);
                        ctx.drawImage(canvas, 0, -1, width, height);
                        ctx.drawImage(canvas, 0, 1, width, height);
                    }
    
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);
                    return canvas.toDataURL("image/png");
                };
    
                img.src = bgImageUrl;
            }
    
            var micaCanvas = document.createElement('canvas');
            micaCanvas.className = 'mica-canvas';
            shadowRoot.appendChild(micaCanvas);
    
            generateMicaImage(micaCanvas, await fs.getFileURL(window.getBackgroundImage()), window.innerWidth, window.innerHeight)
            */
        }

        function updateMica() {
            if (config.mica == true) {
                requestAnimationFrame(() => {
                    const rect = containerElement.getBoundingClientRect();
                    micaElement.style.clipPath = `inset(${rect.top + 1}px ${window.innerWidth - rect.right + 1}px ${window.innerHeight - rect.bottom + 1}px ${rect.left + 1}px)`;
                    micaElement.style.transform = `translate(${-rect.left}px,${-rect.top}px)`;
                })
            }
        }

        const observer = new ResizeObserver(updateMica);
        observer.observe(containerElement);
        window.addEventListener('resize', updateMica)

        parent.appendChild(containerElement);
        containerElement.appendChild(micaElement);
        containerElement.appendChild(hostElement);
        hostElement.appendChild(resizers);
        hostElement.appendChild(content);
        shadowRoot.appendChild(windowElement);
        windowElement.appendChild(toolbarElement);
        windowElement.appendChild(contentElement);

        containerElement.style.transition = 'none';
        animate({
            x: windowData.x,
            y: windowData.y,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            __from: {
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            }
        }, 'window-open');

        updateMica();

        if (config.resizable == false) {
            resizers.remove();
        }

        // Resizers
        Object.keys(resizerConfig).forEach(key => {
            var allowed = resizerConfig[key];
            var pointerDown = false;
            var pointerPosition = [];
            var resizer = document.createElement('div');
            var originalPosition = {};
            var originalSize = {};
            resizer.className = key;

            function updateSizeAndData(e) {
                const position = utils.getPointerPosition(e);
                var diffX = position.x - pointerPosition.x;
                var diffY = position.y - pointerPosition.y;
                var width = originalSize.width;
                var height = originalSize.height;
                if (allowed == 'vertical') {
                    diffX = 0;
                } else if (allowed == 'horizontal') {
                    diffY = 0;
                }
                var translateX = originalPosition.x;
                var translateY = originalPosition.y;
                // For vertical resize
                if (key.search('top') > -1) {
                    // Fixate bottom
                    translateY += diffY;
                    windowElement.style.height = height - diffY + 'px';
                    windowData.height = height - diffY;
                } else if (key.search('bottom') > -1) {
                    // Fixate top
                    windowElement.style.height = height + diffY + 'px';
                    windowData.height = height + diffY;
                }

                // For horizontal resize
                if (key.search('left') > -1) {
                    // Fixate right
                    translateX += diffX;
                    windowElement.style.width = width - diffX + 'px';
                    windowData.width = width - diffX;
                } else {
                    // Fixate left
                    windowElement.style.width = width + diffX + 'px';
                    windowData.width = width + diffX;
                }

                windowData.x = translateX;
                windowData.y = translateY;

                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;
            }

            function handleStartResizing(e) {
                if (isMaximized == true) return;
                pointerPosition = utils.getPointerPosition(e);
                originalPosition = {
                    x: windowData.x,
                    y: windowData.y
                }
                originalSize = {
                    width: windowData.width,
                    height: windowData.height
                }
                appWrapper.classList.add('moving');
                pointerDown = true;
                updateMica();
            }

            function handleMoveResizing(e) {
                if (pointerDown == true) {
                    try {
                        document.getSelection().removeAllRanges();
                    } catch (e) { };
                    updateSizeAndData(e);
                    updateMica();
                }
            }

            function handleEndResizing(e) {
                if (pointerDown == false) return;
                updateSizeAndData(e);
                pointerDown = false;
                appWrapper.classList.remove('moving');
                updateMica();
                console.log(windowData)
            }

            events.start.forEach(event => {
                resizer.addEventListener(event, handleStartResizing);
            })
            events.move.forEach(event => {
                window.addEventListener(event, handleMoveResizing);
            })
            events.end.forEach(event => {
                window.addEventListener(event, handleEndResizing);
            })

            resizers.appendChild(resizer);
        })

        // Default toolbar
        var toolbarInfo = document.createElement('div');
        var toolbarIcon = document.createElement('div');
        var toolbarTitle = document.createElement('div');
        var toolbarButtons = document.createElement('div');

        toolbarInfo.className = 'window-toolbar-info';
        toolbarIcon.className = 'window-toolbar-icon';
        toolbarTitle.className = 'window-toolbar-title';
        toolbarButtons.className = 'window-toolbar-buttons';

        var icon = config.icon || window.appRegistry.getIcon(path.callee);
        var title = config.title || 'App';

        toolbarTitle.innerHTML = window.utils.replaceHTMLTags(title);

        await (async () => {
            var url = URL.createObjectURL(await window.fs.downloadFile('C:/Winbows/System/styles/app.css'));
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = url;
            shadowRoot.appendChild(style);
            return;
        })();

        (async () => {
            var url = await window.fs.getFileURL(icon);
            await loadImage(url);
            toolbarIcon.style.backgroundImage = `url(${url})`;
        })();

        function changeTitle(title = '') {
            if (!title) return;
            config.title = title;
            toolbarTitle.innerHTML = window.utils.replaceHTMLTags(title);
            window.System.processes[pid].title = config.title || 'App';
            ICON.changeTitle(windowID, title);
        }

        function changeIcon(url = '') {
            if (!url) return;
            config.icon = url;
            toolbarIcon.style.backgroundImage = `url(${url})`;
            ICON.changeIcon(windowID, url);
        }

        var minimizeButton = document.createElement('div');
        var maximizeButton = document.createElement('div');
        var closeButton = document.createElement('div');

        minimizeButton.className = 'window-toolbar-button';
        maximizeButton.className = 'window-toolbar-button';
        closeButton.className = 'window-toolbar-button close';

        minimizeButton.addEventListener('click', () => {
            ICON.hide(windowID);
        });
        closeButton.addEventListener('click', close);

        // var iconStyle = document.createElement('style');
        // iconStyle.innerHTML = `.window{--close-icon:url(${await window.fs.getFileURL(icons[0])});--maximize-icon:url(${await window.fs.getFileURL(icons[1])});--minimize-icon:url(${await window.fs.getFileURL(icons[2])});--maxmin-icon:url(${await window.fs.getFileURL(icons[3])});}`;
        // shadowRoot.appendChild(iconStyle);

        var minimizeImage = document.createElement('div');
        minimizeImage.className = 'window-toolbar-button-icon';
        minimizeImage.style.backgroundImage = `url(${icons.minimize})`;
        minimizeButton.appendChild(minimizeImage);

        var maximizeImage = document.createElement('div');
        maximizeImage.className = 'window-toolbar-button-icon';
        maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
        maximizeButton.appendChild(maximizeImage);

        var closeImage = document.createElement('div');
        closeImage.className = 'window-toolbar-button-icon';
        closeImage.style.backgroundImage = `url(${icons.close})`;
        closeButton.appendChild(closeImage)

        toolbarButtons.appendChild(minimizeButton);
        toolbarButtons.appendChild(maximizeButton);
        toolbarButtons.appendChild(closeButton);

        toolbarInfo.appendChild(toolbarIcon);
        toolbarInfo.appendChild(toolbarTitle);

        toolbarElement.appendChild(toolbarInfo);
        toolbarElement.appendChild(toolbarButtons);

        async function unmaximizeWindow(animation = true) {
            originalSnapSide = '';
            isMaximized = false;
            containerElement.removeAttribute('data-maximized');
            containerElement.style.transform = `translate(${windowData.x}px,${windowData.y}px)`;

            if (animation == true) {
                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)
            } else {
                containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                windowElement.style.transition = 'none';
            }

            windowElement.style.width = windowData.width + 'px';
            windowElement.style.height = windowData.height + 'px';
            windowElement.style.borderRadius = 'revert-layer';
            maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
            updateMica()
        }

        async function maximizeWindow(animation = true) {
            originalSnapSide = 'f';
            isMaximized = true;
            containerElement.setAttribute('data-maximized', 'true');
            containerElement.style.transform = `translate(0px,0px)`;
            // hostElement.style.width = 'var(--winbows-screen-width)';
            // hostElement.style.height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';

            if (animation == true) {
                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)
            } else {
                containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                windowElement.style.transition = 'none';
            }

            windowElement.style.width = 'var(--winbows-screen-width)';
            windowElement.style.height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';
            windowElement.style.borderRadius = '0';
            maximizeImage.style.backgroundImage = `url(${icons.maximize})`;
            updateMica()
        }


        maximizeButton.addEventListener('click', () => {
            if (isMaximized == false) {
                maximizeWindow();
            } else {
                unmaximizeWindow();
            }
        });

        function minimize() {
            var position = utils.getPosition(ICON.item);
            var width = containerElement.offsetWidth;
            var height = containerElement.offsetHeight;

            containerElement.style.transition = 'none';

            var scaleX = 180 / width;
            var scaleY = 120 / height;
            var scale = scaleX;

            if (scaleY < scaleX) {
                scale = scaleY
            }

            var windowWidth = width * scale;
            var windowHeight = height * scale;

            animate({
                x: position.x - width * (1 - scale) / 2 - windowWidth / 2 + ICON.item.offsetWidth / 2,
                y: window.innerHeight - 48 - 8 - height * (1 - scale) / 2 - windowHeight,
                scaleX: scale,
                scaleY: scale,
                opacity: 0
            }, 'window-hide');
        }

        function close() {
            if (window.modes.debug == true) {
                console.log('close', windowID);
            }
            containerElement.style.transition = 'none';
            const position = utils.getPosition(containerElement);
            animate({
                x: position.x,
                y: position.y,
                scaleX: .9,
                scaleY: .9,
                opacity: 0
            }, 'window-close');
            ICON.close(windowID);
            window.System.processes[pid]._exit_Window();
        }

        if (config.fullscreenable == false) {
            maximizeButton.remove();
        }
        if (config.minimizable == false) {
            minimizeButton.remove();
        }
        if (config.maximizable == false) {
            maximizeButton.remove();
        }
        if (config.closable == false) {
            closeButton.remove();
        }

        var pointerMoved = false;
        var showSnapPreview = false;
        var snapMargin = 12;
        var pointerDown = false;
        var pointerPosition = [];
        var originalPosition = {};
        var immovableElements = [];
        var snapSide = '';

        function getSnapSide(x, y) {
            var side = '';
            if (y >= appWrapper.offsetHeight - snapMargin) {
                side += 'b';
            } else if (y <= snapMargin) {
                side += 't';
            }
            if (x >= appWrapper.offsetWidth - snapMargin) {
                side += 'r';
            } else if (x <= snapMargin) {
                side += 'l';
            }
            if (side.length == 1) {
                side += 'f';
            }
            if (side.includes('b') && side.includes('f')) {
                return '';
            }
            return side;
        }

        function getSnapSize(side) {
            var width = 'var(--winbows-screen-width)';
            var height = 'calc(var(--winbows-screen-height) - var(--taskbar-height))';
            if (side.includes('l') || side.includes('r')) {
                width = 'calc(var(--winbows-screen-width) / 2)';
            }
            if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                height = 'calc((var(--winbows-screen-height) - var(--taskbar-height)) / 2)';
            }
            return {
                width: width,
                height: height
            }
        }

        function getSnapPosition(side) {
            var left = '0';
            var top = '0';
            if (side.includes('r')) {
                left = 'calc(var(--winbows-screen-width) / 2)';
            }
            if (side.includes('b')) {
                top = 'calc((var(--winbows-screen-height) - var(--taskbar-height)) / 2)';
            }
            return {
                left: left,
                top: top
            }
        }

        function getSnapPreviewSize(side) {
            var width = appWrapper.offsetWidth - snapMargin * 2;
            var height = appWrapper.offsetHeight - snapMargin * 2;
            if (side.includes('l') || side.includes('r')) {
                width = appWrapper.offsetWidth / 2 - snapMargin * 2;
            }
            if ((side.includes('t') && !side.includes('f')) || side.includes('b')) {
                height = appWrapper.offsetHeight / 2 - snapMargin * 2;
            }
            return {
                width: width,
                height: height
            }
        }

        function getSnapPreviewPosition(side) {
            var left = snapMargin;
            var top = snapMargin;
            if (side.includes('r')) {
                left = appWrapper.offsetWidth / 2 + snapMargin;
            }
            if (side.includes('b')) {
                top = appWrapper.offsetHeight / 2 + snapMargin;
            }
            return {
                left: left,
                top: top
            }
        }

        function handleStartMoving(e) {
            if (toolbarButtons.contains(e.target)) return;
            var prevent = false;
            immovableElements.forEach(element => {
                if (element == e.target || element.contains(e.target)) {
                    prevent = true;
                }
            })
            if (prevent == true) return;
            const pointer = utils.getPointerPosition(e);
            var pageX = pointer.x, pageY = pointer.y;
            if (pageX < 0) {
                pageX = 0;
            } else if (pageX > window.innerWidth) {
                pageX = window.innerWidth;
            }
            if (pageY < 0) {
                pageY = 0;
            } else if (pageY > parent.offsetHeight) {
                pageY = parent.offsetHeight;
            }
            pointerDown = true;
            pointerMoved = false;
            var position = utils.getPosition(containerElement);
            pointerPosition = [pageX, pageY];
            originalPosition = {
                x: position.x,
                y: position.y
            }
            triggerEvent('dragstart', {
                preventDefault: () => {
                    handleEndMoving({}, 'preventDefault');
                },
                type: e.type,
                target: e.target
            })
            updateMica()
        }

        function handleMoveMoving(e) {
            if (pointerDown) {
                try {
                    document.getSelection().removeAllRanges();
                } catch (e) { };
                if (originalSnapSide != '' || isMaximized == true || windowElement.offsetWidth != windowData.width || windowElement.offsetHeight != windowElement.offsetHeight) {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                    containerElement.removeAttribute('data-maximized');
                    windowElement.style.width = windowData.width + 'px';
                    windowElement.style.height = windowData.height + 'px';
                    windowElement.style.borderRadius = 'revert-layer';
                    maximizeImage.style.backgroundImage = `url(${icons.maxmin})`;
                    isMaximized = false;
                    originalSnapSide = '';
                }
                const pointer = utils.getPointerPosition(e);
                var pageX = pointer.x, pageY = pointer.y;
                if (pageX != pointerPosition[0] || pageY != pointerPosition[1]) {
                    pointerMoved = true;
                }
                if (pageX < 0) {
                    pageX = 0;
                } else if (pageX > window.innerWidth) {
                    pageX = window.innerWidth;
                }
                if (pageY < 0) {
                    pageY = 0;
                } else if (pageY > parent.offsetHeight) {
                    pageY = parent.offsetHeight;
                }
                const side = getSnapSide(pageX, pageY);
                appWrapper.classList.add('moving');

                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;

                if (config.snappable == false) {
                    snapSide = '';
                } else {
                    if (side != '') {
                        snapPreview.style.position = 'fixed';
                        if (!showSnapPreview == true) {
                            snapPreview.style.width = containerElement.offsetWidth + 'px';
                            snapPreview.style.height = containerElement.offsetHeight + 'px';
                            snapPreview.style.left = window.utils.getPosition(containerElement).x + 'px';
                            snapPreview.style.top = window.utils.getPosition(containerElement).y + 'px';
                            snapPreview.classList.add('active');
                        }
                        var size = getSnapPreviewSize(side);
                        var position = getSnapPreviewPosition(side);
                        snapPreview.style.transition = 'all .15s ease-in-out';
                        snapPreview.style.zIndex = containerElement.style.zIndex || ICON.getMaxZIndex();
                        snapPreview.style.left = position.left + 'px';
                        snapPreview.style.top = position.top + 'px';
                        snapPreview.style.width = size.width + 'px';
                        snapPreview.style.height = size.height + 'px';
                        showSnapPreview = true;
                    } else {
                        if (showSnapPreview == true) {
                            snapPreview.style.width = containerElement.offsetWidth + 'px';
                            snapPreview.style.height = containerElement.offsetHeight + 'px';
                            snapPreview.style.left = window.utils.getPosition(containerElement).x + 'px';
                            snapPreview.style.top = window.utils.getPosition(containerElement).y + 'px';
                            setTimeout(() => {
                                if (showSnapPreview == true) return;
                                snapPreview.style.transition = 'none';
                                snapPreview.classList.remove('active');
                            }, 150)
                        }
                        showSnapPreview = false;
                    }
                    snapSide = side;
                }
                triggerEvent('dragging', {
                    preventDefault: () => {
                        handleEndMoving({}, 'preventDefault');
                    },
                    type: e.type,
                    target: e.target
                })
                updateMica()
            }
        }

        function handleEndMoving(e, type = 'user') {
            if (pointerDown == false) return;
            if (pointerMoved == false) {
                return pointerDown = false;
            }
            pointerDown = false;
            showSnapPreview = false;
            snapPreview.style.width = containerElement.offsetWidth + 'px';
            snapPreview.style.height = containerElement.offsetHeight + 'px';
            snapPreview.style.left = window.utils.getPosition(containerElement).x + 'px';
            snapPreview.style.top = window.utils.getPosition(containerElement).y + 'px';
            setTimeout(() => {
                snapPreview.style.transition = 'none';
                snapPreview.classList.remove('active');
            }, 150)
            appWrapper.classList.remove('moving');
            if (snapSide != '') {
                if (snapSide.includes('t') && snapSide.includes('f')) {
                    maximizeWindow();
                }
                var position = getSnapPosition(snapSide);
                var size = getSnapSize(snapSide);

                containerElement.style.transform = `translate(${position.left},${position.top})`;

                containerElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                windowElement.style.transition = 'all 200ms cubic-bezier(.8,.01,.28,.99)';
                setTimeout(() => {
                    containerElement.style.transition = 'transform 100ms ease-in-out, opacity 100ms ease-in-out';
                    windowElement.style.transition = 'none';
                }, 200)

                windowElement.style.width = size.width;
                windowElement.style.height = size.height;
                windowElement.style.borderRadius = 0;
            } else if (type == 'user') {
                let pageX = e.pageX;
                let pageY = e.pageY;
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    pageX = touch.pageX;
                    pageY = touch.pageY;
                }
                if (pageX < 0) {
                    pageX = 0;
                } else if (pageX > window.innerWidth) {
                    pageX = window.innerWidth;
                }
                if (pageY < 0) {
                    pageY = 0;
                } else if (pageY > parent.offsetHeight) {
                    pageY = parent.offsetHeight;
                }
                windowData.x = originalPosition.x + pageX - pointerPosition[0];
                windowData.y = originalPosition.y + pageY - pointerPosition[1];
                containerElement.style.transition = 'none';
                containerElement.style.transform = `translate(${originalPosition.x + pageX - pointerPosition[0]}px,${originalPosition.y + pageY - pointerPosition[1]}px)`;
            }
            originalSnapSide = snapSide;
            snapSide = '';
            triggerEvent('dragend', {
                preventDefault: () => {

                },
                type: e.type,
                target: e.target
            })
            updateMica()
        }

        var windowTheme = config.theme == 'system' ? window.System.theme.get() : config.theme == 'dark' ? 'dark' : 'light';
        windowElement.setAttribute('data-theme', windowTheme);

        function setTheme(theme) {
            windowTheme = theme == 'dark' ? 'dark' : 'light';
            windowElement.setAttribute('data-theme', windowTheme);
        }

        function getTheme(theme) {
            return windowTheme;
        }

        function setSnappable(value) {
            config.snappable = value == true;
        }

        function setMovable(element) {
            events.start.forEach(event => {
                element.addEventListener(event, handleStartMoving);
            })
        }

        function unsetMovable(element) {
            events.start.forEach(event => {
                element.removeEventListener(event, handleStartMoving);
            })
        }

        function setImmovable(element) {
            if (!immovableElements.includes(element)) {
                immovableElements.push(element);
            }
        }

        function unsetImmovable(element) {
            if (immovableElements.includes(element)) {
                immovableElements.splice(immovableElements.indexOf(element), 1);
            }
        }

        function triggerEvent(event, details) {
            if (listeners.hasOwnProperty(event)) {
                listeners[event].forEach(listener => listener(details));
            }
        }

        function addEventListener(event, listener) {
            if (!listeners.hasOwnProperty(event)) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
        }

        events.start.forEach(event => {
            toolbarElement.addEventListener(event, handleStartMoving);
        })
        events.move.forEach(event => {
            window.addEventListener(event, handleMoveMoving);
        })
        events.end.forEach(event => {
            window.addEventListener(event, handleEndMoving);
        })

        containerElement.addEventListener('pointerdown', (e) => {
            ICON.focus(windowID);
        })

        ICON.focus(windowID);

        function useTabview(config = {
            icon: true
        }) {
            var tabview = document.createElement('div');
            var tabStrip = document.createElement('div');
            var tabStripTabs = document.createElement('div');
            var tabStripCreate = document.createElement('div');
            var tabStripCreateButton = document.createElement('button');

            tabview.className = 'tabview';
            tabStrip.className = 'tabview-tabstrip';
            tabStripTabs.className = 'tabview-tabstrip-tabs';
            tabStripCreate.className = 'tabview-tabstrip-create';
            tabStripCreateButton.className = 'tabview-tabstrip-create-button';

            contentElement.appendChild(tabview);
            if (config.icon == false) {
                toolbarElement.replaceChild(tabStrip, toolbarInfo);
            } else {
                toolbarInfo.replaceChild(tabStrip, toolbarTitle);
            }
            tabStrip.appendChild(tabStripTabs);
            tabStrip.appendChild(tabStripCreate);
            tabStripCreate.appendChild(tabStripCreateButton);

            tabStripCreateButton.addEventListener('click', async () => {
                triggerEvent('requestCreateTab', {
                    active: true,
                    target: tabStripCreateButton
                })
            })

            addEventListener('dragstart', (e) => {
                if (e.target == tabStripCreateButton || tabStripTabs.contains(e.target)) {
                    e.preventDefault();
                }
            })

            var order = [];
            var tabs = {};
            var listeners = {};

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

            function on(event, listener) {
                if (!listeners[event]) {
                    listeners[event] = []
                }
                listeners[event].push(listener);
            }

            function triggerEvent(event, detail) {
                if (listeners[event]) {
                    listeners[event].forEach(listener => listener(detail));
                }
            }

            class Tab {
                constructor(config = {
                    active: true,
                    icon: true
                }) {
                    // Initialize tab
                    this.tab = document.createElement('div');
                    this.tabInfo = document.createElement('div');
                    this.tabIcon = document.createElement('div');
                    this.tabHeader = document.createElement('div');
                    this.tabClose = document.createElement('div');
                    this.tabviewItem = document.createElement('div');

                    this.id = randomID();
                    order.push(this.id);

                    this.tab.className = 'tabview-tabstrip-tab';
                    this.tabInfo.className = 'tabview-tabstrip-tab-info';
                    this.tabIcon.className = 'tabview-tabstrip-tab-icon';
                    this.tabHeader.className = 'tabview-tabstrip-tab-header';
                    this.tabClose.className = 'tabview-tabstrip-tab-close';
                    this.tabviewItem.className = 'tabview-item';

                    var originalPosition = order.indexOf(this.id);
                    var currentPosition = order.indexOf(this.id);
                    var startX = 0;
                    var dragging = false;
                    var events = {
                        "start": ["mousedown", "touchstart", "pointerdown"],
                        "move": ["mousemove", "touchmove", "pointermove"],
                        "end": ["mouseup", "touchend", "pointerup", "blur"]
                    }

                    tabs[this.id] = this;

                    function moveNodeToIndex(nodeIndex, targetIndex, container) {
                        const children = Array.from(container.children);
                        if (nodeIndex < 0 || nodeIndex >= children.length || targetIndex < 0 || targetIndex >= children.length) {
                            // console.error('over range');
                            return;
                        }
                        const nodeToMove = children[nodeIndex];
                        if (targetIndex === children.length - 1) {
                            container.appendChild(nodeToMove);
                        } else if (targetIndex < nodeIndex) {
                            container.insertBefore(nodeToMove, children[targetIndex]);
                        } else {
                            container.insertBefore(nodeToMove, children[targetIndex + 1]);
                        }
                    }

                    function moveArrayItem(arr, fromIndex, toIndex) {
                        if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) {
                            // console.error('over range');
                            return;
                        }
                        const item = arr.splice(fromIndex, 1)[0];
                        arr.splice(toIndex, 0, item);
                        // console.log(arr, item)
                        return arr;
                    }

                    var dragStart = (e) => {
                        if (this.tabClose.contains(e.target)) return;
                        this.focus();
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                        }
                        originalPosition = order.indexOf(this.id);
                        currentPosition = order.indexOf(this.id);
                        this.tab.style.transition = 'none';
                        dragging = true;
                        startX = e.pageX;
                    }

                    var dragMove = (e) => {
                        if (!dragging) return;
                        try {
                            document.getSelection().removeAllRanges();
                        } catch (e) { };
                        if (e.type.startsWith('touch')) {
                            var touch = e.touches[0] || e.changedTouches[0];
                            e.pageX = touch.pageX;
                        }
                        var x = e.pageX - startX;
                        var unit = this.tab.offsetWidth + 8;
                        var count = Math.round(x / unit);

                        console.log(config.tabAnimation)

                        if (config.tabAnimation != false) {
                            this.tab.style.transform = `translateX(${x}px)`;
                        }

                        currentPosition = originalPosition + count;
                        if (currentPosition > order.length - 1) {
                            currentPosition = order.length - 1;
                        } else if (currentPosition < 0) {
                            currentPosition = 0;
                        }
                        count = currentPosition - originalPosition;

                        if (x > 0) {
                            Object.values(tabs).filter(tab => tab.id != this.id).forEach(tab => {
                                if (config.tabAnimation != false) {
                                    tab.tab.style.transition = 'revert-layer';
                                }
                                var index = order.indexOf(tab.id);
                                if (index <= originalPosition + count && index > originalPosition) {
                                    tab.tab.style.transform = 'translateX(calc(-100% - 8px))';
                                } else {
                                    tab.tab.style.transform = '';
                                }
                            })
                        } else if (x < 0) {
                            Object.values(tabs).filter(tab => tab.id != this.id).forEach(tab => {
                                if (config.tabAnimation != false) {
                                    tab.tab.style.transition = 'revert-layer';
                                }
                                var index = order.indexOf(tab.id);
                                if (index >= originalPosition + count && index < originalPosition) {
                                    tab.tab.style.transform = 'translateX(calc(100% + 8px))';
                                } else {
                                    tab.tab.style.transform = '';
                                }
                            })
                        }
                    }

                    var dragEnd = () => {
                        if (dragging == false) return;
                        dragging = false;
                        if (currentPosition != originalPosition) {
                            moveNodeToIndex(originalPosition, currentPosition, tabStripTabs);
                            moveArrayItem(order, originalPosition, currentPosition);
                            originalPosition = currentPosition;
                            Object.values(tabs).forEach(tab => {
                                tab.tab.style.transition = 'none';
                                tab.tab.style.transform = 'translateX(0)';
                                tab.tab.style['-webkit-transform']
                                setTimeout(() => {
                                    tab.tab.style.transition = 'revert-layer';
                                }, 200)
                            })
                        } else {
                            this.tab.style.transition = 'revert-layer';
                            this.tab.style.transform = '';
                        }
                    }

                    events.start.forEach(event => {
                        this.tab.addEventListener(event, dragStart);
                    })
                    events.move.forEach(event => {
                        window.addEventListener(event, dragMove);
                    })
                    events.end.forEach(event => {
                        window.addEventListener(event, dragEnd);
                    })

                    this.tabClose.addEventListener('click', () => {
                        this.close()
                    });

                    this.tab.appendChild(this.tabInfo);
                    this.tab.appendChild(this.tabClose);
                    this.tabInfo.appendChild(this.tabIcon);
                    this.tabInfo.appendChild(this.tabHeader);
                    tabStripTabs.appendChild(this.tab);
                    tabview.appendChild(this.tabviewItem);

                    if (config.active != false) {
                        this.focus();
                    }
                    if (config.icon == false) {
                        this.tabIcon.remove();
                    }
                }
                getContainer() {
                    return this.tabviewItem;
                }
                focus() {
                    Object.values(tabs).forEach(tab => {
                        tab.blur();
                    })
                    this.tab.classList.add('active');
                    this.tabviewItem.classList.add('active');
                }
                changeHeader(header) {
                    this.tabHeader.innerHTML = header;
                }
                changeIcon(icon) {
                    this.tabIcon.style.backgroundImage = `url(${icon})`;
                }
                close() {
                    this.tab.remove();
                    this.tabviewItem.remove();
                    var index = order.indexOf(this.id);
                    delete tabs[this.id];
                    order.splice(index, 1);
                    if (Object.keys(tabs).length == 0) {
                        return close();
                    } else if (order[index]) {
                        return tabs[order[index]].focus();
                    } else if (order[index - 1]) {
                        return tabs[order[index - 1]].focus();
                    } else {
                        return tabs[order[0]].focus();
                    }
                }
                blur() {
                    this.tab.classList.remove('active');
                    this.tabviewItem.classList.remove('active');
                }
            }
            return { Tab, on };
        }

        return {
            shadowRoot, container: containerElement, window: windowElement, toolbar: toolbarElement, content: contentElement,
            close, addEventListener, setTheme, getTheme, setMovable, unsetMovable, setImmovable, unsetImmovable, changeTitle, changeIcon,
            setSnappable,
            useTabview
        };
    }
    return;
})();

// Init kernel files 
async function loadKernel() {
    async function runKernel() {
        var files = {
            //kernel: ['Winbows/System/process.js'],
            animation: [/*'Winbows/System/animation.js'*/],
            //ui: ['Winbows/System/ui/winui.min.js'],
            //module: [/*'Winbows/System/modules/main/domtool.js', 'Winbows/System/modules/main/toolbarComponents.js',*/ 'Winbows/System/modules/main/browserWindow.js'],
            component: [],
            //taskbar: ['Winbows/SystemApps/Microhard.Winbows.Taskbar/app.js'],
            //compiler: ['Winbows/System/compilers/worker/compiler.js', 'Winbows/System/compilers/window/compiler.js']
        }
        return new Promise(async (resolve, reject) => {
            var kernelFiles = [];
            Object.values(files).forEach(category => {
                kernelFiles = kernelFiles.concat(category);
            })
            var loadedKernels = 0;
            var kernelLoading = loadingText(`Loading kernels ( ${loadedKernels} / ${kernelFiles.length} )`);
            window.loadedKernel = () => {
                loadedKernels++;
                kernelLoading.innerHTML = `Loading kernels ( ${loadedKernels} / ${kernelFiles.length} )`;
                loadingProgressBar.style.width = loadedKernels / kernelFiles.length * 100 + '%';
                if (window.modes.debug == true) {
                    console.log(loadedKernels)
                }
                if (loadedKernels == kernelFiles.length) {
                    loadingProgressBar.style.width = '100%';
                    loadingText(`Loading assets...`);
                    resolve();
                }
            }
            function errorHandler(msg, func = () => { location.reload(); }) {
                var warning = document.createElement('div');
                var warningContainer = document.createElement('div');
                var warningText = document.createElement('span');
                var warningRestart = document.createElement('div');

                warning.className = 'winbows-loading-warning';
                warningContainer.className = 'winbows-loading-warning-container';
                warningRestart.className = 'winbows-loading-warning-restart';
                warningText.className = 'winbows-loading-warning-text';

                warningText.innerHTML = msg;
                warningRestart.innerHTML = `Restart`;
                document.body.appendChild(warning);
                warning.appendChild(warningContainer);
                warningContainer.appendChild(warningText);
                warningContainer.appendChild(warningRestart);
                loadingText(msg);
                // window.Crash(msg);
                warningRestart.addEventListener('click', func);
            }
            try {
                for (let i in kernelFiles) {
                    const path = await fs.getFileURL(mainDisk + ':/' + kernelFiles[i]);
                    fetch(path).then(res => res.text()).then((kernel) => {
                        try {
                            new Function(kernel)();
                        } catch (e) {
                            errorHandler(`Failed to execute kernel : ${kernelFiles[i]}`, async () => {
                                try {
                                    fs.rm(mainDisk + ':/' + kernelFiles[i]).then((status) => {
                                        console.log(status);
                                        location.reload();
                                    });
                                } catch (e) {
                                    window.Crash(e);
                                }
                            });
                        }
                    }).catch(e => {
                        console.log(e)
                        errorHandler("Failed to execute kernels, details:" + e);
                    })
                    /*
                    kernel.src = path;
                    kernel.onload = () => {
                        kernel.remove();
                    }
                    document.head.appendChild(kernel);
                    */
                }
            } catch (e) {
                console.log(e)
                errorHandler("Failed to execute kernels, details:" + e);
            }
        })
    }

    await runKernel();
}

// await loadKernel(); // skip

await BrowserWindow();
const taskbar = await Taskbar();
Winbows.Screen.appendChild(taskbar.taskbar);
window.Winbows.Screen.appendChild(taskbar.startMenuContainer);

window.Taskbar.pinApp('C:/User/Documents/sdk-v1/examples/wrt-terminal-app-demo/app.wrt');
//window.Taskbar.pinApp('C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.wrt');
await window.Taskbar.preloadImage();

setWinbows(window.Winbows);

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
                } else if (window.utils.getFileExtension(path) == '.wbsf') {
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
                } else if (['.ttf', '.otf', '.woff', '.woff2', '.eot'].includes(window.utils.getFileExtension(path))) {
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
                                window.document.body.style.setProperty('--winbows-font-default', fontName);

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
                    var type = utils.getFileExtension(path) == '.link' ? 'shortcut' : stat.isFile() ? 'file' : 'directory';
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
        var extension = window.utils.getFileExtension(file).toLowerCase();
        var viewer = window.System.FileViewers.defaultViewers[extension];
        if (!viewer) {
            return null;
        } else {
            return window.System.FileViewers.registeredViewers[viewer];
        }
    },
    getViewers: (file = '') => {
        var extension = window.utils.getFileExtension(file).toLowerCase();
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

function loadImage(url) {
    return new Promise(async (resolve, reject) => {
        var img = new Image();
        img.onload = async () => {
            return resolve();
        }
        img.onerror = async (err) => {
            return reject(err);
        }
        img.src = url;
    })
}

window.System.addEventListener('load', async (e) => {
    // Initialize screen lock 
    var init = true;
    var now = new Date();
    var leftToUpdateTime = (60 - now.getSeconds()) * 1000;
    var leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - (now.getMinutes() * 60) - now.getSeconds()) * 1000;

    screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
    screenLockDate.innerHTML = now.toLocaleDateString(void 0, {
        weekday: "long",
        month: "long",
        day: "numeric"
    })

    function updateTime() {
        var now = new Date();
        var leftToUpdateTime = (60 - now.getSeconds()) * 1000;
        screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
        setTimeout(updateTime, leftToUpdateTime);
    }

    function updateDate() {
        var now = new Date();
        var leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - ((60 - now.getMinutes()) * 60) - now.getSeconds()) * 1000;
        screenLockDate.innerHTML = now.toLocaleDateString(void 0, {
            weekday: "long",
            month: "long",
            day: "numeric"
        })
        setTimeout(updateDate, leftToUpdateDate);
    }

    if (window.modes.debug == true) {
        console.log('Next update of time :', new Date(Date.now() + leftToUpdateTime))
        console.log('Next update of date :', new Date(Date.now() + leftToUpdateDate))
    }

    setTimeout(updateTime, leftToUpdateTime);
    setTimeout(updateDate, leftToUpdateDate);

    screenLockMain.addEventListener('click', () => {
        screenLock.classList.add('signin');
    })

    screenLockSigninButton.addEventListener('click', () => {
        screenLockContainer.classList.remove('active');
        screenLock.classList.remove('signin');
        if (init == true) {
            initTaskbar();
            init = false;

            kernelRuntime.runCode('await(()=>{return new Promise(_=>{})})();', {
                __filename: 'C:/Winbows/System/kernel/kernel.js',
                __dirname: 'C:/Winbows/System/kernel/'
            })
            kernelRuntime.process.title = 'System';

            var command = getJsonFromURL()['command'];
            if (command) {
                ShellInstance.execCommand(command);
            }
        }
    })

    if (now - startLoadingTime < 1000) {
        await delay(1000 - (now - startLoadingTime));
    }

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

setStartStatus(true);

window.System.triggerEvent('load');

// new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'system').start();
// new Process('C:/Winbows/SystemApps/Microhard.Winbows.Test/app.js', 'system').start();

window.utils.formatBytes = formatBytes;

function getStackTrace() {
    var stack;

    try {
        throw new Error('');
    } catch (error) {
        stack = error.stack || '';
    }

    stack = stack.split('\n').map(function (line) { return line.trim(); });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
}