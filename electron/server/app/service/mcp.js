const { Service } = require('egg')
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const {
  StdioClientTransport,
} = require('@modelcontextprotocol/sdk/client/stdio.js')
const fs = require('fs')
const path = require('path')

class McpService extends Service {
  constructor(ctx) {
    super(ctx)
  }

  clients = new Map()
  initialized = false

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initByConfig()
      this.initialized = true
    }
  }

  async initByConfig() {
    const config = await this.getConfig()
    for (const key in config) {
      const serverConfig = config[key]
      await this.connectServer(key, serverConfig)
    }
  }

  async connectServer(key, serverConfig) {
    try {
      this.ctx.logger.info('Init mcp client')
      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
      })

      const client = new Client({
        name: 'eechat',
        version: '1.0.0',
      })

      await client.connect(transport)
      this.clients.set(key, client)
      this.ctx.logger.info('Init mcp client success')
    } catch (error) {
      this.ctx.logger.error('Init mcp client error', error)
    }
  }

  async stopServer() {}

  async restartServer() {}

  async cleanup() {}

  // Tools
  async listAllTools() {
    await this.ensureInitialized()
    const tools = []
    for (const key of this.clients.keys()) {
      const serverTools = await this.getTool(key)
      console.log('serverTools', JSON.stringify(serverTools.tools))
      // tools.push({
      //   key,
      //   tools: serverTools,
      // })
      tools.push(...serverTools.tools)
    }
    this.ctx.logger.info('List tools success:', tools)
    return tools
  }

  async getTool(key) {
    await this.ensureInitialized()
    const client = this.clients.get(key)
    if (!client) {
      return []
    }
    try {
      const tools = await client.listTools()
      this.ctx.logger.info('Get tools success:', tools)
      return tools
    } catch (error) {
      this.ctx.logger.error('Get tools error:', error)
      throw error
    }
  }

  async callTool() {
    await this.ensureInitialized()
  }

  // Prompts
  async listPrompts() {
    await this.ensureInitialized()
  }

  async getPrompt() {
    await this.ensureInitialized()
  }

  // Resources
  async listResources() {
    await this.ensureInitialized()
  }

  async readResource() {
    await this.ensureInitialized()
  }

  // Config
  async getConfig() {
    try {
      this.ctx.logger.info('Get config')
      const configFile = fs.readFileSync(
        path.join(__dirname, './mcp.config.json'),
        'utf8',
      )
      const configJSON = JSON.parse(configFile.toString('utf8'))
      const servers = configJSON.mcpServers
      this.ctx.logger.info('Get config success:', servers)
      return servers
    } catch (error) {
      this.ctx.logger.error('Get config error:', error)
      throw error
    }
  }
}

module.exports = McpService
