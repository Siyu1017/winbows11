;(async () => {
    await System.requestAccessWindow('./window.js', {
        title: 'Task Manager',
        mica: true
    })
})()