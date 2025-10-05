const fileIcons = {
    getIcon: (path = '') => {
        const ext = fsUtils.extname(path);
        if (fileIcons.registerd[ext]) {
            return fileIcons.registerd[ext];
        } else {
            return fileIcons.registerd['*'];
        }
    },
    registerd: {
        // Default
        '*': 'C:/Winbows/icons/files/generic.ico',
        '.jpg': 'C:/Winbows/icons/files/image.ico',
        '.png': 'C:/Winbows/icons/files/image.ico',
        '.gif': 'C:/Winbows/icons/files/image.ico',
        '.svg': 'C:/Winbows/icons/files/image.ico',
        '.webp': 'C:/Winbows/icons/files/image.ico',
        '.jpeg': 'C:/Winbows/icons/files/image.ico',
        '.ico': 'C:/Winbows/icons/files/image.ico',
        '.bmp': 'C:/Winbows/icons/files/image.ico',
        '.mp3': 'C:/Winbows/icons/files/audio.ico',
        '.wav': 'C:/Winbows/icons/files/audio.ico',
        '.ogg': 'C:/Winbows/icons/files/audio.ico',
        '.mp4': 'C:/Winbows/icons/files/video.ico',
        '.webm': 'C:/Winbows/icons/files/video.ico',
        '.avi': 'C:/Winbows/icons/files/video.ico',
        '.mov': 'C:/Winbows/icons/files/video.ico',
        '.txt': 'C:/Winbows/icons/files/text.ico',
        '.exe': 'C:/Winbows/icons/files/program.ico',
        '.zip': 'C:/Winbows/icons/folders/zip.ico',
        '.ttf': 'C:/Winbows/icons/files/font.ico',
        '.otf': 'C:/Winbows/icons/files/font.ico',
        '.woff': 'C:/Winbows/icons/files/font.ico',
        '.woff2': 'C:/Winbows/icons/files/font.ico',
        '.eot': 'C:/Winbows/icons/files/font.ico',
        '.doc': 'C:/Winbows/icons/files/office/worddocument.ico',
        '.docx': 'C:/Winbows/icons/files/office/worddocument.ico',
        '.xls': 'C:/Winbows/icons/files/office/excelsheet.ico',
        '.xlsx': 'C:/Winbows/icons/files/office/excelsheet.ico',
        '.ppt': 'C:/Winbows/icons/files/office/powerpointopen.ico',
        '.pptx': 'C:/Winbows/icons/files/office/powerpointopen.ico',
        // Edge
        '.html': 'C:/Winbows/icons/applications/tools/edge.ico',
        // VSCode
        '.css': 'C:/Program Files/VSCode/File Icons/css.ico',
        '.js': 'C:/Program Files/VSCode/File Icons/javascript.ico',
        '.json': 'C:/Program Files/VSCode/File Icons/json.ico',
        // Winbows script files
        '.wbsf': 'C:/Winbows/icons/files/executable.ico',
        '.wrt': 'C:/Winbows/icons/files/program.ico',
        '.wrt': 'C:/Winbows/icons/files/program.ico',
    },
    register: (ext, icon) => {
        if (ext == '*') return;
        fileIcons.registerd[ext] = icon;
    }
}

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
};
function getMimeType(extension) {
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export default fileIcons;