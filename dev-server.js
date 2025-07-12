const express = require("express");
const app = express();
const fs = require("fs");

const devices = {};

app.use(express.json());

app.use((req, res, next) => {
    if (!devices[req.headers['user-agent']]) {
        devices[req.headers['user-agent']] = [];
    }
    devices[req.headers['user-agent']].push(req.url);
    fs.writeFile(`./logs/devices/${btoa(req.headers['user-agent'])}.txt`, `${req.headers['user-agent']}\n${devices[req.headers['user-agent']].join('\n')}`, function (err) {
        if (err) {
            console.log(err)
        }
    })
    next();
})

app.use(express.static(__dirname), (req, res, next) => {
    res.status(404).sendFile(__dirname + '/404.html');
})

app.listen(3000, function () {
    console.log("Server is running at http://localhost:3000");
})