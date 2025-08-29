import { EventEmitter } from "./WRT/utils/eventEmitter.js";

const WindowManager = {};
const eventEmitter = new EventEmitter();

WindowManager.on = eventEmitter.on.bind(eventEmitter);
WindowManager.emit = eventEmitter._emit.bind(eventEmitter);

export default WindowManager;