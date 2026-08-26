/**
 * Parse the small, cmd-like command language used by ShellInstance.
 * Operators are only special outside of quotes.  Keeping this separate from
 * command execution also makes it safe to pass the resulting tokens directly
 * to minimist without reparsing (and losing quoted whitespace).
 */
export class CommandParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CommandParseError';
    }
}

const OPERATORS = ['>>', '&&', '||', '>', '|', ';'];

/**
 * @param {string} input
 * @returns {string[]}
 */
export function tokenizeCommandLine(input) {
    const tokens = [];
    let token = '';
    let tokenStarted = false;
    let quote = null;

    const pushToken = () => {
        if (tokenStarted) tokens.push(token);
        token = '';
        tokenStarted = false;
    };

    for (let index = 0; index < input.length; index++) {
        const char = input[index];

        // Keep Windows paths intact. A backslash escapes only a character that
        // would otherwise affect parsing; cmd's caret is also accepted.
        const next = input[index + 1];
        if ((char === '^' || char === '\\') && next &&
            (/\s/.test(next) || next === '"' || next === "'" || '|;>&\\'.includes(next))) {
            token += next;
            tokenStarted = true;
            index++;
            continue;
        }
        if (quote) {
            if (char === quote) quote = null;
            else token += char;
            tokenStarted = true;
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            tokenStarted = true;
            continue;
        }
        if (/\s/.test(char)) {
            pushToken();
            continue;
        }

        const operator = OPERATORS.find(candidate => input.startsWith(candidate, index));
        if (operator) {
            pushToken();
            tokens.push(operator);
            index += operator.length - 1;
            continue;
        }
        token += char;
        tokenStarted = true;
    }

    if (quote) throw new CommandParseError(`Unterminated ${quote} quote.`);
    pushToken();
    return tokens;
}

/**
 * @typedef {{ tokens: string[], redirect: null|{mode: 'overwrite'|'append', target: string} }} ParsedCommand
 * @typedef {{ commands: ParsedCommand[], connector: null|'&&'|'||'|';' }} CommandGroup
 */

/**
 * Convert a command line into pipelines. `connector` controls whether the
 * group should run after the preceding group; each group itself is a pipeline.
 *
 * @param {string} input
 * @returns {CommandGroup[]}
 */
export function parseCommandLine(input) {
    const tokens = tokenizeCommandLine(input);
    if (!tokens.length) return [];

    const groups = [];
    let commands = [];
    let command = [];
    let redirect = null;
    let connector = null;

    const finishCommand = () => {
        if (!command.length) throw new CommandParseError('Expected a command.');
        commands.push({ tokens: command, redirect });
        command = [];
        redirect = null;
    };
    const finishGroup = () => {
        finishCommand();
        groups.push({ commands, connector });
        commands = [];
    };

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token === '|') {
            finishCommand();
            continue;
        }
        if (token === ';' || token === '&&' || token === '||') {
            finishGroup();
            connector = token;
            continue;
        }
        if (token === '>' || token === '>>') {
            if (redirect) throw new CommandParseError('Only one output redirection is supported per command.');
            const target = tokens[++index];
            if (!target || OPERATORS.includes(target)) {
                throw new CommandParseError(`Expected a file path after ${token}.`);
            }
            redirect = { mode: token === '>>' ? 'append' : 'overwrite', target };
            continue;
        }
        command.push(token);
    }
    finishGroup();
    return groups;
}

/** Expand cmd-style %NAME% variables without modifying unknown variables. */
export function expandEnvironmentVariables(token, getEnv) {
    return token.replace(/%([^%]+)%/g, (match, name) => {
        const value = getEnv(name) ?? getEnv(String(name).toUpperCase());
        return value === undefined ? match : value;
    });
}
