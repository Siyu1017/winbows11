declare class PipeServer {
    readonly clients: string[];
    send(data: any, clientId: string): void;
    broadcast(data: any): void;
    disconnect(clientId: string): void;
    close(): void;
}