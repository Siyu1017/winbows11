interface appData {
    basePath: string;
    entryScript: string;
    icon: string;
}

declare namespace appRegistry {
    function install(): void;
    function uninstall(): void;
    function update(): void;

    function getIcon(path: string): string;
    function getApp(path: string): {
        basePath: string;
        entryScript: string;
        icon: string;
        name: string;
    } | {};
    function exists(name: string): boolean;
    function getInfoByName(name: string): appData | {};
    function getInfoByPath(path: string): appData | {};
    function getInfoByAppId(appId: string): appData | {};
}