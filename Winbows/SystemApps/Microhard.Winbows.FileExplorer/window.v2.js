import { setupTab } from './tab.js';

var theme = window.System.theme.get()
browserWindow.setTheme(theme);
if (theme == 'dark') {
    document.documentElement.classList.add('winui-dark');
} else {
    document.documentElement.classList.remove('winui-dark');
}

window.System.theme.onChange(theme => {
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
    }
})

document.body.classList.add('winui');
document.body.classList.add('winui-no-background');

const styles = ['./window.v2.css', './pages/style.css'];

const promises = [];
for (let i in styles) {
    promises.push(new Promise(async (resolve, reject) => {
        let style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = await fs.getFileURL(utils.resolvePath(styles[i]));
        document.head.appendChild(style);
        resolve();
    }))
}
await Promise.allSettled(promises);

// Use tabview
var tabview = browserWindow.useTabview({
    icon: false
});

// Create a tab
var tab = new tabview.Tab();
setupTab(browserWindow, tab, datas.page || 'pages://home');

// Handle click event
tabview.on('requestCreateTab', (e) => {
    var tab = new tabview.Tab();
    setupTab(browserWindow, tab);
})