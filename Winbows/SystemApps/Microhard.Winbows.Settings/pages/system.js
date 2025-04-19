import { SettingItem } from '../components/setting.item.js';

var settingItems = [
    {
        icon: 'e7f8',
        title: 'Display',
        description: 'Monitor, brightness, night light, display profile',
        href: '/system/display'
    }, {
        icon: 'e995',
        title: 'Sound',
        description: 'Volume levels, output, input, sound devices',
        href: '/system/sound'
    }, {
        icon: 'ea8f',
        title: 'Notifications',
        description: 'Alerts from apps and system, do not disturb',
        href: '/system/notifications'
    } /*, {
        icon: 'ic_fluent_keyboard_20_regular',
        title: 'Keyboard',
        description: 'Keyboard layout, shortcuts, typing settings',
        href: '/system/keyboard'
    }, {
        icon: 'ic_fluent_mouse_20_regular',
        title: 'Mouse',
        description: 'Mouse pointer, touchpad, gestures',
        href: '/system/mouse'
    }, {
        icon: 'ic_fluent_printer_20_regular',
        title: 'Printers & Scanners',
        description: 'Add or remove printers and scanners',
        href: '/system/printers'
    }*/
]

export default function main() {
    var container = document.createElement('div');
    container.className = 'setting-item-group';
    for (let i in settingItems) {
        container.appendChild(SettingItem({
            icon: settingItems[i].icon,
            title: settingItems[i].title,
            description: settingItems[i].description,
            href: settingItems[i].href
        }))
    }
    return container;
}