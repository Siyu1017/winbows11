import { IDBFS } from "../../shared/fs.js";
import { EventEmitter } from "../../shared/utils.js";

const fs = new IDBFS();
const cache = {};
const texts = [];
const availableLangs = ['en-US', 'zh-TW'];
const defaultLang = 'en-US';

function convertToAvailableLang(lang) {
    if (availableLangs.includes(lang)) return lang;
    let p = lang;
    if (lang.includes('-')) {
        p = lang.split('-')[0];
    }
    const l = availableLangs.find(l => l.startsWith(p));
    if (l) return l;
    return defaultLang;
}

class I18n extends EventEmitter {
    constructor(defaultLang) {
        super();

        this.currentLang = defaultLang;
        this.on('change', () => {
            texts.forEach(text => {
                text.el.textContent = this.t(text.key, text.params);
            })
        })
    }

    async init() {
        await this.lang(this.currentLang);
    }

    async lang(lang) {
        await this.load(convertToAvailableLang(lang));
    }

    async load(lang = "en-US") {
        if (!availableLangs.includes(lang)) return;
        if (cache[lang]) return (this.lang = lang);
        const res = await fs.readFileAsText(`C:/Winbows/System/Locales/${lang}.json`);
        cache[lang] = JSON.parse(res);
        this.currentLang = lang;
        this._emit('change', lang);
    }

    t(key, params = {}) {
        const str = cache[this.currentLang]?.[key] || key;
        return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
    }

    translate = this.t;

    autoTranslateText(key, params = {}) {
        const textEl = document.createTextNode();
        textEl.textContent = this.t(key, params);
        texts.push({
            el: textEl,
            key, params
        });
        return textEl;
    }
}

const locale = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage;
const i18n = new I18n(locale);
await i18n.init();

export { i18n };
export default i18n;