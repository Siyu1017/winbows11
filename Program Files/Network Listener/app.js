; (async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Network Listener'
    })
})()