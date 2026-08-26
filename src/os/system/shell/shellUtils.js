import URI from 'uri-js';

export function terminalTable(term, head = [], config = {
    gap: 1,
    separator: '='
}) {
    const cols = head.length;
    const sizes = head.map(h => h.size);
    const aligns = head.map(h => h.align || 'left');
    const gap = config?.gap || 1;
    const truncate = (text, size) => text.length > size ? `${text.slice(0, Math.max(0, size - 1))}…` : text;

    term.write('\r\n');
    for (let index = 0; index < cols; index++) {
        const cell = head[index];
        const text = truncate(String(cell.text ?? ''), sizes[index]);
        term.write((cell.align === 'right' ? text.padStart(sizes[index]) : text.padEnd(sizes[index])) + ' '.repeat(gap));
    }

    term.write('\r\n');
    for (let index = 0; index < cols; index++) {
        term.write((config?.separator || '=').repeat(sizes[index]) + ' '.repeat(gap));
    }

    return {
        row: (cells = []) => {
            term.write('\r\n');
            for (let index = 0; index < cols; index++) {
                const cell = cells[index];
                const text = cell?.text == null ? '' : truncate(String(cell.text), sizes[index]);
                const align = cell?.align || aligns[index];
                term.write((align === 'right' ? text.padStart(sizes[index]) : text.padEnd(sizes[index])) + ' '.repeat(gap));
            }
        }
    };
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
