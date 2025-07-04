; (async () => {
    await System.requestAccessWindow('./fileTransferWindow.js', {
        width: 480,
        height: 250,
        title: 'File Transfer',
        fullscreenable: false,
        snappable: false,
        resizable: false
    });

    postMessage({
        type: 'start'
    });

    process.on('message', async function (event) {
        // console.log(event.data)
        postMessage(event.data);
    });
})();
