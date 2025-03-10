export interface LLMProvider {
  id: string
  name: string
  state: boolean
  api_url: string
  official_url?: string
  api_key_url?: string
  docs_url?: string
  models_url?: string
  description?: string
}

export interface LLMModel {
  id: string
  name: string
  provider_id: string
  group_name: string
  state: boolean
  sort?: number
  apiKey?: string
  from?: 'config'
  model_id?: string
  type?: string
}

export interface LLMModelArray {
  [key: string]: LLMModel | undefined
}

export interface APIConfig {
  apiKey: string
  baseUrl: string
  config: Record<string, any>
  state: boolean
  info: Partial<{
    name: string
    api: {
      url: string
    }
    websites: {
      official: string
      apiKey: string
      docs: string
      models: string
    }
  }>
}

export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  state: boolean
  models?: LLMModel[]
}

export interface ModelProvider {
  id: string
  name: string
  type: 'api' | 'local'
  state: boolean
  models: LLMModel[]
  config?: {
    apiKey?: string
    baseUrl?: string
  }
  description?: string
  icon?: string
}