export interface LLMProvider {
  id: string
  name: string
  icon: string
}

export interface LLMModel {
  id: string
  name: string
  description: string
  capabilities: string[]
  context_length: number
  pricing: {
    prompt: number
    completion: number
    image: number | null
  }
}

export interface ModelGroup {
  name: string
  description: string
  models: LLMModel[]
}

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  modelGroups: ModelGroup[]
}

export interface LLMState {
  configs: Record<string, LLMConfig>
  currentProvider?: string
}
