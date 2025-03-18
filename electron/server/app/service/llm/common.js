const OpenAI = require('openai')
const BaseLLMService = require('./base')

class DeepseekService extends BaseLLMService {
  constructor(ctx) {
    super(ctx)
    this.provider = 'deepseek'
  }

  async createClient(config) {
    return new OpenAI({
      // apiKey: this.decrypt(config.apiKey),
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
  }

  async testConnection(config, model) {
    try {
      console.log(config)
      const client = await this.createClient(config)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      const response = await client.chat.completions.create({
        model: model_id,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      })
      return response.choices.length > 0
    } catch (error) {
      if (error.status == 401) {
        throw new Error('连接失败，请检查您的 ApiKey')
      } else {
        throw new Error(`连接测试失败: ${error.message}`)
      }
    }
  }

  async listModels() {
    // 使用基类的 listModels 方法
    return super.listModels()
  }

  /**
   *
   * sessionSettings = {
   *   title: '',
   *   systemPrompt: '',
   *   temperature: 0.7,
   *   top_p: 1,
   *   presence_penalty: 0,
   *   frequency_penalty: 0,
   * }
   */
  async chat(model, messages, config, sessionSettings) {
    try {
      const configSaved = await this.getConfig(model.provider_id)
      console.log(configSaved)
      const client = await this.createClient(configSaved)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id

      const messagesWithSystemPrompt = sessionSettings.systemPrompt
        ? [
            { role: 'system', content: sessionSettings.systemPrompt },
            ...messages,
          ]
        : messages
      console.log(sessionSettings)

      const response = await client.chat.completions.create({
        model: model_id,
        messages: messagesWithSystemPrompt,
        stream: true,
        // max_tokens: 2048,
        // temperature: sessionSettings.temperature,
        // top_p: sessionSettings.top_p,
        // presence_penalty: sessionSettings.presence_penalty,
        // frequency_penalty: sessionSettings.frequency_penalty,
      })
      // return response.choices[0].message.content
      return response
    } catch (error) {
      throw new Error(`${error.message}`)
    }
  }

  async chatNoStream(messages, model, provider_id) {
    const { ctx } = this
    try {
      const configSaved = await this.getConfig(model.provider_id)
      const client = await this.createClient(configSaved)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      const response = await client.chat.completions.create({
        model: model_id,
        messages,
        stream: false,
        // max_tokens: 2048,
        // temperature: 0.7,
      })
      return response
    } catch (error) {
      ctx.logger.error(error)
      throw new Error(error.message)
    }
  }
}

module.exports = DeepseekService
