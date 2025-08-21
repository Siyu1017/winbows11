# Winbows Node.js Runtime API

This document describes the APIs available in the **Winbows Node.js Runtime (WRT)** environment.

## System Modules

### `fs`

WRT built-in File System module for reading, writing, and managing files and directories.

- **Type:** `Module`
- **Reference:** [fs Documentation](...)

### `path`

WRT built-in Path module for handling and transforming file paths.

- **Type:** `Module`
- **Reference:** [path Documentation](...)

### `process`

Provides runtime information and control over the current process.

- **Type:** `Process` object
- **Reference:** [process Documentation](...)

## Environment Variables

### `__dirname`

Absolute path of the directory containing the current module.

### `__filename`

Absolute path of the current module file.

## Module System

### `requireAsync(module)`

Loads a module asynchronously.  
This is the preferred way to import modules in WRT.

- **Parameters:**
  - `module` (`string`) — Module name or path.
- **Returns:** `Promise<any>`
- **Example:**

  ```js
  const utils = await requireAsync('./utils');
  utils.doSomething();
  ```

### `module`

Represents the current module's metadata and exports.

- **Properties:**
  - `exports` — The object to be exported.
- **Example:**

  ```js
  const myModule = 'something';
  module.exports = myModule;
  ```

### `exports`

Alias for `module.exports`.

## Runtime

### `runtimeID`

A unique identifier for the current WRT runtime instance.

## Shell and UI

### `ShellInstance`

Represents a Shell instance.

- **Type:** `class`
- **Purpose:** Execute commands and manage the Shell environment.

#### Methods

| Method | Description |
|--------|-------------|
| `write(input: string): void` | Sends input to the shell process. |
| `execCommand(command: string): Promise<void>` | Executes a command in the shell. |
| `setEnv(key: string, value: string): void` | Sets an environment variable. |
| `unsetEnv(key: string): void` | Unsets an environment variable. |
| `getEnv(key: string): string\|undefined` | Retrieves an environment variable. |
| `getAllEnv(): object` | Get all environment variables. |
| `dispose(exitCode?: number): void` | Closes the shell instance. |

#### Events

| Event | Description |
|-------|-------------|
| `output` | Emitted when the shell outputs data. |
| `error` | Emitted when an error occurs in the shell. |
| `dispose` | Emitted when the shell process exits. |

### `WinUI`

Provides APIs for creating and managing Winbows UI components such as contextmenu.

## Application

### `WApplication`

Represents a Winbows application object.

- **Properties:**
  - `app` — Global application manager.
  - `BrowserWindow` — Class for creating and managing application windows.

#### `app` (Application Manager)

##### Methods

| Method | Description |
|--------|-------------|
| `on(event: string, listener: Function)` | Registers an event listener. |
| `quit()` | Quits the application. |

##### Events

| Event | Description |
|-------|-------------|
| `ready` | Emitted when the application is ready to create windows. |
| `window-all-closed` | Emitted when all windows are closed. |
| `before-quit` | Emitted before the application quits. |

#### `BrowserWindow` (Window Management)

##### Constructor

```js
new BrowserWindow(options?: BrowserWindowOptions)
```

- **Parameters:**  
  - `options` (`object`) — Window configuration (width, height, title, etc.).

##### Methods

| Method | Description |
|--------|-------------|
| `loadURL(url: string): void` | Loads a remote URL into the window. |
| `loadFile(filePath: string): void` | Loads a local HTML file into the window. |
| `show(): void` | Shows the window. |
| `hide(): void` | Hides the window. |
| `close(): void` | Closes the window. |
| `setTitle(title: string): void` | Sets the window title. |

##### Events

| Event | Description |
|-------|-------------|
| `ready-to-show` | Emitted when the window is ready to be displayed. |
| `closed` | Emitted when the window is closed. |
| `focus` | Emitted when the window gains focus. |
| `blur` | Emitted when the window loses focus. |

### Example Usage

```js
const { app, BrowserWindow } = WApplication;

app.on('ready', () => {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('https://example.com');
});
```
