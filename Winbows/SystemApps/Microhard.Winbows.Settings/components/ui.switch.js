export function Switch(config = {}, handler = function () { }) {
    const switchElement = document.createElement('label');
    const switchCheckbox = document.createElement('input');
    const switchLabel = document.createElement('span');
    const switchSlider = document.createElement('span');
    switchElement.className = 'setting-switch';
    switchCheckbox.className = 'setting-switch-input';
    switchLabel.className = 'setting-switch-label';
    switchSlider.className = 'setting-switch-slider round';
    switchCheckbox.type = 'checkbox';
    if (config.disabled == true) {
        switchCheckbox.disabled = true;
        switchElement.classList.add('disabled');
    }
    if (config.checked == true) {
        switchLabel.innerHTML = 'On';
        switchCheckbox.checked = true;
    } else {
        switchLabel.innerHTML = 'Off';
    }
    switchCheckbox.addEventListener('change', () => {
        switchLabel.innerHTML = switchCheckbox.checked ? 'On' : 'Off';
        handler({
            target: switchCheckbox,
            value: switchCheckbox.checked,
            restore: () => {
                switchCheckbox.checked = !switchCheckbox.checked;
                return switchCheckbox.checked;
            }
        });
    })
    switchElement.toggle = function () {
        if (switchCheckbox.disabled == false) {
            switchCheckbox.checked = !switchCheckbox.checked;
            handler({
                target: switchCheckbox,
                value: switchCheckbox.checked,
                restore: () => {
                    switchCheckbox.checked = !switchCheckbox.checked;
                    return switchCheckbox.checked;
                }
            });
        }
    }
    switchElement.set = (name, value) => {
        if (name == 'checked') {
            switchCheckbox.checked = value == true;
            handler({
                target: switchCheckbox,
                value: value,
                restore: () => {
                    switchCheckbox.checked = !switchCheckbox.checked;
                    return switchCheckbox.checked;
                }
            });
        } else if (name == 'disabled') {
            if (value == true) {
                switchElement.classList.add('disabled');
            } else {
                switchElement.classList.remove('disabled');
            }
            switchCheckbox.disabled = value == true;
        }
    }
    switchElement.appendChild(switchCheckbox);
    switchElement.appendChild(switchLabel);
    switchElement.appendChild(switchSlider);
    return switchElement;
}