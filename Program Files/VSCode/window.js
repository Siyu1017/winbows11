var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(path.resolve('./window.css'));
document.head.appendChild(style);

; (async () => {
    const editor = await fs.getFileURL(path.resolve('./editor.html'));
    const filePath = process.args.path || 'C:/Program Files/VSCode/window.js';
    const fileBlob = await fs.readFile(filePath);
    const fileType = fileBlob.type;

    document.body.innerHTML = `<style>
			iframe {
				width: 100%;
                height:100%;
                border:none;
			}
		</style>
        `;

    const iframe = document.createElement('iframe');
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<svg class="loading-spinner" width="48" height="48" viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="7px"></circle></svg><div>Loading...</div></div>';
    iframe.src = editor;
    document.body.appendChild(iframe);
    document.body.appendChild(loading);
    
    iframe.onload = async () => {
        loading.remove();

        let event = new CustomEvent('init', {
            detail: {
                filePath: filePath,
                fileContent: await (fileBlob).text(),
                fileType: fileType,
                type: 'init',
                browserWindow
            }
        });
        iframe.contentWindow.document.dispatchEvent(event);

        document.addEventListener('action', async (e) => {
            var data = e.detail;
            console.log(data)
            if (data.action == 'save') {
                await fs.writeFile(data.filePath, new Blob([data.fileContent], fileType ? {
                    type: fileType
                } : {})).then(() => {
                    console.log('File saved');
                });
            }
        });

        document.addEventListener('check', (e) => {
            console.log(e)
        })
    }
})();