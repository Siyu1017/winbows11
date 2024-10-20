; (async () => {
    await System.requestAccessWindow('./window.js', {
        x: 120,
        y: 60,
        title: 'Notepad'
    });

    process.on('message', async function (event) {
        // console.log(event.data)
        postMessage(event.data);
    });
})();
