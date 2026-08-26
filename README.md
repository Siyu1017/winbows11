<div align="center">

![Winbows11](./public/assets/images/presentation.png)

# Winbows11

Run applications, manage files, use a terminal, and experience smooth window animations and interface transitions directly in your browser.

<br>

[![GitHub License](https://img.shields.io/github/license/Siyu1017/winbows11)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Siyu1017/winbows11?style=flat)](https://github.com/Siyu1017/winbows11/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Siyu1017/winbows11?style=flat)](https://github.com/Siyu1017/winbows11/forks)
[![GitHub Issues](https://img.shields.io/github/issues/Siyu1017/winbows11)](https://github.com/Siyu1017/winbows11/issues)
[![Stable](https://img.shields.io/badge/stable-main-0078D4)](https://winbows11.vercel.app)
[![Beta](https://img.shields.io/badge/beta-beta-orange)](https://winbows11-beta.vercel.app)

English | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-Hans.md)

</div>

## Try Winbows11

Winbows11 runs directly in your browser and does not require installation.

| Version | Branch | Description | Website |
| :---: | :-: | --- | --- |
| **Stable** | `main` | Current stable version | [winbows11.vercel.app](https://winbows11.vercel.app) |
| **Beta** | `beta` | Includes the latest features and architectural changes | [winbows11-beta.vercel.app](https://winbows11-beta.vercel.app) |

## About Winbows11

Winbows11 evolved from [WebOS](https://github.com/Siyu1017/WebOS). The project originally began after I was inspired by [Win11 in React](https://win11.blueedge.me/) and decided to build my own web-based Windows 11-style desktop called WebOS. Over time, the project grew beyond desktop simulation and gained its own runtime, filesystem, process management, Shell, window management, and other system components, eventually becoming Winbows11.

Winbows11 currently includes:

- Winbows Runtime (WRT) application runtime
- A virtual filesystem with IndexedDB as its primary persistent storage backend
- Process, signal, child process, and stdio models
- IPC based on the concept of named pipes
- Shell and terminal
- `WApplication` / `BrowserWindow` application and window framework
- Taskbar, Start menu, and Task View
- File Explorer, Settings, and other completed built-in applications
- Developer Tools, SDK, and system APIs
- HMGR hardware abstraction layer, currently focused primarily on network interface emulation

> [!IMPORTANT]
> Winbows11 is an independently developed project and is not affiliated with, licensed by, or partnered with Microsoft.<br>
> It should not be confused with Microsoft Windows, Windows 365, or any other Microsoft product.

## Screenshots

### Desktop and Applications

The desktop can run multiple application windows at the same time, supports desktop shortcuts, and allows files or folders from the host device to be dragged onto the Winbows11 desktop for use inside the environment.

![Winbows11 desktop and applications](./public/assets/images/screenshots/desktop.png)

### Task View

Task View displays currently open windows and allows users to quickly view and switch between running applications.

![Winbows11 Task View](./public/assets/images/screenshots/taskview.png)

### Snap and Multitasking

Windows can be snapped to different areas of the desktop, allowing multiple applications to remain visible and usable at the same time.

![Winbows11 window snapping and multitasking](./public/assets/images/screenshots/multitask.png)

### Developer Tools

Developer Tools includes a task list, console, performance monitor, terminal, and storage panel. It can be used to inspect running processes, performance information, and filesystem data, as well as interact with the Winbows11 environment through the console and terminal.

![Winbows11 Developer Tools](./public/assets/images/screenshots/devtool.png)

## Features

### Desktop Environment

- Window dragging and resizing
- Minimize, maximize, fullscreen, and window snapping
- Rearrangeable application icons on the taskbar
- Start menu
- Task View
- Desktop shortcuts
- Lock screen
- Context menus
- Custom themes and wallpapers
- Mica-style visual effects

### Built-in Applications

Winbows11 includes multiple built-in applications. The following applications are currently considered complete:

- File Explorer
- Microhard Edge
- VSCode
- Command Prompt
- Paint
- Info
- Task Manager
- FPS Meter
- Photos
- Network Listener
- JSON Viewer
- Notepad
- Settings
- Node.js

### Developer Tools

Developer Tools currently includes:

- Task list with information such as Runtime ID and PID
- Console
- Performance monitor for FPS and JavaScript heap usage
- Terminal
- Storage panel with folder tree navigation, file size information, and last modified timestamps

## Winbows Runtime

**WRT (Winbows Runtime)** is the application runtime used by Winbows11 and provides applications running in the browser with a subset of Node.js-like APIs. Some design concepts were inspired by [Windows 96](https://windows96.net/), but WRT is an independent implementation within the Winbows11 project and does not imply shared source code, a derived fork, or API compatibility with Windows 96.

WRT currently includes:

- Process ID and Parent Process ID
- Process lifecycle and state management
- Process signals
- Environment variables
- Process arguments
- `stdin`, `stdout`, and `stderr`
- TTY streams
- Child processes
- `spawn()`, `exec()`, `execFile()`, and `fork()`
- Module loading and caching
- System APIs
- GUI application creation through `WApplication`
- Integration with Winbows11 IPC, Shell, VFS, and window system

## Filesystem

Winbows11 uses a persistent virtual filesystem inside the browser. It currently supports:

- Volume-aware filesystem model
- A dedicated `C:` system volume
- IndexedDB as the primary persistent storage backend
- Node.js-like filesystem APIs
- Node.js-like path utilities
- File and directory operations
- Filesystem events
- Migration from older filesystem formats

> [!IMPORTANT]
> When IndexedDB is unavailable in certain environments, Winbows11 may fall back to memory-backed storage. Files stored in memory are temporary and will be lost when the page is refreshed or closed.

## Shell and Terminal

Command Prompt and WRT processes use the Winbows11 Shell, which currently supports:

- Built-in commands (enter `help` in Command Prompt to view available commands)
- WRT programs
- Command pipelines using `|`
- Output redirection using `>` and `>>`
- Environment variable expansion using `%NAME%`
- File and directory commands
- Text processing commands

For example:

```text
dir | find ".js" > files.txt
```

## Application Framework

GUI applications can create and manage windows through `WApplication` and `BrowserWindow`. The framework currently supports:

- Main windows
- Sub-windows
- Popup windows
- Window lifecycle events
- Window color themes
- WRT script loading
- Access to the DOM within application windows
- Loading local HTML files with `BrowserWindow.loadFile()`
- Application registration
- File extension associations (currently limited to built-in applications)

## Browser Support

Winbows11 is primarily developed and tested on Chromium-based browsers such as Google Chrome and Microsoft Edge.

Safari currently has only limited compatibility fixes, including handling cases where IndexedDB is unavailable in private browsing mode, and has not yet undergone complete compatibility testing. Other browsers may also work, but compatibility is not currently guaranteed.

## TODO

Winbows11 is still under active development. Current plans include:

### Applications

- [ ] Calculator
- [ ] Microhard Store
- [ ] Media Player
- [ ] Complete more Settings pages and features

### System

- [ ] Complete the application installation, update, and removal system
- [ ] Expand volume support
- [ ] Improve filesystem watch and event behavior
- [ ] Expand file type and default application associations
- [ ] Expand HMGR with virtual hardware interfaces beyond NIC
- [ ] Expand system APIs and Shell built-in commands

### Desktop & Windowing

- [ ] Add Start menu search
- [ ] Add an application list
- [ ] Add Widgets
- [ ] Expand personalization features
- [ ] Improve multi-window and modal / popup window behavior

### Developer Experience

- [ ] Expand the WRT SDK and examples
- [ ] Complete WRT TypeScript declarations
- [ ] Provide more complete application development documentation
- [ ] Improve Developer Tools performance

### Compatibility & Localization

- [ ] Improve compatibility with Safari and other non-Chromium browsers
- [ ] Add more languages
- [ ] Improve usability across different screen sizes and mobile devices

> TODO items do not represent a fixed development order. Features and priorities may change as the internal architecture of Winbows11 evolves.

## Development

Install project dependencies:

```bash
npm install
```

Create a development build:

```bash
npm run build:dev
```

Start the development server:

```bash
npm run start:dev
```

Watch for source changes and rebuild automatically:

```bash
npm run build:watch
```

Run TypeScript checks:

```bash
npm run type-check
```

Create a production build:

```bash
npm run build
```

The generated website and Winbows11 system files are output to `public/`.

## Project Structure

```text
winbows11
├─ src/
│  ├─ os/                 Core operating environment and runtime
│  ├─ pages/              Website and installation pages
│  └─ shared/             Shared modules and utilities
│
├─ types/
│  └─ wrt/                WRT TypeScript declarations
│
├─ scripts/
│  └─ build.js            Build orchestration
│
├─ public/
│  ├─ assets/
│  │  ├─ images/          Static images and screenshots
│  │  ├─ scripts/         Generated JavaScript
│  │  └─ styles/          Generated stylesheets
│  ├─ Program Files/      Applications
│  ├─ Winbows/            System files and built-in applications
│  └─ User/               Default user filesystem
│
├─ server.js
├─ tsconfig.json
└─ webpack.config.js      Webpack build configuration
```

## Contributing

Bug reports, suggestions, and code contributions are welcome. When reporting an issue, please include enough information to reproduce the problem and describe both the expected and actual behavior.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and major changes.

## License

See [LICENSE](./LICENSE) for licensing information.
