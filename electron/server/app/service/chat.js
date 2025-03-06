const { Service } = require('egg')
const OpenAI = require('openai')

class ChatService extends Service {
  /**
   * 发送消息到大模型
   * @param {string} messages - 聊天内容
   * @param {string} sessionId - 会话ID
   * @reurns {Promise<string>} - 返回聊天结果
   */
  async sendMessage(model, messages, sessionId) {
    const { ctx } = this
    try {
      // 如果没有会话ID,创建新会话
      // if (!sessionId) {
      //   const session = await this.createSession({
      //     title: messages[0]?.content?.slice(0, 50) || '新对话',
      //     uid: 'default-user',
      //   })
      //   sessionId = session.id
      // }
      console.log('sendMessage', messages, sessionId)

      const openai = new OpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'dummy',
      })

      // 保存用户最后一条消息
      await this.saveMsg(
        'default-user',
        messages[messages.length - 1].role,
        messages[messages.length - 1].content,
        sessionId,
      )

      const requestParams = {
        model: model.id,
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

      let assistantMessage = '' // 用于累积助手的完整回复

      for await (const chunk of stream) {
        const content =
          (chunk.choices[0] &&
            chunk.choices[0].delta &&
            chunk.choices[0].delta.content) ||
          ''
        assistantMessage += content // 累积回复内容

        const data = {
          code: 0,
          data: {
            content,
            sessionId,
          },
        }
        ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      // 保存助手的完整回复
      if (assistantMessage) {
        await this.saveMsg(
          'default-user',
          'assistant',
          assistantMessage,
          sessionId,
        )
      }

      ctx.res.end()
    } catch (error) {
      ctx.logger.error('Chat service error:', error)
      throw error
    }
  }

  /**
   * 保持为历史对话
   * @param {string} uid - 用户 ID
   * @param {string} role - 用户角色
   * @param {string} content - 聊天内容
   * @param {string} id - 消息 ID
   * @returns {Promise<void>}
   */
  async saveMsg(uid, role, content, sessionId) {
    const { ctx } = this
    console.log('saveMsg', uid, role, content, sessionId)

    // 参数验证
    if (!uid || !role || !content || !sessionId) {
      throw new Error('参数不完整')
    }

    // 验证角色是否合法
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new Error('无效的角色类型')
    }

    try {
      // 创建消息记录
      const message = await ctx.model.Message.create({
        session_id: sessionId,
        uid,
        role,
        content,
        created_at: new Date(),
        updated_at: new Date(),
      })

      return message
    } catch (error) {
      ctx.logger.error('保存消息失败:', error)
      throw new Error('保存消息失败: ' + error.message)
    }
  }

  /**
   * 获取对话历史记录
   * @param {string} sessionId - 会话ID
   * @param {string} uid - 用户ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns
   */
  async getHistory(sessionId, uid, page = 1, pageSize = 20) {
    console.log('getHistory', sessionId, uid, page, pageSize)

    const { ctx } = this

    if (!uid || !sessionId) {
      throw new Error('getHistory参数不完整')
    }

    try {
      const offset = (page - 1) * pageSize

      const { count, rows } = await ctx.model.Message.findAndCountAll({
        where: {
          session_id: sessionId,
          uid: uid,
        },
        order: [['created_at', 'ASC']],
        offset,
        limit: pageSize,
      })

      return {
        total: count,
        page,
        pageSize,
        data: rows,
      }
    } catch (error) {
      ctx.logger.error('获取历史记录失败:', error)
      throw new Error('获取历史记录失败: ' + error.message)
    }
  }

  /**
   * 创建新的对话会话
   * @param {Object} params - 创建参数
   * @param {string} params.title - 会话标题
   * @param {string} params.uid - 用户ID
   */
  async createSession(params) {
    const { ctx } = this
    const { title, uid } = params

    try {
      // 创建新会话
      const session = await ctx.model.ChatSession.create({
        title,
        uid,
        model: 'deepseek-r1', // 默认模型
        created_at: new Date(),
        updated_at: new Date(),
      })

      return session
    } catch (error) {
      ctx.logger.error('创建会话失败:', error)
      throw new Error('创建会话失败: ' + error.message)
    }
  }

  async getSession(id) {
    const { ctx } = this

    if (!id) {
      throw new Error('会话ID不能为空')
    }

    try {
      const session = await ctx.model.ChatSession.findByPk(id, {
        include: [
          {
            model: ctx.model.Message,
            as: 'messages',
            order: [['created_at', 'ASC']],
          },
        ],
      })
      console.log(session)

      return session
    } catch (error) {
      ctx.logger.error('获取会话失败:', error)
      throw new Error('获取会话失败: ' + error.message)
    }
  }

  async listSession(page = 1, pageSize = 20) {
    const { ctx } = this

    try {
      const offset = (page - 1) * pageSize

      const { count, rows } = await ctx.model.ChatSession.findAndCountAll({
        order: [['created_at', 'DESC']],
        offset,
        limit: pageSize,
      })

      return {
        total: count,
        page,
        pageSize,
        data: rows,
      }
    } catch (error) {
      ctx.logger.error('获取会话列表失败:', error)
      throw new Error('获取会话列表失败: ' + error.message)
    }
  }
}

module.exports = ChatService