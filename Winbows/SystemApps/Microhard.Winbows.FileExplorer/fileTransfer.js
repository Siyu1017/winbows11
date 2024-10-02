; (async () => {
    await System.requestAccessWindow('./fileTransferWindow.js', {
        width: 360,
        height: 540,
        title: 'File Transfer',
        fullscreenable: false,
        snappable: false,
        resizable: false
    });

    process.send({
        type: 'init'
    })

    process.on('message', async function (event) {
        process.send(event.data);
    });
})();
