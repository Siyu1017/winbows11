import path from "path";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import pkg from "./package.json" with { type: "json" };
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import RemoveEmptyScriptsPlugin from "webpack-remove-empty-scripts";

export default (env = {}, argv = {}) => {
    const mode = argv.mode ?? "production";
    const production = mode === "production";
    const BUILD_ID = env.BUILD_ID;
    const SITE_URL = "https://winbows11-beta.vercel.app";
    const scriptFilename = production
        ? "assets/scripts/[name].[contenthash:8].js"
        : "assets/scripts/[name].js";
    const styleFilename = production
        ? "assets/styles/[name].[contenthash:8].css"
        : "assets/styles/[name].css";
    if (!BUILD_ID) throw new Error("BUILD_ID is required");

    return [
        {
            name: "kernel",
            entry: "./src/os/core/boot.js",
            output: {
                path: path.resolve("public/assets/scripts/"),
                filename: "kernel.js"
            },
            experiments: {
                topLevelAwait: true
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: "ts-loader",
                        exclude: /node_modules/
                    },
                    {
                        test: /\.css$/,
                        use: ["style-loader", "css-loader"]
                    }
                ]
            },
            resolve: {
                extensions: [".ts", ".js"],
                fullySpecified: false
            },
            optimization: {
                minimize: true,
                minimizer: [
                    new TerserPlugin({
                        extractComments: false
                    })
                ]
            },
            plugins: [
                new ForkTsCheckerWebpackPlugin(),
                new webpack.DefinePlugin({
                    __BUILD_ID__: JSON.stringify(BUILD_ID),
                    __VERSION__: JSON.stringify(pkg.version),
                    __MODE__: JSON.stringify(mode)
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
        },
        {
            name: "pages",
            entry: {
                index: [
                    "./src/pages/index.css",
                    "./src/pages/index.js"
                ],
                install: [
                    "./src/pages/install.js",
                    "./src/pages/install.css"
                ]
            },
            output: {
                path: path.resolve("public"),
                filename: scriptFilename
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: "ts-loader",
                        exclude: /node_modules/
                    },
                    {
                        test: /\.css$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            "css-loader"
                        ]
                    }
                ]
            },
            resolve: {
                extensions: [".ts", ".js"],
                fullySpecified: false
            },
            experiments: {
                topLevelAwait: true
            },
            optimization: {
                minimize: true,
                minimizer: [
                    "...",
                    new CssMinimizerPlugin()
                ]
            },
            plugins: [
                new RemoveEmptyScriptsPlugin(),
                new MiniCssExtractPlugin({
                    filename: styleFilename
                }),
                new webpack.DefinePlugin({
                    __BUILD_ID__: JSON.stringify(BUILD_ID),
                    __VERSION__: JSON.stringify(pkg.version),
                    __MODE__: JSON.stringify(mode)
                }),
                new HtmlWebpackPlugin({
                    template: "./src/pages/index.html",
                    filename: "index.html",
                    chunks: ["index"],
                    inject: "head",
                    templateParameters: {
                        site: {
                            title: "Winbows11",
                            description: "Winbows11 is a Windows 11-inspired web desktop with apps, a virtual filesystem, terminal, process management, and a browser-based application runtime.",
                            image: `${SITE_URL}/assets/images/banner.png`,
                            url: SITE_URL
                        }
                    },
                    minify: {
                        collapseWhitespace: true,
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        minifyCSS: true,
                        minifyJS: true
                    }
                }),
                new HtmlWebpackPlugin({
                    template: "./src/pages/install.html",
                    filename: "install.html",
                    chunks: ["install"],
                    inject: "head",
                    templateParameters: {
                        site: {
                            title: "Install Winbows11",
                            description: "Install Winbows11.",
                            image: `${SITE_URL}/assets/images/banner.png`,
                            url: `${SITE_URL}/install.html`
                        }
                    },
                    minify: {
                        collapseWhitespace: true,
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        minifyCSS: true,
                        minifyJS: true
                    }
                })
            ]
        }
    ];
}