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

  return config
}
