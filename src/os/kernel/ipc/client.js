const _server = Symbol('server');

class IPCClient {
    constructor() {
        this[_server] = null;
    }
    on(evt, listener) {

    }
    send(...args) {

    }
    connect(server) {

    }
    disconnect() {

    }
}