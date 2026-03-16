module.exports = function main(router) {
    var home = document.createElement('div');
    var quickAccess = document.createElement('div');
    var quickAccessHeader = document.createElement('div');
    var quickAccessItems = document.createElement('div');

    home.className = 'home';
    quickAccess.className = 'quickaccess';
    quickAccessHeader.className = 'quickaccess-header';
    quickAccessItems.className = 'quickaccess-items';

    quickAccessHeader.innerHTML = 'Quick Access';

    fs.readFileAsText('../quickaccess.json').then(res => {
        JSON.parse(res).forEach(item => {
            var quickAccessItem = document.createElement('div');
            var quickAccessItemIcon = document.createElement('div');
            var quickAccessItemInfo = document.createElement('div');
            var quickAccessItemTitle = document.createElement('div');
            var quickAccessItemLocation = document.createElement('div');

            quickAccessItem.className = 'quickaccess-item';
            quickAccessItemIcon.className = 'quickaccess-item-icon';
            quickAccessItemInfo.className = 'quickaccess-item-info';
            quickAccessItemTitle.className = 'quickaccess-item-title';
            quickAccessItemLocation.className = 'quickaccess-item-location';

            quickAccessItemTitle.innerHTML = item.title;
            quickAccessItemLocation.innerHTML = 'This PC';
            fs.getFileURL(item.icon).then(url => {
                quickAccessItemIcon.style.backgroundImage = `url(${url})`;
            })

            quickAccessItem.addEventListener('click', () => {
                router.push(item.path);
            })

            quickAccessItems.appendChild(quickAccessItem);
            quickAccessItem.appendChild(quickAccessItemIcon);
            quickAccessItem.appendChild(quickAccessItemInfo);
            quickAccessItemInfo.appendChild(quickAccessItemTitle);
            quickAccessItemInfo.appendChild(quickAccessItemLocation);
        })
    })
    home.appendChild(quickAccess);
    quickAccess.appendChild(quickAccessHeader);
    quickAccess.appendChild(quickAccessItems);
    return home;
}