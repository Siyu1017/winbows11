/*import del from "rollup-plugin-delete";
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import json from "@rollup/plugin-json";*/

const terser = require("@rollup/plugin-terser");
const fs = require('node:fs');
const pkg = require('./package.json');

fs.rmSync('./dist', { recursive: true, force: true });

const plugins = [
    terser()
];

module.exports = [{
    input: `./src/index.js`,
    output: {
        name: '_',
        file: `./dist/index.js`,
        format: 'es',
        banner: `/*!
 * WRT-Application <v${pkg.version}>
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */`,
        sourcemap: true
    },
    plugins
}];