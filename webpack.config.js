const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');

const BUILD_ID = fs.readFileSync('build.txt', 'utf-8');
if (!BUILD_ID) throw new Error('An error occurred while reading build id');

module.exports = [
    {
        name: 'kernel',
        entry: './src/kernel/kernel.js',
        output: {
            path: path.resolve(__dirname, 'Winbows/System/kernel'),
            filename: 'kernel.js'
        },
        experiments: {
            topLevelAwait: true, // Enable top-level await support
        },
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader'
                        }
                    ]
                }
            ]
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false
                }),
            ],
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: `/*!
 * Winbows11 - ${BUILD_ID}
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */Object.defineProperty(window.System, 'buildId', {
        value: "${BUILD_ID}",
        writable: false,
        configurable: false
      });`,
                raw: true,
                entryOnly: true
            })
        ]
    }
];