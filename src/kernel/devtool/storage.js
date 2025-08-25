import "./storage.css";
import { apis } from "../kernelRuntime.js";
import { fsUtils } from "../../lib/fs.js";

const { fs } = apis;

const storage = document.createElement('div');
const root = document.createElement('div');
const overview = document.createElement('div');
const overviewIcon = document.createElement('div');
const overviewText = document.createElement('div');
const content = document.createElement('div');

storage.className = 'devtool-storage'
root.className = 'devtool-storage-item';
overview.className = 'devtool-storage-item-overview';
overviewIcon.className = 'devtool-storage-item-overview-icon';
overviewText.className = 'devtool-storage-item-overview-text';
content.className = 'devtool-storage-item-content';

overviewIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive-icon lucide-hard-drive"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>`
overviewText.textContent = 'C:/';

storage.appendChild(root);
root.appendChild(overview);
overview.appendChild(overviewIcon);
overview.appendChild(overviewText);
root.appendChild(content);

async function getContent(dir, parent) {
    const items = await fs.readdir(dir)
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
        stats.push({
            name: fsUtils.basename(item),
            path: item,
            ...await fs.stat(item)
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

        if (stat.type == 'directory') {
            let append = false;
            overview.addEventListener('click', () => {
                if (append == true) {
                    content.innerHTML = '';
                    append = false;
                    return;
                }
                append = true;
                getContent(stat.path, content);
            })
            overviewIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
        } else {
            const date = new Date(stat.lastModifiedTime);
            let dateString = '';
            if (isNaN(date)) {
                dateString = 'Invalid date';
            } else {
                const day = date.format("yyyy/MM/dd");
                const time = (date.format("hh") < 13 ? date.format("hh:mm") : new Date(date.getTime() - 12 * 1000 * 60 * 60).format("hh:mm")) + (date.format("hh") < 12 ? ' AM' : ' PM');
                dateString = day + ' ' + time;
            }
            overview.setAttribute('data-tooltip', `Length: ${stat.length}\nLast modified: ${dateString}`)
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
    getContent('C:/', content);
})

export default storage;