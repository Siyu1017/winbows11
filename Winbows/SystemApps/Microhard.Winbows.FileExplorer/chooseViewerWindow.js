var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./chooseViewerWindow.css'));
document.head.appendChild(style);

function getCategoryString() {
    const file = datas.file;
    const extension = window.utils.getFileExtension(datas.file);
    if (extension != '') {
        return `${extension}`;
    } else {
        return `[${file.split('/').pop()}]`;
    }
}

const extension = window.utils.getFileExtension(datas.file);

var selected = null;

var container = document.createElement('div');
var header = document.createElement('div');
var content = document.createElement('div');
// var recommended = document.createElement('div');
// var recommendedLabel = document.createElement('div');
// var moreOption = document.createElement('div');
// var moreOptionLabel = document.createElement('div');
var footer = document.createElement('div');
var alwaysButton = document.createElement('button');
var onceButton = document.createElement('button');

header.innerHTML = `Select the application to open the ${getCategoryString()} file`;
// recommendedLabel.innerHTML = 'Suggested apps';
// moreOptionLabel.innerHTML = 'More options';
alwaysButton.innerHTML = 'Always';
onceButton.innerHTML = 'Once';

container.className = 'container';
header.className = 'header';
content.className = 'content';
// recommended.className = 'recommended';
// recommendedLabel.className = 'recommended-label';
// moreOption.className = 'more-option';
// moreOptionLabel.className = 'more-option-label';
footer.className = 'footer';
alwaysButton.className = 'footer-button';
onceButton.className = 'footer-button';

alwaysButton.disabled = true;
onceButton.disabled = true;

document.body.appendChild(container);
container.appendChild(header);
container.appendChild(content);
container.appendChild(footer);
// content.appendChild(recommended);
// content.appendChild(moreOption);
// recommended.appendChild(recommendedLabel);
// moreOption.appendChild(moreOptionLabel);
footer.appendChild(alwaysButton);
footer.appendChild(onceButton);

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

var self = false;
var focus = false;

browserWindow.addEventListener('focus', (e) => {
    focus = true;
})

browserWindow.addEventListener('blur', (e) => {
    if (focus == true) {
        return focus = false;
    }
    if (self == true) return;
    self = true;
    process.exit(0);
})

var viewers = window.System.FileViewers.getViewers(datas.file);

if (window.debuggerMode == true) {
    console.log(viewers)
}

Object.keys(viewers).forEach(viewer => {
    var item = document.createElement('div');
    var itemIcon = document.createElement('div');
    var itemName = document.createElement('div');
    var app = window.appRegistry.getApp(viewers[viewer].script);

    item.className = 'viewer';
    itemIcon.className = 'viewer-icon';
    itemName.className = 'viewer-name';
    itemName.innerHTML = viewers[viewer].name;
    fs.getFileURL(app.icon).then(url => {
        itemIcon.style.backgroundImage = `url(${url})`;
    })
    item.addEventListener('click', () => {
        document.querySelectorAll('.viewer.active').forEach(active => {
            active.classList.remove('active');
        })
        item.classList.add('active');
        alwaysButton.disabled = false;
        onceButton.disabled = false;
        selected = viewer;
    })
    content.appendChild(item);
    item.appendChild(itemIcon);
    item.appendChild(itemName);
})

if (extension == '') {
    alwaysButton.remove();
}

browserWindow.setMovable(header);
browserWindow.setSnappable(false);

alwaysButton.addEventListener('click', () => {
    if (selected == null) return;
    if (extension == '') {
        return;
    }
    if (window.debuggerMode == true) {
        console.log(selected)
    }
    window.System.FileViewers.setDefaultViewer(extension, selected);
    new Process(viewers[selected].script).start(`const FILE_PATH="${datas.file}";`);
    self = true;
    process.exit(0);
})

onceButton.addEventListener('click', () => {
    if (selected == null) return;
    new Process(viewers[selected].script).start(`const FILE_PATH="${datas.file}";`);
    self = true;
    process.exit(0);
})