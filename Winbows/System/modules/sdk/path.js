const path = {
    sep: '/',

    normalize(p) {
        const parts = p.split(/[/\\]+/);
        const stack = [];

        for (let part of parts) {
            if (part === '' || part === '.') continue;
            if (part === '..') stack.pop();
            else stack.push(part);
        }

        return (p.startsWith('/') ? '/' : '') + stack.join('/');
    },

    join(...args) {
        return path.normalize(args.join('/'));
    },

    resolve(...args) {
        let resolved = '';
        for (let i = args.length - 1; i >= 0; i--) {
            if (!args[i]) continue;
            resolved = args[i] + '/' + resolved;
            if (args[i].startsWith('/')) break;
        }
        return path.normalize('/' + resolved);
    },

    dirname(p) {
        const normalized = path.normalize(p);
        const parts = normalized.split('/');
        parts.pop();
        return parts.length > 1 ? parts.join('/') : '/';
    },

    basename(p) {
        return path.normalize(p).split('/').pop();
    },

    extname(p) {
        const base = path.basename(p);
        const dotIndex = base.lastIndexOf('.');
        return dotIndex > 0 ? base.slice(dotIndex) : '';
    },

    isAbsolute(p) {
        return p.startsWith('/');
    },

    relative(from, to) {
        const fromParts = path.resolve(from).split('/');
        const toParts = path.resolve(to).split('/');

        while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
            fromParts.shift();
            toParts.shift();
        }

        return '../'.repeat(fromParts.length) + toParts.join('/');
    }
};

export { path };