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
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
    })
  }

  async testConnection(config) {
    try {
      console.log(config)

      const client = await this.createClient(config)
      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      })
      return response.choices.length > 0
    } catch (error) {
      throw new Error(`Deepseek 连接测试失败: ${error.message}`)
    }
  }

  async listModels() {
    // 使用基类的 listModels 方法
    return super.listModels()
  }
}

module.exports = DeepseekService
