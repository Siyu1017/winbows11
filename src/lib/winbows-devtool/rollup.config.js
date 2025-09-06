const terser = require("@rollup/plugin-terser");
const pkg = require("./package.json");
const postcss = require("rollup-plugin-postcss");

module.exports = [{
    input: `src/index.js`,
    output: [
        {
            file: `dist/index.js`,
            format: 'esm',
            banner: `/*!
 * winbows-devtool v${pkg.version}
 * Copyright (c) Siyu1017 ${new Date().getFullYear()}
 * Github : Siyu1017/winbows-devtool
 */`,
            intro: `const version="${pkg.version}"`
        }
    ],
    plugins: [
        terser(),
        postcss({
            module: true,
            extract: true,
            minimize: true
        })
    ]
}];