document.documentElement.style = `
    width: min(320px, 60vw);
    height: min(450px, 80vh);
`

browserWindow.setSnappable(false);

document.documentElement.classList.add('winui-light');

document.documentElement.querySelectorAll('.window-toolbar-button:not(.close)').forEach(btn => {
    btn.remove();
})

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
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
">Warning</div>
				<div style="
    margin-block-start: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
">Winbows11 is in no way affiliated with Microsoft and should not be confused with Microsoft operating systems or products.</div>
			</div>
            </div>`;