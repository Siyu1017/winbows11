; (async () => {
    console.log(FILE_PATH);
    await System.requestAccessWindow('./chooseViewerWindow.js', {
        width: 360,
        height: 540,
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
