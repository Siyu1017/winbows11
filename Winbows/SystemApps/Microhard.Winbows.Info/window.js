document.documentElement.style = `
    width: 320px;
    height: 450px;
`

browserWindow.setSnappable(false);

document.documentElement.classList.add('winui');
document.documentElement.classList.add('winui-no-background');

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

document.body.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;"><div style="padding: 1.5rem;overflow: auto;height: 100%;">
<a href="https://github.com/Siyu1017/winbows11/tree/beta" target="_blank" style="
    background: linear-gradient(to left, rgb(0 186 255), rgb(132 2 182));
    border-radius: .75rem;
    padding: .75rem 1rem;
    color: #fff;
    font-weight: bold;
    margin-bottom: 1rem;
    user-select: none;
    display: block;
    text-decoration: none;
">Try Winbows11 Beta</a>
<div style="
    font-weight: 600;
    font-size: 1.5rem;
    margin-bottom: .75rem;
">Welcome</div>
<div style="
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
">Welcome to Winbows11, which allows you to experience Windows11 animations and themes on web pages, and has a file system built using IndexedDB. Happy using it~</div>
<div style="
    font-weight: 600;
    font-size: 1.5rem;
    margin-bottom: .75rem;
">Updates</div>
<ul style=" 
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-left: 1.5rem;
">
<li style="
    margin: .5rem 0;
">✨New IDBFS✨</li>
<li style="
    margin: .5rem 0;
    
">Dark theme<br><button style="
    cursor: pointer;
    background: #0067c0;
    padding: .5rem 1rem;
    border-radius: .5rem;
    border:0;
    outline:none;
    font:inherit;
    color:#fff;
    margin-top:.5rem;=
    width: fit-content;
    user-select: none;
    " onclick="setBackgroundImage('C:/Winbows/bg/img19.jpg');">Apply dark theme</button></li>
<li style="
    margin: .5rem 0;
">Window animation</li>
<li style="
    margin: .5rem 0;
">Mica effect ( Beta )</li>
<!--li style="
    margin: .5rem 0;
">Rearrange app icons in the taskbar</li-->
</ul>
				<div style="
    font-weight: 600;
    font-size: 1.5rem;
    margin-bottom: .75rem;
">Warning</div>
				<div style="
    margin-block-start: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
">Winbows11 is in no way affiliated with Microsoft and should not be confused with Microsoft operating systems or products.</div>
<div style="
    margin-block-start: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: 600;
">Microsoft, Windows and other demonstration products included in this project are trademarks of the Microsoft Corporation.</div>
<div style="
    margin-block-start: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
">Learn more on <a href="https://github.com/Siyu1017/winbows11" target="_blank"style="
    color: var(--winbows-primary-color);
">Github</a>.</div>
			</div>
            </div>`;

document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', () => {
        window.System.Shell(el.getAttribute('data-action'))
    })
})

var theme = window.System.theme.get()
browserWindow.setTheme(theme);
if (theme == 'dark') {
    document.documentElement.classList.add('winui-dark');
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('winui-dark');
    document.documentElement.classList.remove('dark');
}

window.System.theme.onChange(theme => {
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
        document.documentElement.classList.remove('dark');
    }
})