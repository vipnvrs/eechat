// 通过 openrouter 获取模型数据
// https://openrouter.ai/api/v1/models

/**
 * 数据结构
 * {
    "id": "openai/gpt-4.5-preview",
    "name": "OpenAI: GPT-4.5 (Preview)",
    "created": 1740687810,
    "description": "GPT-4.5 (Preview) is a research preview of OpenAI's latest language model, designed to advance capabilities in reasoning, creativity, and multi-turn conversation. It builds on previous iterations with improvements in world knowledge, contextual coherence, and the ability to follow user intent more effectively.\n\nThe model demonstrates enhanced performance in tasks that require open-ended thinking, problem-solving, and communication. Early testing suggests it is better at generating nuanced responses, maintaining long-context coherence, and reducing hallucinations compared to earlier versions.\n\nThis research preview is intended to help evaluate GPT-4.5's strengths and limitations in real-world use cases as OpenAI continues to refine and develop future models. Read more at the [blog post here.](https://openai.com/index/introducing-gpt-4-5/)",
    "context_length": 128000,
    "architecture": {
        "modality": "text+image->text",
        "tokenizer": "GPT",
        "instruct_type": null
    },
    "pricing": {
        "prompt": "0.000075",
        "completion": "0.00015",
        "image": "0.108375",
        "request": "0"
    },
    "top_provider": {
        "context_length": 128000,
        "max_completion_tokens": 16384,
        "is_moderated": true
    },
    "per_request_limits": null
}
 */
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const url = 'https://openrouter.ai/api/v1/models'
const headers = {
  'HTTP-Referer': 'https://github.com/your-repo', // 替换为你的项目地址
  'X-Title': 'Your App Name', // 替换为你的应用名称
}

async function fetchModelList() {
  try {
    const response = await axios.get(url, { headers })
    const models = response.data.data.map(model => {
      const capabilities = []

      // 添加基础能力
      if (model.architecture.modality === 'text+image->text') {
        capabilities.push('视觉')
      }
      if (model.context_length >= 32000) {
        capabilities.push('长文本')
      }
      if (model.top_provider.is_moderated) {
        capabilities.push('内容审核')
      }

      return {
        id: model.id,
        name: model.name.split(':')[1]?.trim() || model.name,
        description: model.description,
        context_length: model.context_length,
        capabilities,
        pricing: {
          prompt: parseFloat(model.pricing.prompt),
          completion: parseFloat(model.pricing.completion),
          image: model.pricing.image ? parseFloat(model.pricing.image) : null,
        },
      }
    })

    // 按提供商分组
    const groupedModels = models.reduce((acc, model) => {
      const provider = model.id.split('/')[0]
      if (!acc[provider]) {
        acc[provider] = {
          name: provider.charAt(0).toUpperCase() + provider.slice(1),
          description: `${provider}`,
          models: [],
        }
      }
      acc[provider].models.push(model)
      return acc
    }, {})

    // 生成导出文件内容
    const fileContent = `// 此文件由 getOpenrouterModelList.js 自动生成
// 最后更新时间: ${new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    })}

module.exports = ${JSON.stringify(groupedModels, null, 2)}
`

    // 写入文件
    const outputPath = path.join(__dirname, 'modelList.js')
    fs.writeFileSync(outputPath, fileContent, 'utf8')
    console.log('✅ 模型列表已更新')
  } catch (error) {
    console.error('❌ 获取模型列表失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    process.exit(1)
  }
}

// 执行更新
fetchModelList()
