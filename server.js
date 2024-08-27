const express = require("express");
const app = express();

app.get("/", function(req, res) {
    return res.status(200).sendFile(__dirname + '/index.html');
})

app.use(express.static(__dirname + '/'), (req, res, next) => {
    res.status(404).redirect(`/?from=${encodeURIComponent(req.baseUrl + req.path)}`);
})

app.listen(3000, function () {
    console.log("Server is running...");
})