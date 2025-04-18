const { Service } = require('egg')
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const {
  StdioClientTransport,
} = require('@modelcontextprotocol/sdk/client/stdio.js')
const fs = require('fs')
const path = require('path')
const os = require('os')
const paths = require('../../config/paths')

// 创建全局缓存对象
const GLOBAL_CACHE = {
  toolsCache: new Map(),
  toolsCacheTime: new Map(),
  CACHE_TTL: 5 * 60 * 1000, // 缓存有效期：5分钟
  clients: new Map(),       // 添加全局客户端缓存
  initialized: false        // 添加全局初始化状态
};

class McpService extends Service {
  constructor(ctx) {
    super(ctx)
    // 使用全局缓存替代实例缓存
    this.toolsCache = GLOBAL_CACHE.toolsCache
    this.toolsCacheTime = GLOBAL_CACHE.toolsCacheTime
    this.CACHE_TTL = GLOBAL_CACHE.CACHE_TTL
    this.clients = GLOBAL_CACHE.clients
    this.initialized = GLOBAL_CACHE.initialized
  }

  async ensureInitialized() {
    if (!this.initialized) {
      this.ctx.logger.info('MCP服务首次初始化')
      await this.initByConfig()
      GLOBAL_CACHE.initialized = true
      this.initialized = true
    } else {
      this.ctx.logger.info('MCP服务已初始化，跳过初始化过程')
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

  /**
   * 停止所有MCP服务器
   */
  async stopServer() {
    this.ctx.logger.info('正在停止所有MCP服务器')
    
    // 关闭所有客户端连接
    for (const [key, client] of this.clients.entries()) {
      try {
        // 如果客户端有disconnect方法，调用它
        if (client && typeof client.disconnect === 'function') {
          await client.disconnect()
          this.ctx.logger.info(`已断开服务器 ${key} 的连接`)
        }
      } catch (error) {
        this.ctx.logger.error(`断开服务器 ${key} 连接时出错:`, error)
      }
    }
    
    // 清空客户端列表
    this.clients.clear()
    this.ctx.logger.info('所有MCP服务器已停止')
  }

  /**
   * 重启所有MCP服务器
   */
  async restartServer() {
    this.ctx.logger.info('正在重启所有MCP服务器')
    
    // 停止所有服务器
    await this.stopServer()
    
    // 清除所有缓存
    this.clearToolsCache()
    
    // 重置初始化状态
    GLOBAL_CACHE.initialized = false
    this.initialized = false
    
    // 重新初始化
    await this.ensureInitialized()
    
    this.ctx.logger.info('所有MCP服务器已重启')
    return true
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await this.stopServer()
    this.clearToolsCache()
  }

  // Tools
  /**
   * 检查工具缓存是否有效
   * @param {string} key 服务器键名
   * @returns {boolean} 缓存是否有效
   */
  isToolsCacheValid(key) {
    if (!this.toolsCache.has(key) || !this.toolsCacheTime.has(key)) {
      this.ctx.logger.info(`缓存检查: ${key} 缓存不存在`, {
        hasCacheKey: this.toolsCache.has(key),
        hasTimeKey: this.toolsCacheTime.has(key),
        cacheSize: this.toolsCache.size,
        allKeys: Array.from(this.toolsCache.keys())
      })
      return false
    }
    
    const cacheTime = this.toolsCacheTime.get(key)
    const isValid = (Date.now() - cacheTime) < this.CACHE_TTL
    
    this.ctx.logger.info(`缓存检查: ${key} 缓存${isValid ? '有效' : '已过期'}`, {
      cacheTime,
      currentTime: Date.now(),
      diff: Date.now() - cacheTime,
      ttl: this.CACHE_TTL
    })
    
    return isValid
  }

  /**
   * 获取所有工具列表，使用缓存提高性能
   */
  async listAllTools() {
    await this.ensureInitialized()
    const tools = []
    
    for (const key of this.clients.keys()) {
      const serverTools = await this.getTool(key)
      tools.push(...serverTools.tools)
    }
    
    this.ctx.logger.info('List tools success')
    this.ctx.logger.info('Tools names:', tools.map(tool => tool.name))
    return tools
  }

  /**
   * 获取指定服务器的工具列表，优先使用缓存
   */
  async getTool(key) {
    await this.ensureInitialized()
    
    // 如果缓存有效，直接返回缓存数据
    if (this.isToolsCacheValid(key)) {
      this.ctx.logger.info(`使用缓存的工具列表: ${key}`, {
        cacheSize: this.toolsCache.size,
        allKeys: Array.from(this.toolsCache.keys())
      })
      return this.toolsCache.get(key)
    }
    
    const client = this.clients.get(key)
    if (!client) {
      return { tools: [] }
    }
    
    try {
      this.ctx.logger.info(`从服务器获取工具列表: ${key}`)
      const tools = await client.listTools()
      
      // 处理工具名称
      tools.tools = tools.tools.map((tool) => {
        const name = `mcp_${key}_${tool.name}`
        tool.metadata = {
          serverKey: key,
          originalName: tool.name
        }
        tool.name = name
        return tool
      })
      
      // 更新缓存
      this.toolsCache.set(key, tools)
      this.toolsCacheTime.set(key, Date.now())
      
      this.ctx.logger.info('Get tools success', {
        cacheUpdated: this.toolsCache.has(key),
        toolsCount: tools.tools.length,
        cacheSize: this.toolsCache.size,
        allKeys: Array.from(this.toolsCache.keys())
      })
      
      return tools
    } catch (error) {
      this.ctx.logger.error('Get tools error:', error)
      
      // 如果有缓存但已过期，在出错时仍然使用过期缓存
      if (this.toolsCache.has(key)) {
        this.ctx.logger.info(`获取工具失败，使用过期缓存: ${key}`)
        return this.toolsCache.get(key)
      }
      
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
      // 配置文件路径
      const configFile = path.join(paths.configPath, 'mcp.config.json')
      const defaultConfigFile = path.join(__dirname, './mcp.config.default.json')
      this.ctx.logger.info('[MCP]Config file path:', configFile)

      // 确保配置目录存在
      if (!fs.existsSync(paths.configPath)) {
        fs.mkdirSync(paths.configPath, { recursive: true })
      }
      
      // 如果配置文件不存在，复制默认配置
      if (!fs.existsSync(configFile)) {
        this.ctx.logger.info('[MCP]Config file not found, creating from default template')
        const defaultConfig = fs.readFileSync(defaultConfigFile, 'utf8')
        fs.writeFileSync(configFile, defaultConfig, 'utf8')
      }

      // 读取配置文件
      const config = fs.readFileSync(configFile, 'utf8')
      const configJSON = JSON.parse(config)
      const servers = configJSON.mcpServers
      
      this.ctx.logger.info('[MCP]Get config success:', servers)
      return servers
    } catch (error) {
      this.ctx.logger.error('[MCP]Get config error:', error)
      throw error
    }
  }

  //
  /**
   * 获取可执行文件路径
   * @param {string} toolName 工具名称 (bun 或 uv)
   * @returns {object} 包含可执行文件路径和是否存在的对象
   */
  getExecutablePath(toolName) {
    const platform = os.platform()
    const isWindows = platform === 'win32'
    
    // 构建可执行文件名
    const executableName = isWindows ? `${toolName}.exe` : toolName
    
    // 使用配置的 binPath
    const executablePath = path.join(paths.binPath, executableName)
    
    // 检查文件是否存在
    const exists = fs.existsSync(executablePath)
    
    this.ctx.logger.info(`检查工具 ${toolName} 路径:`, {
      path: executablePath,
      exists: exists
    })
    
    return {
      path: executablePath,
      exists: exists
    }
  }

  /**
   * 构造命令和参数，使用内置的bun或uv替代系统工具
   */
  buildCommand(serverConfig) {
    let command = serverConfig.command
    let args = [...serverConfig.args]
    
    // 根据原始命令进行转换
    if (command === 'node' || command === 'npx') {
      // 获取 bun 可执行文件
      const bunExecutable = this.getExecutablePath('bun')
      
      if (!bunExecutable.exists) {
        throw new Error('未找到 bun 可执行文件，请在 MCP 运行环境中下载所需工具')
      }
      
      command = bunExecutable.path
      
      // 如果是npx命令，调整参数
      if (serverConfig.command === 'npx') {
        args.unshift('x')  // 添加 bun x 命令，等同于 npx
      }
    } 
    else if (command === 'uv' || command === 'uvx' || command === 'pip' || command === 'python' || command === 'python3') {
      // 获取 uv 可执行文件
      const uvExecutable = this.getExecutablePath('uv')
      
      if (!uvExecutable.exists) {
        throw new Error('未找到 uv 可执行文件，请在 MCP 运行环境中下载所需工具')
      }
      
      command = uvExecutable.path

      // 处理不同的命令类型
      if (serverConfig.command === 'uvx') {
        // uvx is an alias for 'uv tool run'
        args.unshift('tool', 'run')
      } else if (serverConfig.command === 'pip') {
        args.unshift('pip')
      } else if (serverConfig.command === 'python' || serverConfig.command === 'python3') {
        args.unshift('python')
      }
    }
    
    this.ctx.logger.info(`转换命令: ${serverConfig.command} -> ${command}`)
    this.ctx.logger.info(`转换参数: ${serverConfig.args} -> ${args}`)
    
    return { command, args }
  }

  // 清除工具缓存
  /**
   * 清除工具缓存
   * @param {string} key 可选，指定服务器键名。不提供则清除所有缓存
   */
  clearToolsCache(key = null) {
    if (key) {
      this.toolsCache.delete(key)
      this.toolsCacheTime.delete(key)
      this.ctx.logger.info(`已清除服务器 ${key} 的工具缓存`)
    } else {
      this.toolsCache.clear()
      this.toolsCacheTime.clear()
      this.ctx.logger.info('已清除所有工具缓存')
    }
  }
}

module.exports = McpService
