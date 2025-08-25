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
    console.log("Server is running at http://localhost:3000");
})