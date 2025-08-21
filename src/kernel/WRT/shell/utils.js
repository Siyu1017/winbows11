export function terminalTable(term, head = [], config = {
    gap: 1,
    separator: '='
}) {
    const cols = head.length;
    const sizes = head.map(h => h.size);
    const aligns = head.map(h => h.align || 'left');

    let left = 1;

    term.write('\r\n');
    for (let i = 0; i < cols; i++) {
        const cell = head[i];
        const cellSize = sizes[i];
        const text = cell.text;
        if (text.length > cellSize) {
            term.write(`\x1b[${left}G${text.slice(0, cellSize - 1)}…`);
        } else if (cell.align == 'right') {
            term.write(`\x1b[${left}G${text.padStart(cellSize)}`);
        } else {
            term.write(`\x1b[${left}G${text}`);
        }
        left += cellSize + (config?.gap || 1);
    }

    left = 1;

    term.write('\r\n');
    for (let i = 0; i < cols; i++) {
        const cellSize = sizes[i];
        term.write(`\x1b[${left}G${(config?.separator || '=').repeat(cellSize)}`);
        left += cellSize + (config?.gap || 1);
    }

    return {
        row: (cells = []) => {
            // Start in new line
            term.write('\r\n');

            let left = 1;
            for (let i = 0; i < Math.min(cells.length, cols); i++) {
                const cell = cells[i];
                const cellSize = sizes[i];
                const align = cell.align || aligns[i];
                if (cell && cell.text) {
                    const text = String(cell.text);
                    if (text.length > cellSize) {
                        term.write(`\x1b[${left}G${text?.slice(0, cellSize - 1)}…`);
                    } else if (align == 'right') {
                        term.write(`\x1b[${left}G${text?.padStart(cellSize)}`);
                    } else {
                        term.write(`\x1b[${left}G${text}`);
                    }
                }
                left += cellSize + (config?.gap || 1);
            }
        }
    }
}