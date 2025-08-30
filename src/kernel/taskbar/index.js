import { taskbar } from "./taskbar.js";
import startMenuContainer from "./startMenu.js";
import { iconManager } from "./iconManager.js";
import "./controlPanel.js";

export default {
    container: taskbar,
    ...iconManager
};