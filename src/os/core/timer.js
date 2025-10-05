function randomID(count = 12, chars) {
    var chars = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
};

const marks = [];
const groups = new Map();
const level = 'root';
const levels = [level];
const startTime = Date.now();

groups.set(level, marks);
let target = marks;
let lastTime = startTime;

const timer = {
    group(name) {
        const gId = randomID();
        const group = {
            name,
            start: Date.now(),
            marks: []
        }
        levels.push(gId);
        target.push(group);
        groups.set(gId, group);
        target = group.marks;
    },
    groupEnd() {
        if (levels.length > 1) {
            const now = Date.now();
            const groupId = levels.pop();
            const group = groups.get(groupId);
            group.sum = now - group.start;
            lastTime = now;
            groups.delete(groupId);

            target = groups.get(levels[levels.length - 1]);
            target = target.marks || target;
        }
    },
    mark(label) {
        const now = Date.now();
        target.push({
            label,
            sum: now - lastTime
        })
        lastTime = now;
    }
}

function getDuration() {
    return lastTime - startTime;
}

export default timer;
export { marks, getDuration };