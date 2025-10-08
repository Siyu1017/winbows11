/// <reference path="../../internal/pipeServer.d.ts" />
/// <reference path="../../internal/pipeClient.d.ts" />

declare namespace IPC {
    const runtimeID: string;
    function listen(pipeName: string): PipeServer;
    function connect(pipeName: string): PipeClient;
    function close(): void;
}