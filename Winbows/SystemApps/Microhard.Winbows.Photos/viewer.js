; (async () => {
    console.log(FILE_PATH);
    await System.requestAccessWindow('./window.js', {
        title: 'Photos',
        datas: {
            file: FILE_PATH
        }
    });
})();
