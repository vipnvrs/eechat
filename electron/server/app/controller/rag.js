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

  // 创建知识库
  async createBase() {
    const { ctx } = this
    const data = ctx.request.body
    const uid = ctx.request.query.uid || 'default-user'
    
    try {
      const result = await ctx.service.ragCrud.ragBase.create(data, uid)
      if (result.success) {
        ctx.body = ctx.helper.success(result.data)
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('创建知识库失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 获取知识库列表
  async listBase() {
    const { ctx } = this
    const query = ctx.query
    const uid = ctx.request.query.uid || 'default-user'
    const { is_default, page = 1, pageSize = 20 } = query

    try {
      const result = await ctx.service.ragCrud.ragBase.list(uid, is_default, page, pageSize)
      if (result.success) {
        ctx.body = ctx.helper.success({
          list: result.data,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        })
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('获取知识库列表失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 获取知识库详情
  async getBase() {
    const { ctx } = this
    const { id } = ctx.params

    try {
      const result = await ctx.service.ragCrud.ragBase.get(id)
      if (result.success) {
        ctx.body = ctx.helper.success(result.data)
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('获取知识库详情失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 更新知识库
  async updateBase() {
    const { ctx } = this
    const { id } = ctx.params
    const data = ctx.request.body

    try {
      const result = await ctx.service.ragCrud.ragBase.update(id, data)
      if (result.success) {
        ctx.body = ctx.helper.success(result.data)
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('更新知识库失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 删除知识库
  async deleteBase() {
    const { ctx } = this
    const { id } = ctx.params

    try {
      const result = await ctx.service.ragCrud.ragBase.delete(id)
      if (result.success) {
        ctx.body = ctx.helper.success(result.message)
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('删除知识库失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }

  // 设置默认知识库
  async setDefaultBase() {
    const { ctx } = this
    const { id } = ctx.params
    const uid = ctx.request.query.uid || 'default-user'

    try {
      const result = await ctx.service.ragCrud.ragBase.setDefault(id, uid)
      if (result.success) {
        ctx.body = ctx.helper.success(result.message)
      } else {
        ctx.body = ctx.helper.error(result.error)
      }
    } catch (error) {
      ctx.logger.error('设置默认知识库失败:', error)
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = RagController
