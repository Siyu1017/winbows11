const express = require("express");
const app = express();

app.use(express.static(__dirname), (req, res, next) => {
    res.status(404).sendFile(__dirname + '/404.html');
})

app.listen(3000, function () {
    console.log("Server is running...");
})