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
}
