async function createThumbnail(source, { maxWidth = 320, maxHeight = 320, type = "image/webp", quality = 0.8 } = {}) {
    if (!(source instanceof Blob)) throw new TypeError("source must be a Blob or File");

    const bitmap = await createImageBitmap(source);
    const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        bitmap.close();
        throw new Error("Failed to create canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Failed to encode thumbnail")), type, quality);
    });

    return { blob, width, height, type: blob.type, size: blob.size };
}

module.exports = { createThumbnail }