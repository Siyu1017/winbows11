var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(path.resolve('./window.css'));
document.head.appendChild(style);

var url = await fs.getFileURL(path.resolve('./temporary.html'));

document.body.innerHTML = `<style>iframe {width: 100%;height:100%;border:none;}</style>`;

var iframe = document.createElement('iframe');
iframe.src = url;
document.body.appendChild(iframe);