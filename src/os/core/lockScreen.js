import * as utils from "../../shared/utils.js";
// import i18n from "../i18n/i18n.js";

const lockScreenContainer = document.createElement('div');
const lockScreen = document.createElement('div');
const lockScreenBackground = document.createElement('div');
const lockScreenMain = document.createElement('div');
const lockScreenSignin = document.createElement('div');
lockScreenContainer.className = 'lock-screen-container active';
lockScreen.className = 'lock-screen';
lockScreenBackground.className = 'lock-screen-background';
lockScreenMain.className = 'lock-screen-main';
lockScreenSignin.className = 'lock-screen-signin';
lockScreenContainer.appendChild(lockScreen);
lockScreen.appendChild(lockScreenBackground);
lockScreen.appendChild(lockScreenMain);
lockScreen.appendChild(lockScreenSignin);

// Clock on lock panel
const lockScreenTime = document.createElement('div');
const lockScreenDate = document.createElement('div');
lockScreenTime.className = 'lock-screen-time';
lockScreenDate.className = 'lock-screen-date';
lockScreenMain.appendChild(lockScreenTime);
lockScreenMain.appendChild(lockScreenDate);

// Signin panel
const lockScreenSigninAvatar = document.createElement('div');
const lockScreenSigninUsername = document.createElement('div');
const lockScreenSigninButton = document.createElement('button');
lockScreenSigninAvatar.className = 'lock-screen-signin-avatar';
lockScreenSigninUsername.className = 'lock-screen-signin-username';
lockScreenSigninButton.className = 'lock-screen-signin-button';
lockScreenSignin.appendChild(lockScreenSigninAvatar);
lockScreenSignin.appendChild(lockScreenSigninUsername);
lockScreenSignin.appendChild(lockScreenSigninButton);

lockScreenSigninUsername.innerHTML = utils.replaceHTMLTags('Admin'); //i18n.t('lockscreen.username');
lockScreenSigninButton.innerHTML = utils.replaceHTMLTags('Sign In'); //i18n.t('lockscreen.signin');

let init = true;
const now = new Date();
const leftToUpdateTime = (60 - now.getSeconds()) * 1000;
const leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - (now.getMinutes() * 60) - now.getSeconds()) * 1000;

lockScreenTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
lockScreenDate.innerHTML = now.toLocaleDateString(void 0, {
    weekday: "long",
    month: "long",
    day: "numeric"
})

function updateTime() {
    const now = new Date();
    const leftToUpdateTime = (60 - now.getSeconds()) * 1000;
    lockScreenTime.innerHTML = now.format("hh") < 13 ? now.format("hh:mm") : new Date(now.getTime() - 12 * 1000 * 60 * 60).format("hh:mm");
    setTimeout(updateTime, leftToUpdateTime);
}

function updateDate() {
    const now = new Date();
    const leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - ((60 - now.getMinutes()) * 60) - now.getSeconds()) * 1000;
    lockScreenDate.innerHTML = now.toLocaleDateString(void 0, {
        weekday: "long",
        month: "long",
        day: "numeric"
    })
    setTimeout(updateDate, leftToUpdateDate);
}

//console.log('Next update of time :', new Date(Date.now() + leftToUpdateTime))
//console.log('Next update of date :', new Date(Date.now() + leftToUpdateDate))

setTimeout(updateTime, leftToUpdateTime);
setTimeout(updateDate, leftToUpdateDate);

lockScreenMain.addEventListener('click', () => {
    lockScreen.classList.add('signin');
})

let initFn = () => { };
lockScreenSigninButton.addEventListener('click', () => {
    lockScreenContainer.classList.remove('active');
    lockScreen.classList.remove('signin');
    if (init == true) {
        init = false;
        initFn();
    }
})

function setInitFn(fn) {
    initFn = fn;
}

const lockScreenObj = {
    container: lockScreenContainer,
    avatar: lockScreenSigninAvatar,
    username: lockScreenSigninUsername,
    button: lockScreenSigninButton,
    background: lockScreenBackground,
    setInitFn
}

export default lockScreenObj;