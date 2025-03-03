const Controller = require('egg').Controller

class LLMController extends Controller {
  async saveConfig() {
    const { ctx } = this
    const { provider } = ctx.params
    const config = ctx.request.body

    try {
      await ctx.service.llm.saveConfig(provider, config)
      ctx.body = ctx.helper.success()
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async testConnection() {
    const { ctx } = this
    const { provider } = ctx.params
    const config = ctx.request.body

    try {
      const result = await ctx.service.llm.testConnection(provider, config)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async listModels() {
    const { ctx } = this
    const { provider } = ctx.params

    try {
      const models = await ctx.service.llm.listModels(provider)
      ctx.body = ctx.helper.success(models)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  async listProviders() {
    const { ctx } = this
    const providers = await ctx.service.llm.listProviders()
    ctx.body = ctx.helper.success(providers)
  }
}

module.exports = LLMController
