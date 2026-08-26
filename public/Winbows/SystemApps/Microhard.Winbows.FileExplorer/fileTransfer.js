//! $RTH={"type":"gui"}

process.title = 'File Transfer';

const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
document.head.appendChild(style);
fs.getFileURL('./fileTransfer.css').then(url => {
    style.href = url;
});

let lastTime = Date.now();
const startTime = lastTime;

let state = {
    title: 'Loading...',
    current: 'Unknown',
    processed: 0,
    total: 0
};

console.log(process.env)
const channel = IPC.connect(process.env.pipe);
channel.on('data', (e) => {
    console.log(e)
    const dt = e.data;
    if (dt.type === 'update') {
        state = dt.data;
        lastTime = Date.now();
        update();
    }
})

const titleElement = document.createElement('div');
const percentElement = document.createElement('div');
const progressElement = document.createElement('div');
const progressBar = document.createElement('div');
const progressBarPeg = document.createElement('div');
const infoElement = document.createElement('div');
const nameElement = document.createElement('div');
const timeElement = document.createElement('div');
const lastElement = document.createElement('div');

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

function updateItems() {
    percentElement.textContent = ~~((state.processed / state.total) * 100) + '% complete';
    progressBar.style.width = (state.processed / state.total) * 100 + '%';
    titleElement.textContent = state.title;
    nameElement.textContent = `Name: ${state.current}`;
    lastElement.textContent = `Remaining items: ${state.total - state.processed}`;
}

function updateTime() {
    timeElement.textContent = `Remaining times: ${predictTime()}`;
}

function predictTime() {
    const avarageTime = (Date.now() - lastTime) / state.processed / 1000;
    const lastItems = state.total - state.processed;
    const seconds = ~~(avarageTime * lastItems);
    if (state.processed == 0) {
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

updateTime();
updateItems();

const intervalId = setInterval(update, 1000);

function update() {
    updateTime();
    updateItems();

    if (state.processed == state.total && state.total != 0) {
        clearInterval(intervalId);
        process.exit(0);
    }
}
