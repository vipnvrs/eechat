module.exports = app => {
  const { INTEGER, STRING, DATE, TEXT, FLOAT } = app.Sequelize

  const KnowledgeChunk = app.model.define(
    'knowledge_chunk',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '块ID',
      },
      document_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属文档ID',
      },
      knowledge_base_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属知识库ID',
      },
      chunk_index: {
        type: INTEGER,
        allowNull: false,
        comment: '块索引',
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '块内容',
      },
      vector_id: {
        type: STRING(100),
        allowNull: true,
        comment: 'LanceDB中的向量ID',
      },
      metadata: {
        type: TEXT,
        allowNull: true,
        comment: '元数据(JSON格式)',
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
      tableName: 'knowledge_chunk',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  )

  // 定义关联关系
  KnowledgeChunk.associate = function() {
    app.model.KnowledgeChunk.belongsTo(app.model.KnowledgeDocument, {
      foreignKey: 'document_id',
      as: 'document'
    });
    app.model.KnowledgeChunk.belongsTo(app.model.KnowledgeBase, {
      foreignKey: 'knowledge_base_id',
      as: 'knowledgeBase'
    });
  };

  return KnowledgeChunk
}