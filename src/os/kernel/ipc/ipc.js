const IPCManager = {};
const channels = new Map();

IPCManager.bind = (runtime) => {
    // client
    function connect(channelId, handler) {
        // TODO: check if the channel exists; if not, throw an error; otherwise, return a ipc client object
        // ipc client api: close, disconnect, on, send

        const channel = channels.get(channelId);
        if (!channel) throw new Error(`IPC Channel '${channelId}' does not exist.`);
        return channel.requestClient();
    }

    // server
    function listen(channelId, handler) {
        // TODO: if the channel alreay exists, throw an error; otherwise, return a ipc server object
        // ipc server api: broadcast, close, on, send
    }
}
