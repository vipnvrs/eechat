const { Controller } = require('egg')

class TtsController extends Controller {
  async tts() {
    const { ctx } = this
    const { text, voice } = ctx.request.body
    try {
      const result = await ctx.service.tts.tts(text, voice)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = TtsController
