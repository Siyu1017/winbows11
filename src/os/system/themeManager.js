// Theme 
let theme = localStorage.getItem('WINBOWS_THEME') || 'light';

const listeners = [];
const ThemeManager = {
    set: (value) => {
        theme = value != 'dark' ? 'light' : 'dark';
        localStorage.setItem('WINBOWS_THEME', theme);
        if (theme == 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
        listeners.forEach(fn => fn(theme));
    },
    get: () => {
        return theme;
    },
    onChange: (listener) => {
        listeners.push(listener);
    }
}

if (theme == 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}

export default ThemeManager;