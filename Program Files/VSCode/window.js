var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

; (async () => {
    var editor = await fs.getFileURL(utils.resolvePath('./editor.html'));
    var filePath = datas.file || 'C:/Program Files/VSCode/window.js';
    var fileBlob = await fs.readFile(filePath);
    var fileType = fileBlob.type;

    document.body.innerHTML = `<style>
			iframe {
				width: 100%;
                height:100%;
                border:none;
			}
		</style>
        `;

    var iframe = document.createElement('iframe');
    iframe.src = editor;
    document.body.appendChild(iframe);

    console.log(datas)

    iframe.onload = async () => {
        let event = new CustomEvent('init', {
            detail: {
                filePath: filePath,
                fileContent: await (fileBlob).text(),
                type: 'init'
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