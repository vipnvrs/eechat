import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'child_process'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const log = require('electron-log');
log.transports.file.level = 'debug';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error);
});

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  // 获取主屏幕的尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // 设置窗口的宽度和高度
  const windowWidth = Math.min(1200, width * 0.8) // 窗口宽度为屏幕宽度的80%，最大宽度为1200px
  const windowHeight = Math.min(800, height * 0.8) // 窗口高度为屏幕高度的80%，最大高度为800px

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: windowWidth,
    height: windowHeight,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#666666',
      // height: 64,
    },
    webPreferences: {
      preload,
      webSecurity: false,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // 隐藏菜单栏
  win.setMenuBarVisibility(false)

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

// 添加启动 EggJS 的函数
const egg = require('egg');
async function startEggServer(): Promise<void> {
  const serverPath = path.join(process.env.APP_ROOT, 'electron/server')

  return new Promise<void>(async (resolve, reject) => {
    // 使用 cross-spawn 来处理跨平台命令
    const app = await egg.start({
      baseDir: path.join(__dirname, '../../electron/server'),
      // baseDir: path.join(__dirname, '../server'),
    });
  
    app.listen(7002); // 端口
    console.log(`Server started on ${7002}`);
    resolve();
  });
}

// 在 app ready 时启动 EggJS
app.whenReady().then(async () => {
  try {
    await startEggServer()
    createWindow()
  } catch (error) {
    console.error('Failed to start EggJS server:', error)
    app.quit()
  }
})

// 在应用退出时关闭 EggJS 进程
app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    // 关闭 EggJS 进程
    if (global.eggProcess) {
      global.eggProcess.kill()
    }
    app.quit()
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 添加 ipcMain handler 来处理系统平台查询
ipcMain.handle('get-platform', () => {
  return process.platform
})

// 添加执行命令的 handler
ipcMain.handle('exec', async (_, command) => {
  const { exec } = require('child_process')
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
})

// 添加打开外部链接的 handler
ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url)
})

// 添加打开下载页面的 handler
ipcMain.handle('open-url', (_, url) => {
  return shell.openExternal(url)
})
