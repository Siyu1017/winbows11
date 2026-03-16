function isElement(obj) {
    try {
        return obj instanceof HTMLElement;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

function SettingItemCollapsible(data, collapsedContent) {
    const SettingItemCollapsibleContainer = document.createElement("div");
    const settingItemCollapsible = document.createElement("div");
    const settingItemDetail = document.createElement("div");
    const settingItemTitle = document.createElement("div");
    const settingItemDescription = document.createElement("div");
    const settingItemCollapse = document.createElement("div");
    const settingItemCollapsedContent = document.createElement("div");

    SettingItemCollapsibleContainer.className = "setting-item-collapsible-container";
    settingItemCollapsible.className = "setting-item-collapsible";
    settingItemDetail.className = "setting-item-collapsible-detail";
    settingItemTitle.className = "setting-item-collapsible-title";
    settingItemDescription.className = "setting-item-collapsible-description";
    settingItemCollapse.className = "setting-item-collapsible-collapse";
    settingItemCollapsedContent.className = "setting-item-collapsible-collapsed-content";

    SettingItemCollapsibleContainer.appendChild(settingItemCollapsible);
    settingItemCollapsible.appendChild(settingItemDetail);
    settingItemDetail.appendChild(settingItemTitle);
    settingItemDetail.appendChild(settingItemDescription);
    settingItemCollapsible.appendChild(settingItemCollapse);
    SettingItemCollapsibleContainer.appendChild(settingItemCollapsedContent);

    settingItemCollapsible.addEventListener('click', () => {
        SettingItemCollapsibleContainer.setAttribute('data-collapsed', SettingItemCollapsibleContainer.getAttribute('data-collapsed') === 'false' ? 'true' : 'false');
    })

    settingItemTitle.innerText = data.title;
    settingItemDescription.innerText = data.description;

    if (Array.isArray(collapsedContent)) {
        collapsedContent.forEach(row => {
            let parts = [];
            let temp = [];
            Array.isArray(row) && row.forEach(item => {
                if (typeof item !== "string") {
                    temp.push(item);
                } else {
                    parts.push(temp);
                    temp = [];
                }
            })
            if (temp.length > 0) {
                parts.push(temp);
            }

            const rowElement = document.createElement("div");
            rowElement.className = "setting-item-collapsible-collapsed-content-row";
            parts.forEach(part => {
                const rowPart = document.createElement("div");
                rowPart.className = "setting-item-collapsible-collapsed-content-row-part";
                part.forEach(item => {
                    if (isElement(item)) {
                        rowPart.appendChild(item);
                    }
                })
                rowElement.appendChild(rowPart);
            })
            settingItemCollapsedContent.appendChild(rowElement);
        })
    }

    return SettingItemCollapsibleContainer;
}

module.exports = { SettingItemCollapsible };