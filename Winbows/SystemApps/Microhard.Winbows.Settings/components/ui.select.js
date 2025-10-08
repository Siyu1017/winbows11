function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

function Select(options = [], handler = function () { }) {
    const selectElement = document.createElement('div');
    const selectText = document.createElement('div');
    const selectExpand = document.createElement('div');

    selectElement.className = 'setting-select';
    selectText.className = 'setting-select-text';
    selectExpand.className = 'setting-select-expand';

    selectElement.appendChild(selectText);
    selectElement.appendChild(selectExpand);

    var selected = {};
    var selectedIndex = -1;

    options.forEach((option, i) => {
        if (option.selected) {
            selected = option;
            selectedIndex = i;
        }
        option.action = function () {
            options.forEach((option) => {
                option.selected = false;
            })
            option.selected = true;
            handler(option);
            selected = option;
            selectedIndex = i;
            selectText.innerText = selected.text || 'Please select...';
        }
    })

    selectText.innerText = selected.text || 'Please select...';

    selectElement.addEventListener('click', (e) => {
        const position = getPosition(selectElement);
        const menu = WinUI.contextMenu(options, {
            showIcon: false
        })
        if (e.type.startsWith('touch')) {
            var touch = e.touches[0] || e.changedTouches[0];
            e.pageX = touch.pageX;
            e.pageY = touch.pageY;
        }
        menu.container.style.setProperty('--contextmenu-bg', 'var(--winbows-taskbar-bg)');
        menu.container.style.setProperty('--contextmenu-backdrop-filter', 'saturate(3) blur(20px)');
        menu.container.style.setProperty('--contextmenu-text-size', '.935rem');
        menu.container.style.setProperty('--contextmenu-item-padding', '.25rem .5rem');
        menu.container.style.setProperty('--contextmenu-maxheight', 'unset');
        menu.container.style.minWidth = selectElement.offsetWidth + 'px';
        menu.container.style.minHeight = selectElement.offsetHeight + 'px';
        menu.open(position.x, position.y, 'left-top');
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                menu.close();
            })
        })
    })

    return selectElement;
}

module.exports = { Select }