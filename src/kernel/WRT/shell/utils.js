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

export function parseURI(uri) {
    const result = {
        scheme: null,
        user: null,
        pass: null,
        host: null,
        port: null,
        path: null,
        query: {},
        hash: null
    };

    // Extract scheme
    const schemeMatch = uri.match(/^([A-Za-z][A-Za-z0-9+\-.]*):/);
    if (!schemeMatch) throw new Error("Invalid or missing scheme");
    result.scheme = schemeMatch[1];

    // Remove scheme from string
    let rest = uri.slice(result.scheme.length + 1);

    // Extract fragment (#)
    const hashIndex = rest.indexOf('#');
    if (hashIndex !== -1) {
        result.hash = decodeURIComponent(rest.slice(hashIndex + 1));
        rest = rest.slice(0, hashIndex);
    }

    // Extract query (?)
    const queryIndex = rest.indexOf('?');
    let queryString = '';
    if (queryIndex !== -1) {
        queryString = rest.slice(queryIndex + 1);
        rest = rest.slice(0, queryIndex);

        // Parse query into object
        queryString.split('&').forEach(pair => {
            if (!pair) return;
            const [k, v] = pair.split('=');
            result.query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
        });
    }

    // Check for authority (//host)
    if (rest.startsWith('//')) {
        rest = rest.slice(2);
        let pathStart = rest.indexOf('/');
        let authority = pathStart !== -1 ? rest.slice(0, pathStart) : rest;
        rest = pathStart !== -1 ? rest.slice(pathStart) : '/';

        // Extract user info (user:pass@)
        const atIndex = authority.indexOf('@');
        if (atIndex !== -1) {
            const userInfo = authority.slice(0, atIndex);
            const [user, pass] = userInfo.split(':');
            result.user = user ? decodeURIComponent(user) : null;
            result.pass = pass ? decodeURIComponent(pass) : null;
            authority = authority.slice(atIndex + 1);
        }

        // Extract host and port
        const colonIndex = authority.lastIndexOf(':');
        if (colonIndex !== -1 && authority[colonIndex + 1].match(/^\d+$/)) {
            result.host = authority.slice(0, colonIndex);
            result.port = authority.slice(colonIndex + 1);
        } else {
            result.host = authority;
        }
    }

    // Remaining string is path
    result.path = rest ? decodeURIComponent(rest) : null;

    return result;
}
