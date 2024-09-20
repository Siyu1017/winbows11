; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Microhard Edge',
        datas: {
            page: FILE_PATH
        }
    });
})();
