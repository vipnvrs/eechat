const { Service } = require('egg')
const http = require('http')

class EmbedderService extends Service {
  /**
   * 生成文本嵌入向量
   * @param {Array<string>} texts 文本数组
   * @param {Object} options 选项
   * @returns {Promise<Array<Array<number>>>} 嵌入向量数组
   */
  async embedTexts(texts, options = {}) {
    const { model = 'nomic-embed-text', batchSize = 32 } = options

    try {
      // 分批处理，避免一次性处理太多文本
      const batches = this.createBatches(texts, batchSize)
      const allEmbeddings = []

      for (const batch of batches) {
        const embeddings = await this.embedBatch(batch, model)
        allEmbeddings.push(...embeddings)
      }

      return allEmbeddings
    } catch (error) {
      this.ctx.logger.error('生成嵌入向量失败:', error)
      throw error
    }
  }

  /**
   * 创建批次
   */
  createBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 嵌入一批文本
   * @param {Array<string>} texts 文本数组
   * @param {string} model 模型名称
   * @returns {Promise<Array<Array<number>>>} 嵌入向量数组
   */
  async embedBatch(texts, model) {
    const embeddings = []
    
    // 为每个文本生成嵌入向量
    for (const text of texts) {
      try {
        const embedding = await this.callOllamaEmbedding(text, model)
        embeddings.push(embedding)
      } catch (error) {
        this.ctx.logger.error(`获取文本嵌入向量失败: ${text.substring(0, 50)}...`, error)
        throw error
      }
    }
    
    return embeddings
  }
  
  /**
   * 调用Ollama API获取嵌入向量
   * @param {string} text 文本
   * @param {string} model 模型名称
   * @returns {Promise<Array<number>>} 嵌入向量
   */
  async callOllamaEmbedding(text, model) {
    return new Promise((resolve, reject) => {
      // 准备请求数据
      const data = JSON.stringify({
        model: model,
        prompt: text
      })
      
      // 请求选项
      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }
      
      // 发送请求
      const req = http.request(options, (res) => {
        let responseData = ''
        
        // 接收数据
        res.on('data', (chunk) => {
          responseData += chunk
        })
        
        // 请求完成
        res.on('end', () => {
          try {
            // 解析响应
            const response = JSON.parse(responseData)
            
            if (response.embedding) {
              this.ctx.logger.debug('获取嵌入向量成功:', text)
              resolve(response.embedding)
            } else {
              this.ctx.logger.error('Ollama API返回无效响应:', response)
              reject(new Error('无效的嵌入向量响应'))
            }
          } catch (error) {
            this.ctx.logger.error('解析Ollama API响应失败:', error)
            reject(error)
          }
        })
      })
      
      // 错误处理
      req.on('error', (error) => {
        this.ctx.logger.error('调用Ollama API失败:', error)
        reject(error)
      })
      
      // 发送数据
      req.write(data)
      req.end()
    })
  }
}

module.exports = EmbedderService
