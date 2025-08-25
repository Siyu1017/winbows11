import { root } from "./viewport.js";
import * as utils from "../utils.js";
import { apis } from "./kernelRuntime.js";

const { fs } = apis;
const screenLockContainer = document.createElement('div');
const screenLock = document.createElement('div');
const screenLockBackground = document.createElement('div');
const screenLockMain = document.createElement('div');
const screenLockSignin = document.createElement('div');

screenLockContainer.className = 'screen-lock-container active';
screenLock.className = 'screen-lock';
screenLockBackground.className = 'screen-lock-background';
screenLockMain.className = 'screen-lock-main';
screenLockSignin.className = 'screen-lock-signin';

root.appendChild(screenLockContainer);
screenLockContainer.appendChild(screenLock);
screenLock.appendChild(screenLockBackground);
screenLock.appendChild(screenLockMain);
screenLock.appendChild(screenLockSignin);

// Clock on lock panel
const screenLockTime = document.createElement('div');
const screenLockDate = document.createElement('div');

screenLockTime.className = 'screen-lock-time';
screenLockDate.className = 'screen-lock-date';

screenLockMain.appendChild(screenLockTime);
screenLockMain.appendChild(screenLockDate);

// Signin panel
const screenLockSigninAvatar = document.createElement('div');
const screenLockSigninUsername = document.createElement('div');
const screenLockSigninButton = document.createElement('button');

screenLockSigninAvatar.className = 'screen-lock-signin-avatar';
screenLockSigninUsername.className = 'screen-lock-signin-username';
screenLockSigninButton.className = 'screen-lock-signin-button';

screenLockSignin.appendChild(screenLockSigninAvatar);
screenLockSignin.appendChild(screenLockSigninUsername);
screenLockSignin.appendChild(screenLockSigninButton);

screenLockSigninUsername.innerHTML = utils.replaceHTMLTags('Admin');
screenLockSigninButton.innerHTML = utils.replaceHTMLTags('Sign In');

// Loading images
try {
    fs.getFileURL('C:/Winbows/icons/user.png').then(url => {
        screenLockSigninAvatar.style.backgroundImage = `url(${url})`;
    })
    fs.getFileURL('C:/Winbows/bg/img100.jpg').then(url => {
        screenLockBackground.style.backgroundImage = `url(${url})`;
    })
} catch (e) {
    console.error('Error loading image:', e);
}

let init = true;
const now = new Date();
const leftToUpdateTime = (60 - now.getSeconds()) * 1000;
const leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - (now.getMinutes() * 60) - now.getSeconds()) * 1000;

screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
screenLockDate.innerHTML = now.toLocaleDateString(void 0, {
    weekday: "long",
    month: "long",
    day: "numeric"
})

function updateTime() {
    const now = new Date();
    const leftToUpdateTime = (60 - now.getSeconds()) * 1000;
    screenLockTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
    setTimeout(updateTime, leftToUpdateTime);
}

function updateDate() {
    const now = new Date();
    const leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - ((60 - now.getMinutes()) * 60) - now.getSeconds()) * 1000;
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
        // initTaskbar();
        init = false;

        /*
        kernelRuntime.runCode('await(()=>{return new Promise(_=>{})})();', {
            __filename: 'C:/Winbows/System/kernel/kernel.js',
            __dirname: 'C:/Winbows/System/kernel/'
        })
        kernelRuntime.process.title = 'System';

        var command = getJsonFromURL()['command'];
        if (command) {
            ShellInstance.execCommand(command);
        }*/
    }
})