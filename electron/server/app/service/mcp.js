const { Service } = require('egg')
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const {
  StdioClientTransport,
} = require('@modelcontextprotocol/sdk/client/stdio.js')
const fs = require('fs')
const path = require('path')
const os = require('os')

class McpService extends Service {
  constructor(ctx) {
    super(ctx)
    this.clients = new Map()
    this.initialized = false
  }

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
      
      const { command, args } = this.buildCommand(serverConfig)
      
      this.ctx.logger.info('构建后的命令和参数:', {
        command,
        args,
        fullCommand: `${command} ${args.join(' ')}`
      })

      const transport = new StdioClientTransport({
        command: command,
        args: args,
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
      tools.push(...serverTools.tools)
    }
    this.ctx.logger.info('List tools success')
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
      tools.tools = tools.tools.map((tool) => {
        const name = `mcp_${key}_${tool.name}`
        tool.metadata = {
          serverKey: key,
          originalName: tool.name
        }
        tool.name = name
        return tool
      })
      this.ctx.logger.info('Get tools success')
      return tools
    } catch (error) {
      this.ctx.logger.error('Get tools error:', error)
      throw error
    }
  }

  async callTool(serverKey, toolName, args) {
    console.log('callTool', serverKey, toolName, args)
    await this.ensureInitialized()
    const client = this.clients.get(serverKey)
    if (!client) {
      throw new Error(`MCP服务器 ${serverKey} 不存在`)
    }
    
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      })
      
      this.ctx.logger.info(`工具 ${toolName} 调用成功:`, result)
      return result
    } catch (error) {
      this.ctx.logger.error(`工具 ${toolName} 调用失败:`, error)
      throw error
    }
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

  //
  // 构造命令和参数，使用内置的bun或uv替代系统工具
  buildCommand(serverConfig) {
    const platform = os.platform()
    const isWindows = platform === 'win32'
    const isMac = platform === 'darwin'
    const isLinux = platform === 'linux'
    
    // 修正工具路径获取方式
    const appRoot = path.join(__dirname, '../..')  // 定位到 electron/server 目录
    const toolsDir = path.join(appRoot, 'tools', 'bin')
    
    this.ctx.logger.info('工具目录:', {
      appRoot,
      toolsDir
    })
    
    let command = serverConfig.command
    let args = [...serverConfig.args]
    
    // 根据原始命令进行转换
    if (command === 'node' || command === 'npx') {
      // 使用bun替代node/npx
      if (isWindows) {
        command = path.join(toolsDir, 'bun.exe')  // 简化路径结构
      } else if (isMac || isLinux) {
        command = path.join(toolsDir, 'bun')
      }
      
      // 如果是npx命令，调整参数
      if (serverConfig.command === 'npx') {
        args.unshift('x')  // 添加 bun x 命令，等同于 npx
      }
    } else if (command === 'uv' || command === 'pip' || command === 'python' || command === 'python3') {
      if (isWindows) {
        command = path.join(toolsDir, 'uv.exe')
      } else if (isMac || isLinux) {
        command = path.join(toolsDir, 'uv')
      }
      
      // 根据原始命令调整参数
      if (serverConfig.command === 'pip') {
        // 将pip命令转换为uv命令
        // 例如: pip install 转换为 uv pip install
        args.unshift('pip', ...args)
      } else if (serverConfig.command === 'python' || serverConfig.command === 'python3') {
        // 使用uv run命令运行python脚本
        // 例如: python script.py 转换为 uv python script.py
        args.unshift('python', ...args)
      }
    }
    
    this.ctx.logger.info(`转换命令: ${serverConfig.command} -> ${command}`)
    this.ctx.logger.info(`转换参数: ${serverConfig.args} -> ${args}`)
    
    return { command, args }
  }
}

module.exports = McpService
