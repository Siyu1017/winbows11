export const fallbackImage = (function () {
    const canvas = document.createElement("canvas");
    const size = 40;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#ff5cff";
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

    return canvas.toDataURL("image/png");
})();