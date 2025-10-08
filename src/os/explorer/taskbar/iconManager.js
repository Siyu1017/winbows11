import { IDBFS } from "../../../shared/fs.js";
import { fallbackImage } from "../../core/fallback.js";
import Logger from "../../core/log.js";
import timer from "../../core/timer.js";

const systemItemOptions = {
    start: {
        display: true,
        icon: {
            light: 'C:/Winbows/icons/applications/tools/start.ico',
            dark: 'C:/Winbows/icons/applications/tools/start2.ico'
        },
        // handler: startMenuHandler
    },
    search: {
        display: true,
        icon: {
            light: 'C:/Winbows/icons/applications/tools/search.ico',
            dark: 'C:/Winbows/icons/applications/tools/search2.ico'
        }
    },
    taskview: {
        display: true,
        icon: {
            light: 'C:/Winbows/icons/applications/tools/taskview.ico',
            dark: 'C:/Winbows/icons/applications/tools/taskview2.ico'
        }
    },
    widgets: {
        display: false,
        icon: 'C:/Winbows/icons/applications/tools/widgets.ico'
    }
}

export default async function IconManager() {
    const fs = IDBFS('~EXPLORER');
    timer.group('IconManager');

    for (const key of Object.keys(systemItemOptions)) {
        try {
            const icon = systemItemOptions[key].icon;
            if (typeof icon === 'string') {
                systemItemOptions[key].icon = await fs.getFileURL(icon);
            } else {
                for (const theme of Object.keys(icon)) {
                    systemItemOptions[key].icon[theme] = await fs.getFileURL(icon[theme]);
                }
            }
        } catch (e) {
            systemItemOptions[key].icon = fallbackImage;
        }
    }

    timer.groupEnd();
}