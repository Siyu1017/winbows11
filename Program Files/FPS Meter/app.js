; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'FPS Meter',
        width: 300,
        height: 150,
        resizable: false,
        showOnTop: true
    });
})();
