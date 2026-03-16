const { Link } = await requireAsync('./link.js');

function SettingItem(data) {
    const link = Link(data.href);
    const settingItem = document.createElement("div");
    const settingItemIcon = document.createElement("div");
    const settingItemDetail = document.createElement("div");
    const settingItemTitle = document.createElement("div");
    const settingItemDescription = document.createElement("div");
    const settingItemOpenIcon = document.createElement("div");

    settingItem.className = "setting-item";
    settingItemIcon.className = "setting-item-icon";
    settingItemDetail.className = "setting-item-detail";
    settingItemTitle.className = "setting-item-title";
    settingItemDescription.className = "setting-item-description";
    settingItemOpenIcon.className = "setting-item-open-icon";

    link.setAttribute('href', data.href);
    settingItemIcon.setAttribute('data-icon', String.fromCharCode(parseInt(data.icon, 16)));
    settingItemTitle.innerHTML = data.title;
    settingItemDescription.innerHTML = data.description || "";

    link.appendChild(settingItem);
    settingItem.appendChild(settingItemIcon);
    settingItem.appendChild(settingItemDetail);
    settingItemDetail.appendChild(settingItemTitle);
    settingItemDetail.appendChild(settingItemDescription);

    if (data.openable != false) {
        settingItem.appendChild(settingItemOpenIcon);
    }

    return link;
}

module.exports = { SettingItem }