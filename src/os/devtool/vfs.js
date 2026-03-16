import "./vfs.css";

import { IndexedDBDriver } from "../fs/drivers/IndexedDBDriver.ts";
import { MemoryDriver } from "../fs/drivers/memoryDriver.ts";
import { VFS } from "../fs/core/vfs.ts";

const container = document.createElement('div');
container.style.padding = '1rem';
container.style.overflowY = 'scroll';
container.style.maxHeight = '100%'

//const driver = new MemoryDriver({ id: "test-driver" })
const driver = new IndexedDBDriver({ id: "test-driver" });
await driver.init();

const vfs = new VFS(driver);
await vfs.init();

function randomArrayBuffer(byteLength) {
    const buffer = new ArrayBuffer(byteLength);
    const view = new Uint8Array(buffer);
    crypto.getRandomValues(view);
    return buffer;
}

let writeTestStat = 'idle';
async function writeTest(count = 10000, output) {
    writeTestStat = 'running';

    if (!await vfs.exists('/wt'))
        await vfs.mkdir('/wt');

    let completed = 0;
    let delta = 0;
    let lastTime = 0;
    let startTime = 0;
    const id = setInterval(() => {
        const now = Date.now();
        const speed = delta * 1000 / (now - lastTime);
        const avg = completed * 1000 / (now - startTime);
        const remaining = count - completed;
        lastTime = now;
        delta = 0;
        output.innerHTML = `Writing data... ( ${Math.round((completed / count) * 100)}% )\nSpeed: ${Math.round(speed)} files/second\nAverage: ${Math.round(avg)} files/second\nRemaining items: ${remaining} files\nRemaining time: ${Math.round(remaining / speed)} seconds`;
    }, 100);

    const testId = crypto.randomUUID();
    const dist = `/wt/${testId}`;
    const signature = `writeTest_${testId}`;
    if (!await vfs.exists(dist))
        await vfs.mkdir(dist);

    await vfs.write(`${dist}/.signature`, new Blob([signature], {
        type: 'text/plain'
    }))

    startTime = Date.now();
    lastTime = startTime;
    for (let i = 0; i < count; i++) {
        await vfs.write(`${dist}/file-${i + 1}.txt`, new Blob([signature + `_${i + 1}`], {
            type: 'text/plain'
        }))
        delta++;
        completed++;
    }

    clearInterval(id);

    const now = Date.now();
    const past = now - startTime;
    output.innerHTML = `Test completed in ${past}ms!\nAverage Speed: ${Math.round(count * 1000 / past)} files/second`;

    if (!await vfs.exists(`/wt/.records/`))
        await vfs.mkdir(`/wt/.records/`);
    await vfs.write(`/wt/.records/${testId}`, new Blob([JSON.stringify({
        version: 1,
        speed: count * 1000 / past,
        count: count,
        duration: past
    })], {
        type: 'application/json'
    }))

    updateRecords();

    writeTestStat = 'idle';
}

const btns = document.createElement('div');
const testBtn1 = document.createElement('button');
const testBtn2 = document.createElement('button');
const testBtn3 = document.createElement('button');
const formatBtn = document.createElement('button');
const output = document.createElement('div');
const records = document.createElement('div');
btns.style = `display: flex;gap: .5rem;flex-wrap: wrap;`
records.style.whiteSpace = 'pre-wrap';
records.style.paddingTop = '.5rem';
records.innerHTML = '<h2>Previous records</h2>'
output.style.font = 'monospace';
output.style.whiteSpace = 'pre-wrap'
output.style.paddingTop = '.5rem';
testBtn1.addEventListener('click', () => {
    try {
        if (writeTestStat == 'running') return;
        writeTest(100, output);
    } catch (e) {
        writeTestStat = 'idle';
    }
})
testBtn2.addEventListener('click', () => {
    try {
        if (writeTestStat == 'running') return;
        writeTest(1000, output);
    } catch (e) {
        writeTestStat = 'idle';
    }
})
testBtn3.addEventListener('click', () => {
    try {
        if (writeTestStat == 'running') return;
        writeTest(10000, output);
    } catch (e) {
        writeTestStat = 'idle';
    }
})
formatBtn.addEventListener('click', () => {
    vfs.format();
})
testBtn1.textContent = 'run write test ( 100 files )';
testBtn2.textContent = 'run write test ( 1000 files )';
testBtn3.textContent = 'run write test ( 10000 files )';
formatBtn.textContent = 'format';
testBtn1.className = 'vfs-btn';
testBtn2.className = 'vfs-btn';
testBtn3.className = 'vfs-btn';
formatBtn.className = 'vfs-btn';
container.appendChild(btns);
btns.appendChild(testBtn1);
btns.appendChild(testBtn2);
btns.appendChild(testBtn3);
btns.appendChild(formatBtn);
container.appendChild(output);
container.appendChild(records);

async function updateRecords() {
    records.innerHTML = '<h2>Previous records</h2>';
    if (await vfs.exists('/wt/.records')) {
        const r = await vfs.readdir('/wt/.records');
        for (const n of r) {
            const json = new TextDecoder().decode(await vfs.read(`/wt/.records/${n}`));
            const dt = JSON.parse(json);
            const record = document.createElement('div');
            const info = document.createElement('div');
            const deleteBtn = document.createElement('div');
            record.className = 'vfs-test-record';
            info.className = 'vfs-test-record-info';
            deleteBtn.className = 'vfs-test-record-btn';
            info.innerHTML = `Record ID: ${n.replace('.txt', '')}\nVersion: ${dt.version}\nSpeed: ${Math.round(dt.speed)} files/second\nCount: ${dt.count} files\nDuration: ${dt.duration}ms`;
            deleteBtn.innerHTML = 'Delete';
            deleteBtn.addEventListener('click', async () => {
                deleteBtn.innerHTML = 'Deleting...';
                await vfs.delete(`/wt/.records/${n}`);
                record.remove();
            })
            record.appendChild(info);
            record.appendChild(deleteBtn);
            records.appendChild(record);
            if (await vfs.exists(`/wt/${n.replace('.txt', '')}`)) {
                await vfs.rmdir(`/wt/${n.replace('.txt', '')}`, {
                    recursive: true
                })
            }
        }
    }
}

updateRecords();

; (() => {
    const storage = document.createElement('div');
    const root = document.createElement('div');
    const overview = document.createElement('div');
    const overviewIcon = document.createElement('div');
    const overviewText = document.createElement('div');
    const content = document.createElement('div');

    storage.className = 'devtool-storage'
    storage.style.padding = '0'
    root.className = 'devtool-storage-item';
    overview.className = 'devtool-storage-item-overview';
    overviewIcon.className = 'devtool-storage-item-overview-icon';
    overviewText.className = 'devtool-storage-item-overview-text';
    content.className = 'devtool-storage-item-content';

    overviewIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive-icon lucide-hard-drive"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>`
    overviewText.textContent = 'Root';
    storage.innerHTML = `<h2>File Explorer</h2>`

    storage.appendChild(root);
    root.appendChild(overview);
    overview.appendChild(overviewIcon);
    overview.appendChild(overviewText);
    root.appendChild(content);

    async function getContent(dir, parent) {
        const items = await vfs.readdir(dir)
        const stats = [];

        if (items.length == 0) {
            const itemEl = document.createElement('div');
            const overview = document.createElement('div');

            itemEl.className = 'devtool-storage-item';
            overview.className = 'devtool-storage-item-overview empty';
            overview.textContent = 'This folder is empty.';

            itemEl.appendChild(overview);
            return parent.appendChild(itemEl);
        }

        for (const item of items) {
            const path = `${dir}/${item}`
            stats.push({
                name: item,
                path: path,
                ...await vfs.stats(path)
            })
        }

        stats.sort((a, b) => {
            if (a.type != b.type) {
                return a.type == 'directory' ? -1 : 1;
            }

            return a.name.localeCompare(b.name);
        });

        for (const stat of stats) {
            const itemEl = document.createElement('div');
            const overview = document.createElement('div');
            const overviewIcon = document.createElement('div');
            const overviewText = document.createElement('div');
            const content = document.createElement('div');

            itemEl.className = 'devtool-storage-item';
            overview.className = 'devtool-storage-item-overview';
            overviewIcon.className = 'devtool-storage-item-overview-icon';
            overviewText.className = 'devtool-storage-item-overview-text';
            content.className = 'devtool-storage-item-content';

            if (stat.type == 'dir') {
                let append = false;
                let status = 'default';
                overview.addEventListener('click', async () => {
                    if (status == 'loading') return;
                    if (append == true) {
                        content.innerHTML = '';
                        append = false;
                        return;
                    }
                    status = 'loading';
                    await getContent(stat.path, content);
                    append = true;
                    status = 'default';
                })
                overviewIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
            } else {
                const date = new Date(stat.mtime);
                let dateString = '';
                if (isNaN(date)) {
                    dateString = 'Invalid date';
                } else {
                    const day = date.format("yyyy/MM/dd");
                    const time = (date.format("hh") < 13 ? date.format("hh:mm") : new Date(date.getTime() - 12 * 1000 * 60 * 60).format("hh:mm")) + (date.format("hh") < 12 ? ' AM' : ' PM');
                    dateString = day + ' ' + time;
                }
                overview.setAttribute('data-tooltip', `Length: ${stat.size}\nLast modified: ${dateString}`)
                overviewIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
            }
            overviewText.textContent = stat.name;

            itemEl.appendChild(overview);
            overview.appendChild(overviewIcon);
            overview.appendChild(overviewText);
            itemEl.appendChild(content);
            parent.appendChild(itemEl);
        }
    }

    let append = false;
    overview.addEventListener('click', () => {
        if (append == true) {
            content.innerHTML = '';
            append = false;
            return;
        }
        append = true;
        getContent('/', content);
    })
    container.appendChild(storage)
})();

export default container;