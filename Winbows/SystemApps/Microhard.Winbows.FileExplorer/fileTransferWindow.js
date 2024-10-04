var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
document.head.appendChild(style);

fs.getFileURL(utils.resolvePath('./fileTransferWindow.css')).then(url => {
    style.href = url;
});

var total = 0;
var current = 'Unknown';
var processed = 0;
var title = 'Loading...';

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
    var avarageTime = (Date.now() - lastTime) / 2 / 1000;
    var lastItems = total - processed;
    var seconds = ~~(avarageTime * lastItems);
    if (lastTime == startTime) {
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

function update() {
    percentElement.textContent = ~~((processed / total) * 100) + '% complete';
    progressBar.style.width = (processed / total) * 100 + '%';
    titleElement.textContent = title;
    nameElement.textContent = `Name: ${current}`;
    timeElement.textContent = `Remaining times: ${predictTime()}`;
    lastElement.textContent = `Remaining items: ${total - processed}`;
}

setInterval(update, 1000);

var initialized = false;

browserWindow.worker.addEventListener('message', (e) => {
    console.log(e)
    if (!e.data.token == TOKEN) return;
    if (e.data.type == 'init') {
        return init();
    }
    if (processed != e.data.processed) {
        lastTime = Date.now();
    }
    current = e.data.current;
    total = e.data.total;
    processed = e.data.processed;
    title = e.data.title;
    update();
})

function init() {
    browserWindow.worker.postMessage({
        type: 'init',
        token: TOKEN
    })
}

init();