const CMD_VERSION = `11.0.${(Math.random() * performance.now()).toString().slice(-5)}.${(Math.random() * performance.now()).toString().slice(-4)}`;

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);