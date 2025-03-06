const egg = require('egg')

const workers = Number(process.env.EGG_WORKERS) || 1
egg.startCluster({
  workers,
  baseDir: __dirname,
  port: process.env.PORT || 7001,
})
