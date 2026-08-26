# WRT

WRT ( Winbows Node.js-like Runtime ) is where apps run on Winbows11. It provides the following APIs.

## Constructor

...

## Context APIs

### Built-in APIs

- `fs`
- `path`
- `process`
- `__dirname`
- `__filename`
- `requireAsync`
- `module`
- `exports`
- `runtimeID`

### System APIs

- `ShellInstance`
- `WApplication`
- `appRegistry`
- `commmandRegistry`

## HTML renderer windows

`WApplication.BrowserWindow.load()` accepts either a WRT script or a local `.html` file.
Use `loadFile()` as an Electron-compatible alias. HTML is rendered directly in the
BrowserWindow Shadow DOM; it does not create an iframe. Inline scripts and local script
files are evaluated by the window's WRT, so they receive the same WRT APIs as a normal
window script.

```js
const window = new WApplication.BrowserWindow({ title: 'My app' });
await window.loadFile('./index.html');
```

External script URLs run in the page context and are loaded before local renderer
scripts; they do not receive WRT API injection.

HTML resources may use a relative path or an IDBFS path such as
`C:/Program Files/My app/assets/logo.png`. WRT resolves these resources to blob URLs
before rendering, including `src`, `href`, and CSS `url(...)` references.
