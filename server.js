const express = require("express");
const app = express();

app.use((req, res, next) => {
    res.status(404).redirect(`/?from=${encodeURIComponent(req.baseUrl + req.path)}`);
})

app.listen(3000, function () {
    console.log("Server is running...");
})