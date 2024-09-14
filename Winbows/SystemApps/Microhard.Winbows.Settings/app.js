; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Settings'
    })
})()