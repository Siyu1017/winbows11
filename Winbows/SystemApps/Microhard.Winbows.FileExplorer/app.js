;(async () => {
    // var module = await System.fs('downloadFile', 'C:/Winbows/System/modules/html.js');
    // eval(await module.text());

    await System.requestAccessWindow('./window.js')

    // var browserWindow = await new System.browserWindow({
    //     title: 'Explorer',
    //     toolbar: false,
    //     fullscreen: true
    // });

    // await HTML(browserWindow.id, `<div class="explorer">Explorer</div>`);
})();
