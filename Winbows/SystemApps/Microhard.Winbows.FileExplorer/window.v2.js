import { setupTab } from './tab.js';

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
await fs.getFileURL(utils.resolvePath('./window.v2.css')).then(url => {
    style.href = url;
});
document.body.classList.add('winui');
await(async () => {
    return new Promise(resolve => {
        style.onload = resolve;
        document.head.appendChild(style);
    })
})();

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