import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";

const style = document.createElement('style');
style.innerHTML = `.window-content * {color: #fff;font: 1rem monospace;white-space:pre-wrap;line-height: 1.12;} .window-content,.window-toolbar{background:rgb(30, 30, 30) !important;} *::selection{ background:#fff;color:#000} .xterm { height: inherit;}`;
document.head.appendChild(style);

browserWindow.setTheme('dark');
document.documentElement.classList.add('winui');
document.documentElement.classList.add('winui-no-background');
document.documentElement.classList.add('winui-dark');

document.body.style = `padding: .5rem; padding-right: 0;`;
const container = document.createElement('div');
container.style = `height: 100%;`;
document.body.appendChild(container);

process.title = 'Command Prompt';

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function writeHexColor(term, text, hex) {
    const [r, g, b] = hexToRgb(hex);
    term.write(`\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`);
}

function applyHexColor(term, hex) {
    if (!hex) {
        term.write('\x1b[0m');
    } else {
        const [r, g, b] = hexToRgb(hex);
        term.write(`\x1b[38;2;${r};${g};${b}m`);
    }
}

const shell = new ShellInstance(process);
const term = new Terminal({
    cols: 80,
    rows: 24,
    convertEol: true,
    cursorBlink: true,
    theme: {
        background: 'rgb(30, 30, 30)',
        foreground: '#d4d4d4'
    }
});
const fitAddon = new FitAddon();

await shell.execCommand('cd C:/');

term.loadAddon(fitAddon);
term.open(container);
term.write(`Winbows11 [Version ${System.information.version}]\n(c) Microhard Corporation. All rights reserved.\n\nType \"help\" for available commands.\n`);

/*
let progress = 0;
const interval = setInterval(() => {
    progress += 5;
    const bar = "█".repeat(progress / 5) + "-".repeat(20 - progress / 5);
    term.write(`\r[${bar}] ${progress}%`);
    if (progress >= 100) {
        clearInterval(interval);
        term.write("\nDone!\n");
    }
}, 200);*/

let outputBuffer = '';

let inputType = null;
let startInNewLine = true;
let promptType = 'normal';
let beginningText = '';

let cursor = 0;
let lastCols = term.cols;
let inputHistory = [];
let inputHistoryIndex = 0;

let normalBuffer = '';
let promptBuffer = '';

function replaceInput() {
    const pwd = `${path.normalize(shell.root + shell.pwd)}>`;
    // term.write('\x1b[2K\r' + pwd + buffer);
    // cursor = buffer.length;
    term.write(`\x1B[${pwd.length + 1 + cursor}G`)
}

function updateCursor(term, prompt, current, target) {
    const len = prompt.length;
    current += len;
    target += len;
    const cols = term.cols;

    // Zero-based row number
    const currentRow = ~~(current / cols);
    const targetRow = ~~(target / cols);

    const currentCol = current % cols;
    const targetCol = target % cols;

    if (currentRow != targetRow && current != target) {
        let d = currentRow - targetRow;
        if (targetCol == 0) {
            d--;
            //term.write(`\x1b[${targetRow}B\r`);
        }
        if (d > 0) {
            term.write(`\x1b[${d}A`);
        }
    }
    if (currentCol != targetCol) {
        const d = currentCol - targetCol;
        if (d > 0) {
            term.write(`\x1b[${d}D`);
        } else {
            term.write(`\x1b[${-d}C`);
        }
    }
}

term.onResize(({ cols, rows }) => {
    if (inputType != 'normal') return;

    const len = beginningText.length;
    const originalRow = ~~((cursor + len) / lastCols);
    if (originalRow > 0) {
        term.write(`\x1b[${originalRow}A`);
    }
    term.write('\r\x1b[0J');
    term.write(beginningText);

    updateCommandInput(0, cursor, normalBuffer);
    lastCols = term.cols;
});

function updateCommandInput(orgCursor, cursor, buffer) {
    const toWrite = buffer.slice(orgCursor);
    const matched = buffer.match(/\S+/);
    if (matched) {
        const endIndex = matched.index + matched[0].length;
        if (endIndex > orgCursor) {
            applyHexColor(term, '#ffc96d');
            term.write(toWrite.slice(0, endIndex - orgCursor));
            applyHexColor(term);
            term.write(toWrite.slice(endIndex - orgCursor));
        } else {
            term.write(toWrite);
        }
    } else {
        term.write(toWrite);
    }

    updateCursor(term, beginningText, buffer.length, cursor);
    //term.write(`\x1b[${beginningText.length + cursor + 1}G`);
}

function updateNormalContent() {
    beginningText = `${path.normalize(shell.root + shell.pwd)}>`;
    term.write('\x1b[2K\r');
    term.write(beginningText);

    const matched = normalBuffer.match(/\S+/);
    if (matched) {
        const endIndex = matched.index + matched[0].length;
        applyHexColor(term, '#ffc96d');
        term.write(normalBuffer.slice(0, endIndex));
        applyHexColor(term);
        term.write(normalBuffer.slice(endIndex));
    } else {
        term.write(normalBuffer);
    }
    term.write(`\x1B[${beginningText.length + 1 + cursor}G`);
}

async function handleNormalInput(data) {
    switch (data) {
        case '\x1B[A':  // Up
            if (inputHistoryIndex > 0) {
                const orgCursor = cursor;

                inputHistoryIndex--;
                normalBuffer = inputHistory[inputHistoryIndex];
                cursor = normalBuffer.length;

                beginningText = `${path.normalize(shell.root + shell.pwd)}>`;
                updateCursor(term, beginningText, orgCursor, 0);
                term.write('\x1b[0J');
                updateCommandInput(0, cursor, normalBuffer);
            }
            return;
        case '\x1B[B':  // Down
            if (inputHistoryIndex < inputHistory.length) {
                const orgCursor = cursor;

                inputHistoryIndex++;
                normalBuffer = inputHistory[inputHistoryIndex] || '';
                cursor = normalBuffer.length;

                beginningText = `${path.normalize(shell.root + shell.pwd)}>`;
                updateCursor(term, beginningText, orgCursor, 0);
                term.write('\x1b[0J');
                updateCommandInput(0, cursor, normalBuffer);
            }
            return;
        case '\x1B[C':  // Right
            if (cursor < normalBuffer.length) {
                cursor++;
                if (cursor % term.cols == 0) {
                    term.write('\x1b[B\r');
                } else {
                    term.write(data);
                }
            }
            return;
        case '\x1B[D':  // Left
            if (cursor > 0) {
                cursor--;
                if ((cursor + 1) % term.cols == 0) {
                    term.write(`\x1b[A\r\x1b[${term.cols + 1}C`);
                } else {
                    term.write(data);
                }
            }
            return;
    }

    // Enter
    if (data === '\r') {
        if (normalBuffer.trim() != '') {
            term.write('\n');

            if (inputHistory[inputHistory.length - 1] != normalBuffer) {
                inputHistory.push(normalBuffer);
                inputHistoryIndex = inputHistory.length;
            }

            // Disable input
            inputType = null;

            // Execute command
            try {
                await shell.execCommand(normalBuffer);
            } catch (e) {
                console.error(e);
            }
        }

        // Start a new command line
        if (startInNewLine == true) {
            term.write(`\r\n`);
        }
        // Reset to default
        startInNewLine = true;

        beginningText = `${path.normalize(shell.root + shell.pwd)}>`;
        term.write(beginningText);
        cursor = 0;
        normalBuffer = '';
        inputType = 'normal';
    } else if (data === '\u007F') {
        // Backspace
        if (normalBuffer.length > 0 && cursor > 0) {
            const orgCursor = cursor;
            normalBuffer = normalBuffer.slice(0, cursor - 1 < 0 ? 0 : cursor - 1) + normalBuffer.slice(cursor);
            cursor--;

            const cols = term.cols;
            const len = orgCursor + beginningText.length;
            if (len % cols == 0 && ~~(len / cols) > 0) {
                term.write(`\x1b[A\x1b[${cols}C`);
            } else {
                term.write('\x1b[D');
            }
            term.write('\x1b[0J');
            updateCommandInput(cursor, cursor, normalBuffer);
            return;

            const toWrite = normalBuffer.slice(cursor);
            const matched = normalBuffer.match(/\S+/);
            if (matched) {
                const endIndex = matched.index + matched[0].length;
                if (endIndex > cursor) {
                    applyHexColor(term, '#ffc96d');
                    term.write(toWrite.slice(0, endIndex - cursor));
                    applyHexColor(term);
                    term.write(toWrite.slice(endIndex - cursor));
                } else {
                    term.write(toWrite);
                }
            } else {
                term.write(toWrite);
            }
            term.write(`\x1b[${beginningText.length + cursor + 1}G`);
        }
    } else {
        // Normal input
        const orgCursor = cursor;
        normalBuffer = normalBuffer.slice(0, cursor) + data + normalBuffer.slice(cursor);
        cursor += data.length;

        term.write('\x1b[0J');
        updateCommandInput(orgCursor, cursor, normalBuffer);
        return;

        const toWrite = normalBuffer.slice(orgCursor);
        const matched = normalBuffer.match(/\S+/);
        if (matched) {
            const endIndex = matched.index + matched[0].length;
            if (endIndex > orgCursor) {
                applyHexColor(term, '#ffc96d');
                term.write(toWrite.slice(0, endIndex - orgCursor));
                applyHexColor(term);
                term.write(toWrite.slice(endIndex - orgCursor));
            } else {
                term.write(toWrite);
            }
        } else {
            term.write(toWrite);
        }

        term.write(`\x1b[${beginningText.length + cursor + 1}G`);
    }
}

function handlePromptInput(data) {
    if (inputType != 'prompt') return;
    if (/^\x1B\[.*[A-D]$/.test(data)) return;

    // Stdin
    if (data === '\r') {
        term.write('\r\n');
        inputType = null;
        shell.stdin.write(promptBuffer);
        promptBuffer = '';
        return;
    } else if (data === '\u007F') {
        // Backspace
        if (promptBuffer.length > 0) {
            promptBuffer = promptBuffer.slice(0, -1);
            term.write('\b \b');
        }
    } else {
        // Normal input
        promptBuffer += data;
        term.write(data);
    }
}

// Handle input
term.onData(async (data) => {
    if (inputType == 'normal') return handleNormalInput(data);
    if (inputType == 'prompt') return handlePromptInput(data);
});

// Not to use this
term.attachCustomKeyEventHandler(async (e) => {
    return;
    if (e.ctrlKey && e.key === 'a') { // Ctrl+A
        term.selectAll();
        return false;
    }
    if (e.ctrlKey && e.key === 'c') { // Ctrl+C
        const text = term.getSelection();
        navigator.clipboard.writeText(text);
        return false;
    }
    if (e.ctrlKey && e.key === 'v') {
        const text = await navigator.clipboard.readText();
        if (inputType === 'normal') {
            normalBuffer = normalBuffer.slice(0, cursor) + text + normalBuffer.slice(cursor);
            cursor += text.length;
        } else if (inputType === 'prompt') {
            promptBuffer += text;
            term.write(text);
        }
    }
    return true;
});

shell.stdout.on('data', dt => {
    term.write(dt);
    return;
})
shell.stderr.on('data', dt => {
    writeHexColor(term, dt, '#ff796d');
    return;
})
shell.on('input', (e) => {
    promptBuffer = '';
    inputType = 'prompt';
    promptType = e.type;
})
shell.on('dispose', code => {
    browserWindow.close();
})
shell.stdout.on('clear', () => {
    term.clear();
    startInNewLine = false;
})

fitAddon.fit();
const observer = new ResizeObserver(() => {
    fitAddon.fit();
})
observer.observe(container);

beginningText = `${path.normalize(shell.root + shell.pwd)}>`;
term.write('\r\n' + beginningText);
inputType = 'normal';