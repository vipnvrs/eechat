import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpeechStore = defineStore('speech', () => {
  // 当前是否正在播放语音
  const isSpeaking = ref(false)
  
  // 当前播放的文本内容
  const currentText = ref('')
  
  // 当前使用的语音类型（系统或火山引擎）
  const speechType = ref<'system' | 'volcano'>('system')
  
  // 音频URL（用于分析频谱）
  const audioUrl = ref('')
  
  // 开始播放语音
  const startSpeaking = (text: string, type: 'system' | 'volcano' = 'system', url: string = '') => {
    currentText.value = text
    speechType.value = type
    audioUrl.value = url
    isSpeaking.value = true
  }
  
  // 停止播放语音
  const stopSpeaking = () => {
    isSpeaking.value = false
    currentText.value = ''
    audioUrl.value = ''
  }
  
  return {
    isSpeaking,
    currentText,
    speechType,
    audioUrl,
    startSpeaking,
    stopSpeaking
  }
})