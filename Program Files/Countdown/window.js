browserWindow.setTheme("dark");

const iframe = document.createElement('iframe');
iframe.src = '//siyu1017.github.io/countdown';
iframe.style = `    width: 100%;
    height: 100%;
    border: none;`
document.body.appendChild(iframe);

process.title = "Countdown";