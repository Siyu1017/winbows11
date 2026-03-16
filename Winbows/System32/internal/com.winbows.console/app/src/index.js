//import WinbowsDevtool from "./lib/console";
import "./lib/console.css";
import "./index.css";

//const devtool = new WinbowsDevtool();

browserWindow.setTheme('dark');

if (process.env.pipe) {
    const pipe = process.env.pipe;
    const ipc = IPC.connect(pipe);

    const { console, runtimeID } = await (async () => {
        return new Promise(resolve => {
            ipc.on('data', (e) => {
                const dt = e.data;
                if (dt.type == 'data') {
                    const data = dt.data;
                    resolve(data);
                }
            })
            ipc.send({
                type: 'ready'
            })
        })
    })();

    browserWindow.changeTitle(`${runtimeID} - Console`);
    document.body.appendChild(console.devtool);
}