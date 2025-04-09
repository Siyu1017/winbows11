; (async () => {
    const status = JSON.parse(await (await fs('readFile', 'C:/Winbows/System/.env/location/param.json')).text());
    if (status['dev'] || status['develop'] || status['logs'] || status['output']) {
        console.log(FILE_PATH);
    }
    await System.requestAccessWindow('./chooseViewerWindow.js', {
        width: 360,
        height: 540,
        x: 'center',
        y: 'center',
        fullscreenable: false,
        resizable: false,
        closable: false,
        minimizable: false,
        title: 'Open with',
        datas: {
            file: FILE_PATH
        }
    });
})();
