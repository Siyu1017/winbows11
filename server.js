const express = require("express");
const app = express();

app.use(express.static(__dirname + '/'), (req, res, next) => {
    if (res.status(404)) {
        res.sendFile(__dirname + '/index.html');
    }
})

app.listen(3000, function () {
    console.log("Server is running...");
})