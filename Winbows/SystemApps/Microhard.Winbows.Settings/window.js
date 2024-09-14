const fontURL = await fs.getFileURL('C:/Winbows/fonts/Segoe Fluent Icons.ttf');
const myFont = new FontFace('Segoe Fluent Icons', `url(${fontURL})`);
await myFont.load();

console.log(document)

window.document.fonts.add(myFont);

document.body.style.fontFamily = 'Segoe Fluent Icons';

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

document.body.innerHTML = '<div class="example"></div>';