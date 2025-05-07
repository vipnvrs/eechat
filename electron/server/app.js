// app.js
const paths = require('./config/paths')
const path = require('path')
const fs = require('fs')
class AppBootHook {
  constructor(app) {
    this.app = app
  }

  configWillLoad() {
    // 此时 config 文件已经被读取并合并，但是还并未生效
    // 这是应用层修改配置的最后时机
    // 注意：此函数只支持同步调用
    this.app.logger.info("[AppDataPath]:", paths.appDataPath)
  }

  async didLoad() {
    // 所有的配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义的服务
  }

  async willReady() {
    // 所有的插件都已启动完毕，但是应用整体还未 ready
    // 可以做一些数据初始化等操作，这些操作成功才会启动应用
    try {
      // 检查数据库是否存在，不存在则创建
      const dbDir = path.dirname(this.app.config.sequelize.storage);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // 使用更安全的同步方式
      const res = await this.app.model.sync({ 
        alter: true,
        // 添加以下选项，处理备份表冲突问题
        force: false,
        // 添加自定义处理逻辑
        hooks: {
          beforeSync: async (options) => {
            this.app.logger.info('开始同步数据库结构...');
          },
          afterSync: async (options) => {
            this.app.logger.info('数据库结构同步完成');
          }
        }
      });
      this.app.logger.info('数据库结构同步成功');
    } catch (error) {
      // 如果是唯一约束错误，可能是备份表问题，尝试使用不同的同步策略
      if (error.name === 'SequelizeUniqueConstraintError') {
        this.app.logger.warn('检测到备份表冲突，尝试使用替代方案同步...');
        try {
          // 使用不创建备份表的方式同步
          await this.app.model.sync({ force: false });
          this.app.logger.info('数据库结构同步成功(替代方案)');
        } catch (retryError) {
          this.app.logger.error('数据库结构同步失败(替代方案):', retryError);
        }
      } else {
        this.app.logger.error('数据库结构同步失败:', error);
      }
    }
  }

  async didReady() {
    // 应用已经启动完毕
    try {
      const updateDatabase = require('./scripts/updateDatabase')
      await updateDatabase(this.app.logger)
      this.app.logger.info('数据库初始化/更新成功')
    } catch (error) {
      this.app.logger.error('数据库初始化/更新失败:', error)
      // 如果数据库初始化失败，可以选择退出应用
      // process.exit(1)
    }
  }

  async serverDidReady() {
    // http / https server 已启动，开始接受外部请求
    // 此时可以从 app.server 拿到 server 的实例
  }
}

module.exports = AppBootHook
