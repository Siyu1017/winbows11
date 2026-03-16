const { setupTab } = await requireAsync('./tab.js');

let theme = System.theme.get();
browserWindow.setTheme(theme);
if (theme == 'dark') {
    document.documentElement.classList.add('winui-dark');
} else {
    document.documentElement.classList.remove('winui-dark');
}

System.theme.onChange(theme => {
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
    }
})

document.body.classList.add('winui');
document.body.classList.add('winui-no-background');

process.title = 'Microhard Edge';

const styles = ['./window.css'];

const promises = [];
for (let i in styles) {
    promises.push(new Promise(async (resolve, reject) => {
        let style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = await fs.getFileURL(styles[i]);
        document.head.appendChild(style);
        resolve();
    }))
}
await Promise.allSettled(promises);

// Use tabview
const tabview = browserWindow.useTabview({
    icon: false
});

// console.log(process.args)

// Create a tab
const tab = new tabview.Tab();
setupTab(browserWindow, tab, process.args.path);

// Handle click event
tabview.on('requestCreateTab', (e) => {
    const tab = new tabview.Tab();
    setupTab(browserWindow, tab);
})