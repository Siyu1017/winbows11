; (async () => {
    console.log(FILE_PATH);
    await System.requestAccessWindow('./window.js', {
        title: 'VSCode',
        datas: {
            file: FILE_PATH
        }
    });
})();
