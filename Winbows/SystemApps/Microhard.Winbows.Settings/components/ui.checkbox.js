function Checkbox(config = {}, handler = function () { }) {
    const checkboxElement = document.createElement('label');
    const checkboxInput = document.createElement('input');
    const checkboxMark = document.createElement('span');

    checkboxInput.type = 'checkbox';
    checkboxElement.className = 'setting-checkbox';
    checkboxInput.className = 'setting-checkbox-input';
    checkboxMark.className = 'setting-checkbox-mark';
    checkboxMark.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="setting-checkbox-mark-svg"><path d="M20 6 9 17l-5-5"/></svg>`

    checkboxElement.appendChild(checkboxInput);
    checkboxElement.appendChild(checkboxMark);

    const path = checkboxMark.querySelector('path');
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = -length;

    if (config.disabled == true) {
        checkboxInput.disabled = true;
        checkboxElement.classList.add('disabled');
    }
    if (config.checked == true) {
        checkboxInput.checked = true;
    }
    checkboxInput.addEventListener('change', () => {
        handler({
            target: checkboxInput,
            value: checkboxInput.checked,
            restore: () => {
                checkboxInput.checked = !checkboxInput.checked;
                return checkboxInput.checked;
            }
        });
    })
    checkboxElement.toggle = function () {
        if (checkboxInput.disabled == false) {
            checkboxInput.checked = !checkboxInput.checked;
            handler({
                target: checkboxInput,
                value: checkboxInput.checked,
                restore: () => {
                    checkboxInput.checked = !checkboxInput.checked;
                    return checkboxInput.checked;
                }
            });
        }
    }
    checkboxElement.set = (name, value) => {
        if (name == 'checked') {
            checkboxInput.checked = value == true;
            handler({
                target: checkboxInput,
                value: value,
                restore: () => {
                    checkboxInput.checked = !checkboxInput.checked;
                    return checkboxInput.checked;
                }
            });
        } else if (name == 'disabled') {
            if (value == true) {
                checkboxElement.classList.add('disabled');
            } else {
                checkboxElement.classList.remove('disabled');
            }
            checkboxInput.disabled = value == true;
        }
    }

    return checkboxElement;
}

module.exports = { Checkbox }