import { canvasClarifier } from "../../utils.js";
import "./performance-monitor.css";

function createPerformanceMonitor(container, options = {}) {
    const header = document.createElement('div');
    const titleEl = document.createElement('div');
    const valueEl = document.createElement('div');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    header.className = 'devtool-performance-monitor-header';
    titleEl.className = 'devtool-performance-monitor-title';
    valueEl.className = 'devtool-performance-monitor-value';
    canvas.className = 'devtool-performance-monitor-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '96px';

    container.appendChild(header);
    header.appendChild(titleEl);
    header.appendChild(valueEl);
    container.appendChild(canvas);

    const optionMax = options?.max || undefined;
    const optionUnit = options?.unit || '';
    const smooth = options?.smooth ?? true;
    const color = options?.color ?? [167, 203, 255];
    const dataProvider = options?.dataProvider || function () {
        return 0;
    }

    titleEl.textContent = options?.title ?? 'Title';
    valueEl.textContent = '-';

    const gapSize = 10;
    const pxPerMs = gapSize / 1000;
    const dataUpdateInterval = 500;
    const topPadding = 24;

    let dataBuffer = [];
    let currentMax = 0;
    let running = true;

    function start() {
        if (running == true) return;
        running = true;
        render();
    }

    function stop() {
        running = false;
    }

    setInterval(() => {
        const value = dataProvider();
        dataBuffer.push({ value, timestamp: Date.now() });
        valueEl.textContent = value + optionUnit;
    }, dataUpdateInterval);

    function getMax() {
        if (optionMax) return optionMax;

        let max = dataBuffer[0]?.value;
        for (let i = 1; i < dataBuffer.length; i++) {
            max = Math.max(max, dataBuffer[i].value);
        }

        if (!max) return 10;

        const base10 = Math.pow(10, ~~(Math.log10(max)));
        max = Math.ceil(max / base10 / 2) * base10 * 2;

        const alpha = 0.2
        currentMax = max * alpha + (currentMax || max) * (1 - alpha);
        return currentMax;
    }

    function render() {
        if (running == false) return;
        canvasClarifier(canvas, ctx);
        drawChart();
        drawGrid();
        requestAnimationFrame(render)
    }

    function drawChart() {
        const w = canvas.offsetWidth,
            h = canvas.offsetHeight;
        const path = new Path2D();

        let x = 0;
        let lastX = 0;
        let lastY = 0;

        if (dataBuffer.length > 0) {
            const max = getMax();
            const chartHeight = h - topPadding;
            const now = Date.now();

            function convertY(y) {
                return (1 - y / max) * chartHeight + topPadding;
            }

            x = w - (now - dataBuffer[0].timestamp - dataUpdateInterval) * pxPerMs;
            path.moveTo(x, convertY(0));
            lastX = w + dataUpdateInterval * pxPerMs;
            lastY = convertY(dataBuffer[dataBuffer.length - 1].value);
            path.lineTo(lastX, convertY(0));

            let i = dataBuffer.length - 1;
            while (lastX > 0 && i >= 0) {
                const item = dataBuffer[i];
                const y = convertY(item.value);
                x = w - (now - item.timestamp - dataUpdateInterval) * pxPerMs;
                if (smooth) {
                    const midX = (lastX + x) / 2;
                    path.bezierCurveTo(midX, lastY, midX, y, x, y);
                } else {
                    path.lineTo(x, lastY);
                    path.lineTo(x, y);
                }
                lastX = x;
                lastY = y;
                i--;
            }

            if (i >= 0) {
                dataBuffer.splice(0, i + 1);
            }

            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.25)`;
            ctx.fill(path);
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
            ctx.stroke(path);
        }
    }

    function drawGrid() {
        const now = Date.now();
        const w = canvas.offsetWidth,
            h = canvas.offsetHeight;
        const len = dataBuffer.length;

        if (len > 0) {
            const max = getMax();
            const chartHeight = h - topPadding;
            const now = Date.now();

            function convertY(y) {
                return (1 - y / max) * chartHeight + topPadding;
            }

            // Cols
            const labelDistanceSeconds = 10;
            const currentTime = Date.now() / 1000;
            ctx.fillStyle = '#ffffff88';
            for (let sec = Math.ceil(currentTime); ; --sec) {
                const x = w - ((currentTime - sec) * 1000 - dataUpdateInterval) * pxPerMs;
                if (x < -50) {
                    break;
                }
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                if (sec >= 0 && sec % labelDistanceSeconds === 0) {
                    ctx.fillText(new Date(sec * 1000).format('hh:mm:ss'), x + 4, 12);
                }
                ctx.strokeStyle = sec % labelDistanceSeconds ? '#ffffff0d' : '#ffffff35';
                ctx.stroke();
            }

            // Rows
            let base = Math.pow(10, Math.floor(Math.log10(max)));
            const firstDigit = Math.floor(max / base);
            if (firstDigit !== 1 && firstDigit % 2 === 1) {
                base *= 2;
            }
            let scaleValue = Math.floor(max / base) * base;

            ctx.beginPath();
            ctx.strokeStyle = '#ffffff35';
            ctx.fillStyle = '#ffffff88';
            for (let i = 0; i < 2; ++i) {
                let y = convertY(scaleValue);
                const labelText = scaleValue + optionUnit;
                ctx.moveTo(0, y);
                ctx.lineTo(4, y);
                ctx.moveTo(ctx.measureText(labelText).width + 12, y);
                ctx.lineTo(w, y);
                ctx.fillText(labelText, 8, convertY(scaleValue) + 3);
                scaleValue /= 2;
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, h + 0.5);
            ctx.lineTo(w, h + 0.5);
            ctx.strokeStyle = '#ffffff35';
            ctx.stroke()
        }
    }

    render();

    return { start, stop };
}

let prevTime = Date.now(),
    frames = 0;
let interval = 500;
let scale = 1000 / interval;
let fps = 0;
requestAnimationFrame(function loop() {
    const time = Date.now();
    frames++;
    if (time > prevTime + interval) {
        fps = Math.round((frames * scale * interval) / (time - prevTime));

        prevTime = time;
        frames = 0;
    }
    requestAnimationFrame(loop);
});

const performanceMonitor = document.createElement('div');
const fpsMonitor = document.createElement('div');
const usedJSHeapSizeMonitor = document.createElement('div');
const monitors = [];

performanceMonitor.className = 'devtool-performance-monitor';
fpsMonitor.className = 'devtool-performance-monitor-item';
usedJSHeapSizeMonitor.className = 'devtool-performance-monitor-item';

performanceMonitor.appendChild(fpsMonitor);

monitors.push(createPerformanceMonitor(fpsMonitor, {
    title: 'FPS',
    dataProvider: () => fps,
}));

if (performance.memory) {
    performanceMonitor.appendChild(usedJSHeapSizeMonitor);
    monitors.push(createPerformanceMonitor(usedJSHeapSizeMonitor, {
        title: 'Used JS Heap Size',
        unit: 'MB',
        color: [175, 113, 255],
        smooth: false,
        dataProvider: () => (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
    }))
}

export default {
    container: performanceMonitor,
    monitors
};