declare interface BrowserWindowConfig {
    resizable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
    snappable?: boolean;
    fullscreenable?: boolean;
    mica?: boolean;
    showOnTop?: boolean;
    theme?: 'light' | 'dark' | 'system';
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    x?: number | 'center';
    y?: number | 'center';
    icon?: string;
    title?: string;
}

declare namespace TabviewObject {
    function on(event: string, handler: Function): void;
    class Tab {
        constructor(config: {
            active: boolean,
            icon?: string,
            tabAnimation?: boolean
        });

        // Elements
        tab: HTMLDivElement;
        tabInfo: HTMLDivElement;
        tabIcon: HTMLDivElement;
        tabHeader: HTMLDivElement;
        tabClose: HTMLDivElement;
        tabviewItem: HTMLDivElement;
        id: string;

        // Methods
        getContainer(): HTMLDivElement;
        focus: () => void;
        blur: () => void;
        close: () => void;
        changeTitle(header: string): void;
        changeIcon(icon: string): void;
    }
}

declare class InternalBrowserWindow {
    constructor(config: BrowserWindowConfig);

    // Elements
    shadowRoot: ShadowRoot;
    container: HTMLDivElement;
    window: HTMLDivElement;
    toolbar: HTMLDivElement;
    content: HTMLDivElement;

    // Window operations
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    close(): void;

    // Events
    on(event: string, handler: Function): void;
    // Alias for on
    addEventListener(event: string, handler: Function): void;

    // Theme management
    setTheme(theme: 'light' | 'dark' | 'system'): void;
    getTheme(): 'light' | 'dark' | 'system';

    // Movable / Immovable
    setMovable(element: Element): void;
    unsetMovable(element: Element): void;
    setImmovable(element: Element): void;
    unsetImmovable(element: Element): void;

    // Configurations
    changeTitle(title: string): void;
    changeIcon(icon: string): void;
    setSnappable(snappable: boolean): void;

    useTabview(config: {
        icon: boolean;
    }): typeof TabviewObject;
}