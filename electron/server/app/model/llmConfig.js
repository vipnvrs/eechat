const { Model } = require('sequelize')

module.exports = app => {
  class LLMConfig extends Model {}

  LLMConfig.init(
    {
      id: {
        type: app.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      provider: {
        type: app.Sequelize.STRING,
        allowNull: false,
        comment: '模型提供商',
      },
      api_key: {
        type: app.Sequelize.TEXT,
        allowNull: false,
        comment: '加密的API密钥',
      },
      base_url: {
        type: app.Sequelize.STRING,
        allowNull: true,
        comment: 'API基础地址',
      },
      models: {
        type: app.Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]',
        comment: '可用模型列表JSON',
      },
      created_at: {
        type: app.Sequelize.DATE,
      },
      updated_at: {
        type: app.Sequelize.DATE,
      },
      deleted_at: {
        type: app.Sequelize.DATE,
      },
    },
    {
      sequelize: app.model,
      modelName: 'llm_config',
      tableName: 'llm_configs',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  )

  return LLMConfig
}
