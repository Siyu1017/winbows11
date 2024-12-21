'use strict';

!(async () => {
    Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; }

    const path = {
        compilers: 'Winbows/System/compilers',
        components: 'Winbows/System/components',
        fonts: 'Winbows/fonts',
        icons: 'Winbows/icons',
        logs: 'Winbows/System/Logs',
        themes: 'Winbows/themes',
        ui: 'Winbows/System/ui'
    }
    const debuggerMode = false;
    const devMode = (getJsonFromURL()['dev'] || getJsonFromURL()['develop'] || getJsonFromURL()['embed']) ? true : false;

    var startLoadingTime = Date.now();

    // Loading
    var loadingContainer = document.createElement('div');
    var loadingImage = document.createElement('div');
    var loadingSpinner = devMode == true || window.needsUpdate == true ? document.createElement('div') : document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

    if (devMode == false && window.needsUpdate == false) {
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
    window.System = {};
    window.System.build = localStorage.getItem('WINBOWS_BUILD_ID') || 'UNKNOWN';
    window.System.listeners = {};
    window.System.processes = {};
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
    window.workerModules = {};
    window.utils = {};
    window.debuggers = {
        getStackTrace
    }

    // Check updates
    /*
    try {
        await fetch('https://api.github.com/repos/Siyu1017/winbows11/commits').then(json => {
            return json.json();
        }).then((res) => {
            var latest = res[0].sha;
            if (latest == window.System.build) {
                // Not to update
            } else {
                console.log('New version available: ', latest);
            }
            window.System.build = res[0].sha;
            localStorage.setItem('WINBOWS_BUILD_ID', window.System.build);
        })
    } catch (e) {
        // Not to update
    }
    */

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

    window.utils.getPosition = getPosition;
    window.utils.getJsonFromURL = getJsonFromURL;

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
            'jpg': 'C:/Winbows/icons/files/image.ico',
            'png': 'C:/Winbows/icons/files/image.ico',
            'gif': 'C:/Winbows/icons/files/image.ico',
            'svg': 'C:/Winbows/icons/files/image.ico',
            'webp': 'C:/Winbows/icons/files/image.ico',
            'jpeg': 'C:/Winbows/icons/files/image.ico',
            'ico': 'C:/Winbows/icons/files/image.ico',
            'bmp': 'C:/Winbows/icons/files/image.ico',
            'mp3': 'C:/Winbows/icons/files/audio.ico',
            'wav': 'C:/Winbows/icons/files/audio.ico',
            'ogg': 'C:/Winbows/icons/files/audio.ico',
            'mp4': 'C:/Winbows/icons/files/video.ico',
            'webm': 'C:/Winbows/icons/files/video.ico',
            'avi': 'C:/Winbows/icons/files/video.ico',
            'mov': 'C:/Winbows/icons/files/video.ico',
            'txt': 'C:/Winbows/icons/files/text.ico',
            'exe': 'C:/Winbows/icons/files/program.ico',
            'zip': 'C:/Winbows/icons/folders/zip.ico',
            'ttf': 'C:/Winbows/icons/files/font.ico',
            'otf': 'C:/Winbows/icons/files/font.ico',
            'woff': 'C:/Winbows/icons/files/font.ico',
            'woff2': 'C:/Winbows/icons/files/font.ico',
            'eot': 'C:/Winbows/icons/files/font.ico',
            'doc': 'C:/Winbows/icons/files/office/worddocument.ico',
            'docx': 'C:/Winbows/icons/files/office/worddocument.ico',
            'xls': 'C:/Winbows/icons/files/office/excelsheet.ico',
            'xlsx': 'C:/Winbows/icons/files/office/excelsheet.ico',
            'ppt': 'C:/Winbows/icons/files/office/powerpointopen.ico',
            'pptx': 'C:/Winbows/icons/files/office/powerpointopen.ico',
            // Edge
            'html': 'C:/Winbows/icons/applications/tools/edge.ico',
            // VSCode
            'css': 'C:/Program Files/VSCode/File Icons/css.ico',
            'js': 'C:/Program Files/VSCode/File Icons/javascript.ico',
            'json': 'C:/Program Files/VSCode/File Icons/json.ico',
            // Winbows script files
            'wbsf': 'C:/Winbows/icons/files/executable.ico'
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
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js',
                configurable: 'C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/configurable.js'
            },
            'edge': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/',
                icon: 'C:/Winbows/icons/applications/tools/edge.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/app.js'
            },
            'edgebeta': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/',
                icon: 'C:/Winbows/icons/applications/tools/edgebeta.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.js'
            },
            'store': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/',
                icon: 'C:/Winbows/icons/applications/novelty/store2.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MicrohardStore/app.js'
            },
            'cmd': {
                path: 'C:/Program Files/Command/',
                icon: 'C:/Winbows/icons/applications/novelty/terminal.ico',
                script: 'C:/Program Files/Command/app.js'
            },
            'notepad': {
                path: 'C:/Program Files/Notepad/',
                icon: 'C:/Winbows/icons/applications/novelty/notepad.ico',
                script: 'C:/Program Files/Notepad/app.js'
            },
            'calculator': {
                path: 'C:/Program Files/Calculator/',
                icon: 'C:/Winbows/icons/applications/novelty/calculator.ico',
                script: 'C:/Program Files/Calculator/app.js'
            },
            'paint': {
                path: 'C:/Program Files/Paint/',
                icon: 'C:/Winbows/icons/applications/novelty/paint.ico',
                script: 'C:/Program Files/Paint/app.js'
            },
            'info': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/',
                icon: 'C:/Winbows/icons/emblems/info.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Info/app.js',
                autoExecute: true
            },
            'code': {
                path: 'C:/Program Files/VSCode/',
                icon: 'C:/Winbows/icons/applications/office/code.ico',
                script: 'C:/Program Files/VSCode/app.js'
            },
            'taskmgr': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr',
                icon: 'C:/Winbows/icons/applications/tools/taskmanager.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Taskmgr/app.js'
            },
            'settings': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings',
                icon: 'C:/Winbows/icons/applications/tools/settings.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Settings/app.js'
            },
            'fpsmeter': {
                path: 'C:/Program Files/FPS Meter/',
                icon: 'C:/Program Files/FPS Meter/favicon.ico',
                script: 'C:/Program Files/FPS Meter/app.js'
            },
            'photos': {
                path: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos',
                icon: 'C:/Winbows/icons/applications/novelty/photos.ico',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/app.js'
            },
            'network-listener': {
                path: 'C:/Program Files/Network Listener/',
                icon: 'C:/Winbows/icons/files/program.ico',
                script: 'C:/Program Files/Network Listener/app.js'
            },
            'json-viewer': {
                path: 'C:/Program Files/JSON Viewer/',
                icon: 'C:/Program Files/JSON Viewer/json-viewer.svg',
                script: 'C:/Program Files/JSON Viewer/app.js'
            },
            'notepad': {
                path: 'C:/Program Files/Notepad/',
                icon: 'C:/Program Files/Notepad/favicon.ico',
                script: 'C:/Program Files/Notepad/app.js'
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
            return file.split('.').pop();
        } else {
            return '';
        }
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime'
    };

    function getMimeType(extension) {
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    window.utils.getMimeType = getMimeType;

    window.loadImage = loadImage;

    // Loading images
    loadingImage.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico')})`;
    screenLockSigninAvatar.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/icons/user.png')})`;
    screenLockBackground.style.backgroundImage = `url(${await fs.getFileURL('C:/Winbows/bg/img100.jpg')})`;

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
        var stats = await fs.stat(image);
        if (stats.exists != true) {
            image = 'C:/Winbows/bg/img0.jpg';
        }
        currentBackgroundImage = image;
        localStorage.setItem('WINBOWS_BACKGROUND_IMAGE', currentBackgroundImage);
        var url = await getFileURL(currentBackgroundImage);
        var img = new Image();
        img.src = url;
        img.onload = () => {
            var theme = utils.getImageTheme(img);
            desktop.classList.remove('winui-light', 'winui-dark');
            desktop.classList.add(`winui-${theme}`)
            backgroundImage.style.backgroundImage = `url(${url})`;
            console.log(theme)
        }
    }
    window.WinbowsUpdate = () => {
        location.href = './install.html';
    }

    await window.setBackgroundImage(localStorage.getItem('WINBOWS_BACKGROUND_IMAGE') || 'C:/Winbows/bg/img0.jpg');

    await fs.mkdir('C:/Users');
    await fs.mkdir('C:/Users/Admin');
    await fs.mkdir('C:/Users/Admin/Desktop');
    await fs.mkdir('C:/Users/Admin/Documents');
    await fs.mkdir('C:/Users/Admin/Downloads');
    await fs.mkdir('C:/Users/Admin/Music');
    await fs.mkdir('C:/Users/Admin/Pictures');
    await fs.mkdir('C:/Users/Admin/Videos');

    screenLockSigninUsername.innerHTML = window.utils.replaceHTMLTags('Admin');
    screenLockSigninButton.innerHTML = window.utils.replaceHTMLTags('Sign In');

    // Init kernel files 
    await (async () => {
        async function runKernel() {
            var files = {
                kernel: ['Winbows/System/process.js'],
                ui: ['Winbows/System/ui/build/winui.min.js'],
                module: ['Winbows/System/modules/main/domtool.js', 'Winbows/System/modules/main/toolbarComponents.js', 'Winbows/System/modules/main/browserWindow.js'],
                component: [],
                taskbar: ['Winbows/SystemApps/Microhard.Winbows.Taskbar/app.js'],
                compiler: ['Winbows/System/compilers/worker/compiler.js', 'Winbows/System/compilers/window/compiler.js']
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
                    console.log(loadedKernels)
                    if (loadedKernels == kernelFiles.length) {
                        loadingProgressBar.style.width = '100%';
                        loadingText(`Loading assets...`);
                        resolve();
                    }
                }
                try {
                    for (let i in kernelFiles) {
                        const path = await fs.getFileURL(mainDisk + ':/' + kernelFiles[i]);
                        const kernel = document.createElement('script');
                        kernel.src = path;
                        kernel.onload = () => {
                            kernel.remove();
                        }
                        document.head.appendChild(kernel);
                    }
                } catch (e) {
                    window.Crash(e);
                }
            })
        }

        await runKernel();
    })();

    window.Taskbar.pinApp('C:/Program Files/Command/app.js');
    window.Taskbar.pinApp('C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/app.js');
    await window.Taskbar.preloadImage();

    window.System.CommandParsers = {
        run: (params) => {
            var file = params[0];
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
            if (window.appRegistry.exists(file)) {
                if (config != '' && window.appRegistry.getInfo(file).configurable) {
                    file = window.appRegistry.getInfo(file).configurable;
                } else {
                    file = window.appRegistry.getInfo(file).script;
                }
            }
            var process = new Process(file);
            process.start(config);
            return {
                status: 'ok',
                message: process.id
            }
        },
        open: async (params) => {
            var path = params[0];
            path = path.replaceAll('"', '');
            if (await (fs.exists(path)).exists == true) {
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
    await (async () => {
        window.System.desktop = {};
        window.System.desktop.update = updateDesktop;

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
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            selecting = true;

            // For items
            startX = e.pageX + desktopItems.scrollLeft;
            startY = e.pageY;
            pointerX = e.pageX + desktopItems.scrollLeft;
            pointerY = e.pageY;

            // For canvas
            startXInCanvas = e.pageX + desktopItems.scrollLeft;
            startYInCanvas = e.pageY;
            pointerXInCanvas = e.pageX + desktopItems.scrollLeft;
            pointerYInCanvas = e.pageY;

            selected = [];
            createdItems.forEach(item => {
                item.item.classList.remove('active');
            })
        }

        function selectionMove(e) {
            if (selecting == false) return;
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            pointerX = e.pageX + desktopItems.scrollLeft;
            pointerY = e.pageY;
            pointerXInCanvas = e.pageX;
            pointerYInCanvas = e.pageY;

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
                            icon: "sort_by_name",
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
                                new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js').start(`const FILE_PATH="${path}";`);
                            }
                        });
                    }
                    if (type != 'directory') {
                        items.push({
                            text: 'Open file location',
                            icon: 'folder-open',
                            action: () => {
                                window.System.Shell('run explorer --config=PAGE=\"C:/Users/Admin/Desktop\"')
                            }
                        })
                    }
                    items.push({
                        className: 'delete',
                        icon: "delete",
                        text: "Delete",
                        action: () => {
                            fs.rm(path).then(res => {
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
                                await fs.rm(item.path).then(res => {
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
                    } else if (window.utils.getFileExtension(path) == 'wbsf') {
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
                    } else if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(window.utils.getFileExtension(path))) {
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
                if (e.type.startsWith('touch')) {
                    var touch = e.touches[0] || e.changedTouches[0];
                    e.pageX = touch.pageX;
                    e.pageY = touch.pageY;
                }
                menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
                menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
                menu.open(e.pageX, e.pageY, 'left-top');
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
            console.log('Updating Desktop', '\nForce : ' + force);
            fs.readdir('C:/Users/Admin/Desktop').then(async items => {
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
                    results.push({
                        result: await fs.stat(items[i].path),
                        item: items[i],
                        name: utils.getFileName(items[i].path)
                    });
                }
                if (sort == 'name') {
                    // TODO
                }
                for (let i = 0; i < results.length; i++) {
                    ; await (async (i) => {
                        var { result, item, name } = results[i];
                        var type = utils.getFileExtension(item.path) == 'link' ? 'shortcut' : result.type == 'directory' ? 'directory' : 'file';
                        var detail = {};
                        try {
                            if (type == 'shortcut') {
                                var file = await result.content.text();
                                detail = JSON.parse(file);
                            } else if (type == 'directory') {
                                detail = {
                                    name: name,
                                    command: `run explorer --config=PAGE=\"${item.path}\"`
                                };
                            } else {
                                detail = {
                                    name: name,
                                    action: () => {
                                        var defaultViewer = window.System.FileViewers.getDefaultViewer(item.path);
                                        if (defaultViewer != null) {
                                            new Process(defaultViewer.script).start(`const FILE_PATH="${item.path}";`);
                                        } else {
                                            console.log('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js')
                                            new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/chooseViewer.js').start(`const FILE_PATH="${item.path}";`);
                                        }
                                    }
                                };
                            }
                        } catch (e) { console.error(e) };
                        detail.path = item.path;
                        detail.type = type;
                        detail.file = result.content;
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

        const target = 'C:/Users/Admin/Desktop/';
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

        dropZone.addEventListener('drop', async (event) => {
            event.preventDefault();
            checked = false;
            dropZone.classList.remove('dragover');

            if (allowed == false) return;
            allowed == false;

            const dt = event.dataTransfer;
            const items = Array.from(dt.items);

            if (items.length == 0) return;

            var processed = 0;
            var total = items.length;
            var current = 'Unknown';
            var title = 'Uploading File to Desktop...';
            var worker;
            var update = () => { };

            var files = [];
            var allRead = false;

            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry();
                if (item) {
                    if (item.isFile) {
                        allRead = true;
                        // console.log('file', i)
                        await handleFile(item, "");
                    } else if (item.isDirectory) {
                        allRead = false;
                        // console.log('directory', i)
                        await handleDirectory(item, item.name);
                    }
                } else {
                    total--;
                }
            }

            function handleFile(fileEntry, path) {
                return fileEntry.file(file => {
                    files.push({ file, path });
                    // console.log(path, files.length, total)
                    if (files.length == total && allRead == true) {
                        run();
                    }
                })
            }

            async function handleDirectory(directoryEntry, path) {
                total--;
                return new Promise(async (resolve, reject) => {
                    const reader = directoryEntry.createReader();
                    const entries = await new Promise((resolve, reject) => {
                        reader.readEntries(resolve, reject);
                    });
                    total += entries.length;
                    for (const entry of entries) {
                        if (entry.isFile) {
                            await handleFile(entry, path);
                        } else if (entry.isDirectory) {
                            allRead = false;
                            await handleDirectory(entry, path + "/" + entry.name);
                        }
                    }
                    allRead = true;
                    resolve();
                })
            }

            function run() {
                console.log('run', total, files);
                new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/fileTransfer.js').start().then(async process => {
                    fileTransfer++;
                    worker = process.worker;

                    update = () => {
                        worker.postMessage({
                            type: 'update',
                            token: process.token,
                            current, processed, total, title
                        });
                        if (processed == total && processed != 0) {
                            updateDesktop();
                            return process.exit();
                        }
                    }

                    console.log(files)

                    worker.postMessage({
                        type: 'init',
                        token: process.token
                    })

                    worker.postMessage({
                        type: 'transfer',
                        token: process.token,
                        files, title,
                        target: 'C:/Users/Admin/Desktop/'
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
                                target: 'C:/Users/Admin/Desktop/'
                            })
                        }
                        if (e.data.type == 'completed') {
                            fileTransfer--;
                            updateDesktop();
                        }
                    });

                    // process.exit();
                });
            }
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
                    target: 'C:/Users/Admin/Desktop/'
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
                            target: 'C:/Users/Admin/Desktop/'
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
                        icon: "sort_by_name",
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
            if (e.type.startsWith('touch')) {
                var touch = e.touches[0] || e.changedTouches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
            }
            menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
            menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
            menu.open(e.pageX, e.pageY, 'left-top');
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
            path: 'C:/Users/Admin/Desktop/desktop.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/icons/desktop.ico'),
                name: 'Desktop',
                command: 'run explorer --config=PAGE=\"C:/Users/Admin/Desktop\"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/github.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/github.png'),
                name: 'Github',
                command: 'open "https://github.com/Siyu1017/winbows11/"'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/code.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/applications/office/code.ico'),
                name: 'VSCode',
                command: 'run code'
            }
        }, {
            path: 'C:/Users/Admin/Desktop/author.link',
            content: {
                icon: await fs.getFileURL('C:/Winbows/icons/author.ico'),
                name: 'Siyu',
                command: 'open "https://siyu1017.github.io/"'
            }
        }]

        for (let i = 0; i < defaultShortcuts.length; i++) {
            var content = JSON.stringify(defaultShortcuts[i].content);
            await fs.writeFile(defaultShortcuts[i].path, new Blob([content], {
                type: 'application/winbows-link'
            }));
        }

        var lastTime = Date.now();

        fs.on('change', (e) => {
            if (e.path.search('C:/Users/Admin/Desktop') > -1 && fileTransfer == 0) {
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

        return window.System.desktop.update();
    })();

    window.System.FileViewers = {
        viewers: {
            '*': '',
            'css': ['code'],
            'js': ['code'],
            'html': ['code', 'edge'],
            'txt': ['code'],
            'jpg': ['mediaplayer', 'edge', 'photos'],
            'jpeg': ['mediaplayer', 'edge', 'photos'],
            'png': ['mediaplayer', 'edge', 'photos'],
            'gif': ['mediaplayer', 'edge', 'photos'],
            'webp': ['mediaplayer', 'edge', 'photos'],
            'bmp': ['mediaplayer', 'edge', 'photos'],
            'svg': ['mediaplayer', 'edge', 'photos'],
            'ico': ['mediaplayer', 'edge', 'photos'],
            'pdf': [],
            'json': ['code'],
            'xml': ['code'],
            'zip': [],
            'tar': [],
            'gz': [],
            'mp3': ['mediaplayer'],
            'wav': ['mediaplayer'],
            'ogg': ['mediaplayer'],
            'mp4': ['mediaplayer'],
            'webm': ['mediaplayer'],
            'avi': ['mediaplayer'],
            'mov': ['mediaplayer']
        },
        defaultViewers: {},
        registeredViewers: {
            'code': {
                name: 'Visual Studio Code',
                script: 'C:/Program Files/VSCode/viewer.js',
                accepts: [/*'css', 'js', 'jsx', 'ts', 'ejs', 'html', 'txt', 'json', 'xml', 'py', 'java', 'c', 'h', */'*']
            },
            'edge': {
                name: 'Microhard Edge',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge/viewer.js',
                accepts: ['html', 'pdf', 'txt', 'js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'ico', 'webp', 'gif']
            },
            'edgebeta': {
                name: 'Microhard Edge BETA',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Edge.BETA/viewer.js',
                accepts: ['html', 'pdf', 'txt', 'js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'ico', 'webp', 'gif']
            },
            'photos': {
                name: 'Photos',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.Photos/viewer.js',
                accepts: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'svg', 'ico', 'webp']
            },
            'mediaplayer': {
                name: 'MediaPlayer',
                script: 'C:/Winbows/SystemApps/Microhard.Winbows.MediaPlayer/window.js',
                accepts: ['mp3', 'wav', 'ogg', 'mp4', 'webm', 'avi', 'mov']
            },
            'json-viewer': {
                name: 'JSON Viewer',
                script: 'C:/Program Files/JSON Viewer/viewer.js',
                accepts: ['json']
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
                console.log(window.System.FileViewers.registeredViewers[viewer])
                if (window.System.FileViewers.registeredViewers[viewer].accepts.some(ext => accepted.includes(ext))) {
                    viewers[viewer] = window.System.FileViewers.registeredViewers[viewer];
                }
            })
            console.log(file, extension, viewers)
            return viewers;
        }
    }

    if (localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS') && devMode == false) {
        window.System.FileViewers.viewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_VIEWERS', JSON.stringify(window.System.FileViewers.viewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS') && devMode == false) {
        window.System.FileViewers.defaultViewers = JSON.parse(localStorage.getItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS'));
    } else {
        localStorage.setItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS', JSON.stringify(window.System.FileViewers.defaultViewers));
    }
    if (localStorage.getItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS') && devMode == false) {
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

        console.log('Next update of time :', new Date(Date.now() + leftToUpdateTime))
        console.log('Next update of date :', new Date(Date.now() + leftToUpdateDate))

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
                var command = getJsonFromURL()['command'];
                if (command) {
                    window.System.Shell(command);
                }
            }
        })

        if (now - startLoadingTime < 1000) {
            await delay(1000 - (now - startLoadingTime));
        }

        // await delay(1000);

        // Remove loading 
        loadingContainer.classList.remove('active');

        async function initTaskbar() {
            await delay(200);

            // Initialize Taskbar
            window.Taskbar.init();
        }
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

    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.FileExplorer/app.js', 'system').start();
    // new Process('C:/Winbows/SystemApps/Microhard.Winbows.Test/app.js', 'system').start();

    window.utils.formatBytes = formatBytes;

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

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

    // Cache the url
    async function getFileURL(url) {
        var blob = await downloadFile(url);
        return URL.createObjectURL(blob);
    }

    function removeStringInRange(str, start, end) {
        return str.substring(0, start) + str.substring(end);
    }

    async function downloadFile(path, responseType = 'blob') {
        if (!path || path.trim().length == 0) return;
        if (debuggerMode == true) {
            // Debugger
            console.log('%c[DOWNLOAD FILE]', 'color: #f670ff', getStackTrace(), path);
        }
        if (navigator.onLine != true || window.needsUpdate == false && devMode == false || path.startsWith('C:/Users/Admin/Desktop/')) {
            return await fs.readFile(path);
        }
        // var method = mimeType.startsWith('image') ? 'blob' : 'text';
        return fetch(`./${removeStringInRange(path, 0, path.split(':/').length > 1 ? (path.split(':/')[0].length + 2) : 0)}`).then(response => {
            // console.log(response)
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error(`Failed to fetch file: ${path}`);
            }
        }).then(content => {
            var blob = content;
            // blob = new Blob([content], { type: mimeType });
            fs.writeFile(path, blob);
            // console.log(getSizeString(blob.size));
            if (responseType == 'text') {
                return content;
            } else {
                return blob;
            }
        }).catch(async err => {
            console.log(`Failed to fetch file: ${path}`, err);
            if (responseType == 'text') {
                return await (await fs.readFile(path)).text();
            } else {
                return await fs.readFile(path);
            }
        })
    }
})();