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

    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) {
            return;
        }
        console.log('Received message from iframe:', event.data);
        var message = event.data;
        if (message.type == 'action') {
            if (message.action == 'save') {
                await fs.writeFile(event.data.filePath, new Blob([event.data.fileContent], fileType ? {
                    type: fileType
                } : {}));
            }
        }
    });

    iframe.onload = async () => {
        iframe.contentWindow.postMessage({
            filePath: filePath,
            fileContent: await (fileBlob).text(),
            type: 'init'
        }, editor)
    }
})();