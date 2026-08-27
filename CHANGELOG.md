# Changelog

All notable changes to this project will be documented in this file.

## v1.1.0-beta.4 (2026-08-27)

### Added

- Added Vercel configuration for serving the static `public` build and returning the Winbows 404 page for unknown routes

### Changed

- Separated `find` and `findstr`: `find` now performs literal searches, while `findstr` supports wildcard matching by default and regular expressions through `/r`
- Expanded `find` and `findstr` with Windows-style filtering, matching, line-number, count, file-name, and offset options
- Updated `tree` to render a recursive Windows-style hierarchy with Unicode branches by default and ASCII branches through `/a`
- Updated File Explorer to display drive roots with a drive icon and a drive-qualified title
- Updated `.gitignore` rules to ignore `.env*` files

### Fixed

- Fixed `find` pipeline errors so invalid arguments report `FIND: Parameter format incorrect` without an additional pipeline-stage error
- Fixed `find /n` and `findstr /n` to use `line:` line-number prefixes
- Fixed `Delete` handling in CMD and CMD containers so it deletes the character after the cursor instead of inserting an invisible control sequence
- Made control characters visible during editable CMD input while keeping cursor placement aligned with their visible representation
- Fixed VSCode startup so malformed persisted workspace state does not prevent the editor from opening

## v1.1.0-beta.3 (2026-08-26)

### Added

- Added regression coverage for Windows-style VFS filename validation, including invalid characters, control characters, path normalization, and filesystem operation bypasses
- Added volume-qualified paths to filesystem errors so public APIs report paths such as `C:/Users/file.txt`
- Added built-in `/?` help output for registered shell commands
- Added `dir` directory/file filtering and name-order options, `tree /f`, and `taskkill /im` process-name matching

### Changed

- Improved shell pipeline status handling so `findstr` returning no matches works correctly with `&&`, `||`, and subsequent pipeline stages without printing a spurious error
- Updated `dir`, `tree`, `del`, and `taskkill` usage text to document only supported options

### Fixed

- Fixed VFS operations accepting Windows-invalid filename characters in path segments
- Fixed shell errors being wrapped or printed twice instead of displaying the underlying filesystem error
- Fixed `del` confirmation and failure status handling
- Fixed `taskkill /pid` to terminate the selected process rather than only assigning its exit code

## v1.1.0-beta.2 (2026-08-26)

### Fixed

- Fixed desktop shortcut loading when missing VFS resources returned an HTML fallback response instead of the expected JSON shortcut data

## v1.1.0-beta.1 (2026-08-26)

### Added

- Introduced a new volume-aware virtual filesystem architecture with a dedicated `C:` system volume
- Added automatic migration support for data stored using the legacy filesystem
- Added Node.js-like filesystem and `path` APIs for WRT applications
- Added filesystem events and improved file URL handling
- Added a kernel-managed WRT process manager with process IDs, parent process IDs, process states, and signal handling
- Added new `stdin`, `stdout`, `stderr`, and TTY stream implementations
- Added functional WRT child process support for `spawn()`, `exec()`, `execFile()`, and `fork()`
- Added shell pipelines using `|`
- Added shell output redirection using `>` and `>>`
- Added `%NAME%` environment variable expansion
- Added additional file and text-processing shell commands
- Added direct local HTML rendering to `BrowserWindow`
- Added `BrowserWindow.loadFile()`
- Added popup window support
- Added Seti file icons and additional editor APIs to the built-in VSCode application
- Added generated WRT type declarations for the VSCode editor
- Added reorderable taskbar application icons

### Changed

- Replaced the legacy filesystem integration with the new system VFS
- Migrated system components and applications to the new filesystem APIs
- Reworked the WRT process lifecycle and child process model
- Reworked the shell parser and command execution pipeline
- Moved Explorer into its own WRT GUI process with a unified process and shell lifecycle
- Reworked Command Prompt to use the new Shell and WRT runtime
- Improved `BrowserWindow` and window lifecycle behavior
- Reworked the built-in VSCode editor integration
- Consolidated the main site and kernel build pipeline around Webpack
- Moved deployable site output under `public/`
- Added Webpack-managed HTML templates, CSS extraction and minification, and content-hashed page assets

### Improved

- Improved filesystem path consistency and volume handling
- Improved File Explorer integration with filesystem changes
- Improved taskbar icon positioning, reordering, and animations
- Improved Task View behavior
- Improved WRT SDK declarations and child process examples
- Improved application and popup window handling

### Removed

- Removed the legacy standalone Command application implementation
- Removed obsolete filesystem and process integration code
- Removed the previous standalone build ID and manifest generation flow

## v1.0.0 (2026-03-16)

### Added

- Released the first stable version of Winbows11

## v1.0.0-rc.1 (2026-03-16)

### Added

- Added support for running interactive CLI applications inside the terminal
- Added the new `Explorer.FilePicker` API for easier file browsing and selection
- Added configurable application headers
- Added sub-window support for GUI applications

### Improved

- Improved the loading screen to reduce lag and provide a smoother experience

### Fixed

- Fixed desktop icons not displaying correctly
- Fixed minimized windows disappearing from Task View after repeated toggling
- Fixed an issue where closing a tab in a TabView window did not automatically focus the remaining tab

## v1.0.0-beta.16 (2025-10-23)

### Added

- Added automatic title and icon updates for TabView windows when the active tab changes, its title or icon changes, or a tab receives focus

### Fixed

- Fixed taskbar thumbnail icons not being displayed
- Fixed Task View not automatically closing when a new window was opened

## v1.0.0-beta.15 (2025-10-21)

### Added

- Added taskbar application icons
- Added the Start menu
- Added window animations
- Added Task View

### Fixed

- Fixed the remaining installation time incorrectly displaying a negative value after installation completed
- Fixed installation failures caused by incorrect build metadata
- Fixed arguments such as `--key="value"` being parsed as `{ key: '"value"' }` instead of `{ key: 'value' }`
- Fixed the Mica background layer extending beyond the window viewport after resizing and causing visual overflow artifacts

## v1.0.0-beta.14 (2025-10-08)

### Added

- Added taskbar icons *(implemented in `v1.0.0-beta.15`)*
- Added the Settings application for the WRT environment
- Added the Start menu *(implemented in `v1.0.0-beta.15`)*
- Added type declarations for the WRT global object

### Fixed

- Restored the accidentally deleted `init.js` file
- Fixed task icon display issues in the Developer Tools Tasks tab and Task Manager
- Fixed an issue in File Explorer where changing the path in one tab also changed the path in another tab

## v1.0.0-beta.13 (2025-10-05)

### Breaking Changes

- Changed the system loading process
- Rewrote the WRT constructor and APIs

### Added

- Added debug logging
- Added the `System` object to the WRT context
- Added `System.shell`, an instance of the `ShellInstance` class
- Added `process.args`

### Changed

- Updated the Developer Tools console to `v1.3.2`
- Improved the `taskkill` command

## v1.0.0-beta.12 (2025-09-12)

### Added

- Added the `ver` command to the command registry
- Added the Developer Tools Tasks tab

### Changed

- Changed the BSOD background color
- Updated the Developer Tools console to `v1.3.1`

## v1.0.0-beta.11 (2025-09-04)

### Added

- Added icons to the taskbar
- Added a crash handler

### Fixed

- Fixed issues in the Task Manager application

## v1.0.0-beta.10 (2025-09-01)

### Fixed

- Fixed crashes when opening the Edge and Task Manager applications

## v1.0.0-beta.9 (2025-08-30)

### Added

- Added `minWidth` and `minHeight` options to the `BrowserWindow` class

## v1.0.0-beta.8 (2025-08-30)

### Fixed

- Fixed a theme issue in the BrowserWindow toolbar context menu

## v1.0.0-beta.7 (2025-08-29)

### Fixed

- Fixed the `cd` command

## v1.0.0-beta.6 (2025-08-28)

### Added

- Added a resizer bar to Developer Tools

### Fixed

- Fixed application window titles
- Improved Mica effect performance by reducing image quality

## v1.0.0-beta.5 (2025-08-28)

### Fixed

- Fixed the Mica effect
- Fixed issues in the Developer Tools Performance tab

## v1.0.0-beta.4 (2025-08-27)

### Added

- Added the `start` command to the command registry
- Added the application registry

### Fixed

- Fixed application window sizing and Snap preview sizing

## v1.0.0-beta.3 (2025-08-26)

### Fixed

- Fixed the window opening animation

## v1.0.0-beta.2 (2025-08-25)

### Changed

- Integrated the console window into Developer Tools

## v1.0.0-beta.1 (2025-08-21)

### Added

- Added a new code execution environment called WRT (Winbows Runtime)
- Added a debug console for WRT
- Added a new filesystem schema

### Changed

- Moved code execution from Web Workers to the WRT environment, allowing access to the `window` object from both background and content scripts
- Changed the executable file extension from `.wexe` to `.wrt`
- Replaced ES module-style imports and exports with Node.js-like module loading

## v0.2.0 (2025-07-04) [5d4d0ad59ac0dc4f14851ef0498f63e2c317851f]

### Added

- Added the Notepad and Settings applications
- Added the Mica effect *(beta)*
- Added dark theme support *(beta)*
- Added window animations
- Added reorderable taskbar icons

## v0.1.0 (2024-10-06) [654c474cb676b8c8d06c977ce50fda321e13c5e8]

### Added

- Added the installation page
- Added desktop shortcuts
- Added the Info application
- Added the Quick Settings panel
- Added the sidebar
- Added the Microhard Edge web browser
- Added VSCode, Paint, Command, Task Manager, FPS Meter, Photos, Network Listener, and JSON Viewer
- Added the taskbar context menu

## v0.0.0 (2024-08-27) [8d04c3c1f5ee04dcf4df6ec0849917248d3998f1]

### Added

- Added the lock screen
- Added a taskbar with application icons
- Added the Start menu
- Added desktop background support
- Added File Explorer

## Initial commit (2024-07-14)
