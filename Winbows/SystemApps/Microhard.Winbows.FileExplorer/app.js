;(async () => {
    // var module = await fs('downloadFile', 'C:/Winbows/System/modules/html.js');
    // eval(await module.text());

    await System.requestAccessWindow('./window.js', {
        mica: true
    })

    // var browserWindow = await new System.browserWindow({
    //     title: 'Explorer',
    //     toolbar: false,
    //     fullscreen: true
    // });

    // await HTML(browserWindow.id, `<div class="explorer">Explorer</div>`);
})();
