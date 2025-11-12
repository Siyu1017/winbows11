import Devtool from "../../../../../../../src/lib/winbows-devtool/dist/index.js";
import "../../../../../../../src/lib/winbows-devtool/dist/index.css";

const style = document.createElement('style');
style.textContent = `* {
            box-sizing: border-box;
        }

        .window-toolbar {
            background: #191919 !important;
        }

        .window-content {
            margin: 0;
            padding: .5rem;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #191919 !important;
        }

        .output * {
            font-family: Consolas,monospace;
        }

        .input {
            color: #fff;
            margin: 10px;
        }

        .output {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1px solid #333;
            overflow: hidden;
            border-radius: .75rem;
        }`;
document.head.insertBefore(style, document.head.firstChild);

browserWindow.setTheme('dark');

const devtool = new Devtool();
const input = document.createElement('input');
const output = document.createElement('div');
input.className = 'input';
input.type = 'file';
output.className = 'output';
document.body.appendChild(input);
document.body.appendChild(output);
output.appendChild(devtool.devtool);

devtool.console.log('Select a log file to parse...');
process.title = 'Debug Log Parser';

input.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        devtool.console.clear();
        devtool.console.info(`File: ${file.name}`);

        process.title = `Debug Log Parser - ${file.name}`

        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const informationLine = lines.shift();

        if (informationLine.startsWith('//')) {
            const items = informationLine.slice(2).split(',');
            const info = {};
            items.forEach(item => {
                const [key, value] = item.split('=');
                info[key.trim()] = value.trim();
            });
            devtool.console.info(`Version: ${info.VERSION}\nContent type: ${info.TYPE}`);
        } else {
            // If the first line is not an information line, put it back to lines
            devtool.console.warn('No log information found in the log file.');
            lines.unshift(informationLine);
        }

        try {
            while (lines.length) {
                const log = JSON.parse(lines.shift());
                if (log.data) {
                    try {
                        log.data = JSON.parse(log.data);
                    } catch (e) {
                        // Not JSON, keep as is
                        console.error('Error parsing log data JSON:', e);
                    }
                }
                devtool.console.log(`%c${log.time} Σ${log.sum}ms Δ${log.delta}ms\n%c[${log.module}/${log.level}]: %c${log.msg}`, 'color: rgb(154 154 154);'
                    , 'color: rgb(192 170 251);font-weight:bold;', 'color: unset;font-weight:bold;', log.data ? log.data : '');
                await new Promise(resolve => setTimeout(resolve));
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };
    reader.readAsText(file);
});