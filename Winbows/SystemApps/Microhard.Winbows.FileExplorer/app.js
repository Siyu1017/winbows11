;(async () => {
    var module = await System.fs('downloadFile', 'C:/Winbows/System/modules/html.js');
    eval(await module.text());

    var accessWindow = null;
    await System.requestAccessWindow('./window.js').then(e => {
        if (e.ok == true) {
            accessWindow = e.window;
        } else {
            throw new Error();
        }
    })

    // var browserWindow = await new System.browserWindow({
    //     title: 'Explorer',
    //     toolbar: false,
    //     fullscreen: true
    // });

    await HTML(browserWindow.id, `<div class="explorer">Explorer</div>`);
})();
