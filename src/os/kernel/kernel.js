import SystemInformation from "../core/sysInfo.js";
import { WRT as _WRT, tasklist } from "./wrt/core.js";
import Devtool from "../devtool/devtool.js";
import { EventEmitter, randomID } from "../../shared/utils.js";
import initializeSystem from "../system/system.js";
import crashHandler from "../core/crashHandler.js";
import ModuleManager from "../moduleManager.js";
import Logger from "../core/log.js";
import timer from "../core/timer.js";

async function main() {
    const logger = new Logger({
        module: 'Kernel'
    })
    timer.mark('Boot');
    timer.group('Kernel');

    if (SystemInformation.mode == 'development') {
        const { devtool } = Devtool();

        // Welcome message
        devtool.console.log(`%cWelcome to Winbows11\n%cGithub: Siyu1017/winbows11`, 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;background-image: linear-gradient(to right, rgba(71, 202, 250, 255), rgba(3, 124, 213, 255));-webkit-text-fill-color: #0000;background-clip: text;-webkit-background-clip: text;font-weight: 500;font-size: 4rem;', 'background:rgb(24,24,24);color:#fff;border-radius:.5rem;padding: .5rem 1rem;font-size: 1rem;display: inline-block;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;');
    }

    logger.info('Initializing kernel...');
    logger.debug(`System Information:\nBuild ID: ${SystemInformation.buildId}\nLocal Build ID: ${SystemInformation.localBuildId}\nWinbows Version: ${SystemInformation.version}\nMode: ${SystemInformation.mode}`);

    const IPCManager = new ((() => {
        const pipes = new Map();        // PipeName -> Pipe Server ( Pipe )
        const runtimeIDs = new Map();   // RuntimeID -> IPC Object

        /**
         * @typedef {Object} PipeData
         * @property {string} type
         * @property {"server"|"client"|"unknown"} from
         * @property {*} data
         * @property {string|null} clientId
         */

        class PipeClient extends EventEmitter {
            constructor(server) {
                super();

                this.server = server;
                this.clientId = randomID(12);
                this.closed = false;

                // Connect to server
                this.server.connect(this);
            }

            // ------------ User Methods ------------ //
            /**
             * @param {"data"|"connect"|"disconnect"|"close"|"error"} evt 
             * @param {Function} cb 
             */
            on(evt, cb) {
                if (['data', 'connect', 'disconnect', 'close', 'error'].includes(evt)) {
                    super.on(evt, cb);
                } else {
                    throw new Error(`Event name must be one of: data, connect, disconnect, close, or error. Received: ${evt}`);
                }
            }

            /**
             * @param {*} message 
             */
            send(message) {
                if (this.closed) throw new Error('Client is closed.');
                this.server._emit('data', {
                    type: 'data',
                    from: 'client',
                    data: message,
                    clientId: this.clientId
                })
            }

            disconnect() {
                this.server._emit('disconnect', {
                    type: 'disconnect',
                    from: 'client',
                    data: this.clientId,
                    clientId: this.clientId
                })
            }

            // ------------ Server Methods ------------ //
            close() {
                this.disconnect();
                this.closed = true;
                this.clientId = null;
            }

            /**
             * @param {PipeData} data 
             */
            receive(data) {
                if (!{}.toString.call(data) === '[object Object]') throw new Error('Data must be an object');

                this._emit('data', {
                    type: 'data',
                    from: data.from === 'server' ? 'server' : data.from === 'client' ? 'client' : 'unknown',
                    data: data.data,
                    clientId: data.clientId ?? null
                });
            }
        }

        // Pipe ( Server side )
        class Pipe extends EventEmitter {
            constructor(pipeName) {
                super();

                if (pipes.has(pipeName)) {
                    throw new Error(`Pipe ${pipeName} already exists`);
                }

                this.pipeName = pipeName;
                this.clients = new Map();

                pipes.set(pipeName, this);
            }

            // ------------ Client Methods ------------ //
            /**
             * Note: Use super._emit inside the Pipe class to prevent data filtering
             * @param {string} evt 
             * @param {PipeData} dt 
             */
            _emit(evt, dt) {
                if (evt === 'data') {
                    if (!dt.clientId || !this.clients.has(dt.clientId)) throw new Error(`Client ${dt.clientId} does not exist.`);
                    super._emit(evt, {
                        type: evt,
                        from: dt.from,
                        data: dt.data,
                        clientId: dt.clientId
                    })
                } else if (evt === 'disconnect') {
                    if (!dt.clientId || !this.clients.has(dt.clientId)) throw new Error(`Client ${dt.clientId} does not exist.`);
                    this.clients.delete(dt.clientId);
                    super._emit(evt, {
                        type: evt,
                        from: dt.from,
                        data: dt.clientId,
                        clientId: dt.clientId
                    })
                } else {
                    super._emit(evt, dt);
                }
            }

            // ------------ Server Methods ------------ //
            /**
             * Send a message to the specified client. If clientId is not specified, the message is broadcast.
             * @param {*} message 
             * @param {string} [targetClientId]
             */
            send(message, targetClientId) {
                if (targetClientId) {
                    const client = this.clients.get(targetClientId);
                    if (!client) throw new Error(`Client ${targetClientId} not found`);

                    client.receive({
                        type: 'data',
                        from: 'server',
                        data: message,
                        clientId: null
                    });
                } else {
                    this.broadcast(message);
                }
            }

            /**
             * Broadcast a message to all connected clients.
             * @param {*} message 
             */
            broadcast(message) {
                this.clients.values().forEach(client => {
                    client.receive({
                        type: 'data',
                        from: 'server',
                        data: message,
                        clientId: null
                    });
                })
            }
            disconnect(clientId) {
                const client = this.clients.get(clientId);
                if (!client) throw new Error(`Client ${clientId} not found`);

                client.close();

                this.clients.delete(clientId);
                super._emit('disconnect', {
                    type: 'disconnect',
                    from: 'server',
                    data: clientId,
                    clientId: null
                })
            }
            close() {
                this.clients.values().forEach((client) => {
                    client.close();
                });
                pipes.delete(this.pipeName);
                super._emit('close', {
                    type: 'close',
                    from: 'server',
                    data: null,
                    clientId: null
                });
            }

            // ------------ IPC ------------ //
            connect(client) {
                const clientId = client.clientId;
                this.clients.set(clientId, client);

                super._emit('connect', {
                    type: 'connect',
                    from: 'server',
                    data: clientId,
                    clientId: null
                })

                return client;
            }
        }

        // IPC API for WRT
        class IPC {
            constructor(runtimeID) {
                if (runtimeIDs.has(runtimeID)) {
                    const err = new Error(`Runtime ${runtimeID} already exists`);
                    logger.error(err);
                    return crashHandler(err);
                }

                this.runtimeID = runtimeID;
                this.servers = [];
                this.clients = [];
                runtimeIDs.set(runtimeID, this);
            }

            // Server side
            listen(pipeName) {
                const pipe = new Pipe(pipeName);

                this.servers.push(pipe);
                pipe.on('close', () => {
                    this.servers = this.servers.filter(p => p !== pipe);
                })

                return pipe;
            }

            // Client side
            connect(pipeName) {
                const server = pipes.get(pipeName);
                if (!server) throw new Error(`Pipe ${pipeName} not found`);

                const client = new PipeClient(server);
                this.clients.push(client);
                client.on('close', () => {
                    this.clients = this.clients.filter(c => c !== client);
                })

                return {
                    on: client.on.bind(client),
                    off: client.off.bind(client),
                    send: client.send.bind(client),
                    disconnect: client.disconnect.bind(client)
                }
            }

            close() {
                this.clients.forEach((client) => {
                    client.close();
                });
                this.servers.forEach((server) => {
                    server.close();
                });
                runtimeIDs.delete(this.runtimeID);
            }
        }

        // IPC Manager
        return class extends EventEmitter {
            constructor() {
                super();
            }

            request(runtimeID) {
                return new IPC(runtimeID)
            }

            pipes() {
                return pipes.keys();
            }

            pipe(pipeName) {
                return pipes.get(pipeName);
            }

            close(runtimeID) {
                runtimeIDs.get(runtimeID)?.close();
            }
        }
    })());
    logger.info("IPC Manager loaded");
    timer.mark('IPC Manager');

    ModuleManager.update('WRT', class extends _WRT {
        constructor(options) {
            super(options);

            this.mountAPI({
                name: 'IPC',
                api: IPCManager.request(this.runtimeID)
            });
            /*
            this.mountAPI({
                name: 'WRT',
                api: _WRT
            });*/

            this.process.on('exit', () => {
                IPCManager.close(this.runtimeID);
            })
        }
    }, 'kernel');

    const WRT = ModuleManager.get('WRT');
    const pseudoProcess = new WRT({
        __filename: "C:/Winbows/System/kernel/kernel.js",
        code: `//! Kernel pseudo-process
IPC.listen("MyPipe", (msg) => {
  if (msg.type === "connect") {
    console.log("%c[Server] %cClient connected!", "color:rgb(255 146 122)", "");
    msg.reply.send("Welcome Client!");
  } else {
    console.log("%c[Server] %cMsg from client:", "color:rgb(255 146 122)", "", msg.data);
    msg.reply.send(\`Server received: $\{msg.data\}\`);
  }
});`,
        options: {
            keepAlive: true
        }
    });
    pseudoProcess.process.title = 'Winbows NT Kernel';
    pseudoProcess.process.on('exit', (code) => {
        crashHandler(new Error(`Kernel process exited with code ${code}`));
    })
    pseudoProcess.main();

    logger.debug("WRT context", pseudoProcess);
    logger.info("Kernel pseudo-process created");
    logger.info("Kernel initialized");
    timer.mark('Kernel process');

    initializeSystem();
}

export default main;