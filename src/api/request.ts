import OpenAI from 'openai'

interface LocalAIConfig {
  baseURL?: string
  apiKey?: string
  model?: string
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const defaultConfig: Required<LocalAIConfig> = {
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'dummy', // Local setups often don't require a real API key
  model: 'deepseek-r1',
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
    streaming: boolean = false,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | void> {
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: this.config.model,
      messages: messages,
      stream: streaming,
    }

    if (streaming) {
      const stream = await this.openai.chat.completions.create(params)
      return this.handleStream(stream)
    } else {
      const response = await this.openai.chat.completions.create(params)
      return this.handleResponse(response)
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
      process.stdout.write(content)
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
