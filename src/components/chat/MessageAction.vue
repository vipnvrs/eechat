<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Copy, Check, Headphones } from 'lucide-vue-next'
import { useVolcanoTTS } from '@/composables/useVolcanoTTS'
import { useSpeechStore } from '@/stores/speech'

const props = defineProps<{
  message: string,
  role: string
}>()

const { t } = useI18n()
const isSpeaking = ref(false)
const isCopied = ref(false)
const isVolcanoSpeaking = ref(false)
const speechSynthesis = window.speechSynthesis
let utterance:any = null

// 引入火山引擎TTS
const { speak: volcanoSpeak, stop: volcanoStop, isPlaying } = useVolcanoTTS()

// 引入全局语音状态
const speechStore = useSpeechStore()

// 清理HTML标签，获取纯文本内容
const getPlainText = (html) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  let text = tempDiv.textContent || tempDiv.innerText || ''
  
  // 移除英文括号和中文括号包裹的内容
  text = text.replace(/\([^)]*\)/g, '') // 移除英文小括号 (...)
  text = text.replace(/（[^）]*）/g, '') // 移除中文小括号 （...）
  text = text.replace(/\[[^\]]*\]/g, '') // 移除英文中括号 [...]
  text = text.replace(/【[^】]*】/g, '') // 移除中文中括号 【...】
  text = text.replace(/\{[^}]*\}/g, '') // 移除英文大括号 {...}
  text = text.replace(/［[^］]*］/g, '') // 移除中文方括号 ［...］
  text = text.replace(/｛[^｝]*｝/g, '') // 移除中文花括号 ｛...｝
  
  // 移除连续的空格
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

// 开始朗读文本 (Web Speech API)
const speak = () => {
  // 如果火山引擎TTS正在播放，先停止它
  if (isVolcanoSpeaking.value) {
    volcanoStop()
    isVolcanoSpeaking.value = false
    speechStore.stopSpeaking()
  }
  
  if (isSpeaking.value) {
    stopSpeaking()
    return
  }
  
  const text = getPlainText(props.message)
  if (!text) return
  
  utterance = new SpeechSynthesisUtterance(text)
  
  // 设置语言，默认使用中文
  utterance.lang = 'zh-CN'
  
  // 监听语音结束事件
  utterance.onend = () => {
    isSpeaking.value = false
    speechStore.stopSpeaking()
  }
  
  // 监听语音错误事件
  utterance.onerror = (event) => {
    // console.error('语音合成错误:', event)
    isSpeaking.value = false
    speechStore.stopSpeaking()
  }
  
  // 开始朗读
  speechSynthesis.speak(utterance)
  isSpeaking.value = true
  
  // 更新全局语音状态
  speechStore.startSpeaking(text, 'system')
}

// 停止朗读 (Web Speech API)
const stopSpeaking = () => {
  speechSynthesis.cancel()
  isSpeaking.value = false
  speechStore.stopSpeaking()
}

// 使用火山引擎TTS朗读
const speakWithVolcano = async () => {
  // 如果系统TTS正在播放，先停止它
  if (isSpeaking.value) {
    stopSpeaking()
  }
  
  if (isVolcanoSpeaking.value) {
    await volcanoStop()
    isVolcanoSpeaking.value = false
    speechStore.stopSpeaking()
    return
  }
  
  const text = getPlainText(props.message)
  if (!text) return
  
  try {
    isVolcanoSpeaking.value = true
    
    // 更新全局语音状态
    speechStore.startSpeaking(text, 'volcano')
    
    // 等待播放完成
    await volcanoSpeak(text)
    // 只有在正常播放完成后才执行
    isVolcanoSpeaking.value = false
    speechStore.stopSpeaking()
  } catch (error) {
    console.error('火山引擎TTS错误:', error)
    // 出错时也需要重置状态
    isVolcanoSpeaking.value = false
    speechStore.stopSpeaking()
  }
}

// 监听火山引擎播放状态
watch(isPlaying, (newValue) => {
  isVolcanoSpeaking.value = newValue
})

// 复制消息内容
const copyMessage = async () => {
  const text = getPlainText(props.message)
  if (!text) return
  
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    
    // 2秒后重置复制状态
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 当组件卸载时停止朗读
watch(() => props.message, () => {
  if (isSpeaking.value) {
    stopSpeaking()
  }
  if (isVolcanoSpeaking.value) {
    volcanoStop()
    speechStore.stopSpeaking()
  }
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (isSpeaking.value) {
    stopSpeaking()
  }
  if (isVolcanoSpeaking.value) {
    volcanoStop()
    speechStore.stopSpeaking()
  }
})
</script>

<template>
  <div class="message-actions space-x-2 mt-[-10px]" :class="role === 'user' ? 'flex justify-end' : 'flex justify-start'">
    
    <Button 
      variant="outline" 
      size="icon" 
      class="h-8 w-8" 
      @click="speakWithVolcano" 
      :title="isVolcanoSpeaking ? t('chat.stopVolcanoSpeaking') : t('chat.speakWithVolcano')"
    >
      <Headphones v-if="!isVolcanoSpeaking" class="h-4 w-4" />
      <VolumeX v-else class="h-4 w-4" />
    </Button>
    
    <Button 
      variant="outline" 
      size="icon" 
      class="h-8 w-8" 
      @click="speak" 
      :title="isSpeaking ? t('chat.stopSpeaking') : t('chat.speak')"
    >
      <Volume2 v-if="!isSpeaking" class="h-4 w-4" />
      <VolumeX v-else class="h-4 w-4" />
    </Button>
    
    <Button 
      variant="outline" 
      size="icon" 
      class="h-8 w-8" 
      @click="copyMessage" 
      :title="t('chat.copyMessage')"
    >
      <Copy v-if="!isCopied" class="h-4 w-4" />
      <Check v-else class="h-4 w-4 text-green-500" />
    </Button>
  </div>
</template>

<style scoped>
.message-actions {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.message-actions:hover {
  opacity: 1;
}
</style>