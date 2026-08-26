import express from 'express';
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')), (req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
})

app.listen(3000, function () {
    console.log("Server is running...");
})