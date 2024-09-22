/**
 * Code by Siyu1017 (c) 2023
 * All rights reserved.
 */

"use strict";

class FPS {
    constructor(config = {}) {
        this.config = this.utils.mergeDeep({}, this.config, config);
        this.canvas.style.width = this.config.width;
        this.canvas.style.height = this.config.height;
        this.fpsMeter();
        // this.mouseEventHandler();
        this.canvas.onresize = () => {
            this.drawFPS();
        }
        return this;
    }
    drawFPS = () => {
        this.canvas.style.width = this.config.width;
        this.canvas.style.height = this.config.height;
        var ctx = this.canvas.getContext("2d");
        var width = this.canvas.offsetWidth;
        var height = this.canvas.offsetHeight;
        var all = this.utils.getMinMax(this.datas.slice(-1 * (width / this.config.pointInterval))).max;

        //console.log(this.datas.slice(-1 * (width - this.config.pointInterval)))

        //Math.pow(10, Math.ceil(Math.log10(all / (height / this.config.minLineDistance)) - 2)) * this.config.fpsBaseUnitDistance;

        var interval = this.utils.getInterval(all / (height / this.config.minLineDistance));

        var maxHeight = 25 + this.config.textSize + this.config.lineToFPSTextMinDistance;

        all = ((maxHeight / this.canvas.offsetHeight) + 1) * all;

        this.canvas.style.width = this.config.width || "300px";
        this.canvas.style.height = this.config.height || "150px";
        this.utils.canvasClarifier(this.canvas, ctx);

        ctx.lineWidth = 1;

        // 繪製組距線
        for (let j = 1; j < all / interval; j++) {
            ctx.beginPath();
            ctx.strokeStyle = this.config.colors.intervalLine;
            ctx.lineJoin = "round";
            ctx.moveTo(0, (height - height / all * interval * j));
            ctx.lineTo(width, (height - height / all * interval * j));
            ctx.stroke();
        }

        ctx.imageSmoothingEnabled = true;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = this.config.colors.fpsLine;
        ctx.shadowColor = this.config.colors.fpsLineShadow;
        ctx.shadowBlur = 4;

        /*

        function drawLineTest(points) {
            if (points.length == 0) return;
            if (points.length == 1) {
                ctx.beginPath();
                ctx.arc(points[0].x, points[0].y, 0.5, 0, 2 * Math.PI, true);
                ctx.fill();
                return;
            }
            if (points.length == 2) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
                ctx.stroke();
                return;
            }
            for (let i = 0; i < points.length - 1; i++) {
                ctx.beginPath();
                if (i == 0) {
                    ctx.moveTo(points[i].x, points[i].y)
                    ctx.quadraticCurveTo(points[i + 1].x, points[i + 1].y, points[i + 1].x + (points[i + 2].x - points[i + 1].x) / 2, points[i + 1].y + (points[i + 2].y - points[i + 1].y) / 2);
                } else if (i == points.length - 2) {
                    ctx.moveTo(points[i].x, points[i].y)
                    ctx.quadraticCurveTo(points[i + 1].x, points[i + 1].y, points[i].x + (points[i + 1].x - points[i].x) * 0.75, points[i].y + (points[i + 1].y - points[i].y) * 0.75);
                } else {
                    ctx.moveTo(points[i].x + (points[i + 1].x - points[i].x) / 2, points[i].y + (points[i + 1].y - points[i].y) / 2)
                    ctx.quadraticCurveTo(points[i + 1].x, points[i + 1].y, points[i + 1].x + (points[i + 2].x - points[i + 1].x) / 2, points[i + 1].y + (points[i + 2].y - points[i + 1].y) / 2);
                }
                ctx.stroke();
            }
        }

        var points = [];

        for (let i = 0; i * this.config.pointInterval < width && i < this.datas.length; i++) {
            points.push({
                x: (width - i * this.config.pointInterval),
                y: (this.datas.length > width ? height - (height * this.datas[this.datas.length - i] / all) : height - (height * this.datas[this.datas.length - i] / all))
            });
        }

        drawLineTest(points)

        */

        // 繪製 FPS 折線

        for (let i = 0; i * this.config.pointInterval < width && i < this.datas.length; i++) {
            ctx.strokeStyle = this.config.colors.fpsLine;
            ctx.shadowColor = this.config.colors.fpsLineShadow;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.moveTo((width - i * this.config.pointInterval), (this.datas.length > width ? height - (height * this.datas[this.datas.length - i] / all) : height - (height * this.datas[this.datas.length - i] / all)));
            ctx.lineTo((width - (i + 1) * this.config.pointInterval), (this.datas.length > width ? height - (height * this.datas[this.datas.length - i - 1] / all) : height - (height * this.datas[this.datas.length - i - 1] / all)));
            ctx.stroke();
        }

        ctx.shadowColor = "";
        ctx.shadowBlur = 0;

        // 繪製組距值
        for (let j = 1; j < all / interval; j++) {
            ctx.strokeStyle = this.config.colors.intervalTextShadow;
            ctx.fillStyle = this.config.colors.intervalText;
            ctx.font = `${this.config.textSize}px Arial`;
            ctx.strokeText(j * interval, 14, (height - height / all * interval * j + 5));
            ctx.fillText(j * interval, 14, (height - height / all * interval * j + 5));
        }

        // 繪製 FPS 值範圍
        ctx.strokeStyle = this.config.colors.fpsTextShadow;
        ctx.font = `${this.config.textSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillStyle = this.config.colors.fpsText;
        ctx.strokeText(`${this.datas[this.datas.length - 1]} FPS ( ${this.utils.getMinMax(this.datas).min} ~ ${this.utils.getMinMax(this.datas).max} )`, (width - 20), 25);
        ctx.fillText(`${this.datas[this.datas.length - 1]} FPS ( ${this.utils.getMinMax(this.datas).min} ~ ${this.utils.getMinMax(this.datas).max} )`, (width - 20), 25);
    }
    mouseEventHandler = () => {
        var fps_canvas_pos = {
            x: 0,
            y: 0
        }, moving = false;

        this.canvas.addEventListener("mousedown", (e) => {
            moving = true;
            fps_canvas_pos.x = e.clientX;
            fps_canvas_pos.y = e.clientY;
        })

        window.addEventListener("mousemove", (e) => {
            if (moving == true) {
                this.canvas.style.left = this.utils.getElementPosition(this.canvas).x + e.clientX - fps_canvas_pos.x + "px";
                this.canvas.style.top = this.utils.getElementPosition(this.canvas).y + e.clientY - fps_canvas_pos.y + "px";
                fps_canvas_pos.x = e.clientX;
                fps_canvas_pos.y = e.clientY;
            }
        })

        window.addEventListener("mouseup", (e) => {
            moving = false;
            fps_canvas_pos = {
                x: 0,
                y: 0
            }
        })

        window.onblur = () => {
            moving = false;
            fps_canvas_pos = {
                x: 0,
                y: 0
            }
        }
    }
    fpsMeter = () => {
        let prevTime = Date.now(),
            frames = 0;
        var _this = this;
        // var time1 = Date.now();
        requestAnimationFrame(function loop() {
            const time = Date.now();
            frames++;
            if (time > prevTime + 1000) {
                let fps = Math.round((frames * 1000) / (time - prevTime));
                // fps = Math.floor(Math.random() * (Date.now() - time1));
                _this.datas.push(fps);
                prevTime = time;
                frames = 0;

                _this.drawFPS();
            }
            requestAnimationFrame(loop);
        });
    }
    config = {
        width: "300px",
        height: "150px",
        minLineDistance: 60,
        pointInterval: 5,
        textSize: 14,
        lineToFPSTextMinDistance: 14,
        fpsBaseUnitDistance: 25,
        colors: {
            fpsLine: "rgb(26, 115, 232)",
            fpsLineShadow: "rgb(26, 115, 232)",
            fpsText: "rgb(111, 106, 106)",
            fpsTextShadow: "rgb(255, 255, 255)",
            intervalLine: "rgb(221, 221, 221)",
            intervalText: "rgb(0, 0, 0)",
            intervalTextShadow: "rgb(255, 255, 255)"
        }
    }
    canvas = document.createElement("canvas")
    datas = []
    utils = {
        getMinMax: (data) => {
            return { min: Math.min(...data), max: Math.max(...data) };
        },
        getElementPosition: (element) => {
            function offset(el) {
                var rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
            }
            return { x: offset(element).left, y: offset(element).top };
        },
        getInterval: (number) => {
            return Math.ceil(number / Math.pow(10, number.toString().split('.')[0].length - 1)) * Math.pow(10, number.toString().split('.')[0].length - 1);
        },
        canvasClarifier: function (canvas, ctx) {
            var ratio = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            ctx.scale(ratio, ratio);
        },
        mergeDeep: (target, ...sources) => {
            if (!sources.length) return target;
            const source = sources.shift();

            function isObject(item) {
                return (item && typeof item === 'object' && !Array.isArray(item));
            }

            if (isObject(target) && isObject(source)) {
                for (const key in source) {
                    if (isObject(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        this.utils.mergeDeep(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                }
            }

            return this.utils.mergeDeep(target, ...sources);
        }
    }
};

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

var fps = new FPS({
    width: "300px",
    height: "150px",
    minLineDistance: 60,
    pointInterval: 5,
    textSize: 14,
    lineToFPSTextMinDistance: 14,
    fpsBaseUnitDistance: 25,
    colors: {
        fpsLine: "rgb(25,103,210)",
        /*
        fpsLineShadow: "rgb(26, 115, 232)",
        fpsText: "rgb(111, 106, 106)",
        fpsTextShadow: "rgb(255, 255, 255)",
        intervalLine: "rgb(221, 221, 221)",
        intervalText: "rgb(0, 0, 0)",
        intervalTextShadow: "rgb(255, 255, 255)"
        */
    }
})

document.documentElement.innerHTML = '';
document.documentElement.appendChild(fps.canvas);

console.log(browserWindow)

browserWindow.setMovable(fps.canvas);
browserWindow.setSnappable(false);