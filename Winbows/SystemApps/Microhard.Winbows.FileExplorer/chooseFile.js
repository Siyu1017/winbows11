; (async () => {
    await System.requestAccessWindow('./chooseFileWindow.js', {
        x: 0,
        y: 0,
        fullscreenable: false,
        resizable: false,
        minimizable: false,
        snappable: false,
        title: 'Choose File...'
    });

    process.on('message', async function (event) {
        // console.log(event.data)
        postMessage(event.data);
    });
})();
