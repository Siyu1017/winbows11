# Changelog

All notable changes to this project will be documented here.

## Unreleased

### Added

- You can now run interactive CLI applications within the terminal
- Add a new `Explorer.FilePicker` API for easier file browsing and selection
- Applications now support configurable headers
- Sub-windows are now available for GUI applications

### Improved

- Improve the loading screen to eliminate lag and provide a smoother experience

### Fixed

- Fix desktop icons not displaying correctly
- Fix minimized windows not showing in TaskView after repeated toggles
- Fix an issue where closing a tab in a TabView window did not automatically focus the remaining tab

## v1.0.0-beta.16 (2025-10-23)

### Added

- Windows using TabView now update their title and icon when the active tab's title or icon changes, or when a tab gains focus

### Fixed

- An issue where the taskbar thumbnail icon was not displayed
- An issue where TaskView wouldn't automatically close when opening a new window

## v1.0.0-beta.15 (2025-10-21)

### Added

- Taskbar app icons
- Start menu
- Window animation
- Task view feature

### Fixed

- Remaining time incorrectly showing a negative value after installation completed
- Installation failure caused by incorrect build metadata
- A bug where arguments like `--key="value"` were parsed as `{ key: '"value"' }` instead of `{ key: 'value' }`
- An issue where the Mica background layer extended beyond the window’s viewport bounds after resizing, causing visual overflow artifacts

## v1.0.0-beta.14 (2025-10-08)

### Added

- Taskbar icons *(implemented in `v1.0.0-beta.15`)*
- Setting app for WRT environment
- Start menu *(implemented in `v1.0.0-beta.15`)*
- Type declarations of WRT global object

### Fixed

- Restore the accidentally deleted `init.js` file
- Display issues with task icons in the DevTool Tasks tab and the Task Manager app
- A bug in File Explorer where changing the path in one tab also changes the path in the other tab

## v1.0.0-beta.13 (2025-10-05)

### Breaking

- Change the system loading process
- Rewrite the WRT constructor and APIs

### Added

- Debug log
- Add System object to WRT context
- `System.shell`, an instance of the `ShellInstance` class
- `process.args`

### Changed

- Update devtool console to `v1.3.2`
- Improve the `taskkill` command

## v1.0.0-beta.12 (2025-09-12)

### Added

- Add `ver` command to command registry
- Devtool "Tasks" tab

### Changed

- The background color of BSOD
- Update devtool console to `v1.3.1`

## v1.0.0-beta.11 (2025-09-04)

### Added

- Add icons to taskbar
- Crash handler

### Fixed

- Bugs of Task Manager app

## v1.0.0-beta.10 (2025-09-01)

### Fixed

- The crash issue when opening the Edge app and Task Manager app

## v1.0.0-beta.9 (2025-08-30)

### Added

- Add minWidth and minHeight options to BrowserWindows class

## v1.0.0-beta.8 (2025-08-30)

### Fixed

- Theme issue of the right-click menu in the browser window toolbar

## v1.0.0-beta.7 (2025-08-29)

### Fixed

- `cd` command

## v1.0.0-beta.6 (2025-08-28)

### Added

- Devtool resizer bar

### Fixed

- Fix app window title
- Improve mica effect performance by lowering image quality

## v1.0.0-beta.5 (2025-08-28)

### Fixed

- Mica effect
- Performance tab of the devtool

## v1.0.0-beta.4 (2025-08-27)

### Added

- Add start command to command registry
- app registry

### Fixed

- App window size and snap preview size

## v1.0.0-beta.3 (2025-08-26)

### Fixed

- The window open animation

## v1.0.0-beta.2 (2025-08-25)

### Changed

- Integrate console window to the devtool

## v1.0.0-beta.1 (2025-08-21)

### Added

- A new code execution environment called "WRT" (Winbows node.js-like Runtime)
- Debug console for WRT
- New FS schema

### Changed

- Codes will be executed in the WRT environment instead of in a Web Worker, and will have access to the `window` object regardless of whether the code is a background script or a content script
- The executable file extension has been changed from `.wexe` to `.wrt`
- The module import and export method has changed from using ES to using Node.js-like module import and export methods

## v0.2.0 (2025-07-04) [5d4d0ad59ac0dc4f14851ef0498f63e2c317851f]

### Added

- Notepad and Settings apps
- Mica effect ( beta )
- Dark theme ( beta )
- Window animation
- Reorderable taskbar icons

## v0.1.0 (2024-10-06) [654c474cb676b8c8d06c977ce50fda321e13c5e8]

### Added

- Install page
- Desktop shortcut
- Info app
- Quick setting panel
- Sidebar
- Microhard Edge web browser
- VSCode, Paint, Command, Task Manager, FPS Meter, Photos, Network Listener and JSON Viewer apps
- Taskbar right-click menu

## v0.0.0 (2024-08-27) [8d04c3c1f5ee04dcf4df6ec0849917248d3998f1]

### Added

- Lock screen
- Taskbar with icons
- Start menu
- Desktop background image
- File explorer app

## Initial commit (2024-07-14)
