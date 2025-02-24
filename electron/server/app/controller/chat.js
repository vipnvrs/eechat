const { Controller } = require('egg')

class ChatController extends Controller {
  async chat() {
    const { ctx } = this
    const { messages } = ctx.request.body

    try {
      const result = await ctx.service.chat.sendMessage(messages)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.status = 200 // 保持 HTTP 状态码为 200
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = ChatController
