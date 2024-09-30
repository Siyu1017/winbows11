const path = require('path');
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');

const banner =
    `Winbows11 (c) ${new Date().getFullYear()}
All rights reserved.
WinUI v${pkg.version}`;

module.exports = {
    entry: './winui.js',
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
            },
        ]
    },
    // devtool: "source-map",
    devtool: false,
    output: {
        filename: 'winui.min.js',
        path: path.resolve(__dirname + '/build'),
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserWebpackPlugin({
                extractComments: false
            })
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({
            banner: banner
        })
    ]
};