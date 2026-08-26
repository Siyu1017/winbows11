; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Notepad',
        datas: {
            page: FILE_PATH
        }
    });
})();
