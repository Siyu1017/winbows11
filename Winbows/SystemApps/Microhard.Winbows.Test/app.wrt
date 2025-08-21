// TOKEN, __dirname, __filename => Added by compiler

;(async () => {
    var module = await fs('downloadFile', 'C:/Winbows/System/modules/toolbarComponents.js');
    eval(await module.text());

    var browserWindow = '';
    /*await new System.browserWindow({
        width: 800,
        height: 600,
        title: 'Testing App',
        x: 0,
        y: 0
    });*/

    // console.log('token', TOKEN);
    console.log(System.ToolbarComponents)
    console.log(browserWindow)

    console.log('file :', await fs('readFile', __filename));
    console.log('dir :', await fs('readdir', __dirname));
    console.log('modules:', await fs('readdir', '../../System/modules'));

    var customToolbar = await new System.customToolbar({
        icon: [await new System.ToolbarComponents.Icon('./favicon.ico')],
        menu: [await System.useFlex([
            await new System.ToolbarComponents.Menu({
                label: 'File',
                items: [
                    {
                        type: 'item',
                        label: 'New',
                        click: () => console.log('New document clicked')
                    }, {
                        type: 'item',
                        label: 'Open...',
                        click: () => console.log('Open document clicked')
                    }, {
                        type: 'separator'
                    }, {
                        type: 'item',
                        label: 'Quit',
                        click: () => browserWindow.close()
                    }
                ]
            }), await new System.ToolbarComponents.Menu({
                label: 'Edit',
                items: [
                    {
                        type: 'item',
                        label: 'Undo',
                        click: () => console.log('Undo action')
                    }, {
                        type: 'item',
                        label: 'Redo',
                        click: () => console.log('Redo action')
                    }
                ]
            })
        ], {
            justifyContent: 'center',
            alignItems: 'center',
            direction: 'row'
        })],
        button: [await new System.ToolbarComponents.Button({
            label: 'Toggle DevTools',
            icon: fs.getFile('./close.ico'),
            click: () => browserWindow.close()
        })]
    });

    browserWindow.useToolbar(customToolbar);

    var document = await browserWindow.getDocument();

    var div = document.createElement('div');
    div.innerHTML = 'Test div';
    document.body.appendChild(div);

    process.exit(0);
})();
