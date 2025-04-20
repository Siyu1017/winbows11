;(async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Info',
        width: 320,
        height: 450,
        maximizable: false,
        mica: true
    })
})()