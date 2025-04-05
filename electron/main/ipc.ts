import { app, BrowserWindow, dialog, ipcMain } from 'electron'

export class Ipc {
  constructor() {
    this.init()
  }

  private init() {
    ipcMain.handle('get-app-version', () => {
      return app.getVersion()
    })
  }
  
}