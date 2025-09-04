const SystemInformation = {}

Object.defineProperty(SystemInformation, 'buildId', {
    value: __BUILD_ID__,
    writable: false,
    configurable: false
})
Object.defineProperty(SystemInformation, 'localBuildId', {
    value: localStorage.getItem('WINBOWS_BUILD_ID') || 'UNKNOWN',
    writable: false,
    configurable: false
})
Object.defineProperty(SystemInformation, 'version', {
    value: __VERSION__,
    writable: false,
    configurable: false
})

export default SystemInformation;