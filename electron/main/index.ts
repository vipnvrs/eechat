import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'child_process'
import { AppUpdater, registerUpdaterHandlers } from './updater'
import { registerLlamaHandlers } from './playground/nodeLlamaCpp'
import { Playground } from './playground/playground'
import { Analytics } from './analytics'
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = app.isPackaged ? 'production' : 'development'
}

const log = require('electron-log')
log.transports.file.level = 'debug'
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs/main.log')
log.info('%cRed text. %cGreen text', 'color: red', 'color: green')
// Object.assign(console, log.functions)

// 捕获未处理的异常
process.on('uncaughtException', error => {
  log.error('未捕获的异常:', error)
})

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

// Ensure single instance
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let updater: AppUpdater | null = null
// let nodeLlamaCpp: any
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const windowWidth = Math.min(1200, width * 0.8)
  const windowHeight = Math.min(800, height * 0.8)
  new Analytics()
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

  win.webContents.openDevTools()
  win.setMenuBarVisibility(false)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged 
    if(!app.isPackaged) win.webContents.openDevTools()
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

  // 初始化更新器
  if (app.isPackaged) {
    updater = new AppUpdater(win)
    registerUpdaterHandlers(updater)
  }
  // 保存返回的 llamaService 实例
  const nodeLlamaCpp = registerLlamaHandlers()
  console.log('Llama handlers registered successfully')
}

let appServer: any = null
const egg = require('egg')
async function startEggServer(pathArg): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const isDev = process.env.NODE_ENV !== 'production'
    log.info('isDev:', isDev)
    const baseDir = isDev
      ? path.join(__dirname, '../../electron/server')
      : path.join(process.resourcesPath, 'app', '../server')
    log.info('baseDir:', baseDir)
    try {
      appServer = await egg.start({
        baseDir: baseDir,
      })
      appServer.listen(7002)
      log.info(`Server started on ${7002}`)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
async function stopEggServer(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log(appServer)

      await appServer.close()
      console.log(`Server stoped`)
    } catch (error) {
      log.error(error)
      reject(error)
    }
  })
}

const initUpdate = () => {
  if (app.isPackaged && updater) {
    setTimeout(() => {
      updater.checkUpdate()
    }, 3000)
  }
}

// 在 app ready 时启动 EggJS
app.whenReady().then(async () => {
  try {
    createWindow()
    await startEggServer('')
    initUpdate()
    const playground = new Playground(win)
  } catch (error) {
    console.error('Failed to start EggJS server:', error)
    app.quit()
  }
})

// 在应用退出时关闭 EggJS 进程
app.on('window-all-closed', () => {
  // win = null
  console.log('window-all-closed')
  appServer.close()
  app.quit()
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

ipcMain.handle('get-platform', () => {
  return process.platform
})

// ipcMain.handle('exec', async (_, command) => {
//   const { exec } = require('child_process')
//   return new Promise((resolve, reject) => {
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(error)
//         return
//       }
//       resolve(stdout)
//     })
//   })
// })

// 添加打开外部链接的 handler
ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url)
})

// 添加打开下载页面的 handler
ipcMain.handle('open-url', (_, url) => {
  return shell.openExternal(url)
})

// startEggServer
ipcMain.handle('startEggServer', async (_, pathArg) => {
  try {
    const res = await startEggServer(pathArg)
    return res
  } catch (error) {
    console.error('Failed to start EggJS server:', error)
    return error
  }
})
// stopEggServer
ipcMain.handle('stopEggServer', async (_, pathArg) => {
  try {
    const res = await stopEggServer()
    return res
  } catch (error) {
    console.error('Failed to stop EggJS server:', error)
    return error
  }
})

app.on('render-process-gone', (event, webContents, details) => {
  console.error('渲染进程崩溃:', details.reason)
  app.exit()
})

// 添加更详细的错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:');
  console.error('- 原因:', reason);
  
  // 创建一个对话框显示错误
  if (win) {
    const { dialog } = require('electron')
    dialog.showErrorBox(
      '应用程序错误',
      `发生未处理的错误:\n${reason instanceof Error ? reason.stack : String(reason)}`
    );
  }
  
  // 将错误写入文件
  const fs = require('fs')
  const logPath = path.join(app.getPath('userData'), 'logs/error.log');
  fs.appendFileSync(
    logPath,
    `[${new Date().toISOString()}] 未处理的 Promise 拒绝:\n${reason instanceof Error ? reason.stack : String(reason)}\n\n`
  );
  
  console.error(`错误已记录到: ${logPath}`);
});
