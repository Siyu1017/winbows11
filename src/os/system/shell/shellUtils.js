import URI from 'uri-js';

export function terminalTable(term, head = [], config = {
    gap: 1,
    separator: '='
}) {
    const cols = head.length;
    const sizes = head.map(h => h.size);
    const aligns = head.map(h => h.align || 'left');

    term.write('\r\n');
    for (let i = 0; i < cols; i++) {
        const cell = head[i];
        const cellSize = sizes[i];
        const text = cell.text;
        if (text.length > cellSize) {
            term.write(`${text.slice(0, cellSize - 1)}…`);
        } else if (cell.align == 'right') {
            term.write(`${text.padStart(cellSize)}`);
        } else {
            term.write(text);
            term.write(' '.repeat(cellSize - text.length));
        }
        term.write(' '.repeat(config?.gap || 1))
    }

    term.write('\r\n');
    for (let i = 0; i < cols; i++) {
        const cellSize = sizes[i];
        term.write((config?.separator || '=').repeat(cellSize));
        term.write(' '.repeat(config?.gap || 1));
    }

    return {
        row: (cells = []) => {
            // Start in new line
            term.write('\r\n');

            for (let i = 0; i < Math.min(cells.length, cols); i++) {
                const cell = cells[i];
                const cellSize = sizes[i];
                const align = cell.align || aligns[i];
                if (cell && cell.text) {
                    const text = String(cell.text);
                    if (text.length > cellSize) {
                        term.write(`${text.slice(0, cellSize - 1)}…`);
                    } else if (align == 'right') {
                        term.write(`${text.padStart(cellSize)}`);
                    } else {
                        term.write(text);
                        term.write(' '.repeat(cellSize - text.length));
                    }
                    term.write(' '.repeat(config?.gap || 1))
                } else {
                    term.write(' '.repeat(cellSize + (config?.gap || 1)));
                }
            }
        }
    }
}

export function formatTwoColumns(left, right, tabSize = 16) {
    const padding = Math.max(1, tabSize - left.length);
    return left + " ".repeat(padding) + right;
}

export const parseURI = URI.parse;

export function getScheme(uri) {
    if (typeof uri !== 'string') return null;
    const idx = uri.indexOf(':');
    if (idx === -1) return null;

    const scheme = uri.slice(0, idx);
    if (/^[A-Za-z]([A-Za-z0-9+\-.]*[A-Za-z0-9])?$/.test(scheme)) {
        return scheme;
    }
    return null;
}