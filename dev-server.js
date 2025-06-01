const express = require("express");
const app = express();
const fs = require("fs");

const devices = {};

app.use(express.json());
app.post("/report", (req, res) => {
    //fs.writeFile(`./logs/debug/debug-${Date.now()}.txt`, `${JSON.stringify(req.body)}`, function (err) {
    //    console.log(err);
    //})
    res.send();
})

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
    res.status(404).redirect(`/?from=${encodeURIComponent(req.baseUrl + req.path)}`);
})

app.listen(3000, function () {
    console.log("Server is running...");
})