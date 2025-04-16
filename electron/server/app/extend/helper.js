// electron/server/app/extend/helper.js
module.exports = {
  success(data = null, message = 'success') {
    return {
      code: 0,
      data,
      message,
    }
  },

  error(message = 'error', code = -1) {
    return {
      code,
      data: null,
      message,
    }
  },

  // 流式错误返回
  streamError(ctx, error, sessionId) {
    ctx.set({
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.res.statusCode = 200

    const errorData = {
      code: 0,
      data: {
        content: `\`\`\` ${error} \`\`\``,
        sessionId,
      },
    }

    ctx.res.write(`data: ${JSON.stringify(errorData)}\n`)
    ctx.res.end()
  },

  toolCallStrArgsToObj(message) {
    if(message.arguments) {
      try {
        const safeJson = message.arguments.replace(/\\/g, '\\\\')
        message.arguments = JSON.parse(safeJson)
        return message
      } catch (error) {
        console.error('解析工具调用参数时出错:', error)
        return message
      }
    }
  },

  toolCallFucntionToDirective(message, directive = 'tool_call') {
    if(message.choices[0].delta.content) {
      // 如果内容是对象，将其转换为格式化的JSON字符串
      const content = typeof message.choices[0].delta.content === 'object' 
        ? JSON.stringify(message.choices[0].delta.content, null, 2)
        : message.choices[0].delta.content

      const str = 
`
:::${directive}{.${directive}}
${content}
:::
`
      message.choices[0].delta.content = str
      return message
    }
  },

  factoryMessageContent(content) {
    return {
      choices: [
        {
          delta: {
            content,
          },
        },
      ]
    }
  }
}
