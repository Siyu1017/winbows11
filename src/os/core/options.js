import Logger from "./log.js";
import SystemInformation from "./sysInfo.js";

const logger = new Logger({
    module: 'Options'
})
const _options = {};

function throwErr(msg) {
    logger.warn(msg);
    throw new Error(msg);
}

function enable(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);

    if (!_options[opt].configurable == true) {
        _options[opt].value = true;
    } else {
        logger.warn(`The option '${opt}' cannot be modified.`);
    }
}

function disable(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);

    if (!_options[opt].configurable == true) {
        _options[opt].value = false;
    } else {
        throwErr(`The option '${opt}' cannot be modified.`);
    }
}

function isEnabled(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    return _options[opt].value == true;
}

function isDisabled(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    return _options[opt].value == false;
}

function isConfigurable(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    return _options[opt]?.configurable != false ? true : false;
}

/**
 * @param {string} opt 
 * @param {'boolean' | 'number' | 'string' | 'array'} type 
 * @param {boolean | number | string | array} value 
 * @param {boolean} [configurable]
 */
function create(opt, type, value, configurable = true) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    if (!['boolean', 'number', 'string', 'array'].includes(type))
        throwErr(`The option type must be one of 'boolean', 'number', 'string' or 'array'. Received: ${type}.`);
    if (opt in _options)
        throwErr(`The option name already exists. Received: ${opt}.`);

    if (typeof value !== type)
        throwErr(`The value type does not match the specified type. Expected: ${type}, Received: ${typeof value}.`);

    configurable = configurable != false;

    _options[opt] = {
        type: type,
        value: value,
        configurable
    }
}

function stats(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    return _options[opt] ? _options[opt].value == true ? 'enabled' : 'disabled' : 'unknown';
}

function has(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    return opt in _options;
}

function get(opt) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);
    if (!has(opt))
        throwErr(`Option '${opt}' does not exist.`);

    return _options[opt];
}

function set(opt, value) {
    if (typeof opt !== 'string')
        throwErr(`The option name must be of type string. Received: ${Object.prototype.toString.call(opt)}.`);

    if (_options[opt].configurable === false)
        throwErr(`Option '${opt}' is not configurable.`);
    if (_options[opt].type !== typeof value)
        throwErr(`The value type does not match the specified type. Expected: ${type}, Received: ${typeof value}.`);

    return _options[opt].value = value;
}

const options = {
    enable, disable, isEnabled, isDisabled, isConfigurable, create, stats, has, get, set
}
const IsDevelopment = SystemInformation.mode === 'development';

/**
 * opt: string ( <scope>.<module>.<option|feature> )
 * enabled: boolean ( the default value is false )
 * configurable: boolean ( the default value is true )
 */

//================ Global ================\\
options.create('Global.Options.EmitWarning', 'boolean', IsDevelopment);


//================== OS ==================\\
options.create('OS.ModuleManager.EmitWarning', 'boolean', IsDevelopment);
options.create('OS.Viewport.StretchMode', 'boolean', true, false);

// The devtool will always be enabled once the current environment is in development mode
options.create('OS.Devtool.Enabled', 'boolean', IsDevelopment, false);
options.create('OS.Network.Enable', 'boolean', true);
options.create('OS.Network.UseCache', 'boolean', navigator.onLine != true || window.needsUpdate == false && window.modes.dev == false);


//============= File System ==============\\
options.create('FS.Jornaling.Enabled', 'boolean', false, true);


//================ System ================\\
// If enabled, a warning will be triggered whenever a deprecated API is used
options.create('System.AppRegistry.EmitWarning', 'boolean', IsDevelopment);


//=============== Explorer ===============\\
options.create('Explorer.CommandExecutor.ExtractFromURL', 'boolean', true);
options.create('Exploere.CommandExecutor.SafeMode', 'boolean', false);
options.create('Explorer.CommandExecutor.SkipWarning', 'boolean', false);
options.create('Explorer.Copilot.Enabled', 'boolean', false, false);

// TODO: 

export { options as SystemOption };
export default options;