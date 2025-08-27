import { taskbar } from "./taskbar.js";
import startMenuContainer from "./startMenu.js";
import { iconManager } from "./iconManager.js";

export default {
    container: taskbar,
    ...iconManager
};