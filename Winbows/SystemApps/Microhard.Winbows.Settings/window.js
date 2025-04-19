import { router } from "./_router.js";
import { sidebar } from './components/sidebar.js';
import titles from './meta.js';

fs.init();

const styles = ['./window.css', './styles/sidebar.css', './styles/setting.item.css'];
const fonts = {
    'Segoe Fluent Icons': 'C:/Winbows/fonts/Segoe Fluent Icons.ttf'
};

for (let i in Object.keys(fonts)) {
    var key = Object.keys(fonts)[i];
    var font = new FontFace(key, `url(${await fs.getFileURL(utils.resolvePath(fonts[key]))})`);
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

var pageContents = {};
var navbar = document.createElement('div');
var backButton = document.createElement('div');
var loadingSpinner = document.createElementNS("http://www.w3.org/2000/svg", "svg");

navbar.className = 'window-toolbar-navbar';
loadingSpinner.setAttribute('class', 'loading-spinner');
loadingSpinner.setAttribute('width', 48);
loadingSpinner.setAttribute('height', 48);
loadingSpinner.setAttribute('viewBox', "0 0 16 16");
loadingSpinner.innerHTML = '<circle cx="8px" cy="8px" r="7px"></circle>';
backButton.className = 'back-button';
backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="back-button-icon"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`
backButton.addEventListener('click', () => {
    router.back();
})

document.querySelector('.window-toolbar-info').replaceChild(navbar, document.querySelector('.window-toolbar-icon'));
navbar.appendChild(backButton);

document.body.classList.add('winui');
browserWindow.setImmovable(backButton);

console.log(document)

var appSidebar = document.createElement('div');
var appPage = document.createElement('div');
var sidebarElement = sidebar();
appSidebar.className = 'app-sidebar';
appPage.className = 'app-page';
document.body.appendChild(appSidebar);
document.body.appendChild(appPage);
appSidebar.appendChild(sidebarElement);

var pageTitle = document.createElement('div');
var pageContainer = document.createElement('div');
pageTitle.className = 'app-page-title';
pageContainer.className = 'app-page-container';
appPage.appendChild(pageTitle);
appPage.appendChild(pageContainer);

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

router.on('change', async (e) => {
    const path = e.path.includes('?') ? e.path.slice(e.path.indexOf('?')) : e.path;
    //const pageItem = Object.values(pageListItems).filter(item => item.path === path);
    //if (pageItem.length == 0) return;
    console.log('change', path);
    let page = pageContents[path];
    if (!pageContents[path]) {
        if (navbar.contains(backButton)) {
            navbar.replaceChild(loadingSpinner, backButton);
        }
        try {
            const module = await browserWindow.import(`./pages/` + path + '.js');
            pageContents[path] = module.default();
            page = pageContents[path] || document.createElement('div');
        } catch (e) {
            var el = document.createElement('div');
            el.innerHTML = 'Not found!';
            page = el;
            /*
            if (path != '/404') {
                return router.replace('/_404');
            } else {
                var el = document.createElement('div');
                el.innerHTML = 'Not found!';
                page = el;
            }
                */
        }
        if (router.getCurrentRoute() != path) {
            return;
        }
    }

    pageTitle.innerHTML = titles[path] || capitalizeFirstLetter(path.split('/').slice(-1));
    pageContainer.replaceChildren(...[page]);
    if (navbar.contains(loadingSpinner)) {
        navbar.replaceChild(backButton, loadingSpinner);
    }
})

router.push('/home');

// const sidebar = await import(await fs.getFileURL(utils.resolvePath('./components/sidebar.js'))).then(module => module.sidebar());

// const app = browserWindow.useFrameWork('pages@latest');
// const router = app.useRouter(utils.resolvePath('./pages'));

// router.on('change', async (page, details) => {
//     app.render([utils.resolvePath('./components/sidebar.js'), page]);
// })

// app.listen(3000, () => {
//     router.push('/home');
// })