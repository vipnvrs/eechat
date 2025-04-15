const { Service } = require('egg')
const { type } = require('os')

module.exports = class ToolsService extends Service {
  constructor(ctx) {
    super(ctx)
    this.tools = 
    [
        {
          "type": "function",
          "function": {
              "name": "get_weather",
              "description": "Get weather of an location, the user shoud supply a location first",
              "parameters": {
                  "type": "object",
                  "properties": {
                      "location": {
                          "type": "string",
                          "description": "The city and state, e.g. San Francisco, CA",
                      }
                  },
                  "required": ["location"]
              },
          }
      },
    ]
  }

  tools = []

  addTool(name, tool) {
    this.tools[name] = tool
  }

  async runTools(name, args) {
    console.log('run tools', name, args)
    return 'tool: done, 北京：25℃'
  }

  async getTools() {
    try {
      const mcpTools = await this.ctx.service.mcp.listAllTools()
      const openaiTools = JSON.parse(
        JSON.stringify(this.convertMcpToolsToOpenaiTools(mcpTools)),
      )
      console.log('转换后的工具列表:', JSON.stringify(openaiTools, null, 2))
      return this.tools
      return [...this.tools, ...openaiTools]
      return openaiTools
    } catch (error) {
      this.ctx.logger.error('获取工具列表失败:', error)
      console.error('获取工具列表失败:', error)
      return this.tools // 如果 MCP 工具获取失败，至少返回内置工具
    }
  }

  convertMcpToolsToOpenaiTools(mcpTools) {
    return mcpTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: tool.inputSchema.type,
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      },
    }))
  }
}
