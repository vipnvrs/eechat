const { Service } = require('egg')
const OpenAI = require('openai')
const { exec } = require('child_process')
const util = require('util')
const { sleep } = require('openai/core')
const { read } = require('fs')
const execAsync = util.promisify(exec)
const ollamaBaseUrl = 'http://127.0.0.1:11434'
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
        const response = await this.ctx.curl(`${ollamaBaseUrl}/api/version`, {
          timeout: 3000,
          dataType: 'json',
        })

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
        exec('"ollama app"')
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
    const maxAttempts = 10 // 最多尝试5次

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${ollamaBaseUrl}/api/version`, {
          timeout: 3000,
          // dataType: 'json',
        })
        console.log(attempts, response)

        if (response.status === 200) {
          return // 服务已启动
        }
      } catch (error) {
        console.log(error)
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
          // 首先尝试优雅地关闭
          await execAsync('taskkill /im ollama.exe')
          // 等待一会儿让进程有机会正常关闭
          await sleep(1000)
          // 如果还在运行，则强制终止所有相关进程
          try {
            await execAsync(
              'taskkill /f /im "ollama app.exe" & taskkill /f /im ollama.exe',
            )
          } catch (e) {
            console.log(e)
          }
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
    return { data: 'https://ollama.com/download' }
    // const { platform } = process
    // try {
    //   if (platform === 'win32') {
    //     // 通过 HTTP 请求通知渲染进程打开下载页面
    //     return { data: 'https://ollama.com/download' }
    //   } else {
    //     // macOS 和 Linux 继续使用包管理器安装
    //     const installCmd = 'brew install ollama'
    //     await execAsync(installCmd)
    //   }
    // } catch (error) {
    //   if (platform === 'win32') {
    //     throw new Error(
    //       '请从官网下载并手动安装 Ollama: https://ollama.ai/download/windows',
    //     )
    //   } else {
    //     throw new Error('安装模型管理器失败，请手动安装')
    //   }
    // }
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
      const response = await fetch(`${ollamaBaseUrl}/api/pull`, requestOptions)
      ctx.set({
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      ctx.res.statusCode = 200

      const reader = response.body && response.body.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        const chunk = decoder.decode(value)
        // 处理可能包含多个 JSON 对象的情况
        const jsonStrings = chunk.match(/({[^}]+})/g) || []

        for (const jsonStr of jsonStrings) {
          try {
            const chunkWithDownloadInfo = this.getDownloadInfo(
              jsonStr,
              modelName,
            )
            ctx.res.write(`data: ${JSON.stringify(chunkWithDownloadInfo)}\n\n`)

            if (chunkWithDownloadInfo.status === 'success') {
              ctx.res.end()
              return
            }
          } catch (error) {
            console.error('解析下载信息失败:', error)
            continue
          }
        }

        if (done) {
          ctx.res.end()
          break
        }
      }
    } catch (error) {
      console.log('模型安装失败:', error)
      ctx.res.end()
      throw new Error('模型安装失败')
    }
  }

  /**
   * 获取下载进度信息
   * @param {Object} chunk 
    格式如下：
    { completed: 390299136,
      digest: "sha256:c5396e06af294bd101b30dce59131a76d2b773e76950acc870eda801d3ab0515",
      status: "pulling c5396e06af29",
      total: 397807936
    }
   * @return {Object} {speed, percent}
   */
  getDownloadInfo(chunk, modelName) {
    try {
      chunk = JSON.parse(chunk)
    } catch (error) {
      console.log(chunk)
      debugger
    }

    let speed = 0
    let percent = 2

    if (chunk.status == 'success') {
      chunk.speed = 0
      chunk.percent = 100
      return chunk
    }
    if (!chunk.completed || !chunk.total) {
      chunk.speed = 0
      chunk.percent = 2
      return chunk
    }
    // 计算下载百分比
    percent = Math.round((chunk.completed / chunk.total) * 100)
    // 计算下载速度 (MB/s)
    speed = Math.round((chunk.completed / 1024 / 1024) * 100) / 100
    chunk.speed = speed
    chunk.percent = percent
    chunk.model = modelName
    return chunk
  }

  /**
   * 获取ollama模型列表
   */
  async listModel() {
    try {
      const response = await this.ctx.curl(`${ollamaBaseUrl}/api/tags`, {
        timeout: 3000,
        dataType: 'json',
      })
      if (response.status === 200) {
        return response
      }
    } catch (error) {
      throw new Error('获取模型列表失败')
    }
  }

  /**
   * 移除模型
   */
  async removeModel(modelName) {
    const { ctx } = this

    try {
      const response = await ctx.curl(`${ollamaBaseUrl}/api/delete`, {
        method: 'DELETE',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ name: modelName }),
      })

      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.data.error)
    } catch (error) {
      ctx.logger.error(error)
      throw new Error(error.message)
    }
  }

  async chatNoStream(messages, modelName) {
    const { ctx } = this
    const openai = new OpenAI({
      baseURL: `${ollamaBaseUrl}/v1`,
      apiKey: 'dummy',
    })
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: messages,
      })

      console.log(JSON.stringify(messages))
      console.log(response.choices[0].message.content)
      return response.choices[0].message.content
    } catch (error) {
      ctx.logger.error('Chat error:', error)
      throw new Error(error.message)
    }
  }
}

module.exports = OllamaService
