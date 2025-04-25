const { Controller } = require('egg');

class ProviderController extends Controller {
  async addProvider() {
    const { ctx } = this
    const uid = ctx.request.query.uid || 'default-user'
    const { provider_id, api_key, base_url, state } = ctx.request.body
    try {
      const configs = await ctx.service.provider.addProvider(uid, provider_id, api_key, base_url, state)
      ctx.body = ctx.helper.success(configs) 
    } catch (error) {
      ctx.body = ctx.helper.error(error)
    }
  }
  async getProviders() {
    const { ctx } = this
    const uid = ctx.request.query.uid || 'default-user'
    try {
      const providers = await ctx.service.provider.getProviders(uid)
      ctx.body = ctx.helper.success(providers)
    } catch (error) {
      ctx.body = ctx.helper.error(error)
    }
  }
}

module.exports = ProviderController;
