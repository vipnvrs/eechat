/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app

  // 测试接口
  router.get('/', controller.home.index)

  router.post('/api/chat', controller.chat.sendMessage)
  router.get('/api/chat/:id', controller.chat.history)
  router.post('/api/session/new', controller.chat.createSession)
  router.get('/api/session/list', controller.chat.listSession)

  router.get('/api/ollama/state', controller.ollama.state)
  router.post('/api/ollama/start', controller.ollama.start)
  router.post('/api/ollama/stop', controller.ollama.stop)
  router.post('/api/ollama/restart', controller.ollama.restart)
  router.post('/api/ollama/install', controller.ollama.install)
  router.post('/api/ollama/pull', controller.ollama.pullModel)
  router.get('/api/ollama/list', controller.ollama.listModel)
  
  
}
