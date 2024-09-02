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