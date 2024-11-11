(async () => {
    try {
        var script = `Object.keys(window.System.processes).forEach(p=>window.System.processes[p].exit());`;
        var target = await fs('resolve', `./__${[...Array(72)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}.js`);
        await fs('writeFile', target, new Blob([script]));
        await System.requestAccessWindow(target);
    } catch (e) {
        console.error(e)
    }
})()