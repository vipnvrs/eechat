'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { TEXT, FLOAT } = Sequelize
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'chat_session',
        'system_prompt',
        {
          type: TEXT,
          allowNull: true,
          defaultValue: 'You are a helpful assistant.',
        },
        { transaction },
      )

      await queryInterface.addColumn(
        'chat_session',
        'temperature',
        {
          type: FLOAT,
          allowNull: true,
          defaultValue: 0.6,
        },
        { transaction },
      )

      await queryInterface.addColumn(
        'chat_session',
        'top_p',
        {
          type: FLOAT,
          allowNull: true,
          defaultValue: 1.0,
        },
        { transaction },
      )

      await queryInterface.addColumn(
        'chat_session',
        'presence_penalty',
        {
          type: FLOAT,
          allowNull: true,
          defaultValue: 0.0,
        },
        { transaction },
      )

      await queryInterface.addColumn(
        'chat_session',
        'frequency_penalty',
        {
          type: FLOAT,
          allowNull: true,
          defaultValue: 0.0,
        },
        { transaction },
      )
    })
  },

  down: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('chat_session', 'system_prompt', {
        transaction,
      })
      await queryInterface.removeColumn('chat_session', 'temperature', {
        transaction,
      })
      await queryInterface.removeColumn('chat_session', 'top_p', {
        transaction,
      })
      await queryInterface.removeColumn('chat_session', 'presence_penalty', {
        transaction,
      })
      await queryInterface.removeColumn('chat_session', 'frequency_penalty', {
        transaction,
      })
    })
  },
}
