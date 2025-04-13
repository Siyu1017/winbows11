import { useRouter } from "./_router.js";
import { sidebar } from './components/sidebar.js';

const router = useRouter();

const styles = ['./window.css', './styles/sidebar.css'];
const fonts = {
    'Segoe Fluent Icons': 'C:/Winbows/fonts/Segoe Fluent Icons.ttf'
};

for (let i in Object.keys(fonts)) {
    var key = Object.keys(fonts)[i];
    var font = new FontFace(key, `url(${await fs.getFileURL(fonts[key])})`);
    await font.load();
    window.document.fonts.add(font);
}
for (let i in styles) {
    let style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = await fs.getFileURL(utils.resolvePath(styles[i]));
    document.head.appendChild(style);
}

var backButton = document.createElement('div');
backButton.className = 'back-button';
backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="back-button-icon"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`
backButton.addEventListener('click', () => {
    router.back();
})
document.querySelector('.window-toolbar-info').replaceChild(backButton, document.querySelector('.window-toolbar-icon'))
document.body.classList.add('winui');

sidebar.init(document.body);

console.log(document)

// const sidebar = await import(await fs.getFileURL(utils.resolvePath('./components/sidebar.js'))).then(module => module.sidebar());

// const app = browserWindow.useFrameWork('pages@latest');
// const router = app.useRouter(utils.resolvePath('./pages'));

// router.on('change', async (page, details) => {
//     app.render([utils.resolvePath('./components/sidebar.js'), page]);
// })

// app.listen(3000, () => {
//     router.push('/home');
// })