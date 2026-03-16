const { Select } = await requireAsync("../../components/ui.select.js");
const { SettingItemCollapsible } = await requireAsync("../../components/setting.item.collapsible.js");

module.exports = function main() {
    var container = document.createElement('div');
    var taskbarAlignment = document.createElement('div');
    var taskbarStyle = document.createElement('div');

    container.className = 'setting-item-group';
    taskbarAlignment.innerHTML = 'Taskbar alignment';
    taskbarStyle.innerHTML = 'Taskbar style<span class="beta"></span>';

    var taskbarBehaviors = SettingItemCollapsible({
        title: 'Taskbar behaviors',
        description: 'Taskbar alignment and style'
    }, [
        [taskbarAlignment, '', Select([
            {
                text: 'Left',
                value: 'left',
                selected: window.document.body.getAttribute('data-taskbar-align') === 'left'
            }, {
                text: 'Center',
                value: 'center',
                selected: window.document.body.getAttribute('data-taskbar-align') !== 'left'
            }
        ], function (e) {
            window.document.body.setAttribute('data-taskbar-align', ['center', 'left'].includes(e.value) ? e.value : 'center');
        })],
        [taskbarStyle, '', Select([
            {
                text: 'Default',
                value: 'default',
                selected: window.document.body.getAttribute('data-taskbar-style') !== 'floating'
            }, {
                text: 'Floating',
                value: 'floating',
                selected: window.document.body.getAttribute('data-taskbar-style') === 'floating'
            }
        ], function (e) {
            window.document.body.setAttribute('data-taskbar-style', ['default', 'floating'].includes(e.value) ? e.value : 'default');
        })]
    ]);

    container.appendChild(taskbarBehaviors);

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    /*
        container.appendChild(Switch({ checked: false }));
        container.appendChild(Checkbox({ checked: true }));
        container.appendChild(Select(
            [
                {
                    text: 'Option 1'
                }, {
                    text: 'Option 2'
                }, {
                    text: 'Option 3'
                }
            ]
        ));
    */
    return container
}