const { Link } = await requireAsync('../components/link.js');
const path = await requireAsync('node:path');

module.exports = function main() {
    const container = document.createElement('div');
    const header = document.createElement('div');
    const device = document.createElement('div');
    const deviceImage = document.createElement('div');
    const deviceInfo = document.createElement('div');
    const deviceName = document.createElement('div');
    const deviceModel = document.createElement('div');
    const right = document.createElement('div');
    const network = Link('/network');
    const networkIcon = document.createElement('div');
    const networkInfo = document.createElement('div');
    const networkName = document.createElement('div');
    const networkStatus = document.createElement('div');
    const update = Link('/update');
    const updateIcon = document.createElement('div');
    const updateInfo = document.createElement('div');
    const updateTitle = document.createElement('div');
    const updateTime = document.createElement('div');

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

    fs.getFileURL(Explorer.backgroundImage.get()).then(url => {
        deviceImage.style.backgroundImage = `url(${url})`;
    })
    fs.getFileURL(path.join(__dirname, '../icons/network.ico')).then(url => {
        networkIcon.style.backgroundImage = `url(${url})`;
    })
    fs.getFileURL(path.join(__dirname, '../icons/update.ico')).then(url => {
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