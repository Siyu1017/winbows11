; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Network Listener',
        width: 420,
        height: 600
    })
})()