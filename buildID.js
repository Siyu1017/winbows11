import fs from 'fs';
import crypto from 'node:crypto'
// import pkg from "./package.json" assert { type: "json" };
// import { createHash } from "crypto";

let BUILD_ID;
// if (process.env.NODE_ENV == 'production') {
BUILD_ID = crypto.randomBytes(8).toString('hex');
// } else {
// BUILD_ID = createHash('md5').update(pkg.version).digest('hex').slice(0, 16);
// }

// Save the build id 
fs.writeFileSync('build.txt', BUILD_ID);