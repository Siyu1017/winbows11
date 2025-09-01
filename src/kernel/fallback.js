export const fallbackImage = (function () {
    const canvas = document.createElement("canvas");
    const size = 40;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const path = new Path2D();

    path.moveTo(0, 0);
    path.lineTo(0, size);
    path.lineTo(size, size);
    path.lineTo(size, 0);
    path.lineTo(0, 0);
    path.closePath();
    path.moveTo(0, 0,);
    path.lineTo(size, size);
    path.moveTo(size, 0);
    path.lineTo(0, size);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke(path);

    return canvas.toDataURL("image/png");
})();