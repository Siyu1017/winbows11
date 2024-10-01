; (async () => {
    console.log(FILE_PATH);
    await System.requestAccessWindow('./window.js', {
        title: 'JSON Viewer',
        datas: {
            file: FILE_PATH
        }
    });
})();
