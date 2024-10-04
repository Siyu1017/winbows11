; (async () => {
    await System.requestAccessWindow('./fileTransferWindow.js', {
        width: 360,
        height: 540,
        title: 'File Transfer',
        fullscreenable: false,
        snappable: false,
        resizable: false
    });

    process.on('message', async function (event) {
        console.log(event.data)
        process.send(event.data);
    });
})();
