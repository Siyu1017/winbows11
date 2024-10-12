var initialized = false;
var files = null;
var target = '';
var total = 0;
var current = 'Unknown';
var processed = 0;
var title = 'Loading...';
var stopped = false;

browserWindow.worker.addEventListener('message', (e) => {
    // console.log('Message received');
    // console.log('WINDOW', e.data.type)
    if (!e.data.token == TOKEN) return;
    if (e.data.type == 'init') {
        // console.log('init');
        return init();
    }
    if (e.data.type == 'transfer') {
        // console.log(e.data, 'transfer', files);
        if (!e.data.files || !e.data.target) {
            clearInterval(update);
        }
        if (files == null) {
            // console.log(1)
            title = e.data.title;
            files = e.data.files;
            target = e.data.target;
            total = files.length;
            return handleFiles();
        }
        return;
    }
})

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
document.head.appendChild(style);

fs.getFileURL(utils.resolvePath('./fileTransferWindow.css')).then(url => {
    style.href = url;
});

var lastTime = Date.now();
var startTime = lastTime;

var titleElement = document.createElement('div');
var percentElement = document.createElement('div');
var progressElement = document.createElement('div');
var progressBar = document.createElement('div');
var progressBarPeg = document.createElement('div');
var infoElement = document.createElement('div');
var nameElement = document.createElement('div');
var timeElement = document.createElement('div');
var lastElement = document.createElement('div');

titleElement.className = 'title';
percentElement.className = 'percent';
progressElement.className = 'progress';
progressBar.className = 'progress-bar';
progressBarPeg.className = 'progress-bar-peg';
infoElement.className = 'info';

nameElement.style = "overflow: hidden;white-space: nowrap;text-overflow: ellipsis;";
timeElement.style = "overflow: hidden;white-space: nowrap;text-overflow: ellipsis;";
lastElement.style = "overflow: hidden;white-space: nowrap;text-overflow: ellipsis;";

progressElement.appendChild(progressBar);
progressBar.appendChild(progressBarPeg);

infoElement.appendChild(nameElement);
infoElement.appendChild(timeElement);
infoElement.appendChild(lastElement);

document.body.appendChild(titleElement);
document.body.appendChild(percentElement);
document.body.appendChild(progressElement);
document.body.appendChild(infoElement);

document.body.classList.add('winui');

function predictTime() {
    var avarageTime = (Date.now() - lastTime) / processed / 1000;
    var lastItems = total - processed;
    var seconds = ~~(avarageTime * lastItems);
    if (processed == 0) {
        return 'Calculating...';
    } else if (seconds < 60) {
        return `${seconds} sencond(s)`;
    } else if (seconds < 60 * 60) {
        return `${~~(seconds / 60)} minute(s) and ${seconds % 60} sencond(s)`;
    } else if (seconds < 60 * 60 * 24) {
        return `${~~(seconds / (60 * 60))} hour(s)`;
    } else {
        return 'more than one day';
    }
}

function updateItems() {
    percentElement.textContent = ~~((processed / total) * 100) + '% complete';
    progressBar.style.width = (processed / total) * 100 + '%';
    titleElement.textContent = title;
    nameElement.textContent = `Name: ${current}`;
    lastElement.textContent = `Remaining items: ${total - processed}`;
}

function updateTime() {
    timeElement.textContent = `Remaining times: ${predictTime()}`;
}

updateTime();
updateItems();

function update() {
    updateTime();
    updateItems();

    if (processed == total && total != 0) {
        clearInterval(update);
        if (stopped == false) {
            process.exit(0);
            stopped = true;
        }
    }
}

console.log(browserWindow.worker)

function init() {
    if (initialized == true) return;
    browserWindow.worker.postMessage({
        type: 'init',
        token: TOKEN
    })
    initialized = true;
}

async function handleFiles() {
    console.groupCollapsed('File transfer');
    console.log(files);
    for (let i = 0; i < files.length; i++) {
        var file = files[i];
        await handleFile(file instanceof File ? file : file.file, file.path);
    }
    console.groupEnd();
    browserWindow.worker.postMessage({
        type: 'completed',
        token: TOKEN
    })
}

async function writeFile(path, blob, exist = 0) {
    return new Promise(function (resolve, reject) {
        var pathToCheck = path;
        var extension = window.utils.getFileExtension(path);
        if (exist != 0) {
            pathToCheck = `${path.substring(0, path.length - (extension.length + 1))} (${exist})${extension ? '.' + extension : ''}`;
        }
        fs.exists(pathToCheck).then(async result => {
            if (result.exists == false) {
                console.log(pathToCheck, 'can write');
                fs.writeFile(pathToCheck, blob).then(() => {
                    resolve();
                })
            } else {
                console.log(pathToCheck);
                resolve(writeFile(path, blob, exist+1));
            }
        })
    });
}

function handleFile(file, path) {
    return new Promise(function (resolve, reject) {
        console.log(file, path);
        current = file.name;
        updateItems();

        const filePath = (path ? path + "/" : '') + file.name;
        const reader = new FileReader();
        reader.onload = async function (event) {
            const arrayBuffer = event.target.result;
            const blob = new Blob([arrayBuffer], { type: file.type });
            const fullPath = `${target}${filePath}`;
            writeFile(fullPath, blob).then(() => {
                processed++;
                console.log(`File: ${file.name} (Type: ${file.type}, Size: ${file.size} bytes)`);
                updateItems();
                resolve({
                    type: 'update',
                    status: 'ok',
                    name: file.name,
                    path: fullPath,
                    message: '',
                    size: blob.size,
                    blob: blob,
                    processed: processed
                });
            });
        };
        reader.readAsArrayBuffer(file);
    });
}

browserWindow.worker.postMessage({
    type: 'init',
    token: TOKEN
})

setInterval(update, 1000);