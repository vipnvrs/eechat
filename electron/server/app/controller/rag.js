const { Controller } = require('egg')

class RagController extends Controller {
  // 获取 RAG 配置
  async getConfig() {
    const { ctx } = this

    try {
      const config = await ctx.service.rag.getConfig()
      ctx.body = ctx.helper.success(config)
    } catch (error) {
      ctx.logger.error('获取RAG配置失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 保存 RAG 配置
  async saveConfig() {
    const { ctx } = this
    const configData = ctx.request.body

    try {
      if (!configData || Object.keys(configData).length === 0) {
        ctx.body = ctx.helper.error('配置数据不能为空')
        return
      }

      const result = await ctx.service.rag.saveConfig(configData)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.logger.error('保存RAG配置失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 处理文档
  async processDocument() {
    const { ctx } = this
    const documentData = ctx.request.body

    try {
      if (!documentData || !documentData.content) {
        ctx.body = ctx.helper.error('文档内容不能为空')
        return
      }

      const result = await ctx.service.rag.processDocument(documentData)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.logger.error('处理文档失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 查询
  async query() {
    const { ctx } = this
    const { query, mode, options } = ctx.request.body

    try {
      if (!query) {
        ctx.body = ctx.helper.error('查询内容不能为空')
        return
      }

      const result = await ctx.service.rag.query(query, { mode, ...options })
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.logger.error('查询处理失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 获取 RAG 服务状态
  async getStatus() {
    const { ctx } = this

    try {
      const status = await ctx.service.rag.getStatus()
      ctx.body = ctx.helper.success(status)
    } catch (error) {
      ctx.logger.error('获取RAG服务状态失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 重启 RAG 服务
  async restartService() {
    const { ctx } = this

    try {
      const result = await ctx.service.rag.restartService()
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.logger.error('重启RAG服务失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = RagController
