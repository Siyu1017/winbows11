const fs = require('fs');
const path = require('path');
const BUILD_ID = fs.readFileSync('build.txt', 'utf-8');
if (!BUILD_ID) throw new Error('An error occurred while reading build id');

function walk(dir, done) {
    var results = [];
    if (dir.includes('node_modules')) return done(null, []);
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file.replace(__dirname, 'C:'));
                    next();
                }
            });
        })();
    });
};

async function getDirectorySize(directory) {
    let totalSize = 0;

    const files = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(directory, file.name);

        if (file.isDirectory() && !filePath.includes('node_modules')) {
            totalSize += await getDirectorySize(filePath);
        } else {
            const stats = await fs.promises.stat(filePath);
            totalSize += stats.size;
        }
    }

    return totalSize;
}

var table = [
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

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

walk(__dirname + '/Program Files', function (err, results1) {
    if (err) throw err;
    results1.forEach(function (file, i) {
        results1[i] = file.replaceAll('\\', '/');
    });
    table = table.concat(results1);
    walk(__dirname + '/Winbows', async function (err, results2) {
        if (err) throw err;
        results2.forEach(function (file, i) {
            results2[i] = file.replaceAll('\\', '/');
        });
        table = table.concat(results2);
        walk(__dirname + '/User', async function (err, results3) {
            if (err) throw err;
            results3.forEach(function (file, i) {
                results3[i] = file.replaceAll('\\', '/');
            });
            table = table.concat(results3);

            (async () => {
                const buildTime = new Date().getTime();
                const totalSize = await getDirectorySize(__dirname + '/Program Files') + await getDirectorySize(__dirname + '/Winbows') + await getDirectorySize(__dirname + '/User');

                const detail = {
                    build_id: BUILD_ID,
                    build_time: buildTime,
                    size: totalSize,
                    table: table,
                }

                fs.writeFile(__dirname + '/build.json', JSON.stringify(detail), function (err) {
                    if (err) return console.log(err);
                    return ''
                });

                fs.writeFile(__dirname + '/build-fetch.json', JSON.stringify({
                    size: totalSize,
                    build_time: buildTime,
                    build_id: BUILD_ID
                }), function (err) {
                    if (err) return console.log(err);
                    return ''
                })

                console.log(`Build ID: ${BUILD_ID}`)
                console.log(`Total size: ${formatBytes(totalSize)}`)
            })();
        });
    });
});