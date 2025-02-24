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
}
