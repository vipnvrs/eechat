const Transform = require('stream').Transform
const { Service } = require('egg')
const OpenAI = require('openai')
const ollamaBaseUrl = 'http://127.0.0.1:11434'

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
      // console.log('sendMessage', messages, sessionId)

      const openai = new OpenAI({
        baseURL: `${ollamaBaseUrl}/v1`,
        apiKey: 'dummy',
      })

      const requestParams = {
        model: model.id,
        messages,
        stream: true,
      }
      const stream = await openai.chat.completions.create(requestParams)
      await this.handleStream(stream, ctx, messages, sessionId, model)
    } catch (error) {
      ctx.logger.error('Chat service error:', error)
      await this.handleStreamError(error, ctx)
      // 移除这里的 throw error，因为错误已经在 handleStreamError 中处理
    }
    // 移除这里的 finally 块，让 handleStream 或 handleStreamError 负责结束响应
  }
  async handleStream(stream, ctx, messages, sessionId, model) {
    // console.log('handleStream')
    ctx.set({
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.res.statusCode = 200
    let assistantMessage = ''
    let hasEnded = false

    try {
      for await (const chunk of stream) {
        // 检查响应是否已结束
        if (ctx.res.writableEnded) {
          break
        }
        // reasoning_content,
        // finish_reason
        if (!chunk.choices[0].delta.content) {
          continue
        }
        // console.log(ctx.res.write(JSON.stringify(chunk) + '\n'))
        ctx.res.write(JSON.stringify(chunk) + '\n')
        const content =
          (chunk.choices[0] &&
            chunk.choices[0].delta &&
            chunk.choices[0].delta.content) ||
          ''
        if (content) {
          assistantMessage += content
        }
        // todo: 用量信息
        // todo: session 会话信息
      }

      // 保存用户最后一条消息
      await this.saveMsg(
        'default-user',
        messages[messages.length - 1].role,
        messages[messages.length - 1].content,
        sessionId,
      )

      // 保存助手的完整回复
      if (assistantMessage) {
        await this.saveMsg(
          'default-user',
          'assistant',
          assistantMessage,
          sessionId,
        )
      }

      // 只有在响应尚未结束时才结束它
      if (!ctx.res.writableEnded) {
        ctx.res.end()
        hasEnded = true
      }
    } catch (error) {
      ctx.logger.error('Stream error:', error)
      // 只在响应尚未结束时处理错误
      if (!ctx.res.writableEnded && !hasEnded) {
        await this.handleStreamError(error, ctx)
      }
    }
  }
  async handleStreamError(error, ctx) {
    console.error('handleStreamError', error)

    // 检查响应是否已结束
    if (ctx.res.writableEnded) {
      return
    }

    ctx.set({
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.res.statusCode = 200
    const data = {
      choices: [
        {
          delta: {
            content: error.message,
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
    }
    ctx.res.write(JSON.stringify(data) + '\n')

    // 确保只结束一次响应
    if (!ctx.res.writableEnded) {
      ctx.res.end()
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
    // console.log('getHistory', sessionId, uid, page, pageSize)

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

  async listSession(page = 1, pageSize = 2000) {
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

  async removeSession(id) {
    const { ctx } = this

    if (!id) {
      throw new Error('会话ID不能为空')
    }

    try {
      const session = await ctx.model.ChatSession.findByPk(id)
      if (!session) {
        throw new Error('会话不存在')
      }
      await session.destroy()
      await ctx.model.Message.destroy({
        where: {
          session_id: id,
        },
      })
      return true
    } catch (error) {
      ctx.logger.error('删除会话失败:', error)
      throw new Error('删除会话失败:' + error.message)
    }
  }

  async summary(model, messages, sessionId) {
    const { ctx } = this
    if (!sessionId || !messages) {
      throw new Error('参数不完整')
    }
    let messagesStr = ''
    messages.forEach(item => {
      messagesStr += item.role + ': ' + item.content + '\n'
    })
    const prompt = [
      // {
      //   role: "system",
      //   // content: "You are a concise summarizer. Always provide summaries in exactly 10 words."
      //   content: "你是一个对话标题总结器。总是以10个字的文字总结标题, 无需思考过程。"
      // },
      {
        role: 'user',
        // content: `Summarize the following conversation in 10 words: ${messagesStr}`,
        content: `
我想让你充当对话标题生成器。我将向你提供对话内容，你将生成一个吸引人的标题。请严格遵循以下规则：

1. 请保持标题简洁，不超过 10 个字，并确保保持其含义。
2. 标题内容不能包含标点符号和特殊符号。
3. 答复时直接给出结果, 无需思考过程。
4. 答复时要利用对话的语言类型, 如对话内容为英语则生成英语标题，对话内容是中文则生成中文标题。
5. 标题内容不能为空。
6. 标题的开头必须使用适合当前对话内容的 emoji。
7. 不要以“标题：”开头。

我的第一个对话内容是： ${messagesStr}
`,
      },
    ]
    try {
      let res = ''
      const provider_id = model.provider_id
      if (provider_id == 'local') {
        res = await ctx.service.ollama.chatNoStream(prompt, model.id)
      } else {
        res = await ctx.service.llm.chatNoStream(prompt, model, provider_id)
      }
      const session = await ctx.model.ChatSession.findByPk(sessionId.id)
      if (!session) {
        throw new Error('会话不存在')
      }

      // 移除思考过程的内容
      if (res && res.includes('<think>')) {
        const pattern = /<think>[\s\S]*?<\/think>/g
        res = res.replace(pattern, '').trim()
      }

      // 使用 emojiHelper 为标题添加 emoji
      // const emojiHelper = require('../extend/emojiHelper');
      // res = emojiHelper.addEmojiToTitle(res);

      await session.update({
        title: res,
      })
      await session.reload()
      return session
    } catch (error) {
      ctx.logger.error('修改会话标题失败:', error)
      throw new Error('修改会话标题失败:' + error.message)
    }
  }

  async updateSettings(sessionId, settings) {
    const { ctx } = this
    try {
      const session = await ctx.model.ChatSession.findByPk(sessionId)
      if (!session) {
        throw new Error('会话不存在')
      }

      // 更新会话设置
      const updateData = {
        title: settings.title,
        system_prompt: settings.systemPrompt,
        temperature: settings.temperature?.[0],
        top_p: settings.top_p?.[0],
        presence_penalty: settings.presence_penalty?.[0],
        frequency_penalty: settings.frequency_penalty?.[0],
      }

      await session.update(updateData)
      return session
    } catch (error) {
      ctx.logger.error('更新会话设置失败:', error)
      throw new Error('更新会话设置失败: ' + error.message)
    }
  }

  async getSettings(sessionId) {
    const { ctx } = this
    try {
      const session = await ctx.model.ChatSession.findByPk(sessionId)
      if (!session) {
        throw new Error('会话不存在')
      }

      return {
        title: session.title,
        systemPrompt: session.system_prompt,
        temperature: session.temperature,
        top_p: session.top_p,
        presence_penalty: session.presence_penalty,
        frequency_penalty: session.frequency_penalty,
      }
    } catch (error) {
      ctx.logger.error('获取会话设置失败:', error)
      throw new Error('获取会话设置失败: ' + error.message)
    }
  }
}

module.exports = ChatService
