const { Service } = require('egg')
const { exec } = require('child_process')
const util = require('util')
const { sleep } = require('openai/core')
const { read } = require('fs')
const execAsync = util.promisify(exec)

class OllamaService extends Service {
  /**
   * 检查 Ollama 状态
   * @returns {Promise<Object>} 返回 Ollama 的状态信息
   */
  async checkState() {
    const { platform } = process
    const checkCmd = platform === 'win32' ? 'where ollama' : 'which ollama'

    try {
      // 首先检查是否安装
      await execAsync(checkCmd)

      // 检查是否运行中
      try {
        const response = await this.ctx.curl(
          'http://localhost:11434/api/version',
          {
            timeout: 3000,
            dataType: 'json',
          },
        )

        if (response.status === 200) {
          return {
            installed: true,
            running: true,
            version: response.data.version,
          }
        }

        return {
          installed: true,
          running: false,
          error: '模型管理器未运行',
        }
      } catch (error) {
        return {
          installed: true,
          running: false,
          error: '模型管理器未运行',
        }
      }
    } catch (error) {
      return {
        installed: false,
        running: false,
        error: '模型管理器未安装',
      }
    }
  }

  /**
   * 启动 Ollama
   * @returns {Promise<void>}
   */
  async start() {
    const { platform } = process
    const { ctx } = this

    // 启动服务
    switch (platform) {
      case 'win32':
        try {
          await execAsync('"ollama app"')
        } catch (error) {
          throw new Error('启动模型管理器失败')
        }
        break
      case 'darwin':
        try {
          await execAsync('open -a ollama')
        } catch (error) {
          throw new Error('启动模型管理器失败')
        }
        break
      case 'linux':
        try {
          await execAsync('ollama')
        } catch (error) {
          throw new Error('启动模型管理器失败')
        }
        break
    }

    // 等待服务启动
    let attempts = 0
    const maxAttempts = 10 // 最多尝试10次

    while (attempts < maxAttempts) {
      try {
        const response = await ctx.curl('http://localhost:11434/api/version', {
          timeout: 3000,
          dataType: 'json',
        })

        if (response.status === 200) {
          return // 服务已启动
        }
      } catch (error) {
        // 忽略错误,继续重试
      }

      await sleep(1000) // 等待1秒
      attempts++
    }

    throw new Error('启动模型管理器超时')
  }

  /**
   * 停止 Ollama
   * @returns {Promise<void>}
   */
  async stop() {
    const { platform } = process
    switch (platform) {
      case 'win32':
        try {
          await execAsync('taskkill /f /im ollama.exe')
        } catch (error) {
          throw new Error('停止模型管理器失败')
        }
        break
      case 'darwin':
        try {
          await execAsync('pkill -9 ollama Ollama')
        } catch (error) {
          throw new Error('停止模型管理器失败')
        }
        break
      case 'linux':
        try {
          await execAsync('pkill -9 ollama Ollama')
        } catch (error) {
          throw new Error('停止模型管理器失败')
        }
        break
    }
  }

  /**
   * 重启 Ollama
   * @returns {Promise<void>}
   */
  async restart() {
    await this.stop()
    await this.start()
  }

  /**
   * 安装 Ollama
   * @returns {Promise<void>}
   */
  async install() {
    const { platform } = process
    const installCmd =
      platform === 'win32' ? 'choco install ollama' : 'brew install ollama'

    try {
      await execAsync(installCmd)
    } catch (error) {
      throw new Error('安装模型管理器失败')
    }
  }

  /**
   * ollama 模型安装
   */
  async pullModel(modelName) {
    const { ctx } = this
    var requestOptions = {
      method: 'POST',
      headers: {},
      body: JSON.stringify({
        model: modelName,
        stream: true,
      }),
    }
    try {
      const response = await fetch(
        'http://localhost:11434/api/pull',
        requestOptions,
      )
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        const chunk = decoder.decode(value)
        console.log(done, chunk)
        if (done) break
      }
    } catch (error) {
      ctx.res.end()
      throw new Error('模型安装失败')
    }
  }
}

module.exports = OllamaService
