import Log from "./log";
import styles from "./devtool.module.css";
import { throttle, randomID } from "./utils";

function updateConsoleDOM(container, logs) {
    const newNodes = logs;
    const oldNodes = Array.from(container.children);

    // Map: DOM Node -> old index
    const oldIndexMap = new Map();
    for (let i = 0; i < oldNodes.length; i++) {
        oldIndexMap.set(oldNodes[i], i);
    }

    // New index to old index
    const newIndexToOldIndex = new Array(newNodes.length);
    for (let i = 0; i < newNodes.length; i++) {
        const oldIndex = oldIndexMap.has(newNodes[i])
            ? oldIndexMap.get(newNodes[i])
            : -1;
        newIndexToOldIndex[i] = oldIndex;
    }

    // LIS ( Get the nodes that don't need to be moved )
    const seq = [];
    const pos = new Array(newNodes.length);
    for (let i = 0; i < newNodes.length; i++) {
        const oldIndex = newIndexToOldIndex[i];
        if (oldIndex === -1) continue;  // New Node
        let low = 0, high = seq.length;
        while (low < high) {
            const mid = (low + high) >> 1;  // Round down the average
            if (newIndexToOldIndex[seq[mid]] < oldIndex) low = mid + 1;
            else high = mid;
        }
        if (low >= seq.length) seq.push(i);
        else seq[low] = i;
        pos[i] = low > 0 ? seq[low - 1] : -1;
    }

    let lisIndexSet = new Set(seq);

    let anchor = null;
    for (let i = newNodes.length - 1; i >= 0; i--) {
        const node = newNodes[i];
        if (newIndexToOldIndex[i] === -1) {
            // New node
            container.insertBefore(node, anchor);
        } else if (!lisIndexSet.has(i)) {
            // Old node that needs to be moved
            container.insertBefore(node, anchor);
        }
        anchor = node;
    }

    // Remove the old node that doesn't exist
    for (const oldNode of oldNodes) {
        if (!newNodes.includes(oldNode)) {
            oldNode.remove();
        }
    }
}



export default class Devtool {
    constructor() {
        this.version = version;

        this.devtool = document.createElement('div');
        this.devtoolLogsArea = document.createElement('div');
        this.devtoolMeasurementArea = document.createElement('div');
        this.devtoolLogs = document.createElement('div');

        this.devtool.className = styles.devtool;
        this.devtoolLogsArea.className = styles.devtoolLogsArea;
        this.devtoolMeasurementArea.className = styles.devtoolMeasurementArea;
        this.devtoolLogs.className = styles.devtoolLogs;

        this.devtool.appendChild(this.devtoolLogsArea);
        this.devtoolLogsArea.appendChild(this.devtoolMeasurementArea);
        this.devtoolLogsArea.appendChild(this.devtoolLogs);

        let lastLog;
        let logs = [];
        let groupStack = [];
        let collapsedGroups = new Set();
        let groupScopes = new Map();
        let groups = {};

        const timers = new Map();
        const counters = new Map();

        const renderViewport = throttle((topTolerance = 800, bottomTolerance = 800) => {
            const viewportH = this.devtool.clientHeight;
            const scrollTop = this.devtool.scrollTop;
            const start = Math.max(0, scrollTop - topTolerance);
            const end = scrollTop + viewportH + bottomTolerance;
            let height = 0;
            let startIndex = -1;
            let endIndex = 0;
            let top = 0;
            let clonedLogs = logs.filter(log => {
                return !collapsedGroups.has(log.getGroupID());
            })

            for (let i = 0; i < clonedLogs.length; i++) {
                const log = clonedLogs[i];
                const orgHeight = height;
                height += log.height;
                if (height >= start && orgHeight <= end) {
                    if (startIndex == -1) {
                        startIndex = i;
                        top = orgHeight;
                    }
                    endIndex = i;
                }
            }

            const atBottom = this.devtool.scrollHeight - this.devtool.clientHeight < this.scrollTop + 1;

            this.devtoolLogsArea.style.height = height + 'px';
            this.devtoolLogs.style.top = top + 'px';

            const target = this.devtoolLogs;
            const newContents = clonedLogs.slice(startIndex, endIndex + 1).map(t => t.container);

            if (atBottom) {
                this.devtool.scrollTop = 99999999;
            }

            return updateConsoleDOM(target, newContents);
        });

        const attach = (log) => {
            if (log.equals(lastLog) == true) {
                // Add count if the content is repeated and the content is simple or the type is not a group
                lastLog.addCount();
            } else {
                logs.push(log);
                log.setLastLog(lastLog);
                log.setMeasureEl(this.devtoolMeasurementArea);
                log.on('resize', renderViewport);
                log.setGroupStack(groupStack);

                if (log.type == 'group' || log.type == 'groupCollapsed') {
                    const id = randomID(12);
                    const group = {
                        id,
                        collapsed: log.type == 'groupCollapsed',
                        update: (isCollapsed) => {
                            group.collapsed = isCollapsed;
                            let parentCollapsed = isCollapsed;
                            [id].concat(Array.from(groupScopes.get(id))).forEach(gid => {
                                if (parentCollapsed == true || groups[gid].collapsed == true) {
                                    collapsedGroups.add(gid);
                                    parentCollapsed = true
                                } else {
                                    collapsedGroups.delete(gid);
                                }
                            })
                            return renderViewport();
                        }
                    }

                    for (const gid of groupStack) {
                        groupScopes.get(gid)    // Returns a Set(n)
                            .add(id);           // Add group id to set
                    }

                    // Add the new id
                    groupStack.push(id);
                    groupScopes.set(id, new Set());
                    groups[id] = group;

                    log.onChange(group.update);

                    let collapsed = false;
                    groupStack.forEach(gid => {
                        if (groups[gid].collapsed == true || collapsed == true) {
                            collapsedGroups.add(gid);
                            collapsed = true;
                        } else {
                            collapsedGroups.delete(gid);
                        }
                    })
                }

                lastLog = log;
            }

            renderViewport();
        }

        let lastScrollTop = 0;
        let lastTime = 0;

        this.devtool.onscroll = () => {
            const scrollTop = this.devtool.scrollTop;
            const now = performance.now();
            const delta = now - lastTime;
            const distance = Math.abs(scrollTop - lastScrollTop);
            const speed = distance / delta;

            let tolerance = speed * 100;
            let topTolerance = 0;
            let bottomTolerance = 0;

            if (delta > 500) {
                tolerance = 800;
            }
            if (tolerance > 2000) {
                tolerance = 2000;
            }
            if (tolerance < 100) {
                tolerance = 100;
            }

            if (scrollTop < lastScrollTop) {
                topTolerance = tolerance;
                bottomTolerance = 100;
            } else {
                topTolerance = 100;
                bottomTolerance = tolerance;
            }

            lastScrollTop = scrollTop;
            lastTime = now;

            renderViewport(topTolerance, bottomTolerance);
        };

        this.console = {
            //========== Output ==========//
            log: (...args) => {
                if (args.length == 0) return;
                attach(new Log('log', args));
            },
            info: (...args) => {
                if (args.length == 0) return;
                attach(new Log('info', args));
            },
            debug: (...args) => {
                if (args.length == 0) return;
                attach(new Log('debug', args));
            },
            warn: (...args) => {
                if (args.length == 0) return;
                attach(new Log('warn', args));
            },
            error: (...args) => {
                if (args.length == 0) return;
                attach(new Log('error', args));
            },

            //=========== Group ==========//
            group: (...args) => {
                if (!args[0]) {
                    args[0] = 'console.group';
                }
                attach(new Log('group', args));
            },
            groupCollapsed: (...args) => {
                if (!args[0]) {
                    args[0] = 'console.groupCollapsed';
                }
                attach(new Log('groupCollapsed', args));
            },
            groupEnd: () => {
                groupStack.pop();
                lastLog = {
                    type: 'groupEnd'
                }
            },

            //=========== Count ==========//
            count: (label = 'default') => {
                label = String(label);
                const current = (counters.get(label) || 0) + 1;
                counters.set(label, current);
                attach(new Log('log', [`${label}: ${current}`]));
            },
            countReset: (label = 'default') => {
                label = String(label);
                if (!counters.has(label)) {
                    return attach(new Log('warn', [`Count for '${label}' does not exist`]));
                }
                counters.set(label, 0);
            },

            //=========== Time ===========//
            time: (label = 'default') => {
                label = String(label);
                if (timers.has(label)) {
                    return attach(new Log('warn', [`Timer '${label}' already exists`]));
                }
                timers.set(label, performance.now());
            },
            timeLog: (label = 'default', ...args) => {
                label = String(label);
                if (!timers.has(label)) {
                    return attach(new Log('warn', [`Timer '${label}' does not exist`]));
                }
                const duration = performance.now() - timers.get(label);
                attach(new Log('log', [`${label}: ${duration}ms`].concat(args)));
            },
            timeEnd: (label = 'default') => {
                label = String(label);
                if (!timers.has(label)) {
                    return attach(new Log('warn', [`Timer '${label}' does not exist`]));
                }
                const duration = performance.now() - timers.get(label);
                attach(new Log('log', [`${label}: ${duration}ms`]));
                timers.delete(label);
            },

            //=========== Other ==========//
            table: (...args) => {
                if (!args[0]) return;
                attach(new Log('table', args));
            },
            trace: (...args) => {
                if (!args[0]) args[0] = 'console.trace';
                attach(new Log('trace', args));
            },
            assert: (condition, ...args) => {
                if (!condition) attach(new Log('error', ['Assertion failed:', ...args]));
            },
            clear: () => {
                // Reset the logs
                logs = [];
                lastLog = null;

                // Reset the groups
                groupStack = [];
                collapsedGroups = new Set();
                groupScopes = new Map();
                groups = {};

                attach(new Log('clear', [`Console was cleared`]));
                renderViewport();
            }
        }
    }
}
