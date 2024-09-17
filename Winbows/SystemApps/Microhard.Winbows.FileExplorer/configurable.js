;(async () => {
    await System.requestAccessWindow('./window.js', {
        datas: {
            page: PAGE
        }
    })
})();
