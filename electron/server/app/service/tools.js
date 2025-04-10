const { Service } = require('egg')

module.exports = class ToolsService extends Service {
  constructor(ctx) {
    super(ctx)
    this.tools = [
      {
        type: 'function',
        name: 'get_weather',
        description: 'Get current temperature for a given location.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City and country e.g. Bogotá, Colombia',
            },
          },
          required: ['location'],
          additionalProperties: false,
        },
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

  getTools() {
    return this.tools
  }
}
