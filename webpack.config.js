import path from 'path';
import webpack from 'webpack'
import fs from 'fs';
import TerserPlugin from 'terser-webpack-plugin';
import pkg from "./package.json" assert { type: "json" };
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const BUILD_ID = fs.readFileSync('build.txt', 'utf-8');
if (!BUILD_ID) throw new Error('An error occurred while reading build id');

export default [
    {
        name: 'kernel',
        entry: './src/os/core/boot.js',
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
                    test: /\.ts$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
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
        resolve: {
            extensions: [".ts", ".js"]
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
            new ForkTsCheckerWebpackPlugin(),
            new webpack.DefinePlugin({
                __BUILD_ID__: `"${BUILD_ID}"`,
                __VERSION__: `"${pkg.version}"`,
                __MODE__: `"${process.env.NODE_ENV}"`
            }),
            new webpack.BannerPlugin({
                banner: `/*!
 * Winbows11 - ${BUILD_ID}
 * Copyright (c) Microhard ${new Date().getFullYear()}
 * Github : Siyu1017/winbows11
 */;`,
                raw: true
            })
        ]
    }, {
        name: 'kernel',
        entry: './src/install/install.js',
        output: {
            path: path.resolve('Winbows/System/kernel'),
            filename: 'install.js'
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
        }
    }
]