import express from 'express';

const app = express();

app.use(express.static('./'), (req, res, next) => {
    res.status(404).sendFile('./404.html');
})

app.listen(3000, function () {
    console.log("Server is running...");
})