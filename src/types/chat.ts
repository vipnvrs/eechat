export interface Message {
  id: number
  uid: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  updated_at: string
}

export interface ChatHistoryResponse {
  total: number
  page: number
  pageSize: number
  data: Message[]
}
