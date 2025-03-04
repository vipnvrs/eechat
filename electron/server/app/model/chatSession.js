module.exports = app => {
  const { INTEGER, STRING, DATE } = app.Sequelize

  const ChatSession = app.model.define(
    'chat_session',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '会话ID',
      },
      title: {
        type: STRING(100),
        allowNull: false,
        defaultValue: '新对话',
        comment: '会话标题',
      },
      uid: {
        type: STRING(50),
        allowNull: false,
        comment: '用户ID',
      },
      model: {
        type: STRING(50),
        allowNull: false,
        defaultValue: 'deepseek-r1',
        comment: '使用的模型',
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
      tableName: 'chat_session',
      paranoid: true, // 启用软删除
      timestamps: true, // 启用时间戳
      underscored: true, // 使用下划线命名
    },
  )

  // 定义关联关系
  // ChatSession.associate = function () {
  //   app.model.ChatSession.hasMany(app.model.Message, {
  //     foreignKey: 'session_id',
  //     as: 'messages',
  //     onDelete: 'CASCADE', // 删除会话时级联删除消息
  //   })
  // }

  return ChatSession
}
