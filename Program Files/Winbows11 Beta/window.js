browserWindow.setTheme('dark');

/*
const toolbar = document.querySelector('.window-toolbar-buttons')
const paramSettingBtn = document.createElement('div');
const paramSettingBtnIcon = document.createElement('div');
paramSettingBtn.className = 'window-toolbar-button';
paramSettingBtnIcon.className = 'window-toolbar-button-icon';
paramSettingBtnIcon.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBjbGFzcz0ic2l6ZS02Ij4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik05LjU5NCAzLjk0Yy4wOS0uNTQyLjU2LS45NCAxLjExLS45NGgyLjU5M2MuNTUgMCAxLjAyLjM5OCAxLjExLjk0bC4yMTMgMS4yODFjLjA2My4zNzQuMzEzLjY4Ni42NDUuODcuMDc0LjA0LjE0Ny4wODMuMjIuMTI3LjMyNS4xOTYuNzIuMjU3IDEuMDc1LjEyNGwxLjIxNy0uNDU2YTEuMTI1IDEuMTI1IDAgMCAxIDEuMzcuNDlsMS4yOTYgMi4yNDdhMS4xMjUgMS4xMjUgMCAwIDEtLjI2IDEuNDMxbC0xLjAwMy44MjdjLS4yOTMuMjQxLS40MzguNjEzLS40My45OTJhNy43MjMgNy43MjMgMCAwIDEgMCAuMjU1Yy0uMDA4LjM3OC4xMzcuNzUuNDMuOTkxbDEuMDA0LjgyN2MuNDI0LjM1LjUzNC45NTUuMjYgMS40M2wtMS4yOTggMi4yNDdhMS4xMjUgMS4xMjUgMCAwIDEtMS4zNjkuNDkxbC0xLjIxNy0uNDU2Yy0uMzU1LS4xMzMtLjc1LS4wNzItMS4wNzYuMTI0YTYuNDcgNi40NyAwIDAgMS0uMjIuMTI4Yy0uMzMxLjE4My0uNTgxLjQ5NS0uNjQ0Ljg2OWwtLjIxMyAxLjI4MWMtLjA5LjU0My0uNTYuOTQtMS4xMS45NGgtMi41OTRjLS41NSAwLTEuMDE5LS4zOTgtMS4xMS0uOTRsLS4yMTMtMS4yODFjLS4wNjItLjM3NC0uMzEyLS42ODYtLjY0NC0uODdhNi41MiA2LjUyIDAgMCAxLS4yMi0uMTI3Yy0uMzI1LS4xOTYtLjcyLS4yNTctMS4wNzYtLjEyNGwtMS4yMTcuNDU2YTEuMTI1IDEuMTI1IDAgMCAxLTEuMzY5LS40OWwtMS4yOTctMi4yNDdhMS4xMjUgMS4xMjUgMCAwIDEgLjI2LTEuNDMxbDEuMDA0LS44MjdjLjI5Mi0uMjQuNDM3LS42MTMuNDMtLjk5MWE2LjkzMiA2LjkzMiAwIDAgMSAwLS4yNTVjLjAwNy0uMzgtLjEzOC0uNzUxLS40My0uOTkybC0xLjAwNC0uODI3YTEuMTI1IDEuMTI1IDAgMCAxLS4yNi0xLjQzbDEuMjk3LTIuMjQ3YTEuMTI1IDEuMTI1IDAgMCAxIDEuMzctLjQ5MWwxLjIxNi40NTZjLjM1Ni4xMzMuNzUxLjA3MiAxLjA3Ni0uMTI0LjA3Mi0uMDQ0LjE0Ni0uMDg2LjIyLS4xMjguMzMyLS4xODMuNTgyLS40OTUuNjQ0LS44NjlsLjIxNC0xLjI4WiIgLz4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xNSAxMmEzIDMgMCAxIDEtNiAwIDMgMyAwIDAgMSA2IDBaIiAvPgo8L3N2Zz4K)';
paramSettingBtnIcon.style.width = '1rem';
paramSettingBtnIcon.style.height = '1rem';
paramSettingBtnIcon.style.minWidth = '1rem';
paramSettingBtnIcon.style.minHeight = '1rem';
toolbar.insertBefore(paramSettingBtn, toolbar.firstChild);
paramSettingBtn.appendChild(paramSettingBtnIcon);
*/

const iframe = document.createElement('iframe');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';
document.body.appendChild(iframe);

function launch() {
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.src = 'https://winbows11-beta.vercel.app/?embed&no-devtool';
}

launch();

/*paramSettingBtn.addEventListener('click', () => {

})*/
