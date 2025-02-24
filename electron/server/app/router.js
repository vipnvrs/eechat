/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app

  // 测试接口
  router.get('/', controller.home.index)

  router.post('/api/chat', controller.chat.chat)
}
