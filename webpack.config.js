import path from 'path';
import webpack from 'webpack'
import fs from 'fs';
import TerserPlugin from 'terser-webpack-plugin';

const BUILD_ID = fs.readFileSync('build.txt', 'utf-8');
if (!BUILD_ID) throw new Error('An error occurred while reading build id');

export default [
    {
        name: 'kernel',
        entry: './src/kernel/kernel.js',
        output: {
            path: path.resolve('Winbows/System/kernel'),
            filename: 'kernel.js'
        },
        experiments: {
            topLevelAwait: true, // Enable top-level await support
        },
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
            new webpack.DefinePlugin({
                __BUILD_ID__: `"${BUILD_ID}"`
            }),
            new webpack.BannerPlugin({
                banner: `/*!
 * Winbows11 - ${BUILD_ID}
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */;`,
                raw: true,
                entryOnly: true
            })
        ]
    }
];