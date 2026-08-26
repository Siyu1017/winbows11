<div align="center">

![Winbows11](./public/assets/images/presentation.png)

# Winbows11

讓你在瀏覽器裡執行應用程式、管理檔案、使用終端機，並體驗流暢的視窗動畫與介面轉場。

<br>

[![GitHub License](https://img.shields.io/github/license/Siyu1017/winbows11)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Siyu1017/winbows11?style=flat)](https://github.com/Siyu1017/winbows11/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Siyu1017/winbows11?style=flat)](https://github.com/Siyu1017/winbows11/forks)
[![GitHub Issues](https://img.shields.io/github/issues/Siyu1017/winbows11)](https://github.com/Siyu1017/winbows11/issues)
[![Stable](https://img.shields.io/badge/stable-main-0078D4)](https://winbows11.vercel.app)
[![Beta](https://img.shields.io/badge/beta-beta-orange)](https://winbows11-beta.vercel.app)

[English](./README.md) | 繁體中文 | [简体中文](./README.zh-Hans.md)

</div>

## 試試 Winbows11

Winbows11 可以直接在瀏覽器中執行，不需安裝即可使用。

| 版本 | 分支 | 說明 | 網站 |
| :---: | :-: | --- | --- |
| **Stable** | `main` | 目前的穩定版本 | [winbows11.vercel.app](https://winbows11.vercel.app) |
| **Beta** | `beta` | 包含最新功能與架構變更的版本 | [winbows11-beta.vercel.app](https://winbows11-beta.vercel.app) |

## 關於 Winbows11

這個專案是由 [WebOS](https://github.com/Siyu1017/WebOS) 演變而來的，當初我受到 [Win11 in React](https://win11.blueedge.me/) 的啟發，決定自己寫一個網頁版 Win11 並把它命名為 WebOS，後來又在原本桌面模擬的基礎上慢慢加入自己的 runtime、檔案系統、進程管理、Shell、視窗管理與其他系統功能，一路變成了現在的 Winbows11。

目前 Winbows11 主要包含：

- Winbows Runtime（WRT）應用程式執行環境
- 以 IndexedDB 為主要持久化後端的虛擬檔案系統
- 進程、訊號、子進程與 stdio 模型
- 基於具名管道概念的 IPC
- Shell 與終端機
- `WApplication` / `BrowserWindow` 應用程式與視窗框架
- 工作列、開始選單、Task View
- 檔案總管、設定與其他已完成的內建應用程式
- Developer Tools、SDK 與系統 API
- HMGR 硬體抽象層，目前主要提供網路介面卡模擬

> [!IMPORTANT]
> Winbows11 是獨立開發的專案，與 Microsoft 沒有任何從屬、授權或合作關係。<br>
> 請勿將其與 Microsoft Windows、Windows 365 或其他 Microsoft 產品混淆。

## 畫面展示

### 桌面與應用程式

桌面可以同時開啟多個應用程式視窗並使用桌面捷徑，也可以將裝置上的檔案或資料夾拖曳至桌面在 Winbows11 上使用。

![Winbows11 desktop and applications](./public/assets/images/screenshots/desktop.png)

### Task View

Task View 會顯示目前開啟的視窗，讓使用者快速查看並切換正在運行的應用程式。

![Winbows11 Task View](./public/assets/images/screenshots/taskview.png)

### Snap 與多工

視窗可以 Snap 到桌面的不同區域，讓多個應用程式同時保持可見並一起操作。

![Winbows11 window snapping and multitasking](./public/assets/images/screenshots/multitask.png)

### Developer Tools

Developer Tools 內建工作列表、主控台、效能監視器、終端機與儲存空間面板，可以直接查看目前執行中的進程、效能與檔案系統資訊，也能透過主控台和終端機與 Winbows11 環境互動。

![Winbows11 Developer Tools](./public/assets/images/screenshots/devtool.png)

## 功能

### 桌面環境

- 視窗拖曳與縮放
- 最小化、最大化、全螢幕與視窗 Snap
- 可重新排列應用程式圖示的工作列
- 開始選單
- Task View
- 桌面捷徑
- 鎖定螢幕
- 右鍵選單
- 自訂主題與桌布
- Mica 風格視覺效果

### 內建應用程式

Winbows11 內建多個應用程式，以下為目前已完成的應用程式：

- 檔案總管
- Microhard Edge
- VSCode
- Command Prompt
- 小畫家
- Info
- 工作管理員
- FPS Meter
- 照片
- Network Listener
- JSON 檢視器
- 記事本
- 設定
- Node.js

### Developer Tools

Developer Tools 目前包含：

- 工作列表，可查看 Runtime ID、PID 等進程資訊
- 主控台
- 效能監視器，可查看 FPS 與已使用的 JavaScript heap 大小
- 終端機
- 儲存空間面板，支援資料夾樹狀瀏覽，並能查看檔案大小與最後修改時間

## Winbows Runtime

**WRT（Winbows Runtime）** 是 Winbows11 的應用程式執行環境，為瀏覽器中的應用程式提供部分 Node.js-like APIs。部分設計概念受到 [Windows 96](https://windows96.net/) 啟發，但 WRT 本身為 Winbows11 專案中的獨立實作，並不代表與 Windows 96 共享程式碼、具有衍生關係或保證 API 相容性。

目前 WRT 包含：

- 進程 ID 與父進程 ID
- 進程生命週期與狀態管理
- 進程訊號
- 環境變數
- 進程參數
- `stdin`、`stdout` 與 `stderr`
- TTY 串流
- 子進程
- `spawn()`、`exec()`、`execFile()` 與 `fork()`
- 模組載入與快取
- 系統 API
- 透過 `WApplication` 建立 GUI 應用程式
- 與 Winbows11 IPC、Shell、VFS 及視窗系統整合

## 檔案系統

Winbows11 使用可持久化儲存在瀏覽器中的虛擬檔案系統，目前支援：

- 支援磁碟區的檔案系統模型
- 獨立的 `C:` 系統磁碟區
- 以 IndexedDB 為主要持久化儲存後端
- 類似 Node.js 的檔案系統 API
- 類似 Node.js 的路徑處理工具
- 檔案與資料夾操作
- 檔案系統事件
- 舊版檔案系統資料遷移

> [!IMPORTANT]
> 在某些情況下 IndexedDB 無法使用時，Winbows11 會嘗試使用記憶體作為載體，將使用到的檔案暫存於記憶體中，這些檔案會在網頁刷新或關閉後消失

## Shell 與終端機

Command Prompt 與 WRT 進程都使用 Winbows11 的 Shell，目前支援：

- 內建指令 (可在 Command Prompt 中輸入 `help` 命令查看)
- WRT 程式
- 使用 `|` 的指令管線
- 使用 `>` 與 `>>` 的輸出重新導向
- 使用 `%NAME%` 的環境變數展開
- 檔案與資料夾相關指令
- 文字處理指令

例如：

```text
dir | find ".js" > files.txt
```

## 應用程式框架

GUI 應用程式可以透過 `WApplication` 和 `BrowserWindow` 建立及管理視窗，目前可以使用：

- 主視窗
- 子視窗
- 彈出視窗
- 視窗生命週期事件
- 視窗色彩主題
- WRT 腳本載入
- 可存取應用程式視窗中的 DOM
- 使用 `BrowserWindow.loadFile()` 直接載入本機 HTML
- 應用程式註冊
- 副檔名關聯（目前僅限內建應用程式）

## 瀏覽器支援

Winbows11 主要在 Google Chrome 和 Microsoft Edge 等基於 Chromium 的瀏覽器上開發與測試，而 Safari 目前只做過部分相容性修正，例如處理私密瀏覽模式下 IndexedDB 無法使用的情況，還沒有經過完整測試，因此其他瀏覽器雖然可能也能正常使用，目前仍不保證相容性。

## TODO

Winbows11 仍在持續開發中，目前主要規劃包括：

### 應用程式

- [ ] 計算機
- [ ] Microhard Store
- [ ] 媒體播放器
- [ ] 完成更多設定頁面與設定功能

### 系統

- [ ] 完善應用程式安裝、更新與移除機制
- [ ] 擴充磁碟區支援
- [ ] 改善檔案系統監看與事件行為
- [ ] 擴充檔案類型與預設應用程式關聯
- [ ] 擴充 HMGR，加入 NIC 以外的虛擬硬體介面
- [ ] 擴充系統 API 與 Shell 內建指令

### 桌面與視窗

- [ ] 加入開始選單搜尋功能
- [ ] 加入應用程式清單
- [ ] 加入小工具（Widgets）
- [ ] 擴充個人化功能
- [ ] 改善多視窗與模態／彈出視窗行為

### 開發體驗

- [ ] 擴充 WRT SDK 與範例
- [ ] 完善 WRT TypeScript 型別宣告
- [ ] 提供更完整的應用程式開發文件
- [ ] 改善 Developer Tools 效能

### 相容性與在地化

- [ ] 提升 Safari 與其他非 Chromium 瀏覽器的相容性
- [ ] 擴充更多語言
- [ ] 改善不同螢幕尺寸與行動裝置上的使用體驗

> TODO 內容不代表固定的開發順序，實際實作項目與優先順序可能隨 Winbows11 的架構調整而變更。

## 開發

安裝專案相依套件：

```bash
npm install
```

建立開發版本：

```bash
npm run build:dev
```

啟動開發伺服器：

```bash
npm run start:dev
```

監控原始碼變更並自動重新建置：

```bash
npm run build:watch
```

執行 TypeScript 檢查：

```bash
npm run type-check
```

建立正式版本：

```bash
npm run build
```

產生的網站與 Winbows11 系統檔案會輸出到 `public/`。

## 專案結構

```text
winbows11
├─ src/
│  ├─ os/                 核心作業環境與 runtime
│  ├─ pages/              網站與安裝頁面
│  └─ shared/             共用模組與工具
│
├─ types/
│  └─ wrt/                WRT TypeScript 型別宣告
│
├─ scripts/
│  └─ build.js            建置流程
│
├─ public/
│  ├─ assets/
│  │  ├─ images/          靜態圖片與截圖
│  │  ├─ scripts/         產生的 JavaScript
│  │  └─ styles/          產生的樣式表
│  ├─ Program Files/      應用程式
│  ├─ Winbows/            系統檔案與內建應用程式
│  └─ User/               預設使用者檔案系統
│
├─ server.js
├─ tsconfig.json
└─ webpack.config.js      Webpack build 設定
```

## 參與開發

歡迎提交錯誤回報、建議或程式碼貢獻，回報問題時請附上足以重現問題的資訊，並說明預期行為與實際發生的行為。

## 變更紀錄

版本歷史與主要變更請參閱 [CHANGELOG.md](./CHANGELOG.md)。

## 授權

授權資訊請參閱 [LICENSE](./LICENSE)。
