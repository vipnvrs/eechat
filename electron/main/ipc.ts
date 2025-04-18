import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'
// 引入下载工厂
import { downloader, DownloadStatus } from './downloader'

export class Ipc {
  constructor() {
    this.init()
  }

  private getToolFilename(name: string): string {
    return process.platform === 'win32' ? `${name}.exe` : name
  }


  private init() {
    ipcMain.handle('get-app-version', () => {
      return app.getVersion()
    })

    // 获取各种路径
    ipcMain.handle('get-app-paths', () => {
      const userData = app.getPath('userData')
      return {
        config: path.join(userData, 'config'),
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

    // 检查工具是否安装
    ipcMain.handle('check-tool', (_, name: string) => {
      const binPath = path.join(app.getPath('userData'), 'bin')
      const toolPath = path.join(binPath, this.getToolFilename(name))
      return fs.existsSync(toolPath)
    })

    // 获取工具文件名
    ipcMain.handle('get-tool-filename', (_, name: string) => {
      return this.getToolFilename(name)
    })

    // 获取所有下载任务
    ipcMain.handle('get-download-tasks', () => {
      return downloader.getAllTasks();
    });

    // 获取单个下载任务
    ipcMain.handle('get-download-task', (_, id: string) => {
      return downloader.getTask(id);
    });

    // 创建下载任务
    ipcMain.handle('create-download-task', (_, url: string, destination: string, filename?: string) => {
      return downloader.createTask(url, destination, filename);
    });

    // 开始下载任务
    ipcMain.handle('start-download-task', (_, id: string) => {
      return downloader.startTask(id);
    });

    // 暂停下载任务
    ipcMain.handle('pause-download-task', (_, id: string) => {
      return downloader.pauseTask(id);
    });

    // 取消下载任务
    ipcMain.handle('cancel-download-task', (_, id: string) => {
      return downloader.cancelTask(id);
    });

    // 删除下载任务
    ipcMain.handle('delete-download-task', (_, id: string, deleteFile: boolean = false) => {
      return downloader.deleteTask(id, deleteFile);
    });

    // 下载工具
    ipcMain.handle('download-tool', async (_, name: string) => {
      try {
        const filename = process.platform === 'win32' ? `${name}.exe` : name;
        const url = `http://8.130.172.245/bin/${process.platform === 'win32' ? 'win' : 'linux'}/${filename}`;
        
        // 创建下载任务并返回任务ID
        const taskId = await downloader.downloadTool(url, filename);
        
        // 监听任务完成事件
        return new Promise((resolve, reject) => {
          const onComplete = (task) => {
            if (task.id === taskId) {
              downloader.removeListener('taskCompleted', onComplete);
              downloader.removeListener('taskFailed', onFailed);
              resolve(true);
            }
          };
          
          const onFailed = (task) => {
            if (task.id === taskId) {
              downloader.removeListener('taskCompleted', onComplete);
              downloader.removeListener('taskFailed', onFailed);
              reject(new Error(task.error || '下载失败'));
            }
          };
          
          downloader.on('taskCompleted', onComplete);
          downloader.on('taskFailed', onFailed);
        });
      } catch (error) {
        throw new Error(`下载工具失败: ${error.message}`);
      }
    });
  }
}