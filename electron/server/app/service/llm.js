const { stat } = require('fs')
const BaseLLMService = require('./llm/base')
const DeepseekService = require('./llm/deepseek')

class LLMService extends BaseLLMService {
  constructor(ctx) {
    super(ctx)
    this.providers = {
      // openai: new OpenAIService(ctx),
      // anthropic: new AnthropicService(ctx),
      deepseek: new DeepseekService(ctx),
    }
  }

  async testConnection(provider, config) {
    const service = this.providers[provider]
    if (!service) {
      throw new Error('暂不支持该模型提供商，请尝试通用模型')
    }
    return service.testConnection(config)
  }

  async listModels(provider) {
    const { ctx } = this
    const uid = 'default-user'
    const configedModels = await this.getConfigModelList(uid, provider)
    if (configedModels.length === 0) {
      const models = await this.ctx.model.LlmModel.findAll({
        where: { provider_id: provider },
        order: [
          ['state', 'DESC'],
          ['sort', 'ASC'],
        ],
      })
      models.forEach(item => {
        item.dataValues.from = 'common'
      })
      return models
    }
    return configedModels
  }

  async saveConfig(provider, config) {
    return super.saveConfig(provider, config)
  }

  async listProviders() {
    const { ctx } = this
    try {
      console.log(ctx.model)
      // 获取所有提供商
      const providers = await ctx.model.LlmProvider.findAll({
        order: [
          ['state', 'DESC'],
          ['sort', 'ASC'],
        ],
      })
      // 获取已配置的提供商
      const configedProviders = await ctx.model.LlmConfigProvider.findAll({
        where: { uid: 'default-user' },
      })
      // 合并提供商数据
      providers.forEach(provider => {
        const configedProvider = configedProviders.find(
          item => item.provider_id === provider.id,
        )
        if (configedProvider) {
          provider.dataValues.state = configedProvider.state
        }
      })
      // 转换为前端需要的格式
      const data = providers.reduce((acc, provider) => {
        acc[provider.id] = {
          name: provider.name,
          // state: typeof provider.state === 'boolean' ? provider.state : false,
          state: provider.state,
          api: { url: provider.api_url },
          websites: {
            official: provider.official_url,
            apiKey: provider.api_key_url,
            docs: provider.docs_url,
            models: provider.models_url,
          },
        }
        return acc
      }, {})
      return data
    } catch (error) {
      console.error('获取提供商失败:', error)
      throw new Error('获取提供商失败: ' + error.message)
    }
  }

  // 获取指定提供商
  async getConfigProvider(uid, providerId) {
    uid = 'default-user'
    const { ctx } = this
    try {
      const res = await ctx.model.LlmConfigProvider.findOne({
        where: {
          uid,
          provider_id: providerId,
        },
      })
      return res
    } catch (error) {
      console.error('获取提供商配置失败:', error)
      throw new Error('获取提供商配置失败: ' + error.message)
    }
  }

  // 保持提供商模型配置
  async saveConfigProvider(uid, providerId, config) {
    uid = 'default-user'
    const { ctx } = this
    try {
      // 准备保存的数据
      const configData = {
        uid,
        provider_id: providerId,
        api_key: config.apiKey,
        base_url: config.baseUrl || null,
        state: config.state || true,
      }
      // 检查是否已存在配置
      let existingConfig = await ctx.model.LlmConfigProvider.findOne({
        where: {
          uid,
          provider_id: providerId,
        },
      })
      let res
      if (existingConfig) {
        // 更新现有配置
        res = await existingConfig.update(configData)
      } else {
        // 创建新配置
        res = await ctx.model.LlmConfigProvider.create(configData)
      }
      console.log(res)
      return res
    } catch (error) {
      console.error('保存提供商配置失败:', error)
      throw new Error('保存提供商配置失败: ' + error.message)
    }
  }

  // 更新提供商开启状态
  async saveConfigProviderState(uid, providerId, config) {
    const { ctx } = this
    try {
      let res
      let existingConfig = await ctx.model.LlmConfigProvider.findOne({
        where: {
          uid,
          provider_id: providerId,
        },
      })
      if (!existingConfig) {
        const configData = {
          uid,
          provider_id: providerId,
          api_key: config.apiKey,
          base_url: config.baseUrl || null,
          state: config.state,
        }
        res = await ctx.model.LlmConfigProvider.create({
          ...configData,
        })
      } else {
        res = await existingConfig.update({ state: config.state })
      }

      // 更新模型配置列表
      const modelConfigList = []
      config.models.forEach(model => {
        modelConfigList.push({
          uid,
          provider_id: providerId,
          model_id: model.model_id,
          state: model.state,
          name: model.name,
          group_name: model.group_name,
        })
      })
      await this.saveConfigModelList(uid, providerId, modelConfigList)
      return res
    } catch (error) {
      throw new Error('保存提供商配置失败: ' + error.message)
    }
  }

  // 获取指定模型配置信息
  async getConfigModel(uid, providerId, modelId) {
    uid = 'default-user'
    const { ctx } = this
    try {
      const res = await ctx.model.LlmModel.findOne({
        where: {
          provider_id: providerId,
          id: modelId,
        },
      })
      return res
    } catch (error) {
      console.error('获取模型配置失败:', error)
      throw new Error('获取模型配置失败:' + error.message)
    }
  }

  // 获取提供商下模型配置列表
  async getConfigModelList(uid, providerId) {
    const { ctx } = this
    uid = 'default-user'
    try {
      const res = await ctx.model.LlmConfigModel.findAll({
        where: {
          provider_id: providerId,
        },
      })
      res.forEach(item => {
        item.dataValues.from = 'config'
      })
      return res
    } catch (error) {
      console.error('获取模型配置列表失败:', error)
      throw new Error('获取模型配置列表失败:' + error.message)
    }
  }
  // 保存模型配置列表
  async saveConfigModelList(uid, providerId, configList) {
    const { ctx } = this
    const transaction = await ctx.model.transaction()

    try {
      // 在事务中先删除该用户和提供商下的所有现有配置
      await ctx.model.LlmConfigModel.destroy({
        where: {
          uid,
          provider_id: providerId,
        },
        force: true,
        transaction,
      })

      // 然后在同一事务中批量创建新配置
      const result = await ctx.model.LlmConfigModel.bulkCreate(configList, {
        transaction,
      })

      // 提交事务
      await transaction.commit()

      return {
        success: true,
        count: result.length,
      }
    } catch (error) {
      // 发生错误时回滚事务
      await transaction.rollback()
      console.error('保存模型配置列表失败:', error)
      throw new Error('保存模型配置列表失败:' + error.message)
    }
  }

  //
  async saveConfigModelState(uid, modelId, config) {
    const { ctx } = this
    try {
      let res
      let existingConfig = await ctx.model.LlmConfigModel.findOne({
        where: {
          uid,
          model_id: modelId,
        },
      })
      // res = await existingConfig.update({ state: config.state })
      if (!existingConfig) {
        // 更新模型配置列表
        const modelConfigList = []
        const providerId = config.models[0].provider_id
        config.models.forEach(model => {
          modelConfigList.push({
            uid,
            provider_id: providerId,
            model_id: model.id,
            state: model.state,
            name: model.name,
            group_name: model.group_name,
          })
        })
        await this.saveConfigModelList(uid, providerId, modelConfigList)
      } else {
        res = await existingConfig.update({ state: config.state })
      }
      return res
    } catch (error) {
      throw new Error('保存模型配置失败:' + error.message)
    }
  }

  /**
   *
   * @param {*} model
   * @param {*} provider
   * @param {*} messages
   * @param {*} config
   */
  async chat(model, provider, messages, sessionId, config) {
    const { ctx } = this
    try {
      const service = this.providers[provider]
      const stream = await service.chat(model, messages, config)

      // 使用 ChatService 的 handleStream 处理流数据
      const chatService = ctx.service.chat
      await chatService.handleStream(stream, ctx, messages, sessionId, model)
    } catch (error) {
      console.error('模型请求失败:', error)
      throw error
    }
  }

  async getConfig(provider) {
    return await super.getConfig(provider)
  }
}

module.exports = LLMService
