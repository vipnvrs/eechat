const { Controller } = require('egg');

class McpController extends Controller {
  async listAllTools() {
    const { ctx } = this

    try {
      const res = await ctx.service.mcp.listAllTools()
      ctx.body = ctx.helper.success(res)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
  async restartServer() {
    const { ctx } = this

    try {
      const res = await ctx.service.mcp.restartServer()
      ctx.body = ctx.helper.success(res)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = McpController;
