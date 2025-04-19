export default function main() {
    var container = document.createElement('div');
    var taskbarAlignment = document.createElement('div');
    var taskbarAlignmentTitle = document.createElement('div');
    var taskbarAlignmentSelect = document.createElement('div');

    var taskbarStyling = document.createElement('div');
    var taskbarStylingTitle = document.createElement('div');
    var taskbarStylingSelect = document.createElement('div');

    container.style = 'display:flex;flex-direction:column;gap:.5rem;'

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    taskbarAlignment.style = 'display: flex;justify-content: space-between;align-items: center;background: rgb(255 255 255 / 60%);padding: .5rem 1rem;border-radius: .5rem;box-shadow: rgba(0, 0, 0, .5) 0px 0px 1px 0px;';
    taskbarAlignmentSelect.style = `
    background: rgba(255,255,255,.6);
    padding: .25rem 1rem;
    border-radius: .375rem;
    box-shadow: rgba(0,0,0,.5) 0px 0px 1px 0px;
;`
    taskbarAlignmentTitle.innerHTML = 'Taskbar alignment';
    taskbarAlignmentSelect.innerHTML = document.body.getAttribute('data-taskbar-align') ? capitalizeFirstLetter(document.body.getAttribute('data-taskbar-align')) : 'Center';
    taskbarAlignmentSelect.addEventListener('click', () => {
        const menu = WinUI.contextMenu([
            {
                text: 'Left',
                action: async () => {
                    document.body.setAttribute('data-taskbar-align', 'left');
                    taskbarAlignmentSelect.innerHTML = 'Left';
                }
            }, {
                text: 'Center',
                action: async () => {
                    document.body.setAttribute('data-taskbar-align', 'center');
                    taskbarAlignmentSelect.innerHTML = 'Center';
                }
            }
        ], {
            showIcon: false
        })
        const position = utils.getPosition(taskbarAlignmentSelect);
        menu.open(position.x, position.y, 'left-top');
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                menu.close();
            })
        })
    })

    var stylings = {
        'floating': 'Floating',
        'joined': 'Joined'
    }

    taskbarStyling.style = 'display: flex;justify-content: space-between;align-items: center;background: rgb(255 255 255 / 60%);padding: .5rem 1rem;border-radius: .5rem;box-shadow: rgba(0, 0, 0, .5) 0px 0px 1px 0px;';
    taskbarStylingSelect.style = `
    background: rgba(255,255,255,.6);
    padding: .25rem 1rem;
    border-radius: .375rem;
    box-shadow: rgba(0,0,0,.5) 0px 0px 1px 0px;
;`
    taskbarStylingTitle.innerHTML = 'Taskbar styling ( beta )';
    taskbarStylingSelect.innerHTML = document.body.getAttribute('data-taskbar-style') ? stylings[document.body.getAttribute('data-taskbar-style')] : 'Default';
    taskbarStylingSelect.addEventListener('click', () => {
        const menu = WinUI.contextMenu([
            {
                text: 'Default',
                action: async () => {
                    document.body.removeAttribute('data-taskbar-style');
                    taskbarStylingSelect.innerHTML = 'Default';
                }
            }, {
                text: 'Floating',
                action: async () => {
                    document.body.setAttribute('data-taskbar-style', 'floating');
                    taskbarStylingSelect.innerHTML = 'Floating';
                }
            }/*, {
                text: 'Joined',
                action: async () => {
                    document.body.setAttribute('data-taskbar-style', 'joined');
                    taskbarStylingSelect.innerHTML = 'Joined';
                }
            }*/
        ], {
            showIcon: false
        })
        const position = utils.getPosition(taskbarStylingSelect);
        menu.open(position.x, position.y, 'left-top');
        new Array("mousedown", "touchstart", "pointerdown").forEach(event => {
            window.addEventListener(event, (e) => {
                if (menu.container.contains(e.target)) return;
                menu.close();
            })
        })
    })


    container.appendChild(taskbarAlignment);
    taskbarAlignment.appendChild(taskbarAlignmentTitle);
    taskbarAlignment.appendChild(taskbarAlignmentSelect);
    container.appendChild(taskbarStyling);
    taskbarStyling.appendChild(taskbarStylingTitle);
    taskbarStyling.appendChild(taskbarStylingSelect);

    return container
}