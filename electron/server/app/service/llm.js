const BaseLLMService = require('./llm/base')
const DeepseekService = require('./llm/deepseek')
const { Service } = require('egg')

class LLMService extends Service {
  constructor(ctx) {
    super(ctx)
    this.providers = {
      // openai: new OpenAIService(ctx),
      // anthropic: new AnthropicService(ctx),
      deepseek: new DeepseekService(ctx),
    }
  }

  async testConnection(provider, config) {
    const service = this.providers[provider]
    if (!service) {
      throw new Error('暂不支持该模型提供商，请尝试通用模型')
    }
    return service.testConnection(config)
  }

  async listModels(provider) {
    const { ctx } = this
    const models = await this.ctx.model.LlmModel.findAll({
      where: { provider_id: provider },
      order: [
        ['state', 'DESC'],
        ['sort', 'ASC'],
      ],
    })
    return models
  }

  async saveConfig(provider, config) {
    return super.saveConfig(provider, config)
  }

  async listProviders() {
    const { ctx } = this
    try {
      console.log(ctx.model)

      const providers = await ctx.model.LlmProvider.findAll({
        where: { state: true },
        order: [
          ['state', 'DESC'],
          ['sort', 'ASC'],
        ],
      })

      // 转换为前端需要的格式
      return providers.reduce((acc, provider) => {
        acc[provider.id] = {
          name: provider.name,
          api: { url: provider.api_url },
          websites: {
            official: provider.official_url,
            apiKey: provider.api_key_url,
            docs: provider.docs_url,
            models: provider.models_url,
          },
        }
        return acc
      }, {})
    } catch (error) {
      console.error('获取提供商失败:', error)
      throw new Error('获取提供商失败: ' + error.message)
    }
  }
}

module.exports = LLMService
