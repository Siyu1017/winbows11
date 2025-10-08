declare class EventEmitter {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
}