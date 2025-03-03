const BaseLLMService = require('./llm/base')
const DeepseekService = require('./llm/deepseek')
const providers = require('../../tools/providers.js')
const models = require('../../tools/models.js')

class LLMService extends BaseLLMService {
  constructor(ctx) {
    super(ctx)
    this.providers = {
      // openai: new OpenAIService(ctx),
      // anthropic: new AnthropicService(ctx),
      deepseek: new DeepseekService(ctx),
    }
  }

  async testConnection(provider, config) {
    // const config = await this.getConfig(provider)
    // if (!config || !config.apiKey) {
    //   throw new Error('API 配置未完成')
    // }

    const service = this.providers[provider]
    if (!service) {
      throw new Error('暂不支持该模型提供商，请尝试通用模型')
    }

    return service.testConnection(config)
  }

  async listModels(provider) {
    const config = await this.getConfig(provider)
    // if (!config || !config.apiKey) {
    //   throw new Error('API 配置未完成')
    // }

    // const service = this.providers[provider]
    // if (!service) {
    //   throw new Error('不支持的模型提供商')
    // }

    return models[provider]
  }

  async saveConfig(provider, config) {
    return super.saveConfig(provider, config)
  }

  async listProviders() {
    return providers
  }
}

module.exports = LLMService
