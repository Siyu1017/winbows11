/// <reference path="./ShellInstance.d.ts" />

interface CommandConfig {
    description: string;
    usage: string;
    options: { [key: string]: string };
    category: string;
    handler: (
        param0: {
            args: string[],
            flags: { [key: string]: string | number | boolean }
        },
        shell: ShellInstance
    ) => void;
}

declare namespace System {
    namespace commandRegistry {
        function register(commandName: string, config: CommandConfig): void;
        function deregister(commandName: string): void;
        function addCategory(categoryName: string, config: {
            title: string
        }): void;
        function list(): string[];
        function get(commandName: string): CommandConfig | null;
        function has(commandName: string): boolean;
    }

    namespace fileIcons {
        function getIcon(extension: string): string;
        function register(extension: string, iconPath: string): void;
    }

    namespace fileViewers {
        function isRegistered(viewerName: string): boolean;
        function updateViewer(viewerName: string, prop: string, value: any): void;
        function registerViewer(viewerName: string, title: string, viewerScriptPath: string, supportedExtensions: string[]): void;
        function deregisterViewer(viewerName: string): void;
        function setDefaultViewer(extension: string, viewerName: string): void;
        function unsetDefaultViewer(extension: string, viewerName: string): void;
        function getDefaultViewer(extension: string): string | null;
        function getViewers(extension: string): string[];
    }

    namespace information {
        const buildId: string;
        const localBuildId: string;
        const version: string;
        const mode: 'development' | 'production';
    }

    namespace rom {
        function list(): string[];
        function exists(fileName: string): boolean;
        function write(fileName: string, data: string): void;
        function read(fileName: string): string;
        function rm(fileName: string): void;
    }

    const shell: ShellInstance;

    namespace theme {
        function set(themeName: string): void;
        function get(): string;
        function onChange(listener: (newTheme: string) => void): void;
    }
}

// System APIs, but global APIs: appRegistry, ShellInstance, WinUI, tasklist, WApplication
// System: commandRegistry, fileIcons, fileViewers, information, rom, shell, theme