import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import webpack from "webpack";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const scriptsDir = path.join(publicDir, "assets", "scripts");
const styleDir = path.join(publicDir, "assets", "styles");
const typeRoot = path.join(rootDir, "types", "wrt");
const wrtOutput = path.join(publicDir, "Program Files", "VSCode", "wrt.d.ts");
const buildJson = path.join(publicDir, "build.json");
const buildFetchJson = path.join(publicDir, "build-fetch.json");

function parseArgs() {
    const args = process.argv.slice(2);
    const modeIndex = args.indexOf("--mode");
    const mode = modeIndex !== -1 ? args[modeIndex + 1] : "production";
    if (!["production", "development", "none"].includes(mode)) throw new Error(`Invalid webpack mode: ${mode}`);
    return {
        mode,
        watch: args.includes("--watch")
    };
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function createBuildId() {
    return crypto.randomBytes(8).toString("hex");
}

async function clean() {
    await Promise.all([
        fs.promises.rm(scriptsDir, { recursive: true, force: true }),
        fs.promises.rm(styleDir, { recursive: true, force: true }),
        fs.promises.rm(buildJson, { force: true }),
        fs.promises.rm(buildFetchJson, { force: true })
    ]);
}

async function bundleVSCodeWrtTypes() {
    const files = [];

    async function collect(directory) {
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        entries.sort((a, b) => a.name.localeCompare(b.name));

        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) await collect(entryPath);
            else if (entry.name.endsWith(".d.ts") && entry.name !== "index.d.ts") files.push(entryPath);
        }
    }

    await collect(typeRoot);

    const withoutReferences = source => source.replace(/^\/\/\/\s*<reference[^\n]*>\s*\r?\n/gm, "");
    const declarations = await Promise.all(files.map(async file => withoutReferences(await fs.promises.readFile(file, "utf8"))));
    const index = await fs.promises.readFile(path.join(typeRoot, "index.d.ts"), "utf8");
    const globals = withoutReferences(index)
        .replace(/export\s*\{\s*\};?\s*/, "")
        .replace(/declare global\s*\{([\s\S]*)\}\s*$/, "$1");

    await fs.promises.mkdir(path.dirname(wrtOutput), { recursive: true });
    await fs.promises.writeFile(wrtOutput, `/* Auto-generated from types/wrt. Do not edit. */\n\n${declarations.join("\n")}\n${globals}\n`);
}

async function generateFileTable() {
    let totalSize = 0;
    const fileTable = [];
    const ignored = new Set([
        "build.json",
        "build-fetch.json"
    ]);

    async function walk(directory) {
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        entries.sort((a, b) => a.name.localeCompare(b.name));

        for (const entry of entries) {
            const filePath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                await walk(filePath);
                continue;
            }

            const relative = path.relative(publicDir, filePath).replace(/\\/g, "/");
            if (ignored.has(relative)) continue;

            const stats = await fs.promises.stat(filePath);
            totalSize += stats.size;
            fileTable.push(`C:/${relative}`);
        }
    }

    await walk(publicDir);
    return { totalSize, fileTable };
}

async function finalizeBuild(buildId) {
    const { totalSize, fileTable } = await generateFileTable();
    const buildTime = Date.now();

    await Promise.all([
        fs.promises.writeFile(buildJson, JSON.stringify({
            build_id: buildId,
            build_time: buildTime,
            size: totalSize,
            table: fileTable
        })),
        fs.promises.writeFile(buildFetchJson, JSON.stringify({
            size: totalSize,
            build_time: buildTime,
            build_id: buildId
        }))
    ]);

    console.log(`Build ID: ${buildId}`);
    console.log(`Total size: ${formatBytes(totalSize)}`);
}

function printWebpackStats(stats) {
    console.log(stats.toString({
        colors: true,
        chunks: false,
        modules: false,
        children: true
    }));
}

async function main() {
    const { mode, watch } = parseArgs();
    const buildId = createBuildId();

    await clean();
    await bundleVSCodeWrtTypes();

    const { default: webpackConfig } = await import("../webpack.config.js");
    const config = typeof webpackConfig === "function"
        ? webpackConfig({ BUILD_ID: buildId }, { mode })
        : webpackConfig;

    const configs = Array.isArray(config) ? config : [config];
    for (const item of configs) item.mode ??= mode;

    const compiler = webpack(configs);
    if (watch) {
        compiler.watch({}, async (error, stats) => {
            if (error) {
                console.error(error);
                return;
            }
            printWebpackStats(stats);
            if (stats.hasErrors()) return;

            try {
                await finalizeBuild(buildId);
            } catch (error) {
                console.error("Failed to finalize build:", error);
            }
        });

        return;
    }

    compiler.run(async (error, stats) => {
        if (error) {
            console.error(error);
            process.exitCode = 1;
            return;
        }

        printWebpackStats(stats);

        if (stats.hasErrors()) {
            process.exitCode = 1;
            compiler.close(() => { });
            return;
        }

        try {
            await finalizeBuild(buildId);
        } catch (error) {
            console.error("Failed to finalize build:", error);
            process.exitCode = 1;
        } finally {
            compiler.close(closeError => {
                if (closeError) {
                    console.error(closeError);
                    process.exitCode = 1;
                }
            });
        }
    });
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});