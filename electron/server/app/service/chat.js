const { Service } = require('egg')
const OpenAI = require('openai')

class ChatService extends Service {
  /**
   * 发送消息到大模型
   * @param {string} messages - 聊天内容
   * @reurns {Promise<string>} - 返回聊天结果
   */
  async sendMessage(messages) {
    const { ctx } = this
    try {
      const openai = new OpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'dummy',
      })
      const requestParams = {
        model: 'deepseek-r1',
        messages,
        stream: true,
      }
      const stream = await openai.chat.completions.create(requestParams)
      ctx.set({
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      ctx.res.statusCode = 200
      for await (const chunk of stream) {
        const data = {
          code: 0,
          data: {
            content: chunk.choices[0]?.delta?.content || '',
          },
        }
        ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
      }
      ctx.res.end()
    } catch (error) {
      ctx.logger.error('Chat service error:', error)
      throw error
    }
  }

  /**
   * 保持未历史对话
   * @param {string} uid - 用户 ID
   * @param {string} role - 用户角色
   * @param {string} msg - 聊天内容
   * @returns {Promise<void>}
   */
  async saveMsg(uid, role, msg) {}
}

module.exports = ChatService
