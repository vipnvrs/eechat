interface RagBase {
  title: string
  description?: string
  vector_collection?: string
  chunk_size: number
  chunk_overlap: number
  chunk_method: string
  embedding_model: string
  embedding_dimension: any
  embedding_model_type: string
  text_understanding_model: string
  image_understanding_model: string
  rerank_enabled: boolean
  rerank_model?: string
  is_default?: boolean
}

export interface RagForm extends Omit<RagBase, 'id'> {}
export interface RagResponse extends RagBase {
  id: number | string;
  created_at?: string
  updated_at?: string
  document_count?: number
}

export interface RagState {
  bases: RagResponse[]
  loading: boolean
  loadingBases: boolean
  selectedBase: RagResponse | null
  error: string | null
  initialized: boolean
  showCreateDialog: boolean
  showEditDialog: boolean
  processingDocument: boolean
  serviceStatus: {
    running: boolean
    error: string | null
  }
}