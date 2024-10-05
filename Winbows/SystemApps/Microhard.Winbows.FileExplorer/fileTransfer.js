; (async () => {
    await System.requestAccessWindow('./fileTransferWindow.js', {
        width: 360,
        height: 540,
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
