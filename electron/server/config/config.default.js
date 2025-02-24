module.exports = appInfo => {
  const config = (exports = {})

  // 使用环境变量来区分环境
  const isProd = process.env.NODE_ENV === 'production'

  // 基础配置
  config.keys = appInfo.name + '_1740383378737_8971'
  config.middleware = []

  // 跨域配置
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  }

  // 根据环境配置不同的端口
  config.cluster = {
    listen: {
      port: isProd ? 7001 : 7002,
    },
  }

  // 安全配置
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: ['*'],
  }

  // 添加数据库配置
  const path = require('path')
  config.sequelize = {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/chat.db'),
    define: {
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
    logging: console.log,
    sync: {
      // 启用同步
      force: false, // 不强制重建表
      alter: true, // 允许修改表结构
    },
  }

  return config
}
