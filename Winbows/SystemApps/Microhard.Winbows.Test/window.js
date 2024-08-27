console.groupCollapsed('File Explorer');

console.log(document)
console.log(document.body, document)
console.log(window)
console.log(1, this, self)
console.log(document.damn, document.createElement);
console.log(document.querySelector('div'))
console.log(document.createElement('div', {}));
window.fs.damn = null;
console.log(window.fs.damn);

var time = 0;
var el = document.createElement('div');
el.innerHTML = 'Window will close in <span>10.00</span> second(s).';
el.style.display = 'flex';
el.style.flexDirection = 'row';
el.style.alignItems = 'center';
el.style.justifyContent = 'center';
el.style.height = '100%';
el.style.gap = '8px';
document.body.appendChild(el);

var start = performance.now();
var existTime = 10000;

function timer() {
    var now = performance.now();
    if (now - start > existTime) {
        process.exit();
        cancelAnimationFrame(timer);
    } else {
        el.querySelector('span').innerHTML = existTime - (now - start) < 0 ? 0 : ((existTime - (now - start)) / 1000).toFixed(2)
        requestAnimationFrame(timer);
    }
}

timer();

console.log(Function('return this')());

document.write('damn')

console.log(System)

console.groupEnd();

new System.browserWindow({
    title: 'Explorer',
    toolbar: false,
    fullscreen: true
})

document.querySelector('.screen').remove();

new System.browserWindow({
    title: 'Explorer',
    toolbar: false,
    fullscreen: true
})

var customToolbar = new CustomToolbar();

window.useToolbar();

