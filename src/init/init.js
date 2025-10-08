import { getJsonFromURL } from '../shared/utils.js';
import rom from '../os/core/rom.js';

console.log(`winbows11 v${version}`);

// Proxy Server API
if ('serviceWorker' in navigator) {
    var listeners = {};

    window.HMGR = {
        on: function (eventName, callback) {
            if (listeners[eventName]) {
                listeners[eventName].push(callback);
            } else {
                listeners[eventName] = [callback];
            }
        },
        emit: function (eventName, data) {
            if (listeners[eventName]) {
                listeners[eventName].forEach(function (callback) {
                    callback(data);
                });
            }
        },
        off: function (eventName, listener) {
            if (listeners[eventName]) {
                listeners[eventName] = listeners[eventName].filter(function (l) {
                    return l !== listener;
                });
            }
        },
        enable: function (hardware) {
            navigator.serviceWorker.controller.postMessage({
                type: 'ENABLE',
                value: hardware.toUpperCase()
            });
        },
        disable: function (hardware) {
            navigator.serviceWorker.controller.postMessage({
                type: 'DISABLE',
                value: hardware.toUpperCase()
            });
        }
    };

    navigator.serviceWorker.register('./hmgr.js', { updateViaCache: 'none', scope: './' }).then((register) => {
        register.update();
        console.log('register success')
    }, (err) => console.log('register fail:', err));

    navigator.serviceWorker.ready.then((registration) => {
        navigator.serviceWorker.controller.postMessage({
            type: "SETUP",
            value: {
                location: {
                    href: location.href,
                    origin: location.origin,
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                    protocol: location.protocol,
                    hostname: location.hostname,
                    port: location.port,
                    host: location.host
                }
            }
        });
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
        const message = event.data;
        if (message.type) {
            window.HMGR.emit(message.type, message.value)
        }
    });
};

Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; }

// Screen size to css variable
function updateScreenSize() {
    document.querySelector(':root').style.setProperty('--winbows-screen-width', window.innerWidth + 'px');
    document.querySelector(':root').style.setProperty('--winbows-screen-height', window.innerHeight + 'px');
}
window.addEventListener('resize', updateScreenSize);
window.addEventListener('load', updateScreenSize);

function isAppleDeviceType() {
    const ua = navigator.userAgent;
    const isTouch = 'ontouchend' in document;

    if (/iPhone/.test(ua)) {
        return true;    // iPhone
    }
    if (/iPad/.test(ua)) {
        return true;    // iPad
    }
    if (/Macintosh/.test(ua) && isTouch) {
        return true;    // iPad
    }
    return /Macintosh/.test(ua);
}

// Modes
const URLParams = getJsonFromURL();
window.modes = {};
Object.defineProperty(window.modes, 'debug', {
    value: (URLParams['dev'] || URLParams['develop'] || URLParams['logs'] || URLParams['output']) ? true : false,
    writable: false,
    configurable: false
});
Object.defineProperty(window.modes, 'dev', {
    value: (URLParams['dev'] || URLParams['develop'] || URLParams['embed']) ? true : false,
    writable: false,
    configurable: false
})

// Entry function
!(async function Start() {
    // Warning window for apple devices
    if (isAppleDeviceType() === true) {
        await (async function ShowDeviceWarning() {
            return new Promise(resolve => {
                var warning = document.createElement("div");
                var warningWindow = document.createElement("div");
                var warningIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                var warningTitle = document.createElement("div");
                var warningDescription = document.createElement("div");
                var warningContinue = document.createElement("button");

                warning.style = "position:fixed;top:0;left:0;width:100vw;height:var(--winbows-screen-height);display:flex;align-items:center;justify-content:center;background-color:rgba(0,0,0,.5);z-index:999999999999";
                warningWindow.style = "display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px,calc(100vw - 2rem));width: 100%;max-height: min(calc(var(--winbows-screen-height)*80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;";

                warningIcon.style = "width:5rem;height:5rem;";
                warningIcon.setAttribute("viewBox", "0 0 24 24");
                warningIcon.setAttribute("fill", "none");
                warningIcon.setAttribute("stroke", "#E69264");
                warningIcon.setAttribute("stroke-width", "2");
                warningIcon.setAttribute("stroke-linecap", "round");
                warningIcon.setAttribute("stroke-linejoin", "round");
                warningIcon.innerHTML = '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>';

                warningTitle.style = "max-width: 80%;word-break: auto-phrase;font-weight: 600;font-size: 1.25rem;margin-top: 1rem;";
                warningTitle.innerHTML = "Warning for iPhone/iPad/Mac users";
                warningDescription.style = "font-size: .875rem;color: #454545;margin: .375rem;";
                warningDescription.innerHTML = "There are a number of known styling issues with Winbows11 on iPhone/iPad/Mac. Until this issue is resolved, we recommend that you use another device to browse this site.";

                warningContinue.style = "color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.75rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size:.925rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0;border: 0;margin-top: 1rem;";
                warningContinue.innerHTML = "Continue to visit Winbows11";

                warningContinue.addEventListener("click", () => {
                    warning.remove();
                    resolve();
                });

                warning.appendChild(warningWindow);
                warningWindow.appendChild(warningIcon);
                warningWindow.appendChild(warningTitle);
                warningWindow.appendChild(warningDescription);
                warningWindow.appendChild(warningContinue);
                document.body.appendChild(warning);
            })
        })();
    }

    // const DIRECTORIES = localStorage.getItem('WINBOWS_DIRECTORIES') || true;
    window.needsUpdate = false;
    const localBuildId = localStorage.getItem('WINBOWS_BUILD_ID');
    const scriptEl = document.createElement('script');
    let latestBuildData = null;

    let showed = false;
    function showErrorWindow(e) {
        if (showed == true) return;
        showed = true;
        const error = document.createElement('div');
        const errorWindow = document.createElement('div');
        const errorHeader = document.createElement('div');
        const errorContent = document.createElement('div');
        const errorFooter = document.createElement('div');
        const errorCloseButton = document.createElement('button');

        errorHeader.innerHTML = 'An error occurred while loading Winbows11';
        errorContent.innerHTML = e.message;
        errorCloseButton.innerHTML = 'Close';

        error.style = 'position: fixed;top: 0px;left: 0px;width: 100vw;height: var(--winbows-screen-height);display: flex;align-items: center;justify-content: center;background-color: rgba(0, 0, 0, 0.5);z-index: 999999999999;font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;color:#000;';
        errorWindow.style = 'display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: rgb(255, 255, 255);padding: 2rem 4rem;border-radius: 1.5rem;box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 1rem;max-width: min(600px, -2rem + 100vw);width: 100%;max-height: min(calc(var(--winbows-screen-height) * 80%), calc(var(--winbows-screen-height) - 2rem));overflow: auto;';
        errorHeader.style = 'font-size: 175%;font-weight: 600;margin: .5rem 0 1.5rem;';
        errorFooter.style = 'display: flex;gap: .5rem;';
        errorCloseButton.style = 'color: rgb(255, 255, 255);margin-bottom: 0.5rem;padding: 0.625rem 1.25rem;background: rgb(0, 103, 192);border-radius: 0.5rem;font-size: 1rem;text-decoration: none;cursor: pointer;user-select: none;-webkit-user-drag: none;outline: 0px;border: 1px solid rgb(0, 103, 192);margin-top: 1.5rem;font-family: inherit;font-weight: 600;min-width: 8rem;';

        error.appendChild(errorWindow);
        errorWindow.appendChild(errorHeader);
        errorWindow.appendChild(errorContent);
        errorWindow.appendChild(errorFooter);
        errorFooter.appendChild(errorCloseButton);
        document.body.appendChild(error);

        errorCloseButton.addEventListener('click', () => {
            error.remove();
        })
    }

    scriptEl.onerror = showErrorWindow;

    if (!navigator.onLine) {
        if (rom.exists('KERNEL.js')) {
            scriptEl.textContent = rom.read('KERNEL.js') + '\n//# sourceURL=kernel.js';
            try {
                document.head.appendChild(scriptEl);
            } catch (e) {
                showErrorWindow(e);
            }
        } else {
            console.error('Failed to read KERNEL.js from ROM.');
        }
    } else {
        try {
            const req = await fetch(`/Winbows/System/kernel/kernel.js?timestamp=${new Date().getTime()}`);
            const kernelContent = await req.text();
            scriptEl.textContent = kernelContent + '\n//# sourceURL=kernel.js';

            rom.write('KERNEL.js', kernelContent);
        } catch (e) {
            showErrorWindow(e);

            if (rom.exists('KERNEL.js')) {
                scriptEl.textContent = rom.read('KERNEL.js');
                try {
                    document.head.appendChild(scriptEl);
                } catch (e) {
                    showErrorWindow(e);
                }
            } else {
                console.error('Failed to read KERNEL.js from ROM.');
            }
        }

        console.log(buildId)
        if (localBuildId != buildId && !getJsonFromURL()['embed']) {
            // needs to update
            window.needsUpdate = true;

            document.body.style.backgroundImage = 'linear-gradient(transparent, transparent)'
            document.body.style.transition = 'background-image .2s ease-in-out';

            try {
                const req = await fetch(`/build-fetch.json?timestamp=${new Date().getTime()}`);
                const data = await req.json();
                latestBuildData = data;
            } catch (e) { console.log(e); }

            function formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '0Bytes';
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
            }

            var buildSize = latestBuildData != null ? formatBytes(latestBuildData.size, 0) : '[Failed to get build size]';
            var predictedInstallationTime = latestBuildData != null ? (Math.ceil((69925609 / 1024 / 1024) / ((navigator.connection ? navigator.connection.downlink : 2) / 4) / 60) + 'minute(s)') : '[Failed to calculate download time]';

            var confirm = document.createElement('div');
            var confirmWindow = document.createElement('div');
            var confirmSymbol = document.createElement('div');
            var confirmContent = document.createElement('div');
            var confirmTitle = document.createElement('div');
            var confirmDescription = document.createElement('div');
            var confirmTip = document.createElement('div');
            var confirmButtons = document.createElement('div');
            var confirmCancel = document.createElement('button');
            var confirmInstall = document.createElement('button');

            confirm.className = 'confirm';
            confirmWindow.className = 'confirm-window';
            confirmSymbol.className = 'confirm-symbol';
            confirmContent.className = 'confirm-content';
            confirmTitle.className = 'confirm-title';
            confirmDescription.className = 'confirm-description';
            confirmTip.className = 'confirm-tip';
            confirmButtons.className = 'confirm-buttons';
            confirmCancel.className = 'confirm-button outline';
            confirmInstall.className = 'confirm-button';

            document.body.appendChild(confirm);
            confirm.appendChild(confirmWindow);
            confirmWindow.appendChild(confirmSymbol);
            confirmWindow.appendChild(confirmContent);
            confirmContent.appendChild(confirmTitle);
            confirmContent.appendChild(confirmDescription);
            confirmContent.appendChild(confirmTip);
            confirmContent.appendChild(confirmButtons);
            confirmButtons.appendChild(confirmCancel);
            confirmButtons.appendChild(confirmInstall);

            confirmTitle.innerHTML = 'Install Winbows11 in your browser?';
            confirmDescription.innerHTML = `<div>Installing Winbows11 in the browser can make it run more smoothly than using the internet. Its size is about <span class='confirm-highlighted-text'>${buildSize}</span>, and the installation is expected to take around <span class='confirm-highlighted-text'>${predictedInstallationTime}</span>.</div><br><div>If you don't want to install it, you can also just use the Internet to experience Winbows11! </div>`;
            confirmTip.innerHTML = "<div>If you choose to install, we will save the necessary files for Winbows11 to <a href='https://developer.mozilla.org/zh-TW/docs/Web/API/IndexedDB_API/Using_IndexedDB' in the browser target='_blank' class='confirm-learn-link'>Indexed DB</a>. </div>";
            confirmCancel.innerHTML = 'Refuse';
            confirmInstall.innerHTML = 'Install';
            confirmSymbol.innerHTML = '<div class="confirm-symbol-bg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="confirm-symbol-arrow"><path d="M15 6v10h4l-7 7-7-7h4V6h6z"/></svg></div>';

            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundImage = 'url(./Winbows/bg/img-low-quality.jpg)';

            var clicked = false;
            confirmCancel.addEventListener('click', () => {
                if (clicked == true) {
                    return;
                }
                clicked = true;
                confirmCancel.classList.add('loading');
                confirmCancel.innerHTML = '<svg class="winbows-loading-spinner" width="48" height="48" viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="7px"></circle></svg>';
                confirmCancel.disabled = true;
                try {
                    document.head.appendChild(scriptEl);
                } catch (e) {
                    showErrorWindow(e);
                }
            })
            confirmInstall.addEventListener('click', () => {
                location.href = `./install.html?timestamp=${new Date().getTime()}`;
            })
        } else {
            try {
                document.head.appendChild(scriptEl);
            } catch (e) {
                showErrorWindow(e);
            }
        }
    }
})();

// Welcome message
console.log(`%cWelcome to Winbows11\n%cGithub: Siyu1017/winbows11`, 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;background-image: linear-gradient(to right, rgba(71, 202, 250, 255), rgba(3, 124, 213, 255));-webkit-text-fill-color: #0000;background-clip: text;-webkit-background-clip: text;font-weight: 500;font-size: 4rem;', 'background:rgb(24,24,24);color:#fff;border-radius:.5rem;padding: .5rem 1rem;font-size: 1rem;display: inline-block;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;');