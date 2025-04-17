import { app, BrowserWindow, dialog, ipcMain,shell } from 'electron'
import path from 'path'
export class Ipc {
  constructor() {
    this.init()
  }

  private init() {
    ipcMain.handle('get-app-version', () => {
      return app.getVersion()
    })

    // 获取各种路径
    ipcMain.handle('get-app-paths', () => {
      const userData = app.getPath('userData')
      return {
        database: path.join(userData, 'database'),
        executable: path.join(userData, 'bin'),
        logs: path.join(userData, 'logs')
      }
    })

    // 打开目录
    ipcMain.handle('open-directory', (_, dirPath: string) => {
      if (dirPath) {
        return shell.openPath(dirPath)
      }
      return false
    })
  }
  
}