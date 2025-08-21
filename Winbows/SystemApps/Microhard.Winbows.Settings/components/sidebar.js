import { fs } from 'winbows/fs';
import { Link } from './link.js';
import { router } from '../_router.js';
import { sidebarItems } from '../sidebarItems.js';

// await fs.init();

function sidebar() {
    var currentPage = 'home';
    var sidebarContainer = document.createElement('div');
    var sidebar = document.createElement('div');
    var account = document.createElement('div');
    var accountAvatar = document.createElement('div');
    var accountInfo = document.createElement('div');
    var accountName = document.createElement('div');
    var accountEmail = document.createElement('div');
    var search = document.createElement('div');
    var searchInput = document.createElement('input');
    var searchButton = document.createElement('button');
    var pageListContainer = document.createElement('div');
    var pageList = document.createElement('div');

    sidebarContainer.className = 'sidebar-container';
    sidebar.className = 'sidebar';
    account.className = 'account';
    accountAvatar.className = 'account-avatar';
    accountInfo.className = 'account-info';
    accountName.className = 'account-name';
    accountEmail.className = 'account-email';
    search.className = 'search';
    searchInput.className = 'search-input';
    searchButton.className = 'search-button';
    pageListContainer.className = 'page-list-container';
    pageList.className = 'page-list';

    searchInput.addEventListener('focus', () => {
        search.classList.add('focused');
    })
    searchInput.addEventListener('blur', () => {
        search.classList.remove('focused');
    })

    accountName.innerHTML = 'Admin';
    accountEmail.innerHTML = 'admin@outlook.com';
    searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    fs.getFileURL('C:/Winbows/icons/user.png').then((url) => {
        accountAvatar.style.backgroundImage = `url(${url})`;
    })

    sidebarContainer.appendChild(sidebar);
    sidebar.appendChild(account);
    sidebar.appendChild(search);
    sidebar.appendChild(pageListContainer);
    account.appendChild(accountAvatar);
    account.appendChild(accountInfo);
    accountInfo.appendChild(accountName);
    accountInfo.appendChild(accountEmail);
    pageListContainer.appendChild(pageList);
    search.appendChild(searchInput);
    search.appendChild(searchButton);

    Object.keys(sidebarItems).forEach((key) => {
        var item = sidebarItems[key];
        var pageItem = Link();
        var pageIcon = document.createElement('div');
        var pageTitle = document.createElement('div');
        pageItem.className = 'page-item';
        pageIcon.className = 'page-icon';
        pageTitle.className = 'page-title';
        fs.getFileURL(item.icon).then((url) => {
            pageIcon.style.backgroundImage = `url(${url})`;
        })
        pageTitle.innerHTML = item.title;
        pageItem.setAttribute('href', item.path);
        pageItem.addEventListener('click', async () => {
            currentPage = item.path;
            if (window.modes.debug == true) {
                console.log(`Navigating to ${item.path}`);
            }
        });
        pageItem.appendChild(pageIcon);
        pageItem.appendChild(pageTitle);
        pageList.appendChild(pageItem);
        sidebarItems[key].item = pageItem;
    })

    router.on('change', (e) => {
        const path = e.path;
        if (window.modes.debug == true) {
            console.log(path);
        }
        Object.values(sidebarItems).forEach(item => {
            if (path.startsWith(item.path) == true) {
                item.item.classList.add('active');
                currentPage = path;
            } else {
                item.item.classList.remove('active');
            }
        })
    })

    return sidebarContainer;
}

export { sidebar };