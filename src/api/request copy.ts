import OpenAI from 'openai'

interface LocalAIConfig {
  baseURL?: string
  apiKey?: string
  model?: string
  onMessage?: (content: string) => void // 添加回调函数类型
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const defaultConfig: Required<LocalAIConfig> = {
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'dummy', // Local setups often don't require a real API key
  model: 'deepseek-r1',
  onMessage: () => {}, // 默认空函数
}

class LocalAI {
  private config: Required<LocalAIConfig>
  private openai: OpenAI

  constructor(config: LocalAIConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.openai = new OpenAI({
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    })
  }

  async createChatCompletion(
    messages: Message[],
    streaming: boolean = true,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | void> {
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: this.config.model,
      messages: messages,
      stream: streaming,
    }

    if (streaming) {
      const stream = await this.openai.chat.completions.create(params) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
      return this.handleStream(stream)
    } else {
      const response = await this.openai.chat.completions.create(params)
      if (!('choices' in response)) {
        throw new Error('Expected a ChatCompletion response')
      }
      return this.handleResponse(response as OpenAI.Chat.Completions.ChatCompletion)
    }
  }

  private async handleStream(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  ): Promise<void> {
    console.log(
      `Streaming response from local AI model (${this.config.model}):\n`,
    )
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      this.config.onMessage(content) // 使用回调函数替代 process.stdout.write
    }
    console.log('\n\nStream finished.')
  }

  private handleResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): OpenAI.Chat.Completions.ChatCompletion {
    // console.log(`Response from local AI model (${this.config.model}):\n`)
    // console.log(response.choices[0].message.content)
    // console.log('\nUsage:', response.usage)
    return response
  }
}

export default LocalAI

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://your-server.com:7001'  // 生产环境服务器地址
  : 'http://localhost:7002'        // 开发环境地址
