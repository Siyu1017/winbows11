import { EventEmitter } from "../shared/utils.ts";
import Logger from "./core/log.js";

const modules = new Map();
const logger = new Logger({
    module: 'ModuleManager'
})
const eventEmitter = new EventEmitter();

// For OS level modules
const ModuleManager = {
    /**
     * @param {string} name 
     * @param {*} module 
     * @param {string} tag
     */
    register(name, module, tag) {
        if (!name) {
            const error = new Error(`Failed to register module '${name}': Module name is required`);
            logger.fatal(error);
            throw error;
        }
        if (modules.has(name)) {
            const error = new Error(`Failed to register module '${name}': Module already exists`);
            logger.fatal(error);
            throw error;
        }
        if (!tag || typeof tag != 'string') {
            logger.warn(`Invalid tag '${tag}' provided for module '${name}', using default tag 'original'`);
            tag = 'original';
        }
        modules.set(name, {
            tags: new Map([[tag, module]]),
            order: new Set([tag])
        });
        eventEmitter._emit('register', { name, module, tag });
    },
    /**
     * @param {string} name 
     * @param {string} [tag] 
     */
    deregister(name, tag) {
        const mod = modules.get(name);
        if (!mod) {
            throw new Error(`Module ${name} not found`);
        }

        if (tag) {
            mod.tags.delete(tag);
            mod.order.delete(tag);

            if (mod.size === 0) {
                modules.delete(name);
            }
        } else {
            tag = mod.tags.list();
            modules.delete(name);
        }
        eventEmitter._emit('deregister', { name, tag });
    },
    /**
     * @param {string} name 
     * @param {*} module 
     * @param {string} tag 
     */
    update(name, module, tag) {
        const mod = modules.get(name);
        if (!mod) {
            const error = new Error(`Failed to update module '${name}': Module not found`)
            logger.fatal(error);
            throw error;
        }

        if (mod.tags.has(tag)) {
            const error = new Error(`Failed to update module '${name}': Module tag '${tag}' already exists`);
            logger.fatal(error);
            throw error;
        } else {
            mod.tags.set(tag, module);
            mod.order.add(tag);
        }
        eventEmitter._emit('update', { name, module, tag });
    },
    list() {
        return modules.keys();
    },
    /**
     * @param {string} name 
     * @param {string} [tag]
     * @returns 
     */
    get(name, tag) {
        const mod = modules.get(name);
        if (!mod) {
            logger.warn(`Module ${name} not found`);
            return null;
        }

        if (!tag) {
            const order = [...mod.order.values()];
            return mod.tags.get(order[order.length - 1]);
        } else {
            return mod.tags.get(tag);
        }
    },
    on(evt, cb) {
        eventEmitter.on(evt, cb);
    },
    off(evt, cb) {
        eventEmitter.off(evt, cb);
    }
}

ModuleManager.on('register', (e) => {
    logger.info(`Module '${e.name}' (Tag: ${e.tag}) registered`);
})
ModuleManager.on('deregister', (e) => {
    logger.info(`Module '${e.name}' (Tag: ${e.tag}) deregistered`);
})
ModuleManager.on('update', (e) => {
    logger.info(`Module '${e.name}' (Tag: ${e.tag}) updated`);
})

export default ModuleManager;