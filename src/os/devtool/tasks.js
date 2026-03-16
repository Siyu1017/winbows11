import { fsUtils, IDBFS } from "../../shared/fs.js";
import { tasklist } from "../kernel/wrt/core.js";
import ModuleManager from "../moduleManager.js";
//import { tasklist } from "../WRT/kernel.js";
//import { appRegistry } from "../appRegistry.js";
//import { apis } from "../kernelRuntime.js";
import "./tasks.css";

//const { fs } = apis;
const fs = IDBFS('~DEVTOOL');

const tasks = document.createElement('div');
const table = document.createElement('table');
const header = document.createElement('thead');
const headerRow = document.createElement('tr');
const body = document.createElement('tbody');

tasks.className = 'devtool-tasks';

const cells = [
    {
        key: 'icon',
        title: 'Icon'
    }, {
        key: 'title',
        title: 'Title'
    }, {
        key: 'file',
        title: 'File'
    }, {
        key: 'runtime-id',
        title: 'RuntimeID'
    }, {
        key: 'pid',
        title: 'PID'
    }
];

cells.forEach(cell => {
    const th = document.createElement('th');
    th.innerText = cell.title;
    headerRow.appendChild(th);
})

tasks.appendChild(table);
table.appendChild(header);
table.appendChild(body);
header.appendChild(headerRow);

const taskItems = {};

function createRow(task) {
    const tr = document.createElement('tr');
    const iconCell = document.createElement('td');
    const iconImage = document.createElement('div');
    const titleCell = document.createElement('td');
    const fileCell = document.createElement('td');
    const runtimeIdCell = document.createElement('td');
    const pidCell = document.createElement('td');
    const System = ModuleManager.get('System');

    iconImage.style = `background-size: cover;background-position: center;background-repeat: no-repeat;width: 1rem;height: 1rem;display: block;margin:auto;`;
    if (task.icon) {
        iconImage.style.backgroundImage = `url(${task.icon})`
    } else {
        fs.getFileURL((task.__filename ? System?.appRegistry.getInfoByPath(task.__filename).icon : '') || 'C:/Winbows/icons/files/program.ico').then(url => {
            iconImage.style.backgroundImage = `url(${url})`;
        })
    }
    iconCell.appendChild(iconImage);

    titleCell.textContent = task.title ?? 'Task';
    fileCell.textContent = task.__filename ? fsUtils.basename(task.__filename) : 'UNKNOWN';
    runtimeIdCell.textContent = task.runtimeID || 'UNKNOWN';
    pidCell.textContent = String(task.process?.pid) || 'UNKNOWN';

    function updateIcon(icon) {
        if (icon.startsWith('C:/')) {
            fs.getFileURL(icon || 'C:/Winbows/icons/files/program.ico').then(url => {
                iconImage.style.backgroundImage = `url(${url})`;
            })
        } else {
            iconImage.style.backgroundImage = `url(${icon})`;
        }
    }

    function updateTitle(title) {
        titleCell.textContent = title;
    }

    body.appendChild(tr);
    tr.appendChild(iconCell);
    tr.appendChild(titleCell);
    tr.appendChild(fileCell);
    tr.appendChild(runtimeIdCell);
    tr.appendChild(pidCell);

    taskItems[task.runtimeID] = {
        updateIcon, updateTitle, tr
    };
}

tasklist.list().forEach(runtimeID => {
    createRow({
        runtimeID,
        ...tasklist.get(runtimeID)
    });
})

tasklist.on('add', (e) => {
    createRow({
        runtimeID: e.id,
        ...e.task
    });
})
tasklist.on('remove', (e) => {
    const item = taskItems[e.id];
    if (item) {
        item.tr.remove();
        delete taskItems[e.id];
    }
})
tasklist.on('update', (e) => {
    const item = taskItems[e.id];
    if (item) {
        if (e.key == 'title') {
            item.updateTitle(e.value);
        } else if (e.key == 'icon') {
            item.updateIcon(e.value);
        }
    }
})

export default tasks;