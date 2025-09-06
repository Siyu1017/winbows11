import ObjectViewer from "./object-viewer";
import styles from "./log.module.css";
import * as utils from "./utils";

const sourceRegexp = /(?:blob:.+?\/[a-f0-9A-F\-]+|https?:\/\/([a-zA-Z0-9\-\.]+|localhost)(:\d+)?\/[a-zA-Z0-9?&#=.%_\-~/]*)/g;
const linkRegexp = /(?:blob:.+?\/[a-f0-9A-F\-]+|https?:\/\/([a-zA-Z0-9\-\.]+|localhost)(:\d+)?\/(?:[A-Za-z0-9\-._~!$&()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)/g;
const localFileRegexp = /([A-Z]:[\\/](?:[^<>:"|?*\r\n]+[\\/])*[^<>:"|?*\r\n]*)/g;

function safeString(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return utils.safeEscape(str);
}

function parseLog(originalArgs) {
    const args = [...originalArgs];
    const arg0 = args.shift();
    let structure = [];

    if (typeof arg0 === 'string') {
        const len = arg0.length;
        const arg0Structure = {
            type: 'plaintext',
            value: []
        }

        // TODO: ???
        let str = '';
        let styled = null;
        for (let i = 0; i < len; i++) {
            const char = arg0[i];

            if (
                char == '%' &&  // Match '%' char
                i + 1 < len     // Make sure there are other chars after this char
            ) {
                const fc = arg0[++i];   // Format char
                const target = (styled != null ? styled.value : arg0Structure.value);

                if (
                    args.length == 0 ||         // No more args to reference
                    !'sdifoOcj'.includes(fc)    // Unknown format char
                ) {
                    str += '%';
                    str += fc != '%' ? fc : ''; // Handle %% ( %% -> % )
                    continue;
                }
                if (str) {
                    target.push({
                        type: 'auto',
                        value: str
                    })
                    str = '';
                }
                const arg = args.shift();
                switch (fc) {
                    case 's':
                        target.push({
                            type: 'string',
                            value: String(arg)
                        });
                        break;
                    case 'd':
                    case 'i':
                        target.push({
                            type: 'number',
                            value: parseInt(arg)
                        });
                        break;
                    case 'f':
                        target.push({
                            type: 'number',
                            value: utils.toNumber(arg)
                        });
                        break;
                    case 'o':
                        target.push({
                            type: 'object',
                            options: {
                                shallow: true
                            },
                            value: arg
                        });
                        break;
                    case 'O':
                        target.push({
                            type: 'object',
                            value: arg
                        });
                        break;
                    case 'c':
                        if (styled) arg0Structure.value.push(styled);
                        styled = {
                            type: 'styled',
                            value: [],
                            style: arg
                        }
                        break;
                    case 'j':
                        target.push({
                            type: 'object',
                            value: ObjectViewer.utils.parseJSON(arg)
                        });
                        break;
                }
            } else {
                str += char;
            }
        }

        if (str) {
            (styled ? styled.value : arg0Structure.value).push({
                type: 'auto',
                value: str
            })
        }
        if (styled) arg0Structure.value.push(styled);

        structure.push(arg0Structure);
    } else {
        args.unshift(arg0);
    }

    while (args.length > 0) {
        structure.push({
            type: 'auto',
            value: args.shift()
        })
    }

    return structure;
}

function formatArgs(container, originalArgs) {
    const structure = parseLog(originalArgs);
    const arg0 = structure[0];
    const arg0IsString = arg0.type == 'plaintext' || typeof arg0.value == 'string';

    function traversal(structure, parent, level = 0) {
        const isTopLevel = level == 0;

        for (const index in structure) {
            const arg = structure[index];
            let el = document.createElement('span');

            // Top level types: plaintext | auto
            if (isTopLevel && arg.type == 'plaintext' && index == 0) {
                // arg0
                el.className = styles.logPlaintext;
                traversal(arg.value, el, level + 1);
            } else if (!isTopLevel && arg.type == 'styled') {
                // styled ( allowed under top level )
                el.style.cssText = arg.style;
                el.className = styles.logStyled;
                traversal(arg.value, el, level + 1);
            } else {
                // Parse it with object viewer
                if (ObjectViewer.utils.expandable(arg.value)) {
                    // If expandable, use the object viewer first
                    el = new ObjectViewer(arg.value, {
                        shallow: arg.options?.shallow || false
                    }).container;
                } else if (isTopLevel) {
                    // auto type
                    const type = ObjectViewer.utils.getType(arg.value);
                    if (arg0IsString && type == 'string' && arg.type != 'object') {
                        el.innerHTML = (container.childElementCount > 0 ? ' ' : '') + safeString(arg.value).replace(linkRegexp, (match) => {
                            return `<a href="${match}" target="_blank">${match}</a>`
                        }).replace(localFileRegexp, (match) => {
                            return `<a href="javascript:void(0)" data-href="${match}">${match}</a>`
                        });
                    } else if (type == 'string') {
                        el.innerHTML = (container.childElementCount > 0 ? ' ' : '') + ObjectViewer.utils.getPreview(arg.value).replace(linkRegexp, (match) => {
                            return `<a href="${match}" target="_blank">${match}</a>`
                        }).replace(localFileRegexp, (match) => {
                            return `<a href="javascript:void(0)" data-href="${match}">${match}</a>`
                        });
                    } else {
                        el.className = `obj-viewer-value-${type}`;
                        el.innerHTML = (container.childElementCount > 0 ? ' ' : '') + ObjectViewer.utils.getPreview(arg.value);
                    }
                } else {
                    el.innerHTML = safeString(arg.value).replace(linkRegexp, (match) => {
                        return `<a href="${match}" target="_blank">${match}</a>`
                    }).replace(localFileRegexp, (match) => {
                        return `<a href="javascript:void(0)" data-href="${match}">${match}</a>`
                    });
                }
            }
            parent.appendChild(el);
        }
    }

    traversal(structure, container, 0);
}

function formatTable(container, args) {
    const data = args[0];
    const type = ObjectViewer.utils.getType(args[0]);
    let rows = [];
    let columns = new Set();

    if (type == 'array') {
        data.forEach((item, index) => {
            let row = { "(index)": index, ...item };
            Object.keys(row).forEach(k => columns.add(k));
            rows.push(row);
        });
    } else if (type == 'object') {
        Object.entries(data).forEach(([key, value]) => {
            let row = { "(index)": key, ...value };
            Object.keys(row).forEach(k => columns.add(k));
            rows.push(row);
        });
    } else {
        return formatArgs(container, args);
    }

    let columnsToShow = args[1];
    if (columnsToShow && Array.isArray(columnsToShow)) {
        columns = columns.intersection(new Set(['(index)', ...columnsToShow]));
    }

    const tableContainer = document.createElement('div');
    const table = document.createElement('table');
    const colgroup = document.createElement('colgroup');
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const body = document.createElement('tbody');

    tableContainer.className = styles.tableContainer;
    table.className = styles.table;
    colgroup.className = styles.tableColgroup;
    header.className = styles.tableHeader;
    headerRow.className = styles.tableHeaderRow;
    body.className = styles.tableBody;

    container.appendChild(tableContainer);
    tableContainer.appendChild(table);
    table.appendChild(colgroup);
    table.appendChild(header);
    header.appendChild(headerRow);
    table.appendChild(body);

    columns.forEach((column, i) => {
        const header = document.createElement('th');
        header.className = styles.tableHeaderCell;
        header.textContent = column;
        headerRow.appendChild(header);
    })
    rows.forEach((row, i) => {
        const rowEl = document.createElement('tr');
        rowEl.className = styles.tableRow;
        body.appendChild(rowEl);

        columns.forEach(column => {
            const cell = document.createElement('td');
            cell.className = styles.tableCell;
            if (column == '(index)') {
                cell.textContent = i;
            } else if (Object.prototype.hasOwnProperty.call(row, column)) {
                cell.innerHTML = ObjectViewer.utils.getPreview(row[column], 1);
            } else {
                cell.textContent = '';
            }
            rowEl.appendChild(cell);
        })
    })

    formatArgs(container, [data]);

    !(() => {
        const rows = Array.from(body.rows);
        const headerCells = header.rows[0].cells;
        const caret = document.createElement('span');
        caret.className = styles.tableHeaderCellCaret;

        for (const th of headerCells) {
            const cellIndex = th.cellIndex;
            let dir = 0;
            th.addEventListener("click", () => {
                caret.remove();

                if (dir == 1) {
                    caret.classList.add(styles.up);
                } else {
                    caret.classList.remove(styles.up);
                }
                th.appendChild(caret);

                rows.sort((tr1, tr2) => {
                    const tr1Text = tr1.cells[cellIndex].textContent;
                    const tr2Text = tr2.cells[cellIndex].textContent;
                    return dir == 0 ? tr1Text.localeCompare(tr2Text) : tr2Text.localeCompare(tr1Text);
                });
                body.append(...rows);

                dir = dir == 0 ? 1 : 0;
            });
        }
    })();
}

function collapsibleContainer(isCollapsed = true) {
    const cbs = [];
    const container = document.createElement('div');
    const summaryContainer = document.createElement('div');
    const summaryIconContainer = document.createElement('div');
    const summaryIcon = document.createElement('div');
    const summary = document.createElement('div');
    const contentContainer = document.createElement('div');
    const content = document.createElement('div');

    container.className = styles.collapsibleContainer;
    summaryContainer.className = styles.collapsibleSummaryContainer;
    summaryIconContainer.className = styles.collapsibleSummaryIconContainer
    summaryIcon.className = styles.collapsibleSummaryIcon;
    summary.className = styles.collapsibleSummary;
    contentContainer.className = styles.collapsibleContentContainer;
    content.className = styles.collapsibleContent;

    container.appendChild(summaryContainer);
    summaryContainer.appendChild(summaryIconContainer);
    summaryIconContainer.appendChild(summaryIcon);
    summaryContainer.appendChild(summary);
    container.appendChild(contentContainer);
    contentContainer.appendChild(content);

    summaryContainer.addEventListener('click', toggle);

    function setCollapsed(val) {
        isCollapsed = val == true;
        if (isCollapsed) {
            container.classList.add(styles.collapsed);
        } else {
            container.classList.remove(styles.collapsed);
        }
        trigger(isCollapsed);
    }

    function toggle() {
        isCollapsed = isCollapsed != true;
        if (isCollapsed) {
            container.classList.add(styles.collapsed);
        } else {
            container.classList.remove(styles.collapsed);
        }
        trigger(isCollapsed);
    }

    function onChange(fn) {
        cbs.push(fn);
    }

    function trigger(v) {
        cbs.forEach(fn => fn(v));
    }

    setCollapsed(isCollapsed);

    return {
        get isCollapsed() {
            return isCollapsed;
        },
        container, summary, content, setCollapsed, toggle, onChange
    }
}

const listeners = Symbol('listeners');
const emit = Symbol('emit');

export default class Log {
    /**
     * Create a log
     * @param {String} type 
     * @param {any[]} args 
     */
    constructor(type = 'log', args) {
        this[listeners] = {};
        this[emit] = (evt, dt) => {
            if (!this[listeners][evt]) return;
            for (const cb of this[listeners][evt]) {
                cb(dt);
            }
        }
        this.on = (evt, cb) => {
            if (!this[listeners][evt]) this[listeners][evt] = [];
            this[listeners][evt].push(cb);
        }

        this.type = type;
        this.args = args;
        this.noSep = ['info', 'warn', 'error'].includes(this.type);
        this.count = 1;
        this.groupStack = [];

        this.container = document.createElement('div');
        this.logIndent = document.createElement('div');
        this.logItem = document.createElement('div');
        this.logIconContainer = document.createElement('div');
        this.logIcon = document.createElement('div');
        this.logContent = document.createElement('div');

        this.container.className = styles.logContainer;
        this.logIndent.className = styles.logIndent;
        this.logItem.classList.add(styles.logItem);
        this.logIconContainer.className = styles.logIconContainer;
        this.logIcon.className = styles.logIcon;
        this.logContent.className = styles.logContent;

        if (this.type != 'log') {
            this.logItem.classList.add(styles[this.type]);
        }
        if (this.noSep) {
            this.container.classList.add(styles.noSep);
            this.logIcon.classList.add(styles[this.type]);
        }

        this.container.appendChild(this.logIndent);
        this.container.appendChild(this.logItem);
        this.logItem.appendChild(this.logIconContainer);
        this.logIconContainer.appendChild(this.logIcon);
        this.logItem.appendChild(this.logContent);

        this.isSimple = true;
        for (const arg of this.args) {
            if (ObjectViewer.utils.expandable(arg)) this.isSimple = false;
        }

        this.observer = new ResizeObserver(() => {
            this.updateSize();
            this[emit]('resize');
        });
        this.observer.observe(this.logContent);

        this.width = 0;
        this.height = 0;
        this.onChange = () => { };
        this.updateSize = utils.throttle(() => {
            if (this.measureEl) {
                const el = this.container.cloneNode(true);
                this.measureEl.appendChild(el);
                const { width, height } = el.getBoundingClientRect();
                if (this.width != width) {
                    this.width = width;
                }
                if (this.height != height) {
                    this.height = height;
                }
                el.remove();
            }
        })

        switch (this.type) {
            case 'log':
            case 'info':
            case 'debug':
                formatArgs(this.logContent, args);
                break;
            case 'warn':
            case 'error':
            case 'trace': {
                const { summary, content, container } = collapsibleContainer();
                formatArgs(summary, args);
                const traceList = document.createElement('div');
                utils.getStackTrace().forEach(s => {
                    const trace = document.createElement('div');
                    trace.innerHTML = typeof s === "string" ? safeString(s).replace(sourceRegexp, (match) => {
                        return `<a href="${match}" target="_blank">${match}</a>`
                    }).replace(localFileRegexp, (match) => {
                        return `<a href="javascript:void(0)" data-href="${match}">${match}</a>`
                    }) : '';
                    traceList.appendChild(trace);
                });
                content.appendChild(traceList);
                this.logContent.appendChild(container);
                break;
            }
            case 'clear':
                const el = document.createElement('div');
                el.className = styles.logClear;
                el.textContent = 'Console was cleared.';
                this.logContent.appendChild(el);
                break;
            case 'group':
            case 'groupCollapsed': {
                const { summary, container, onChange, isCollapsed, setCollapsed } = collapsibleContainer(this.type != 'group');
                formatArgs(summary, args);
                summary.style.fontWeight = 'bold';
                this.logContent.appendChild(container);
                this.onChange = onChange;
                this.isCollapsed = isCollapsed;
                this.setCollapsed = setCollapsed;
                break;
            }
            case 'table':
                formatTable(this.logContent, args);
        }
    }
    equals(log) {
        if (!log) return false;
        if (['group', 'groupCollapsed', 'groupEnd'].includes(this.type)) return false;
        if (this.isSimple == false) return false;
        if (this.type != log.type) return false;
        if (this.args.length != log.args.length) return false;
        if (this.text() != log.text()) return false;
        for (let i = 0; i < this.args.length; i++) {
            if (ObjectViewer.utils.getType(this.args[i]) != ObjectViewer.utils.getType(log.args[i])) return false;
        }
        return true;
    }
    addCount() {
        if (!this.logCount || !this.logCountContainer) {
            this.logCountContainer = document.createElement('div');
            this.logCount = document.createElement('div');

            this.logCountContainer.className = styles.logCountContainer;
            this.logCount.className = styles.logCount;

            this.logIconContainer.remove();
            this.logItem.insertAdjacentElement('afterbegin', this.logCountContainer);
            this.logCountContainer.appendChild(this.logCount);
        }
        this.count++;
        this.logCount.textContent = this.count;
    }
    setGroupStack(stack) {
        this.groupStack = Array.from(stack);
        for (let i = 0; i < this.groupStack.length; i++) {
            const indent = document.createElement('div');
            indent.className = styles.logLevelIndent;
            this.logIndent.appendChild(indent);
        }
    }
    getGroupID() {
        return this.groupStack[this.groupStack.length - 1] || 'root';
    }
    setMeasureEl(el) {
        this.measureEl = el;
        this.updateSize();
    }
    setLastLog(log) {
        if (log == null) {
            this.container.classList.add(styles.pt0);
        } else if (log.noSep == false && this.noSep == true) {
            this.container.classList.add(styles.pt0);
        } else if (log.noSep == false && this.noSep == false) {
            this.container.classList.add(styles.pt5);
        }
    }
    text() {
        return this.logContent.textContent || '';
    }
}