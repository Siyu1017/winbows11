import { root, desktop, desktopItems, backgroundImage } from './viewport.js';
import { fsUtils } from '../lib/fs.js';
import { System } from './system.js';
import WinUI from '../ui/winui.js';
import { WRT } from './WRT/kernel.js';
import { setInitFn } from './lockScreen.js';

//import BrowserWindow from './browserWindow.js';
import { setWinbows } from './WRT/WApplication.v2.js';
import { kernelRuntime, apis } from './kernelRuntime.js';
import Devtool from './devtool/main.js';

import * as utils from '../utils.js';
import taskbar from './taskbar/index.js';
import "./lockScreen.js"



//window.WinUI = WinUI;

const { fs, process, __dirname, __filename, requireAsync, module, exports, runtimeID, ShellInstance } = apis;

window.kernelRuntime = kernelRuntime;

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




function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.delay = delay;

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


(async () => {
    // Initialize screen lock 
    var init = true;

    const now = Date.now();
    if (now - startLoadingTime < 1000) {
        await delay(1000 - (now - startLoadingTime));
    }

    clearInterval(updateProgressId);
    loadingProgressBar.style.width = '100%';

    System.desktop.update();

    // await delay(1000);

    // Remove loading 
    loadingContainer.classList.remove('active');

    setInitFn(async function () {
        await delay(200);

        // Initialize Taskbar
        // window.Taskbar.init();

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
    })

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

    console.log(kernelRuntime, System, window.Winbows)

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
})();