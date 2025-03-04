module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, BOOLEAN, DATE } = Sequelize
    await queryInterface.createTable('llm_providers', {
      id: {
        type: STRING,
        primaryKey: true,
        comment: '提供商ID',
      },
      name: {
        type: STRING,
        allowNull: false,
        comment: '提供商名称',
      },
      api_url: {
        type: STRING,
        comment: 'API基础地址',
      },
      official_url: {
        type: STRING,
        comment: '官方网站',
      },
      api_key_url: {
        type: STRING,
        comment: 'API密钥获取地址',
      },
      docs_url: {
        type: STRING,
        comment: '文档地址',
      },
      models_url: {
        type: STRING,
        comment: '模型列表地址',
      },
      state: {
        type: BOOLEAN,
        defaultValue: true,
        comment: '是否启用',
      },
      created_at: {
        type: DATE,
        allowNull: false,
      },
      updated_at: {
        type: DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DATE,
        allowNull: true,
      },
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('llm_providers')
  },
}
