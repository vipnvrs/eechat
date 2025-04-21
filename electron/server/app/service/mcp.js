const { Service } = require('egg')
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js')
// const {StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js')
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
      
      // 获取传输类型，默认为 stdio
      const transportType = serverConfig.transport || 'stdio'
      let transport;
      
      if (typeof serverConfig.url != 'undefined' || transportType === 'sse') {
        const baseUrl = new URL(serverConfig.url)
        if (!serverConfig.url) {
          throw new Error('SSE 传输类型需要提供 url 参数')
        }
        this.ctx.logger.info('使用 SSE 传输连接服务器:', {
          url: serverConfig.url,
          headers: serverConfig.headers || {}
        })
        // try {
        //   transport = new StreamableHTTPClientTransport(
        //     new URL(baseUrl)
        //   )
        // } catch (error) {
          
        // }
        transport = new SSEClientTransport(baseUrl)
      } else {
        // 使用默认的 stdio 传输
        const { command, args, env } = this.buildCommand(serverConfig)

        this.ctx.logger.info('使用 stdio 传输连接服务器:', {
          command,
          args,
          env,
          fullCommand: `${command} ${args.join(' ')}`,
        })

        transport = new StdioClientTransport({
          command: command,
          args: args,
          env: env, // 添加环境变量配置
        })
      }

      // const { command, args, env } = this.buildCommand(serverConfig)

      // this.ctx.logger.info('构建后的命令和参数:', {
      //   command,
      //   args,
      //   env,
      //   fullCommand: `${command} ${args.join(' ')}`,
      // })

      // const transport = new StdioClientTransport({
      //   command: command,
      //   args: args,
      //   env: env, // 添加环境变量配置
      // })

      const client = new Client({
        name: 'eechat',
        version: '1.0.0',
      })

      await client.connect(transport)
      this.clients.set(key, client)
      this.ctx.logger.info('Init mcp client success')
      return { success: true }
    } catch (error) {
      this.ctx.logger.error('Init mcp client error', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 重启所有MCP服务器
   */
  async restartServer() {
    try {
      this.ctx.logger.info('正在重启所有MCP服务器')
      
      // 停止所有服务器
      await this.stopServer()
      
      // 清除所有缓存
      this.clearToolsCache()
      
      // 重置初始化状态
      GLOBAL_CACHE.initialized = false
      this.initialized = false
      
      // 重新初始化，但收集错误信息而不是中断
      const config = await this.getConfig()
      const results = {
        total: Object.keys(config).length,
        success: 0,
        failed: 0,
        failedServers: []
      }
      
      for (const key in config) {
        const serverConfig = config[key]
        const result = await this.connectServer(key, serverConfig)
        
        if (result.success) {
          results.success++
        } else {
          results.failed++
          results.failedServers.push({
            key,
            error: result.error
          })
        }
      }
      
      // 更新初始化状态
      if (results.success > 0) {
        GLOBAL_CACHE.initialized = true
        this.initialized = true
      }
      
      this.ctx.logger.info('MCP服务器重启结果:', results)
      
      // 构建返回消息
      let message = `共 ${results.total} 个服务，`
      if (results.failed > 0) {
        message += `其中 ${results.failed} 个未启动成功 (${results.failedServers.map(s => s.key).join(', ')})。`
      } else {
        message += `全部启动成功。`
      }
      
      return {
        success: results.success > 0,
        message,
        details: results
      }
        
    } catch (error) {
      this.ctx.logger.error('重启MCP服务器时发生错误:', error)
      return {
        success: false,
        message: `重启失败: ${error.message || '未知错误'}`,
        details: { error: error.message }
      }
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
    // 合并环境变量
    let env = {
      // ...process.env, // 继承当前进程的环境变量
      ...(serverConfig.env || {}), // 合并配置中的环境变量
    }

    // 根据原始命令进行转换
    if (command === 'node' || command === 'npx') {
      // 获取 bun 可执行文件
      const bunExecutable = this.getExecutablePath('bun')

      if (!bunExecutable.exists) {
        throw new Error(
          '未找到 bun 可执行文件，请在 MCP 运行环境中下载所需工具',
        )
      }

      command = bunExecutable.path

      // 如果是npx命令，调整参数
      if (serverConfig.command === 'npx') {
        args.unshift('x') // 添加 bun x 命令，等同于 npx
      }
    } else if (
      command === 'uv' ||
      command === 'uvx' ||
      command === 'pip' ||
      command === 'python' ||
      command === 'python3'
    ) {
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
      } else if (
        serverConfig.command === 'python' ||
        serverConfig.command === 'python3'
      ) {
        args.unshift('python')
      }
    }

    this.ctx.logger.info(`转换命令: ${serverConfig.command} -> ${command}`)
    this.ctx.logger.info(`转换参数: ${serverConfig.args} -> ${args}`)
    this.ctx.logger.info(`环境变量:`, env)

    return { command, args, env }
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

  // 其他方法...
  // 从URL获取README内容
  async fetchReadme(url) {
    this.ctx.logger.info('获取README内容:', url)
    
    try {
      // 尝试从mockdata中匹配README
      const mockReadme = await this.matchReadmeFromMockData(url)
      if (mockReadme) {
        return mockReadme
      }
      
      // 如果mockdata中没有匹配，则从URL获取内容
      const response = await this.ctx.curl(url, {
        timeout: 10000,
        dataType: 'text',
      })
      
      if (response.status !== 200) {
        throw new Error(`获取失败，状态码: ${response.status}`)
      }
      
      return response.data
    } catch (error) {
      this.ctx.logger.error('获取README失败:', error)
      throw error
    }
  }

  // 从mockdata中匹配README
  async matchReadmeFromMockData(url) {
    this.ctx.logger.info('尝试匹配README:', url)
    
    try {
      // 检查是否是GitHub链接
      const githubRegex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+\.md)/i
      const rawGithubRegex = /https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)/i
      // 新增：检测GitHub项目链接
      const githubProjectRegex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/i
      
      // 如果是GitHub项目链接，尝试获取项目的README.md
      if (githubProjectRegex.test(url) && !githubRegex.test(url) && !rawGithubRegex.test(url)) {
        const matches = url.match(githubProjectRegex)
        if (matches && matches.length >= 3) {
          const [_, owner, repo] = matches
          
          // 检查请求头中的语言设置
          const acceptLanguage = this.ctx.get('Accept-Language') || ''
          const isChinese = acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh')
          
          // 尝试获取README.md文件
          const readmeFiles = ['README.md', 'readme.md', 'Readme.md']
          
          for (const readmeFile of readmeFiles) {
            let readmeUrl
            if (isChinese) {
              // 使用中国镜像
              readmeUrl = `https://raw.gitmirror.com/${owner}/${repo}/refs/heads/main/${readmeFile}`
            } else {
              // 使用原始GitHub链接
              readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${readmeFile}`
            }
            
            this.ctx.logger.info(`尝试获取GitHub项目README: ${readmeUrl}`)
            
            try {
              const response = await this.ctx.curl(readmeUrl, {
                timeout: 15000,
                dataType: 'text',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              })
              
              if (response.status === 200) {
                this.ctx.logger.info(`成功获取GitHub项目README: ${readmeUrl}`)
                return response.data
              }
            } catch (error) {
              this.ctx.logger.info(`获取 ${readmeUrl} 失败，尝试其他分支或文件名`)
            }
          }
          
          // 如果main分支没有找到，尝试master分支
          for (const readmeFile of readmeFiles) {
            let readmeUrl
            if (isChinese) {
              // 使用中国镜像
              readmeUrl = `https://raw.gitmirror.com/${owner}/${repo}/refs/heads/master/${readmeFile}`
            } else {
              // 使用原始GitHub链接
              readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/master/${readmeFile}`
            }
            
            this.ctx.logger.info(`尝试获取GitHub项目README(master分支): ${readmeUrl}`)
            
            try {
              const response = await this.ctx.curl(readmeUrl, {
                timeout: 15000,
                dataType: 'text',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              })
              
              if (response.status === 200) {
                this.ctx.logger.info(`成功获取GitHub项目README(master分支): ${readmeUrl}`)
                return response.data
              }
            } catch (error) {
              this.ctx.logger.info(`获取 ${readmeUrl} 失败`)
            }
          }
          
          this.ctx.logger.info(`未能找到GitHub项目 ${owner}/${repo} 的README文件`)
        }
      }
      
      // 如果是GitHub链接但不是raw链接，转换为raw链接
      if (githubRegex.test(url) && !rawGithubRegex.test(url)) {
        const matches = url.match(githubRegex)
        if (matches && matches.length >= 5) {
          const [_, owner, repo, branch, path] = matches
          
          // 检查请求头中的语言设置
          const acceptLanguage = this.ctx.get('Accept-Language') || ''
          const isChinese = acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh')
          
          let rawUrl
          if (isChinese) {
            // 使用中国镜像
            rawUrl = `https://raw.gitmirror.com/${owner}/${repo}/refs/heads/${branch}/${path}`
            this.ctx.logger.info('使用中国镜像获取GitHub内容:', rawUrl)
          } else {
            // 使用原始GitHub链接
            rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${path}`
            this.ctx.logger.info('使用原始GitHub链接获取内容:', rawUrl)
          }
          
          // 获取内容
          const response = await this.ctx.curl(rawUrl, {
            timeout: 15000,
            dataType: 'text',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          })
          
          if (response.status === 200) {
            return response.data
          } else {
            this.ctx.logger.error('获取GitHub内容失败:', {
              url: rawUrl,
              status: response.status,
              statusText: response.statusText
            })
            return null
          }
        }
      }
      
      // 如果已经是raw链接，直接处理
      if (rawGithubRegex.test(url)) {
        const matches = url.match(rawGithubRegex)
        if (matches && matches.length >= 4) {
          const [_, owner, repo, path] = matches
          
          // 检查请求头中的语言设置
          const acceptLanguage = this.ctx.get('Accept-Language') || ''
          const isChinese = acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh')
          
          let rawUrl = url
          if (isChinese) {
            // 使用中国镜像替换原始域名
            rawUrl = url.replace('raw.githubusercontent.com', 'raw.gitmirror.com')
            this.ctx.logger.info('使用中国镜像获取GitHub内容:', rawUrl)
          }
          
          // 获取内容
          const response = await this.ctx.curl(rawUrl, {
            timeout: 15000,
            dataType: 'text',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          })
          
          if (response.status === 200) {
            return response.data
          } else {
            this.ctx.logger.error('获取GitHub内容失败:', {
              url: rawUrl,
              status: response.status,
              statusText: response.statusText
            })
            return null
          }
        }
      }
      
      // 尝试从mockdata中匹配
      const mockDataDir = path.join(__dirname, '../mockdata/readme')
      
      // 确保mockdata目录存在
      if (!fs.existsSync(mockDataDir)) {
        fs.mkdirSync(mockDataDir, { recursive: true })
        this.ctx.logger.info('创建mockdata目录:', mockDataDir)
      }
      
      // 从URL中提取可能的文件名
      let fileName = ''
      
      // 尝试从GitHub URL提取仓库名
      if (githubRegex.test(url)) {
        const matches = url.match(githubRegex)
        if (matches && matches.length >= 3) {
          fileName = `${matches[2]}.md`
        }
      } else {
        // 从一般URL中提取最后一部分作为文件名
        const urlParts = url.split('/')
        fileName = urlParts[urlParts.length - 1]
        
        // 如果文件名不是.md结尾，添加.md后缀
        if (!fileName.endsWith('.md')) {
          fileName = `${fileName}.md`
        }
      }
      
      // 检查mockdata中是否有匹配的文件
      if (fileName) {
        const mockFilePath = path.join(mockDataDir, fileName)
        if (fs.existsSync(mockFilePath)) {
          this.ctx.logger.info('从mockdata中找到匹配的README:', mockFilePath)
          return fs.readFileSync(mockFilePath, 'utf8')
        }
      }
      
      // 没有找到匹配的mockdata，返回null
      return null
    } catch (error) {
      this.ctx.logger.error('匹配README失败:', error)
      return null
    }
  }

  // 添加MCP服务器
  async addServer(serverData) {
    this.ctx.logger.info('添加MCP服务器:', serverData)
    
    try {
      // 获取当前配置
      const configFile = path.join(paths.configPath, 'mcp.config.json')
      let config = { mcpServers: {} }
      
      if (fs.existsSync(configFile)) {
        const configContent = fs.readFileSync(configFile, 'utf8')
        config = JSON.parse(configContent)
      }
      
      // 合并新的服务器配置
      // 注意：不保存readme内容
      for (const [key, server] of Object.entries(serverData)) {
        // 移除readme相关字段，不存储在配置文件中
        const { readme, readmeCN, ...serverConfig } = server
        
        config.mcpServers[key] = serverConfig
      }
      
      // 保存配置
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8')
      
      // 重新连接新添加的服务器
      for (const [key, server] of Object.entries(serverData)) {
        // 移除readme相关字段
        const { readme, readmeCN, ...serverConfig } = server
        
        await this.connectServer(key, serverConfig)
      }
      
      return { success: true, message: '服务器添加成功' }
    } catch (error) {
      this.ctx.logger.error('添加MCP服务器失败:', error)
      throw error
    }
  }
}

module.exports = McpService
