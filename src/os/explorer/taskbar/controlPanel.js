import timer from "../../core/timer.js";
import { viewport } from "../../core/viewport.js";
import ModuleManager from "../../moduleManager.js";

export function ControlPanel(taskbarControls) {
    const System = ModuleManager.get('System');
    const downEvts = ["mousedown", "touchstart", "pointerdown"];

    const controlPanelContainer = document.createElement('div');
    const controlSidebarContainer = document.createElement('div');
    const controlPanel = document.createElement('div');
    const controlSidebar = document.createElement('div');
    const controlPanelSummary = document.createElement('div');
    const controlSidebarSummary = document.createElement('div');
    const controlToggleDesktop = document.createElement('div');

    controlPanelContainer.className = 'control-panel-container';
    controlSidebarContainer.className = 'control-sidebar-container';
    controlPanel.className = 'control-panel';
    controlSidebar.className = 'control-sidebar';
    controlPanelSummary.className = 'control-panel-summary';
    controlSidebarSummary.className = 'control-sidebar-summary';
    controlToggleDesktop.className = 'control-toggle-desktop';

    taskbarControls.appendChild(controlPanelSummary);
    taskbarControls.appendChild(controlSidebarSummary);
    taskbarControls.appendChild(controlToggleDesktop);
    viewport.screenElement.appendChild(controlPanelContainer);
    viewport.screenElement.appendChild(controlSidebarContainer);
    controlPanelContainer.appendChild(controlPanel);
    controlSidebarContainer.appendChild(controlSidebar);

    // Overlays 
    const brightnessOverlay = document.createElement('div');
    const nightLightOverlay = document.createElement('div');
    brightnessOverlay.className = 'overlay brightness';
    nightLightOverlay.className = 'overlay nightlight';
    document.body.appendChild(nightLightOverlay);
    document.body.appendChild(brightnessOverlay);

    // Controls - Panel Summary
    const controlPanelSummaryWifi = document.createElement('div');
    const controlPanelSummaryVolume = document.createElement('div');
    const controlPanelSummaryBattery = document.createElement('div');

    controlPanelSummaryWifi.className = 'control-panel-summary-item wifi';
    controlPanelSummaryVolume.className = 'control-panel-summary-item volume';
    controlPanelSummaryBattery.className = 'control-panel-summary-item battery';

    controlPanelSummary.appendChild(controlPanelSummaryWifi);
    controlPanelSummary.appendChild(controlPanelSummaryVolume);
    controlPanelSummary.appendChild(controlPanelSummaryBattery);

    // Controls - Sidebar Summary
    const controlSidebarSummaryMain = document.createElement('div');
    const controlSidebarSummaryTime = document.createElement('div');
    const controlSidebarSummaryDate = document.createElement('div');
    const controlSidebarSummaryNotify = document.createElement('div');

    controlSidebarSummaryMain.className = 'control-sidebar-summary-main';
    controlSidebarSummaryTime.className = 'control-sidebar-summary-time';
    controlSidebarSummaryDate.className = 'control-sidebar-summary-date';
    controlSidebarSummaryNotify.className = 'control-sidebar-summary-notify';

    controlSidebarSummary.appendChild(controlSidebarSummaryMain);
    controlSidebarSummaryMain.appendChild(controlSidebarSummaryTime);
    controlSidebarSummaryMain.appendChild(controlSidebarSummaryDate);
    controlSidebarSummary.appendChild(controlSidebarSummaryNotify);

    // Controls - Panel
    const quickSettingGroup = document.createElement('div');
    const quickSettingContent = document.createElement('div');
    const quickSettingBlocks = document.createElement('div');
    const quickSettingSliders = document.createElement('div');
    const quickSettingFooter = document.createElement('div');
    quickSettingGroup.className = 'control-panel-group';
    quickSettingContent.className = 'control-panel-content';
    quickSettingBlocks.className = 'control-panel-blocks';
    quickSettingSliders.className = 'control-panel-sliders';
    quickSettingFooter.className = 'control-panel-footer';
    controlPanel.appendChild(quickSettingGroup);
    quickSettingGroup.appendChild(quickSettingContent);
    quickSettingContent.appendChild(quickSettingBlocks);
    quickSettingContent.appendChild(quickSettingSliders);
    quickSettingGroup.appendChild(quickSettingFooter);

    let quickSettingItems = [{
        label: 'WiFi',
        status: 'enabled',
        name: 'wifi',
        change: (status) => {
            if (status == 'enabled') {
                window.HMGR.enable('NIC');
            } else {
                window.HMGR.disable('NIC');
            }
        }
    }, {
        label: 'Bluetooth',
        status: 'disabled',
        name: 'bluetooth',
        change: () => {

        }
    }, {
        label: 'Flight Mode',
        status: 'disabled',
        name: 'flight-mode',
        change: () => {

        }
    }, {
        label: 'Dark Theme',
        status: System.theme.get() != 'light' ? 'enabled' : 'disabled',
        name: 'dark-theme',
        change: (status) => {
            if (status == 'enabled') {
                System.theme.set('dark');
            } else {
                System.theme.set('light');
            }
        }
    }, {
        label: 'Night Light',
        status: 'disabled',
        name: 'night-light',
        change: (status) => {
            if (status == 'enabled') {
                nightLightOverlay.style.opacity = '.8';
            } else {
                nightLightOverlay.style.opacity = '0';
            }
        }
    }, {
        label: 'Battery Saver',
        status: 'disabled',
        name: 'battery-saver',
        change: () => {

        }
    }];

    let quickSettingSliderBars = [{
        name: 'brightness',
        value: 100,
        disabled: false,
        change: (e) => {
            var value = e.value;
            brightnessOverlay.style.opacity = 0.9 * (100 - value) / 100;
        }
    }, {
        name: 'volume',
        value: 0,
        disabled: false,
        change: (e) => {
            var value = e.value;
            var classes = ['mute', 'volume0', 'volume1', 'volume2', 'volume3'];
            classes.forEach(className => {
                e.icon.classList.remove(className);
                controlPanelSummaryVolume.classList.remove(className);
            })
            if (value == 0) {
                e.icon.classList.add('mute');
                controlPanelSummaryVolume.classList.add('mute');
                return;
            } else if (value > 0 && value <= 10) {
                e.icon.classList.add('volume0');
                controlPanelSummaryVolume.classList.add('volume0');
                return;
            } else if (value > 10 && value <= 30) {
                e.icon.classList.add('volume1');
                controlPanelSummaryVolume.classList.add('volume1');
                return;
            } else if (value > 30 && value <= 60) {
                e.icon.classList.add('volume2');
                controlPanelSummaryVolume.classList.add('volume2');
                return;
            } else {
                e.icon.classList.add('volume3');
                controlPanelSummaryVolume.classList.add('volume3');
                return;
            }
        }
    }];

    quickSettingItems.forEach((item, i) => {
        const quickSettingBlock = document.createElement('div');
        const quickSettingButton = document.createElement('div');
        const quickSettingIcon = document.createElement('div');
        const quickSettingLabel = document.createElement('div');
        let status = item.status == 'enabled' ? 'enabled' : 'disabled';
        quickSettingBlock.className = 'control-panel-block';
        quickSettingButton.className = 'control-panel-block-button';
        quickSettingIcon.className = 'control-panel-block-icon';
        quickSettingLabel.className = 'control-panel-block-label';
        quickSettingIcon.classList.add(item.name);
        quickSettingLabel.innerHTML = item.label;
        if (item.status == 'disabled') {
            quickSettingBlock.disabled = true;
        } else {
            quickSettingButton.classList.add('active');
        }
        quickSettingButton.addEventListener('click', () => {
            if (status == 'enabled') {
                quickSettingButton.classList.remove('active');
            } else {
                quickSettingButton.classList.add('active');
            }
            status = status == 'enabled' ? 'disabled' : 'enabled';
            item.change(status);
        })
        quickSettingBlocks.appendChild(quickSettingBlock);
        quickSettingBlock.appendChild(quickSettingButton);
        quickSettingButton.appendChild(quickSettingIcon);
        quickSettingBlock.appendChild(quickSettingLabel);
        quickSettingItems[i].setStatus = function (value) {
            status = value == 'disabled' ? 'disabled' : 'enabled';
            if (status == 'enabled') {
                quickSettingButton.classList.add('active');
            } else {
                quickSettingButton.classList.remove('active');
            }
        }
    })
    System.theme.onChange(theme => {
        quickSettingItems.filter(item => item.name == 'dark-theme')[0].setStatus(theme == 'dark' ? 'enabled' : 'disabled')
    })
    quickSettingSliderBars.forEach(item => {
        const box = document.createElement('div');
        const icon = document.createElement('div');
        const slider = document.createElement('input');
        let disabled = item.disabled == true;
        let value = item.value;
        box.className = 'control-panel-slider';
        icon.className = 'control-panel-slider-icon';
        icon.classList.add(item.name);
        slider.className = 'control-panel-slider-bar';
        if (disabled == true) {
            box.classList.add('disabled');
            slider.disabled = disabled;
        }

        // Initialize
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = item.value;
        slider.style.setProperty('--track-color', `linear-gradient(90deg, var(--winbows-primary-color) ${slider.value}%, #888888 ${slider.value}%)`);
        item.change({ slider, box, icon, value });

        // Input listener
        slider.addEventListener('input', (e) => {
            if (disabled == true) {
                if (slider.value != value) {
                    slider.value = value;
                }
                return;
            }
            slider.style.setProperty('--track-color', `linear-gradient(90deg, var(--winbows-primary-color) ${slider.value}%, #888888 ${slider.value}%)`);
            value = slider.value;
            item.change({ slider, box, icon, value });
        })
        box.appendChild(icon);
        box.appendChild(slider);
        quickSettingSliders.appendChild(box);
    })

    controlPanelSummary.addEventListener('click', (e) => {
        controlPanelContainer.classList.toggle('active');
    })

    downEvts.forEach(event => {
        window.addEventListener(event, (e) => {
            if (controlPanelContainer.contains(e.target) || controlPanelSummary.contains(e.target)) return;
            controlPanelContainer.classList.remove('active');
        })
    })

    // Controls - Calendar and Notifications ( In sidebar )
    const notifyGroup = document.createElement('div');
    const calendarGroup = document.createElement('div');
    notifyGroup.className = 'control-sidebar-group';
    calendarGroup.className = 'control-sidebar-group';
    controlSidebar.appendChild(notifyGroup);
    controlSidebar.appendChild(calendarGroup);

    const notifyHeader = document.createElement('div');
    const notifyList = document.createElement('div');
    notifyHeader.className = 'control-sidebar-notify-header';
    notifyList.className = 'control-sidebar-notify-list';
    notifyGroup.appendChild(notifyHeader);
    notifyGroup.appendChild(notifyList);
    notifyHeader.innerHTML = 'Notifications';

    const calendarOverview = document.createElement('div');
    const calendarOverviewDate = document.createElement('div');
    const calendarMain = document.createElement('div');
    calendarOverview.className = 'control-sidebar-calendar-overview';
    calendarOverviewDate.className = 'control-sidebar-calendar-overview-date';
    calendarMain.className = 'control-sidebar-calendar-main';
    calendarGroup.appendChild(calendarOverview);
    calendarOverview.appendChild(calendarOverviewDate);
    calendarGroup.appendChild(calendarMain);
    calendarMain.innerHTML = 'Calendar will soon be available.';
    calendarMain.style = style = "display: flex;align-items: center;justify-content: center;";

    controlSidebarSummary.addEventListener('click', (e) => {
        controlSidebarContainer.classList.toggle('active');
    })

    downEvts.forEach(event => {
        window.addEventListener(event, (e) => {
            if (controlSidebarContainer.contains(e.target) || controlSidebarSummary.contains(e.target)) return;
            controlSidebarContainer.classList.remove('active');
        })
    })

    // Update date & time
    !(() => {
        const pattern = [" AM", " PM"];

        function updateTime() {
            const now = new Date();
            const leftToUpdateTime = (60 - now.getSeconds()) * 1000;
            controlSidebarSummaryTime.innerHTML = (now.format("hh") < 13 ? now.format("hh:mm") : new Date(Date.now() - 12 * 1000 * 60 * 60).format("hh:mm")) + (now.format("hh") < 12 ? pattern[0] : pattern[1]);
            setTimeout(updateTime, leftToUpdateTime);
        }
        function updateDate() {
            const now = new Date();
            const leftToUpdateDate = (((24 - now.getHours()) * 60 * 60) - ((60 - now.getMinutes()) * 60) - now.getSeconds()) * 1000;
            controlSidebarSummaryDate.innerHTML = now.format("yyyy/MM/dd");
            calendarOverviewDate.innerHTML = now.toLocaleDateString(void 0, {
                weekday: "long",
                month: "long",
                day: "numeric"
            })
            setTimeout(updateDate, leftToUpdateDate);
        }

        updateTime();
        updateDate();
    })();

    timer.mark('Control Panel')

    return { panel: controlPanelContainer, sidebar: controlSidebarContainer }
}