Object.defineProperty(window.Compilers, 'Worker', {
    /**
     * Add current file datas to the file.
     * @param {String} path 
     * @param {String} token 
     * @returns {Blob} 
     */
    value: async function (path, token, extra) {
        var file = await window.fs.downloadFile(path);
        var content = await file.text();
        var directories = path.trim().split('/').filter(dir => dir.length > 0);
        directories.splice(-1);
        
        var modules = ['C:/Winbows/System/modules/system.js'];
        var moduleContent = '';

        for (let i in modules) {
            moduleContent += `;${await (await fs.downloadFile(modules[i])).text()}`;
        }
        
        content = `/**\n * Compiled by Winbows11 (c) 2024\n * All rights reserved.\n */const __dirname="${directories.join('/')}",__filename="${path}";(()=>{try{const TOKEN="${token}";${moduleContent};}catch(e){console.error(e)}})();\n${extra};${content}`;
        return new Blob([content], { type: 'application/javascript' });
    },
    configurable: false,
    writable: false
})

window.loadedKernel();