const { Service } = require('egg')
const fs = require('fs').promises
const path = require('path')
const pdf = require('pdf-parse')
const mammoth = require('mammoth')

class ExtractorService extends Service {
  /**
   * 根据文件类型提取文本
   * @param {Object} file 文件对象
   * @returns {Promise<string>} 提取的文本
   */
  async extractText(file) {
    const { file_path, mime_type } = file

    try {
      // 根据MIME类型或文件扩展名选择提取方法
      const extension = path.extname(file_path).toLowerCase()

      if (mime_type === 'application/pdf' || extension === '.pdf') {
        return await this.extractPdf(file_path)
      } else if (
        mime_type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === '.docx'
      ) {
        return await this.extractDocx(file_path)
      } else if (mime_type === 'text/plain' || extension === '.txt') {
        return await this.extractTxt(file_path)
      } else if (
        mime_type === 'text/html' ||
        extension === '.html' ||
        extension === '.htm'
      ) {
        return await this.extractHtml(file_path)
      } else {
        throw new Error(`不支持的文件类型: ${mime_type || extension}`)
      }
    } catch (error) {
      this.ctx.logger.error('文本提取失败:', error)
      throw error
    }
  }

  /**
   * 提取PDF文本
   */
  async extractPdf(file_path) {
    // TODO: 实现PDF文本提取
    const dataBuffer = await fs.readFile(file_path)
    const data = await pdf(dataBuffer)
    return data.text
  }

  /**
   * 提取DOCX文本
   */
  async extractDocx(file_path) {
    // TODO: 实现DOCX文本提取
    const result = await mammoth.extractRawText({ path: file_path })
    return result.value
  }

  /**
   * 提取TXT文本
   */
  async extractTxt(file_path) {
    const content = await fs.readFile(file_path, 'utf8')
    return content
  }

  /**
   * 提取HTML文本
   */
  async extractHtml(file_path) {
    // TODO: 实现HTML文本提取
    const content = await fs.readFile(file_path, 'utf8')
    // 简单实现，后续可以使用cheerio等库提取结构化内容
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

module.exports = ExtractorService
