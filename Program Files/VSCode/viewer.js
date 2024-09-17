; (async () => {
    console.log(FILE_PATH);
    await System.requestAccessWindow('./window.js', {
        title: 'Visual Studio Code',
        datas: {
            file: FILE_PATH
        }
    });
})();
