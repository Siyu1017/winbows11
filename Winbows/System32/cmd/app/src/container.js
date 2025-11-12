import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";

const style = document.createElement('style');
style.innerHTML = `.window-content * {color: #fff;font: 1rem monospace;white-space:pre-wrap;line-height: 1.12;} .window-content,.window-toolbar{background:rgb(18, 18, 18) !important;} *::selection{ background:#fff;color:#000} .xterm { height: inherit;}`;
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

function countVisibleChars(input) {
    let visibleCount = 0;
    let i = 0;

    const isVisibleChar = ch => {
        const code = ch.codePointAt(0);
        if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) return false;
        if ([0x200B, 0x200C, 0x200D, 0xFEFF].includes(code)) return false;
        if (code >= 0x0300 && code <= 0x036F) return false; // combining marks
        return true;
    };

    while (i < input.length) {
        // === C0 or C1 ===
        const code = input.charCodeAt(i);
        if ((code <= 0x1F && code !== 0x1B) || (code >= 0x7F && code <= 0x9F)) {
            i++;
            continue;
        }

        // === ESC sequences ===
        if (code === 0x1B) {
            const next = input[i + 1];
            if (next === '[') {
                // CSI
                i += 2;
                while (i < input.length && !/[A-Za-z]/.test(input[i])) i++;
                i++; // skip final letter
                continue;
            } else if (next === ']') {
                // OSC - terminated by BEL or ST (\x07 or ESC \)
                i += 2;
                while (i < input.length && input[i] !== '\x07') {
                    if (input[i] === '\x1B' && input[i + 1] === '\\') { i += 2; break; }
                    i++;
                }
                i++;
                continue;
            } else if (next === 'P') {
                // DCS - terminated by ESC \
                i += 2;
                while (i < input.length && !(input[i] === '\x1B' && input[i + 1] === '\\')) i++;
                i += 2;
                continue;
            } else {
                // Single ESC cmds
                i += 2;
                continue;
            }
        }

        const chStr = input[i];
        if (isVisibleChar(chStr)) visibleCount++;
        i++;
    }

    return visibleCount;
}

const term = new WinUI.Terminal({
    cols: 80,
    rows: 24,
    convertEol: true,
    cursorBlink: true,
    theme: {
        background: 'rgb(18, 18, 18)',
        foreground: '#d4d4d4'
    }
});
const fitAddon = new FitAddon();
const observer = new ResizeObserver(() => {
    fitAddon.fit();
})

term.loadAddon(fitAddon);
term.open(container);
fitAddon.fit();
observer.observe(container);

const pipe = process.env.pipe;
const ipc = IPC.connect(pipe);

const wrt = await (async () => {
    return new Promise(resolve => {
        ipc.on('data', (e) => {
            const dt = e.data;
            if (dt.type == 'check') {
                console.log(token.value, dt.data, token)
                if (dt.data !== token.value || !token.isTrusted) {
                    return process.exit();
                }
                ipc.send({
                    type: 'ready'
                })
            }
            if (dt.type == 'data') {
                const wrt = dt.data;
                resolve(wrt);

                browserWindow.changeTitle(wrt.__filename);
                console.info('Got WRT:', wrt)
            }
        })
        ipc.send({
            type: 'ready'
        })
        // ipc.send({
        //     type: 'check'
        // })
    })
})();

let cursorPos = [0, 0];
let alive = true;
let cursor = 0;
let inputBuffer = '';
let _waiting = null;

wrt.process.stdout.on('data', dt => {
    term.write(dt);
})
wrt.process.stderr.on('data', dt => {
    writeHexColor(term, dt, '#ff796d');
})
wrt.process.on('exit', () => {
    if (alive === false) return;
    term.write('\r\r\nPress any key to continue...');
    alive = false;
})
process.on('exit', () => {
    alive = false;
    wrt.kill();
})

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

function updateCommandInput(orgCursor, cursor, buffer) {
    const toWrite = buffer.slice(orgCursor);
    const matched = buffer.match(/\S+/);
    term.write(toWrite);

    updateCursor(term, '', buffer.length, cursor);
    //term.write(`\x1b[${beginningText.length + cursor + 1}G`);
}

async function handleInput(data) {
    if (data.length == 0) return;

    switch (data) {
        case '\x1B[A':  // Up ( Disabled )
            return;
        case '\x1B[B':  // Down ( Disabled )
            return;
        case '\x1B[C':  // Right
            if (cursor < inputBuffer.length) {
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
        wrt.process.stdin.write(inputBuffer);
        cursor = 0;
        inputBuffer = '';
    } else if (data === '\u007F') {
        // Backspace
        if (inputBuffer.length > 0 && cursor > 0) {
            const orgCursor = cursor;
            inputBuffer = inputBuffer.slice(0, cursor - 1 < 0 ? 0 : cursor - 1) + inputBuffer.slice(cursor);
            cursor--;

            const cols = term.cols;
            const len = orgCursor;
            if (len % cols == 0 && ~~(len / cols) > 0) {
                term.write(`\x1b[A\x1b[${cols}C`);
            } else {
                term.write('\x1b[D');
            }
            term.write('\x1b[0J');
            updateCommandInput(cursor, cursor, inputBuffer);
            return;
        }
    } else {
        // Normal input
        const orgCursor = cursor;
        inputBuffer = inputBuffer.slice(0, cursor) + data + inputBuffer.slice(cursor);
        cursor += data.length;

        term.write('\x1b[0J');
        updateCommandInput(orgCursor, cursor, inputBuffer);
        return;
    }
}

term.attachCustomKeyEventHandler((e) => {
    if (e.ctrlKey && ['v', 'a'].includes(e.key.toLowerCase())) {
        return false;
    }
    return true;
});

term.onKey(async ({ domEvent }) => {
    const e = domEvent;

    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const selection = term.getSelection();
        if (!selection && wrt.alive) {
            writeHexColor(term, '^C', '#ff3232');
            _waiting = 'kill';
        } else {
            await navigator.clipboard.writeText(selection);
        }
        return;
    }

    // Not to handle ctrl+v
});

term.onData(async (data) => {
    console.info("Received data:", data, countVisibleChars(data));

    if (_waiting == 'kill') {
        wrt.kill();
        _waiting = null;
    } else if (wrt.alive == false) {
        process.exit();
    } else if (data === '\x03') {
        return;
    }
    if (wrt.process.stdin?.isPaused?.()) return;
    if (wrt.process.stdin.isRaw) return wrt.process.stdin.write(data);

    handleInput(data);
});

wrt.main();
