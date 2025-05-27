import { SettingItem } from '../components/setting.item.js';

var settingItems = [
    {
        icon: 'e91b',
        title: 'Background',
        description: 'Background image, color, slideshow',
        href: '/personalization/background'
    }, {
        icon: 'e75b',
        title: 'Taskbar',
        description: 'Taskbar behaviors, system pins',
        href: '/personalization/taskbar'
    }
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