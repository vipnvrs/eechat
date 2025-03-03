'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 创建新表
    await queryInterface.createTable('llm_configs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '模型提供商',
      },
      api_key: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '加密的API密钥',
      },
      base_url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'API基础地址',
      },
      models: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]',
        comment: '可用模型列表JSON',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    })

    // 4. 重新创建索引
    // await queryInterface.addIndex('llm_configs', ['provider'])
  },

  down: async (queryInterface, Sequelize) => {
    // 1. 创建旧结构的表
    await queryInterface.createTable('llm_configs_old', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '模型提供商',
      },
      config: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '配置JSON',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    })

    // 2. 迁移回原格式
    const records = await queryInterface.sequelize.query(
      'SELECT * FROM llm_configs',
      { type: Sequelize.QueryTypes.SELECT },
    )

    for (const record of records) {
      const newConfig = {
        apiKey: record.api_key,
        baseUrl: record.base_url,
        modelGroups: [
          {
            name: 'Default',
            models: JSON.parse(record.models),
          },
        ],
      }

      await queryInterface.sequelize.query(
        `INSERT INTO llm_configs_old (
          id, provider, config, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            record.id,
            record.provider,
            JSON.stringify(newConfig),
            record.created_at,
            record.updated_at,
            record.deleted_at,
          ],
        },
      )
    }

    // 3. 替换表
    await queryInterface.dropTable('llm_configs')
    await queryInterface.renameTable('llm_configs_old', 'llm_configs')

    // 4. 重建索引
    await queryInterface.addIndex('llm_configs', ['provider'])
  },
}
