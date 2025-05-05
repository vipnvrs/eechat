const { Service } = require('egg')
const fs = require('fs').promises
const path = require('path')

class ManagerService extends Service {
  constructor(ctx) {
    super(ctx)
    this.initialized = false
  }

  /**
   * 确保服务已初始化
   */
  async ensureInitialized() {
    if (!this.initialized) {
      this.ctx.logger.info('RAG服务首次初始化')
      const config = await this.getConfig()

      // 初始化Milvus服务
      await this.ctx.service.rag.milvus.ensureInitialized(config)

      this.initialized = true
    }
  }

  /**
   * 获取配置
   */
  async getConfig() {
    try {
      // 配置文件路径
      const configFile = path.join(
        this.app.config.baseDir,
        'config/rag.config.json',
      )
      const defaultConfigFile = path.join(
        __dirname,
        '../rag.config.default.json',
      )

      // 确保配置目录存在
      const configDir = path.dirname(configFile)
      if (!fs.existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true })
      }

      // 如果配置文件不存在，复制默认配置
      if (!fs.existsSync(configFile)) {
        this.ctx.logger.info('RAG配置文件不存在，创建默认配置')
        const defaultConfig = await fs.readFile(defaultConfigFile, 'utf8')
        await fs.writeFile(configFile, defaultConfig, 'utf8')
      }

      // 读取配置文件
      const config = await fs.readFile(configFile, 'utf8')
      const configJSON = JSON.parse(config)

      return configJSON
    } catch (error) {
      this.ctx.logger.error('获取RAG配置失败:', error)
      throw error
    }
  }

  /**
   * 处理文档
   * @param {Object} document 文档对象
   * @param {Object} options 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async processDocumentRag(document, options = {}) {
    await this.ensureInitialized()

    try {
      // 1. 文本提取
      const extractorService = this.ctx.service.rag.extractor
      const extractedText = await extractorService.extractText(document)

      // 2. 文本分块
      const chunkerService = this.ctx.service.rag.chunker
      const textChunks = await chunkerService.chunkText(extractedText, {
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        method: options.chunkMethod,
      })

      // 3. 向量嵌入
      const embedderService = this.ctx.service.rag.embedder
      const embeddings = await embedderService.embedTexts(textChunks, {
        model: options.embeddingModel,
      })

      // 4. 索引存储
      const indexerService = this.ctx.service.rag.indexer
      const indexResult = await indexerService.indexDocument(
        document,
        textChunks,
        embeddings,
        { collection: options.collection },
      )

      return {
        success: true,
        documentId: document.id,
        chunks: textChunks.length,
        collection: options.collection || 'documents',
      }
    } catch (error) {
      this.ctx.logger.error('文档处理失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 查询处理
   * @param {string} query 查询文本
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async query(query, options = {}) {
    await this.ensureInitialized()

    try {
      // 设置默认查询模式
      const mode = options.mode || 'naive'
      const collection = options.collection || 'documents'

      // 1. 向量嵌入
      const embedderService = this.ctx.service.rag.embedder
      const queryEmbedding = (await embedderService.embedTexts([query]))[0]

      // 2. 向量检索
      const indexerService = this.ctx.service.rag.indexer
      let searchResult = await indexerService.search(queryEmbedding, {
        collection,
        topK: options.topK || 10,
        filter: options.filter || '',
      })

      // 3. 重新排序（如果启用）
      if (
        options.rerank &&
        searchResult.matches &&
        searchResult.matches.length > 0
      ) {
        const rerankerService = this.ctx.service.rag.reranker
        searchResult.matches = await rerankerService.rerank(
          query,
          searchResult.matches,
          {
            model: options.rerankModel,
            topK: options.topK || 10,
          },
        )
      }

      // 4. 构建上下文
      const context = this.buildContext(searchResult.matches, options)

      // 5. 生成回答
      const answer = await this.generateAnswer(query, context, options)

      return {
        query,
        mode,
        context,
        answer,
        matches: searchResult.matches,
      }
    } catch (error) {
      this.ctx.logger.error('查询处理失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 构建上下文
   * @param {Array<Object>} matches 匹配结果
   * @param {Object} options 选项
   * @returns {string} 构建的上下文
   */
  buildContext(matches, options) {
    // 简单实现，后续优化
    return matches.map(match => match.text).join('\n\n')
  }

  /**
   * 生成回答
   * @param {string} query 查询文本
   * @param {string} context 上下文
   * @param {Object} options 选项
   * @returns {Promise<string>} 生成的回答
   */
  async generateAnswer(query, context, options) {
    // 构建提示
    const prompt = [
      {
        role: 'system',
        content: '你是一个有用的助手，根据提供的上下文回答问题。',
      },
      { role: 'user', content: `上下文信息：\n${context}\n\n问题：${query}` },
    ]

    // 调用 LLM 服务
    try {
      const response = await this.ctx.service.llm.chatNoStream(
        prompt,
        { id: options.llmModel || 'deepseek-r1' },
        options.llmProvider || 'deepseek',
      )
      return response
    } catch (error) {
      this.ctx.logger.error('生成回答失败:', error)
      return '抱歉，我无法基于当前信息回答这个问题。'
    }
  }
}

module.exports = ManagerService
