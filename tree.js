const BUILD_ID = require('node:crypto').randomBytes(8).toString('hex');

var fs = require('fs');
var path = require('path');
var walk = function (dir, done) {
    var results = [];
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

        if (file.isDirectory()) {
            totalSize += await getDirectorySize(filePath);
        } else {
            const stats = await fs.promises.stat(filePath);
            totalSize += stats.size;
        }
    }

    return totalSize;
}

var res = [];

walk(__dirname + '/Program Files', function (err, results1) {
    if (err) throw err;
    results1.forEach(function (file, i) {
        results1[i] = file.replaceAll('\\', '/');
    });
    res = results1;
    walk(__dirname + '/Winbows', async function (err, results2) {
        if (err) throw err;
        results2.forEach(function (file, i) {
            results2[i] = file.replaceAll('\\', '/');
        });
        fs.writeFile(__dirname + '/tree.json', JSON.stringify(res.concat(results2)), function (err) {
            if (err) return console.log(err);
            return ''
        });
    });
});

(async () => {
    const totalSize = await getDirectorySize(__dirname + '/Program Files') + await getDirectorySize(__dirname + '/Winbows');

    const detail = {
        size: totalSize,
        build_id: BUILD_ID
    }

    fs.writeFile(__dirname + '/build.json', JSON.stringify(detail), function (err) {
        if (err) return console.log(err);
        return ''
    });
})();
