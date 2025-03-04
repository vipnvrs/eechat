module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, BOOLEAN, INTEGER, DATE } = Sequelize
    await queryInterface.createTable('llm_models', {
      id: {
        type: STRING,
        primaryKey: true,
        comment: '模型ID',
      },
      provider_id: {
        type: STRING,
        allowNull: false,
        comment: '提供商ID',
        references: {
          model: 'llm_providers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: STRING,
        allowNull: false,
        comment: '模型名称',
      },
      group_name: {
        type: STRING,
        comment: '模型分组',
      },
      state: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否启用',
      },
      sort: {
        type: INTEGER,
        defaultValue: 0,
        comment: '排序',
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
    await queryInterface.dropTable('llm_models')
  },
}
