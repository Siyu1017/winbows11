import { Link } from '../components/link.js';
import { fs } from 'winbows/fs';

export default function main() {
    var container = document.createElement('div');
    var header = document.createElement('div');
    var device = document.createElement('div');
    var deviceImage = document.createElement('div');
    var deviceInfo = document.createElement('div');
    var deviceName = document.createElement('div');
    var deviceModel = document.createElement('div');
    var right = document.createElement('div');
    var network = Link('/network');
    var networkIcon = document.createElement('div');
    var networkInfo = document.createElement('div');
    var networkName = document.createElement('div');
    var networkStatus = document.createElement('div');
    var update = Link('/update');
    var updateIcon = document.createElement('div');
    var updateInfo = document.createElement('div');
    var updateTitle = document.createElement('div');
    var updateTime = document.createElement('div');

    header.className = 'home-header';
    device.className = 'home-device';
    deviceImage.className = 'home-device-image';
    deviceInfo.className = 'home-device-info';
    deviceName.className = 'home-device-name';
    deviceModel.className = 'home-device-model';
    right.className = 'home-header-right';
    network.className = 'home-network';
    networkIcon.className = 'home-network-icon';
    networkInfo.className = 'home-network-info';
    networkName.className = 'home-network-name';
    networkStatus.className = 'home-network-status';
    update.className = 'home-update';
    updateIcon.className = 'home-update-icon';
    updateInfo.className = 'home-update-info';
    updateTitle.className = 'home-update-title';
    updateTime.className = 'home-update-time';

    deviceName.innerHTML = 'Supercomputer';
    deviceModel.innerHTML = `Super Computer (${new Date().getFullYear()})`;
    networkName.innerHTML = 'Wifi';
    networkStatus.innerHTML = 'Connected';
    updateTitle.innerHTML = 'Winbows Update';
    updateTime.innerHTML = 'Last checked: Just now';

    fs.getFileURL(window.getBackgroundImage()).then(url => {
        deviceImage.style.backgroundImage = `url(${url})`;
    })
    fs.getFileURL('../icons/network.ico').then(url => {
        networkIcon.style.backgroundImage = `url(${url})`;
    })
    fs.getFileURL('../icons/update.ico').then(url => {
        updateIcon.style.backgroundImage = `url(${url})`;
    })

    container.appendChild(header);
    header.appendChild(device);
    header.appendChild(right);
    device.appendChild(deviceImage);
    device.appendChild(deviceInfo);
    deviceInfo.appendChild(deviceName);
    deviceInfo.appendChild(deviceModel);
    right.appendChild(network);
    network.appendChild(networkIcon);
    network.appendChild(networkInfo);
    networkInfo.appendChild(networkName);
    networkInfo.appendChild(networkStatus);
    right.appendChild(update);
    update.appendChild(updateIcon);
    update.appendChild(updateInfo);
    updateInfo.appendChild(updateTitle);
    updateInfo.appendChild(updateTime);

    return container;
}