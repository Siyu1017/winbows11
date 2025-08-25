/*import del from "rollup-plugin-delete";
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
*/

import terser from "@rollup/plugin-terser";
import resolve from '@rollup/plugin-node-resolve';
import fs from 'fs';
import crypto from 'node:crypto'
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import json from "@rollup/plugin-json";

const BUILD_ID = crypto.randomBytes(8).toString('hex');

// Save the build id 
fs.writeFileSync('build.txt', BUILD_ID);

// Remove old kernel files
fs.rmSync('Winbows/System/kernel', { recursive: true, force: true });

const builtinModules = fs.readdirSync('./User/AppData/Roaming/wrt/wrt_modules/');
const builtinModuleDatas = {
    version: 1,
    packages: {}
};
for (const mod of builtinModules) {
    try {
        const jsonText = fs.readFileSync('./User/AppData/Roaming/wrt/wrt_modules/' + mod + '/package.json', 'utf-8');
        const modInfo = JSON.parse(jsonText);
        modInfo.pd = mod;
        builtinModuleDatas.packages[mod] = modInfo;
    } catch (e) {
        console.warn('Failed to read file', './User/AppData/Roaming/wrt/wrt_modules/' + mod + '/package.json')
    }
}
fs.writeFileSync('./User/AppData/Roaming/wrt/wrt_modules/packages.json', JSON.stringify(builtinModuleDatas), 'utf-8')

export default [{
    input: `src/kernel/init.js`,
    output: {
        name: '_',
        file: `Winbows/System/kernel/init.js`,
        format: 'iife',
        banner: `/*!
 * Winbows11 - ${BUILD_ID}
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */`,
        intro: `const buildId = "${BUILD_ID}";`
    },
    plugins: [
        terser()
    ]
}];