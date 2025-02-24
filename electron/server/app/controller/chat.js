const { Controller } = require('egg')

class ChatController extends Controller {
  async sendMessage() {
    const { ctx } = this
    const { messages, sessionId } = ctx.request.body
    try {
      const result = await ctx.service.chat.sendMessage(messages, sessionId)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.status = 200 // 保持 HTTP 状态码为 200
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async history() {
    const { ctx } = this
    const { page = 1, pageSize = 20 } = ctx.query
    const sessionId = ctx.params.id
    const uid = 'default-user'
    try {
      const result = await ctx.service.chat.getHistory(
        sessionId,
        uid,
        page,
        pageSize,
      )
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async createSession() {
    const { ctx } = this
    const { title = '新对话' } = ctx.request.body

    try {
      // 创建新会话
      const session = {
        title,
        uid: 'default-user', // 暂时使用默认用户
      }
      const result = await ctx.service.chat.createSession(session)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async listSession() {
    const { ctx } = this
    const { page = 1, pageSize = 20 } = ctx.query

    try {
      const result = await ctx.service.chat.listSession(page, pageSize)

      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = ChatController
