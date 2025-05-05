const { Service } = require('egg')

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
   */
  async embedBatch(texts, model) {
    // TODO: 实现实际的嵌入逻辑
    // 这里应该调用嵌入模型API

    // 模拟嵌入结果
    return texts.map(() => {
      // 生成384维的随机向量作为示例
      return Array(384)
        .fill(0)
        .map(() => Math.random() * 2 - 1)
    })
  }
}

module.exports = EmbedderService
