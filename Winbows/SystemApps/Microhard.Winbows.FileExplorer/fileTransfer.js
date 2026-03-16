//! $RTH={"type":"gui"}
// ; (async () => {
//     await System.requestAccessWindow('./fileTransferWindow.js', {
//         width: 480,
//         height: 250,
//         title: 'File Transfer',
//         fullscreenable: false,
//         snappable: false,
//         resizable: false
//     });

//     postMessage({
//         type: 'start'
//     });

//     process.on('message', async function (event) {
//         // console.log(event.data)
//         postMessage(event.data);
//     });
// })();

function randomID(count, spec) {
    let chars = spec || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        result = '',
        length = chars.length;
    for (let i = 0; i < count; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
};

const { app, BrowserWindow } = WApplication;
const pipeId = randomID(256);

let mainWindow;

process.title = 'File Transfer';

app.on('ready', () => {
    const ipc = IPC.listen(pipeId);
    ipc.on('data', (e) => {
        // if (e.data.type === 'check') {
        //     ipc.send({
        //         type: 'check',
        //         data: token
        //     })
        // }
        if (e.data.type === 'ready') {
            ipc.send({
                type: 'data',
                data: wrt
            })
            setTimeout(() => {
                ipc.close();
            })
        }
    })
    mainWindow = new BrowserWindow({
        width: 480,
        height: 250,
        title: 'File Transfer',
        fullscreenable: false,
        snappable: false,
        resizable: false
    }, {
        env: {
            pipe: pipeId
        }
    });
    mainWindow.load('./fileTransferWindow.js');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
})

try {
    await app.executeAsync();
} catch (err) {
    console.error('App crashed:', err);
}