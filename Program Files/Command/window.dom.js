const CMD_VERSION = `11.0.${(Math.random() * performance.now()).toString().slice(-5)}.${(Math.random() * performance.now()).toString().slice(-4)}`;

browserWindow.changeTitle('Command')

Date.prototype.format = function (fmt) { var o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() }; if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); } for (var k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); } } return fmt; };

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = await fs.getFileURL(utils.resolvePath('./window.css'));
document.head.appendChild(style);

function getPosition(element) {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
    return { x: offset(element).left, y: offset(element).top };
}

var lines = [
    {
        text: `Microhard Winbows [Version ${CMD_VERSION}]`
    }, {
        text: `(c) Microhard Corporation. All rights reserved.`
    }, {
        text: ``
    }, {
        text: `Type "help" for available commands.`
    }, {
        text: ``
    }
];

var path = 'C:/';

function runCommand(cmd, params, config) {

}