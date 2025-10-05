import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname), (req, res, next) => {
    res.status(404).sendFile('/404.html', { root: __dirname });
})

app.listen(3000, function () {
    setTimeout(() => {
        console.log("Server is running at http://localhost:3000");
        console.log("Dev mode: http://localhost:3000/?dev");
        console.log("Log parser: http://localhost:3000/dev/log-parser/")
    }, 1000);
})