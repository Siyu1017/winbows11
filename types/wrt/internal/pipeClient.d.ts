declare class PipeClient {
    on(event: 'data' | 'connect' | 'disconnect' | 'error' | 'close', handler: Function): void;
    send(data: any): void;
    disconnect(): void;
}
