import { IDBFS } from "../../../shared/fs.js";
import ModuleManager from "../../moduleManager.js";
import { viewport } from "../../core/viewport.js";
import { getImageTheme } from "../../../shared/utils.js";
import { desktopEl } from "./init.js";

const fs = IDBFS("~EXPLORER");
const { screenElement } = viewport;

// Bg
const background = document.createElement('div');
const backgroundImage = document.createElement('div');
background.className = 'background';
backgroundImage.className = 'background-image';
screenElement.appendChild(background);
background.appendChild(backgroundImage);

const canvas = document.createElement('canvas');
const ctx = canvas.getContext("2d");

function compressImage(file) {
    const img = new Image();

    if ({}.toString.call(file) === '[object Blob]') {
        img.src = URL.createObjectURL(file);
    } else {
        img.src = file;
    }

    return new Promise((resolve) => {
        img.onload = () => {
            const targetWidth = Math.max(window.innerWidth / 20, 80);
            const scale = targetWidth / img.width;
            const targetHeight = img.height * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.style.imageRendering = "pixelated";

            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    })
}

let currentBackgroundImage;
/**
 * @returns {string}
 */
function get() {
    return currentBackgroundImage;
}

/**
 * @param {string} image 
 * @returns {any}
 */
async function set(image = '') {
    if (!image || image == currentBackgroundImage) return;
    const stats = fs.stat(image);
    if (stats.exists != true) {
        await fs.downloadFile(image).catch(err => {
            image = 'C:/Winbows/bg/img0.jpg';
            console.warn(err);
        });
    }
    currentBackgroundImage = image;
    localStorage.setItem('WINBOWS_BACKGROUND_IMAGE', currentBackgroundImage);
    const url = await fs.getFileURL(currentBackgroundImage);
    try {
        const micaURL = await compressImage(url);
        document.querySelector(':root').style.setProperty('--winbows-mica', `url(${micaURL})`);
    } catch (e) {
        document.querySelector(':root').style.setProperty('--winbows-mica', `url(${url})`);
        console.error(e);
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
        const System = ModuleManager.get('System');
        const theme = getImageTheme(img);

        desktopEl.classList.remove('winui-light', 'winui-dark');
        desktopEl.classList.add(`winui-${theme}`);
        System.theme.set(theme);
        backgroundImage.style.backgroundImage = `url(${url})`;
    }
}

export default {
    get,
    set,
    backgroundEl: background,
    backgroundImageEl: backgroundImage
}