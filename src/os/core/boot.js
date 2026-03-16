import timer from "./timer.js";
import { loading } from "./viewport.js";
import { IDBFS } from "../../shared/fs.js";
import main from "../kernel/kernel.js";
import Logger from "./log.js";
import { codes } from "../../shared/events.js";
import "./stat.js";

timer.mark('IDB file system');

const fs = IDBFS("~BOOT");
const logger = new Logger({
    module: 'Boot'
})

logger.info('Starting Winbows11...');

try {
    const requires = ['C:/Winbows/System/styles/app.css'];

    for (const r of requires) {
        if (!fs.exists(r)) throw new Error(`File ${r} not found`);
    }
} catch (e) {
    // Remove installation information
    localStorage.removeItem("WINBOWS_BUILD_ID");

    let evts = JSON.parse(localStorage.getItem("WINBOWS_EVENTS") || '[]') || [];
    if (typeof evts !== 'array') {
        localStorage.removeItem("WINBOWS_EVENTS");
        evts = [];
    }

    evts.push({
        evt: 'CRASH',
        code: codes['CORRUPTED_INSTALLATION'],
        msg: 'A corrupted Windows installation has been detected',
        ts: Date.now()
    })
    localStorage.setItem("WINBOWS_EVENTS", JSON.stringify(evts));
}

try {
    fs.getFileURL('C:/Winbows/icons/applications/tools/start.ico').then(url => {
        loading.image.style.backgroundImage = `url(${url})`;
    })
} catch (e) {
    console.error(e);
}

try {
    await fs.mkdir('C:/');
} catch (e) { }

// Start Winbows kernel
main();