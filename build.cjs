const fs = require('fs');
const path = require('path');

const BUILD_ID = process.env.BUILD_ID || fs.readFileSync('build.txt', 'utf-8');
if (!BUILD_ID) throw new Error('An error occurred while reading build id');

const defauleTable = [
    'C:/build.json',
    'C:/index.html',
    'C:/index.css',
    'C:/favicon.ico',
    'C:/banner.png',
    'C:/presentation.png',
    'C:/LICENSE',
    'C:/README.md',
    'C:/package.json',
    'C:/package-lock.json'
];

async function generateTable(entries, exclude = ['src', 'node_modules']) {
    let totalSize = 0;
    let fileTable = [];

    async function readdir(directory) {
        const files = await fs.promises.readdir(directory, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(directory, file.name);

            if (file.isDirectory()) {
                if (!exclude.includes(file.name))
                    await readdir(filePath);
            } else {
                const stats = await fs.promises.stat(filePath);
                totalSize += stats.size;
                fileTable.push(filePath.replace(__dirname, 'C:').replace(/\\/g, '/'));
            }
        }
    }

    for (const entry of entries) {
        await readdir(entry);
    }

    return { totalSize, fileTable };
}

async function calculateDefaultTableSize() {
    const items = defauleTable.map(i => i.replace('C:', __dirname));
    let size = 0;

    for (const item of items) {
        const stats = await fs.promises.stat(item);
        size += stats.size;
    }

    return size;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

generateTable([__dirname + '/Program Files', __dirname + '/Winbows', __dirname + '/User']).then(async ({ fileTable, totalSize }) => {
    const table = [...fileTable, ...defauleTable];
    const size = totalSize + await calculateDefaultTableSize()
    const buildTime = new Date().getTime();
    const detail = {
        build_id: BUILD_ID,
        build_time: buildTime,
        size: size,
        table: table,
    }

    fs.writeFile(__dirname + '/build.json', JSON.stringify(detail), function (err) {
        if (err) return console.log(err);
        return ''
    });

    fs.writeFile(__dirname + '/build-fetch.json', JSON.stringify({
        size: size,
        build_time: buildTime,
        build_id: BUILD_ID
    }), function (err) {
        if (err) return console.log(err);
        return ''
    })

    console.log(`Build ID: ${BUILD_ID}`);
    console.log(`Total size: ${formatBytes(size)}`);
});