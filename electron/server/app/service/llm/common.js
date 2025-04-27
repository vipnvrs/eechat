const OpenAI = require('openai')
const BaseLLMService = require('./base')

class DeepseekService extends BaseLLMService {
  constructor(ctx) {
    super(ctx)
    this.provider = 'deepseek'
  }

  async createClient(config) {
    if (!config || !config.baseUrl || !config.apiKey) {
      throw new Error(this.ctx.__('chat.key_empty'))
    }
    return new OpenAI({
      // apiKey: this.decrypt(config.apiKey),
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
  }

  async testConnection(config, model) {
    try {
      const client = await this.createClient(config)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      const response = await client.chat.completions.create({
        model: model_id,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      })
      if(!response.choices || response.choices.length == 0) {
        if(response.error) {
          if(response.error.metadata && response.error.metadata.raw) {
            try {
              const json = JSON.parse(response.error.metadata.raw)
              throw new Error(json.error)
            } catch (error) {
              
            }
            throw new Error(response.error.metadata.raw)
          }
          throw new Error(response.error)
        }
      }
      return response.choices.length > 0
    } catch (error) {
      if (error.status == 401) {
        throw new Error(this.ctx.__('connection.auth_failed'))
      } else {
        throw new Error(this.ctx.__('connection.test_failed') + error.message)
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
  async chat(model, messages, config, sessionSettings, tools) {
    const { ctx } = this
    try {
      const configSaved = await this.getConfig(model.provider_id)
      console.log(configSaved)
      const client = await this.createClient(configSaved)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      //       if (tools && tools.length > 0) {
      //         sessionSettings.systemPrompt += `
      // You must respond ONLY with a valid and well-formed JSON object.

      // - Use double quotes '"' around all keys and string values.
      // - Do NOT include any extra text, comments, markdown, explanations, or code blocks.
      // - The JSON must be directly parsable using "JSON.parse()" in JavaScript.
      // - Do NOT include newlines ("\n") or trailing commas.
      // - All values must be correctly escaped according to JSON standards.
      // - The output must start with "{" and end with "}" (or "[" and "]" if it’s an array).

      // `
      //       }
      const messagesWithSystemPrompt = sessionSettings.systemPrompt
        ? [
            { role: 'system', content: sessionSettings.systemPrompt },
            ...messages,
          ]
        : messages
      console.log(sessionSettings)

      // const tools = [
      //   {
      //     "type": "function",
      //     "function": {
      //         "name": "get_weather",
      //         "description": "Get weather of an location, the user shoud supply a location first",
      //         "parameters": {
      //             "type": "object",
      //             "properties": {
      //                 "location": {
      //                     "type": "string",
      //                     "description": "The city and state, e.g. San Francisco, CA",
      //                 }
      //             },
      //             "required": ["location"]
      //         },
      //     }
      // },
      // ]
      // const tools = await ctx.service.tools.getTools()
      const params = {
        model: model_id,
        messages: messagesWithSystemPrompt,
        stream: true,
        // max_tokens: 2048,
        temperature: sessionSettings.temperature,
        top_p: sessionSettings.top_p,
        presence_penalty: sessionSettings.presence_penalty,
        frequency_penalty: sessionSettings.frequency_penalty,
      }
      if (tools && tools.length > 0) {
        params.tools =
          this.ctx.service.tools.convertMcpToolsToOpenaiTools(tools)
      }
      const response = await client.chat.completions.create(params)
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
