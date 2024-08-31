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

walk(__dirname + '/Program Files', function (err, results) {
    if (err) throw err;
    results.forEach(function (file, i) {
        results[i] = file.replaceAll('\\', '/');
    });
    res.concat(results);
    walk(__dirname + '/Winbows', function (err, results) {
        if (err) throw err;
        results.forEach(function (file, i) {
            results[i] = file.replaceAll('\\', '/');
        });
        res.concat(results);
        fs.writeFile(__dirname + '/tree.json', JSON.stringify(results), function (err) {
            if (err) return console.log(err);
            return ''
        });
    });
});