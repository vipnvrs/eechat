const { Controller } = require('egg')

class OllamaController extends Controller {
  async state() {
    const { ctx } = this
    try {
      const state = await ctx.service.ollama.checkState()
      ctx.body = ctx.helper.success(state)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
  async start() {
    const { ctx } = this
    try {
      await ctx.service.ollama.start()
      ctx.body = ctx.helper.success()
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
  async stop() {
    const { ctx } = this
    try {
      await ctx.service.ollama.stop()
      ctx.body = ctx.helper.success()
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async restart() {
    const { ctx } = this
    try {
      await ctx.service.ollama.restart()
      ctx.body = ctx.helper.success()
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async install() {
    const { ctx } = this
    try {
      await ctx.service.ollama.install()
      ctx.body = ctx.helper.success()
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = OllamaController
