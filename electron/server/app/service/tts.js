const { Service } = require('egg')
const fetch = require('node-fetch')
const { WebSocket } = require('ws')
const fs = require('fs')

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const VOICE_LIST_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`
const WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`

module.exports = class TtsService extends Service {
  constructor(ctx) {
    super(ctx)
  }

  async tts(text, voice = 'en-US-AriaNeural') {
    return new Promise((resolve, reject) => {
      const ssml = `
        <speak version="1.0" xml:lang="en-US">
          <voice name="${voice}">${text}</voice>
        </speak>
      `.trim()

      const ws = new WebSocket(WS_URL, 'tts')

      const chunks = []
      ws.on('open', () => {
        // 语音配置
        ws.send(`Path: speech.config\r\n\r\n`)
        // 必要的配置头
        ws.send(
          JSON.stringify({
            context: {
              system: { name: 'SpeechSDK', version: '1.0.0' },
              audio: {
                metadata: { format: 'audio-16khz-32kbitrate-mono-mp3' },
              },
            },
          }),
        )
        // 发送 SSML
        ws.send(
          `Path: ssml\r\nContent-Type: application/ssml+xml\r\n\r\n${ssml}`,
        )
      })

      ws.on('message', data => {
        // 边接收到边拼接二进制音频流
        if (data instanceof Buffer) {
          chunks.push(data)
        }
      })

      ws.on('close', () => {
        const audio = Buffer.concat(chunks)
        fs.writeFileSync('output.mp3', audio)
        console.log('合成完成，已保存 output.mp3')
        resolve()
      })

      ws.on('error', reject)
    })
  }
}
