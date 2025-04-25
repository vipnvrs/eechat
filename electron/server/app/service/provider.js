const { Service } = require('egg')

module.exports = class ProviderService extends Service {
  constructor(ctx) {
    super(ctx)
  }

  async addProvider(uid, provider_id, api_key, base_url, state) {
    const { ctx } = this
    try {
      const exsist = await ctx.model.LlmConfigProvider.findOne({
        where: {
          uid,
          provider_id,
        }
      })
      if (exsist) {
        throw new Error('provider already exists')
      } else {
        const newProvider = ctx.model.LlmConfigProvider.create({
          uid,
          provider_id,
          api_key,
          base_url,
          state,
        })
        return newProvider
      }
    } catch (error) {
      throw error
    }
  }

  
}