// app.js
class AppBootHook {
  constructor(app) {
    this.app = app
  }

  configWillLoad() {
    // 此时 config 文件已经被读取并合并，但是还并未生效
    // 这是应用层修改配置的最后时机
    // 注意：此函数只支持同步调用
  }

  async didLoad() {
    // 所有的配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义的服务
  }

  async willReady() {
    // 所有的插件都已启动完毕，但是应用整体还未 ready
    // 可以做一些数据初始化等操作，这些操作成功才会启动应用

    try {
      // 关闭外键约束，这对SQLite很重要
      await this.app.model.query('PRAGMA foreign_keys = OFF;')
      console.log('[App] 暂时关闭外键约束以便同步数据库结构')

      // 同步所有模型到数据库
      // 使用 alter: true 允许修改现有表结构
      await this.app.model.sync({ alter: true })
      console.log('[App] 数据库结构同步完成')

      // 重新开启外键约束
      await this.app.model.query('PRAGMA foreign_keys = ON;')
      console.log('[App] 重新开启外键约束')

      // 检查数据库中的记录数量
      const providerCount = await this.app.model.LlmProvider.count()
      const modelCount = await this.app.model.LlmModel.count()
      console.log(
        `[App] 数据库中共有 ${providerCount} 个提供商和 ${modelCount} 个模型`,
      )
    } catch (error) {
      console.error('[App] 数据库同步出错:')
      // 如果出现错误，尝试使用更安全的方式同步
      try {
        console.log('[App] 尝试使用备用方式同步数据库...')
        // 只同步新表，不修改现有表
        await this.app.model.sync()
        console.log('[App] 数据库基本同步完成')
      } catch (secondError) {
        console.error('[App] 备用同步方式也失败:', secondError)
      }
    }
  }

  async didReady() {
    // 应用已经启动完毕
    try {
      const updateDatabase = require('./scripts/updateDatabase')
      await updateDatabase()
      console.log('数据库初始化/更新成功')
    } catch (error) {
      console.error('数据库初始化/更新失败:', error)
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
