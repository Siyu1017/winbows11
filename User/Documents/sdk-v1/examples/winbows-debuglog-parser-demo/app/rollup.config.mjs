import resolve from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";
import fs from "fs";
import postcss from "rollup-plugin-postcss";
import commonjs from '@rollup/plugin-commonjs';

fs.rmSync('./dist', { recursive: true, force: true });

export default [{
    input: `./src/index.js`,
    output: {
        name: '_',
        file: `./dist/index.js`,
        format: 'es',
        banner: `/*!
 * Winbows Debug Log Parser Demo
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */`,
        plugins: [terser()]
    },
    plugins: [
        resolve(),
        commonjs(),
        postcss({
            minimize: true
        })
    ],
    external: []
}];