const express = require("express");
const app = express();

app.use(express.static(__dirname), (req, res, next) => {
    
})

app.listen(3000, function () {
    console.log("Server is running...");
})