Object.defineProperty(window.Compilers, 'Worker', {
    /**
     * Add current file datas to the file.
     * @param {String} path 
     * @param {String} token 
     * @returns {Blob} 
     */
    value: async function (path, token, extra = '') {
        return new Promise(async (resolve, reject) => {
            var file = await window.fs.downloadFile(path);
            var content = await file.text();
            var directories = path.trim().split('/').filter(dir => dir.length > 0);
            directories.splice(-1);

            var modules = ['C:/Winbows/System/modules/system.js'];
            var moduleContent = '';

            for (let i in modules) {
                try {
                    moduleContent += `;${await (await fs.downloadFile(modules[i])).text()}`;
                } catch (error) {
                    reject(error);
                }
            }

            content = `/**\n * Compiled by Winbows11 (c) 2024\n * All rights reserved.\n */const __dirname="${directories.join('/')}",__filename="${path}";(()=>{try{const TOKEN="${token}";${moduleContent};}catch(e){console.error(e)}})();try{${extra};${content};}catch(e){process.error(e);}`;
            resolve(new Blob([content], { type: 'application/javascript' }));
        });
    },
    configurable: false,
    writable: false
})

window.loadedKernel();