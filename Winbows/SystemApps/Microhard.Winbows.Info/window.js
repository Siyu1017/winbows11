document.documentElement.style = `
    width: 320px;
    height: 450px;
`

process.title = 'Info';

browserWindow.setSnappable(false);

document.documentElement.classList.add('winui');
document.documentElement.classList.add('winui-no-background');

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL('./window.css');
document.head.appendChild(style);

document.body.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;"><div style="padding: 1.5rem;overflow: auto;height: 100%;">
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
">✨Winbows Node.js Runtime✨</li>
<li style="
    margin: .5rem 0;
    
">Dark theme</li>
<li style="
    margin: .5rem 0;
">Window animation</li>
<li style="
    margin: .5rem 0;
">Mica effect</li>
<li style="
    margin: .5rem 0;
">Taskview ( Beta )</li>
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
        new ShellInstance().execCommand(el.getAttribute('data-action'))
    })
})

var theme = System.theme.get()
browserWindow.setTheme(theme);
if (theme == 'dark') {
    document.documentElement.classList.add('winui-dark');
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('winui-dark');
    document.documentElement.classList.remove('dark');
}

System.theme.onChange(theme => {
    browserWindow.setTheme(theme);
    if (theme == 'dark') {
        document.documentElement.classList.add('winui-dark');
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('winui-dark');
        document.documentElement.classList.remove('dark');
    }
})
