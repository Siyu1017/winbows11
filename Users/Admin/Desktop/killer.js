(async () => {
    try {
        var script = `Object.keys(window.System.processes).forEach(p=>window.System.processes[p].exit());`;
        var target = await fs('resolve', `C:/Winbows/System/Temp/__${[...Array(72)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}.tmp`);
        await fs('writeFile', target, new Blob([script], {
            type: 'application/tmp+javascript'
        }));
        await System.requestAccessWindow(target);
    } catch (e) {
        console.error(e)
    }
})()