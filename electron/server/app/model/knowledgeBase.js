module.exports = app => {
  const { INTEGER, STRING, DATE, TEXT, BOOLEAN } = app.Sequelize

  const KnowledgeBase = app.model.define(
    'knowledge_base',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '知识库ID',
      },
      title: {
        type: STRING(100),
        allowNull: false,
        defaultValue: '新知识库',
        comment: '知识库标题',
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: '知识库描述',
      },
      uid: {
        type: STRING(50),
        allowNull: false,
        comment: '用户ID',
      },
      vector_collection: {
        type: STRING(100),
        allowNull: false,
        comment: 'LanceDB集合名称',
      },
      is_default: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否为默认知识库',
      },
      document_count: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '文档数量',
      },
      embedding_model: {
        type: STRING(50),
        allowNull: true,
        comment: '使用的嵌入模型',
      },
      chunk_size: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 1000,
        comment: '文本分块大小',
      },
      chunk_overlap: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 200,
        comment: '文本分块重叠大小',
      },
      chunk_method: {
        type: STRING(20),
        allowNull: true,
        defaultValue: 'sliding_window',
        comment: '分块方法',
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
    },
    {
      tableName: 'knowledge_base',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  )

  // 定义关联关系
  KnowledgeBase.associate = function() {
    app.model.KnowledgeBase.hasMany(app.model.KnowledgeDocument, {
      foreignKey: 'knowledge_base_id',
      as: 'documents'
    });
  };

  return KnowledgeBase
}